import { SupportGroup } from "../models/SupportGroup.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import { Report } from "../models/Report.js";
import notificationService from "../services/notificationService.js";
import Notification from "../models/Notification.js";

// ==================== CANDIDATE SCORING ====================

// Calculate member score for moderator candidacy
export const getMemberScore = async (userId, groupId) => {
    console.log('getMemberScore called', { userId, groupId });
    // Step 1: Find group
    const group = await SupportGroup.findById(groupId);
    if (!group) {
        console.log('getMemberScore: group not found', { groupId });
        throw new Error("Group not found");
    }
    // Step 2: Find member
    const member = group.members.find(m => m.userId.toString() === userId.toString());
    if (!member) {
        console.log('getMemberScore: member not found in group', { userId, groupId });
        throw new Error("User is not a member of this group");
    }
    console.log('getMemberScore: found member', { member });
    const metrics = {};

    // 1. Time in group (longer = more trustworthy)
    const daysInGroup = Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24));
    metrics.daysInGroup = daysInGroup;

    // 2. Weekly task completion
    const tasksCompleted = await countTasksCompleted(userId, groupId);
    metrics.tasksCompleted = tasksCompleted;

    // 3. Active participation (posts in group)
    const groupPosts = await Post.countDocuments({
        userId,
        groupId,
        isHidden: false
    });
    metrics.posts = groupPosts;

    // 4. Helpful comments/reactions
    const helpfulComments = await countHelpfulComments(userId, groupId);
    metrics.helpfulComments = helpfulComments;

    // 5. No violations (negative score)
    const violations = await Report.countDocuments({
        targetId: userId,
        targetType: 'user',
        status: 'resolved',
        action: { $in: ['warning', 'content-removed', 'user-suspended'] }
    });
    metrics.violations = violations;

    // 6. Reports filed (helping moderate)
    const reportsFiledCount = await Report.countDocuments({
        reportedBy: userId,
        status: 'resolved'
    });
    metrics.reportsFiled = reportsFiledCount;

    // Points are awarded on the User profile in current flows (posts/reactions/comments).
    // Fall back to member.points for backward compatibility with older group-level scoring.
    const user = await User.findById(userId).select("points");
    const memberPoints = (user?.points ?? member.points ?? 0);
    const requiredPoints = group.requiredPoints || 20;
    const eligible = memberPoints >= requiredPoints && daysInGroup >= 10 && violations === 0;
    console.log('getMemberScore: eligibility check', {
        userId,
        memberPoints,
        requiredPoints,
        daysInGroup,
        violations,
        eligible
    });

    return {
        userId,
        points: memberPoints,
        requiredPoints,
        metrics,
        violations, // Show violation count in debug
        eligible
    };
}
// ==================== MODERATION ACTIONS ====================

// Get all reported posts for a group
export const getReportedPostsForGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        // Find posts in group that are reported
        const posts = await Post.find({ groupId, isReported: true })
            .populate("userId", "firstName lastName")
            .lean();
        // Attach report info
        for (let post of posts) {
            post.reports = await Report.find({ targetId: post._id, reportType: "post", status: { $in: ["pending", "under-review"] } }).lean();
        }
        res.status(200).json({ posts });
    } catch (error) {
        console.error("Error fetching reported posts:", error);
        res.status(500).json({ error: "Failed to fetch reported posts" });
    }
};

// Remove a post (moderator/admin)
export const moderatorRemovePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const { reason } = req.body;
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ error: "Post not found" });
        const user = await User.findById(post.userId);
        await Post.findByIdAndDelete(postId);
        // Mark related reports as resolved
        await Report.updateMany({ targetId: postId, reportType: "post" }, { status: "resolved", action: "content-removed", reviewedBy: req.user._id, reviewedAt: new Date(), adminNotes: reason });
        // Notify user
        if (user) {
            await notificationService.sendNotification({
                userId: user._id,
                type: "post-removed",
                message: `Your post was removed by a moderator. Reason: ${reason || "Violation of group rules"}`
            });
        }
        res.status(200).json({ message: "Post removed and user notified" });
    } catch (error) {
        console.error("Error removing post:", error);
        res.status(500).json({ error: "Failed to remove post" });
    }
};

// Dismiss a report (moderator/admin)
export const moderatorDismissReport = async (req, res) => {
    try {
        const { reportId } = req.params;
        await Report.findByIdAndUpdate(reportId, { status: "dismissed", reviewedBy: req.user._id, reviewedAt: new Date(), action: "none" });
        res.status(200).json({ message: "Report dismissed" });
    } catch (error) {
        console.error("Error dismissing report:", error);
        res.status(500).json({ error: "Failed to dismiss report" });
    }
};

// Helper: Count tasks completed
const countTasksCompleted = async (userId, groupId) => {
    try {
        const group = await SupportGroup.findById(groupId);
        if (!group || !group.weeklyTask) return 0;

        // Count how many times user completed weekly tasks
        return group.weeklyTask.completedBy?.filter(
            id => id.toString() === userId.toString()
        ).length || 0;
    } catch (error) {
        return 0;
    }
};

// Helper: Count helpful comments
const countHelpfulComments = async (userId, groupId) => {
    try {
        const posts = await Post.find({ groupId, isHidden: false });

        let commentCount = 0;
        posts.forEach(post => {
            const userComments = post.comments.filter(
                c => c.userId.toString() === userId.toString()
            );
            commentCount += userComments.length;
        });

        return commentCount;
    } catch (error) {
        return 0;
    }
};

// ==================== GET CANDIDATES ====================

// Get top moderator candidates for a specific group
export const getModeratorCandidates = async (req, res) => {
    try {
        const { groupId } = req.params;
        const adminId = req.user.id;

        const group = await SupportGroup.findById(groupId).populate('members.userId', 'firstName lastName email');

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Only admin can view candidates
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only admins can view candidates" });
        }

        // Score all members
        const candidates = [];

        for (const member of group.members) {
            // Skip if already a moderator
            if (member.role === 'moderator') continue;

            try {
                const scoreData = await getMemberScore(member.userId._id, groupId);
                candidates.push({
                    ...scoreData,
                    user: {
                        _id: member.userId._id,
                        firstName: member.userId.firstName,
                        lastName: member.userId.lastName,
                        email: member.userId.email
                    },
                    joinedAt: member.joinedAt
                });
            } catch (error) {
                console.error(`Error scoring user ${member.userId._id}:`, error);
            }
        }

        // Sort by points (highest first)
        candidates.sort((a, b) => b.points - a.points);

        res.status(200).json({
            group: {
                _id: group._id,
                name: group.name
            },
            candidates: candidates.slice(0, 10) // Top 10 candidates
        });
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).json({ error: "Failed to fetch candidates" });
    }
};

// ==================== PROMOTION/DEMOTION ====================

async function applyModeratorPromotion(group, userId, adminId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    if (group.adminId) {
        const adminIdStr = group.adminId.toString();
        group.members.forEach(m => {
            const memberUserId = m.userId ? m.userId.toString() : null;
            if (memberUserId === adminIdStr) {
                m.role = "admin";
            }
        });
    }

    if (group.moderatorId && group.moderatorId.toString() !== userId.toString()) {
        const prevMod = group.members.find(m => {
            const memberUserId = m.userId ? m.userId.toString() : null;
            return memberUserId === group.moderatorId.toString();
        });
        if (prevMod && prevMod.userId && prevMod.userId.toString() !== group.adminId?.toString()) {
            prevMod.role = "member";
        }

        const prevModUser = await User.findById(group.moderatorId);
        if (prevModUser) {
            prevModUser.moderatedGroups = prevModUser.moderatedGroups.filter(
                id => id.toString() !== group._id.toString()
            );
            await prevModUser.save();
        }
    }

    group.members.forEach(m => {
        const memberUserId = m.userId ? m.userId.toString() : null;
        if (memberUserId === userId.toString()) {
            m.role = "moderator";
        }
    });
    group.moderatorId = userId;

    if (!user.moderatedGroups.some(id => id.toString() === group._id.toString())) {
        user.moderatedGroups.push(group._id);
    }
    user.promotedBy = adminId;
    user.promotedAt = new Date();

    await group.save();
    await user.save();

    return user;
}

// Admin sends moderator invitation (user must accept)
export const promoteToModerator = async (req, res) => {
    try {
        const { userId, groupId } = req.body;
        const adminId = req.user.id;

        if (req.user.role !== "admin") {
            return res.status(403).json({ error: "Only admins can invite moderators" });
        }

        const group = await SupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const member = group.members.find(m => m.userId && m.userId.toString() === userId);
        if (!member) {
            return res.status(400).json({ error: "User is not a member of this group" });
        }

        if (member.role === "moderator") {
            return res.status(400).json({ error: "User is already a moderator" });
        }

        const existingPending = group.moderatorInvitations?.find(
            inv => inv.userId.toString() === userId && inv.status === "pending"
        );
        if (existingPending) {
            return res.status(400).json({ error: "This user already has a pending moderator invitation" });
        }

        const scoreData = await getMemberScore(userId, groupId);
        if (!scoreData.eligible) {
            return res.status(400).json({
                error: "User does not meet minimum requirements",
                details: `Points: ${scoreData.points}/${scoreData.requiredPoints} required, Days in group: ${scoreData.metrics.daysInGroup}/10 required, Violations: ${scoreData.violations}`,
                scoreData
            });
        }

        if (!group.moderatorInvitations) {
            group.moderatorInvitations = [];
        }

        group.moderatorInvitations.forEach(inv => {
            if (inv.status === "pending" && inv.userId.toString() !== userId) {
                inv.status = "cancelled";
                inv.respondedAt = new Date();
            }
        });

        group.moderatorInvitations.push({
            userId,
            invitedBy: adminId,
            status: "pending",
            invitedAt: new Date()
        });

        await group.save();

        await notificationService.createNotification({
            userId,
            type: "GROUP_MODERATOR_INVITATION",
            title: "You've been invited to become a moderator",
            message: `You've been invited to become a moderator for "${group.name}". Open your notifications to accept or decline.`,
            data: {
                groupId: group._id,
                groupName: group.name,
                invitedBy: adminId,
                invitationStatus: "pending",
                actionUrl: `/community/group/${group._id}`
            },
            channels: { inApp: true, email: true }
        });

        res.status(200).json({
            message: "Moderator invitation sent successfully",
            group: { _id: group._id, name: group.name },
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName
            }
        });
    } catch (error) {
        console.error("Error sending moderator invitation:", error);
        res.status(500).json({
            error: "Failed to send moderator invitation",
            details: error.message
        });
    }
};

// User accepts or declines moderator invitation
export const respondToModeratorInvitation = async (req, res) => {
    try {
        const { groupId, action } = req.body;
        const userId = req.user.id;

        if (!["accept", "decline"].includes(action)) {
            return res.status(400).json({ error: "Action must be 'accept' or 'decline'" });
        }

        const group = await SupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const invitation = group.moderatorInvitations?.find(
            inv => inv.userId.toString() === userId && inv.status === "pending"
        );
        if (!invitation) {
            return res.status(404).json({ error: "No pending moderator invitation found" });
        }

        const user = await User.findById(userId);
        const admin = await User.findById(invitation.invitedBy);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        invitation.respondedAt = new Date();

        if (action === "decline") {
            invitation.status = "declined";
            await group.save();

            await Notification.updateMany(
                {
                    userId,
                    type: "GROUP_MODERATOR_INVITATION",
                    "data.groupId": group._id
                },
                {
                    read: true,
                    readAt: new Date(),
                    "data.invitationStatus": "declined"
                }
            );

            if (admin) {
                await notificationService.createNotification({
                    userId: admin._id,
                    type: "GROUP_MODERATOR_DECLINED",
                    title: "Moderator invitation declined",
                    message: `${user.firstName} ${user.lastName} declined the moderator invitation for "${group.name}".`,
                    data: {
                        groupId: group._id,
                        groupName: group.name,
                        userId: user._id,
                        userName: `${user.firstName} ${user.lastName}`,
                        actionUrl: `/admin/groups/${group._id}/moderator/dashboard`
                    },
                    channels: { inApp: true, email: true }
                });
            }

            return res.status(200).json({ message: "Moderator invitation declined" });
        }

        invitation.status = "accepted";
        await applyModeratorPromotion(group, userId, invitation.invitedBy);

        await Notification.updateMany(
            {
                userId,
                type: "GROUP_MODERATOR_INVITATION",
                "data.groupId": group._id
            },
            {
                read: true,
                readAt: new Date(),
                "data.invitationStatus": "accepted"
            }
        );

        await notificationService.createNotification({
            userId,
            type: "GROUP_MODERATOR_ASSIGNED",
            title: "You are now a group moderator!",
            message: `You accepted the invitation and are now the moderator for "${group.name}".`,
            data: {
                groupId: group._id,
                groupName: group.name,
                status: "accepted",
                actionUrl: `/admin/groups/${group._id}/moderator/dashboard`
            },
            channels: { inApp: true, email: true }
        });

        if (admin) {
            await notificationService.createNotification({
                userId: admin._id,
                type: "GROUP_MODERATOR_ACCEPTED",
                title: "Moderator invitation accepted",
                message: `${user.firstName} ${user.lastName} accepted the moderator invitation for "${group.name}".`,
                data: {
                    groupId: group._id,
                    groupName: group.name,
                    userId: user._id,
                    userName: `${user.firstName} ${user.lastName}`,
                    actionUrl: `/admin/groups/${group._id}/moderator/dashboard`
                },
                channels: { inApp: true, email: true }
            });
        }

        res.status(200).json({
            message: "You are now the group moderator",
            group: { _id: group._id, name: group.name }
        });
    } catch (error) {
        console.error("Error responding to moderator invitation:", error);
        res.status(500).json({
            error: "Failed to respond to moderator invitation",
            details: error.message
        });
    }
};

// Remove moderator
export const removeModerator = async (req, res) => {
    try {
        const { groupId, userId } = req.params;

        // Only admin can remove
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Only admins can remove moderators" });
        }

        const group = await SupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Find member and demote
        const member = group.members.find(m => m.userId.toString() === userId);
        if (member && member.role === 'moderator') {
            member.role = 'member';
        }

        // Remove from moderators array
        group.moderators = group.moderators.filter(id => id.toString() !== userId);
        await group.save();

        // Update user
        user.moderatedGroups = user.moderatedGroups.filter(id => id.toString() !== groupId);

        // If user doesn't moderate any other groups, demote to regular user
        if (user.moderatedGroups.length === 0 && user.role === 'moderator') {
            user.role = 'user';
        }

        await user.save();

        res.status(200).json({
            message: "Moderator removed successfully"
        });
    } catch (error) {
        console.error("Error removing moderator:", error);
        res.status(500).json({ error: "Failed to remove moderator" });
    }
};

// ==================== GET MODERATED GROUPS ====================

// Get groups moderated by current user
export const getModeratedGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await SupportGroup.find({
            moderators: userId,
            isActive: true
        })
            .populate('createdBy', 'firstName lastName')
            .populate('joinRequests.userId', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.status(200).json({ groups });
    } catch (error) {
        console.error("Error fetching moderated groups:", error);
        res.status(500).json({ error: "Failed to fetch moderated groups" });
    }
};