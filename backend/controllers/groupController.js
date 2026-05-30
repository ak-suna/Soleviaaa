// Mark weekly group task as completed by user
export const completeWeeklyTask = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if user is a member and not disabled
        const member = group.members.find(m => m.userId.toString() === userId);
        if (!member) {
            return res.status(403).json({ error: "You must be a member to complete the task" });
        }
        if (member.disabled) {
            return res.status(403).json({ error: "You are disabled from this group." });
        }

        // Check if already completed
        const alreadyCompleted = group.weeklyTask.completedBy.some(
            entry => entry.userId.toString() === userId
        );
        if (alreadyCompleted) {
            return res.status(400).json({ error: "You have already completed this task." });
        }

        // Add completion
        group.weeklyTask.completedBy.push({ userId, completedAt: new Date() });
        await group.save();

        // Calculate stats
        const totalMembers = group.members.filter(m => !m.disabled).length;
        const completedCount = group.weeklyTask.completedBy.length;
        const completionRate = totalMembers > 0 ? Math.round((completedCount / totalMembers) * 100) : 0;

        res.status(200).json({
            message: "Task marked as completed!",
            totalMembers,
            completedCount,
            completionRate
        });
    } catch (error) {
        console.error("Error completing weekly task:", error);
        res.status(500).json({ error: "Failed to complete weekly task" });
    }
};
// Disable or enable a group member (group-scoped)
export const setGroupMemberDisabled = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const { disabled, reason } = req.body;
        const actingUserId = req.user.id;
        const actingUserRole = req.user.role;

        const group = await SupportGroup.findById(groupId);
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Only group admin or moderator can disable/enable
        const actingMember = group.members.find(m => m.userId.toString() === actingUserId);
        if (!actingMember || (actingMember.role !== "admin" && actingMember.role !== "moderator" && actingUserRole !== "admin")) {
            return res.status(403).json({ error: "Not authorized" });
        }

        // Cannot disable admin
        const targetMember = group.members.find(m => m.userId.toString() === userId);
        if (!targetMember) {
            return res.status(404).json({ error: "User is not a member of this group" });
        }
        if (targetMember.role === "admin") {
            return res.status(403).json({ error: "Cannot disable the group admin" });
        }

        targetMember.disabled = !!disabled;
        targetMember.disabledReason = disabled ? (reason || "No reason provided.") : "";
        await group.save();

        // Send notification if disabling
        if (disabled) {
            try {
                await notificationService.createNotification({
                    userId,
                    type: "GROUP_MEMBER_DISABLED",
                    title: `You have been disabled in group: ${group.name}`,
                    message: `You have been disabled from participating in the group. Reason: ${reason || "No reason provided."} \n\nIf you believe this is a mistake, please contact customer support at anuskagc100@gmail.com.`,
                    data: { groupId, groupName: group.name, reason },
                });
            } catch (err) {
                console.error("Failed to send disable notification:", err);
            }
        }

        res.status(200).json({ message: `Member ${disabled ? "disabled" : "enabled"} successfully`, member: targetMember });
    } catch (error) {
        console.error("Error disabling/enabling group member:", error);
        res.status(500).json({ error: "Failed to update member status" });
    }
};
// Helper: Check if user is disabled in group
export const isUserDisabledInGroup = (group, userId) => {
    const member = group.members.find(m => m.userId.toString() === userId);
    return member && member.disabled ? member.disabledReason || true : false;
};
// Set weekly group task (admin/moderator only)
export const setWeeklyTask = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { task } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }


        // Check if user is group admin or moderator (by member role or userRole)
        const member = group.members.find(m => (m.userId && m.userId.toString() === userId.toString()));
        const isModerator = member && member.role === "moderator";
        const isAdmin = member && member.role === "admin";
        if (!(isModerator || isAdmin || userRole === "admin")) {
            return res.status(403).json({ error: "Not authorized to set weekly task" });
        }

        group.weeklyTask = {
            task: task,
            week: Date.now(),
            completedBy: []
        };

        await group.save();
        await group.populate('createdBy', 'firstName lastName');

        res.status(200).json({
            message: "Weekly task updated successfully",
            group
        });
    } catch (error) {
        console.error("Error setting weekly task:", error);
        res.status(500).json({ error: "Failed to set weekly task" });
    }
};
import mongoose from "mongoose";
import { SupportGroup } from "../models/SupportGroup.js";
import { Post } from "../models/Post.js";
import { User } from "../models/User.js";
import notificationService from "../services/notificationService.js";

// Get all support groups
export const getAllGroups = async (req, res) => {
    try {
        const { category, page = 1, limit = 20 } = req.query;

        const query = { isActive: true };

        if (category && category !== "all") {
            query.category = category;
        }

        const groups = await SupportGroup.find(query)
            .populate('createdBy', 'firstName lastName')
            .sort({ memberCount: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .lean();

        const count = await SupportGroup.countDocuments(query);

        res.status(200).json({
            groups,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ error: "Failed to fetch groups" });
    }
};

// Get single group by ID
export const getGroupById = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await SupportGroup.findById(groupId)
            .populate('createdBy', 'firstName lastName')
            .populate('members.userId', 'firstName lastName')
            .lean();

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (!group.isActive) {
            return res.status(403).json({ error: "This group is not active" });
        }

        // Block disabled members
        const userId = req.user.id;
        const member = group.members.find(m => m.userId.toString() === userId);
        if (member && member.disabled) {
            return res.status(403).json({ error: `You are disabled from this group. Reason: ${member.disabledReason || "No reason provided."}` });
        }
        res.status(200).json({ group });
    } catch (error) {
        console.error("Error fetching group:", error);
        res.status(500).json({ error: "Failed to fetch group" });
    }
};

// Get user's joined groups
export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        const groups = await SupportGroup.find({
            'members.userId': userId,
            isActive: true
        })
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({ groups });
    } catch (error) {
        console.error("Error fetching user groups:", error);
        res.status(500).json({ error: "Failed to fetch groups" });
    }
};

// Join a group
export const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (!group.isActive) {
            return res.status(403).json({ error: "This group is not active" });
        }

        // Check if already a member
        const isMember = group.members.some(
            member => member.userId.toString() === userId
        );

        if (isMember) {
            return res.status(400).json({ error: "You are already a member of this group" });
        }

        // Check if group is full
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ error: "This group is full" });
        }

        group.members.push({ userId, role: "member" });
        await group.save();

        await group.populate('createdBy', 'firstName lastName');
        await group.populate('members.userId', 'firstName lastName');

        res.status(200).json({
            message: "Successfully joined the group",
            group
        });
    } catch (error) {
        console.error("Error joining group:", error);
        res.status(500).json({ error: "Failed to join group" });
    }
};

// Leave a group
export const leaveGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if user is a member
        const memberIndex = group.members.findIndex(
            member => member.userId.toString() === userId
        );

        if (memberIndex === -1) {
            return res.status(400).json({ error: "You are not a member of this group" });
        }

        group.members.splice(memberIndex, 1);
        await group.save();

        res.status(200).json({ message: "Successfully left the group" });
    } catch (error) {
        console.error("Error leaving group:", error);
        res.status(500).json({ error: "Failed to leave group" });
    }
};

// Get group posts (group feed)
export const getGroupPosts = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.id;

        // Check if user is a member
        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        const member = group.members.find(m => m.userId.toString() === userId);
        if (!member) {
            return res.status(403).json({ error: "You must be a member to view group posts" });
        }
        if (member.disabled) {
            return res.status(403).json({ error: `You are disabled from this group. Reason: ${member.disabledReason || "No reason provided."}` });
        }

        const pipeline = [
            { $match: { groupId: new mongoose.Types.ObjectId(groupId), isHidden: false } },
            { $sort: { isPinned: -1, createdAt: -1 } },
            { $skip: (page - 1) * limit },
            { $limit: limit * 1 },
            { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "userIdDoc", pipeline: [{ $project: { firstName: 1, lastName: 1, accountStatus: 1 } }] } },
            { $unwind: { path: "$userIdDoc", preserveNullAndEmptyArrays: true } },
            { $match: { "userIdDoc.accountStatus": { $ne: "deactivated" } } },
            { $set: { userId: { $cond: { if: { $eq: ["$userIdDoc", null] }, then: { _id: null, firstName: "[Deleted", lastName: "User]" }, else: "$userIdDoc" } } } },
            { $lookup: { from: "comments", let: { postId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$postId", "$$postId"] } } }, { $sort: { createdAt: 1 } }, { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "u", pipeline: [{ $project: { firstName: 1, lastName: 1, accountStatus: 1 } }] } }, { $unwind: { path: "$u", preserveNullAndEmptyArrays: true } }, { $match: { "u.accountStatus": { $ne: "deactivated" } } }, { $set: { userId: { $cond: { if: { $eq: ["$u", null] }, then: { _id: null, firstName: "[Deleted", lastName: "User]" }, else: "$u" } } } }, { $project: { u: 0 } }], as: "comments" } },
            { $lookup: { from: "reactions", let: { postId: "$_id" }, pipeline: [{ $match: { $expr: { $eq: ["$postId", "$$postId"] } } }], as: "reactions" } },
            { $project: { userIdDoc: 0 } }
        ];

        const posts = await Post.aggregate(pipeline);
        const count = await Post.countDocuments({ groupId, isHidden: false });

        res.status(200).json({
            posts,
            totalPages: Math.ceil(count / limit),
            currentPage: page,
            total: count
        });
    } catch (error) {
        console.error("Error fetching group posts:", error);
        res.status(500).json({ error: "Failed to fetch group posts" });
    }
};


// Create a new group (admin only)
export const createGroup = async (req, res) => {
    try {
        const { name, description, category, icon, maxMembers } = req.body;
        const userId = req.user.id;

        if (!name || !description || !category) {
            return res.status(400).json({ error: "Name, description, and category are required" });
        }

        const newGroup = new SupportGroup({
            name: name.trim(),
            description: description.trim(),
            category,
            icon: icon || "📝",
            maxMembers: maxMembers || 50,
            createdBy: userId,
            moderators: [userId], // Admin is default moderator (legacy, can be removed if unused)
            members: [{
                userId,
                role: "admin" // ✅ Admin is admin
            }]
        });

        await newGroup.save();
        await newGroup.populate('createdBy', 'firstName lastName');

        res.status(201).json({
            message: "Group created successfully",
            group: newGroup
        });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ error: "Failed to create group" });
    }
};

// Update group (admin/moderator only)
export const updateGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description, icon, weeklyTask } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if user is moderator or admin
        const member = group.members.find(m => m.userId.toString() === userId);
        const isModerator = member && member.role === "moderator";

        if (!isModerator && userRole !== "admin") {
            return res.status(403).json({ error: "Not authorized to update this group" });
        }

        if (name) group.name = name.trim();
        if (description) group.description = description.trim();
        if (icon) group.icon = icon;

        if (weeklyTask) {
            group.weeklyTask = {
                task: weeklyTask.task,
                week: weeklyTask.week || Date.now(),
                completedBy: []
            };
        }

        await group.save();
        await group.populate('createdBy', 'firstName lastName');

        res.status(200).json({
            message: "Group updated successfully",
            group
        });
    } catch (error) {
        console.error("Error updating group:", error);
        res.status(500).json({ error: "Failed to update group" });
    }
};

// Delete group (admin only)
export const deleteGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Soft delete - mark as inactive
        group.isActive = false;
        await group.save();

        res.status(200).json({ message: "Group deactivated successfully" });
    } catch (error) {
        console.error("Error deleting group:", error);
        res.status(500).json({ error: "Failed to delete group" });
    }
};

// Get recommended groups based on user's goals/habits (future enhancement)
export const getRecommendedGroups = async (req, res) => {
    try {
        const userId = req.user.id;

        // For now, return popular groups
        // In future, can analyze user's goals/habits to recommend relevant groups
        const groups = await SupportGroup.find({ isActive: true })
            .populate('createdBy', 'firstName lastName')
            .sort({ memberCount: -1 })
            .limit(5)
            .lean();

        res.status(200).json({ groups });
    } catch (error) {
        console.error("Error fetching recommended groups:", error);
        res.status(500).json({ error: "Failed to fetch recommendations" });
    }
};

export const requestToJoinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { message } = req.body;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        if (!group.isActive) {
            return res.status(403).json({ error: "This group is not active" });
        }

        // Check if already a member
        const isMember = group.members.some(
            member => member.userId.toString() === userId
        );

        if (isMember) {
            return res.status(400).json({ error: "You are already a member of this group" });
        }

        // Check if group is full
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ error: "This group is full" });
        }

        // Check if already requested
        const existingRequest = group.joinRequests.find(
            req => req.userId.toString() === userId && req.status === 'pending'
        );

        if (existingRequest) {
            return res.status(400).json({ error: "You already have a pending request" });
        }

        // Add join request
        group.joinRequests.push({
            userId,
            message: message || "",
            status: 'pending',
            requestedAt: new Date()
        });

        await group.save();

        res.status(200).json({
            message: "Join request submitted successfully. Waiting for approval.",
            group: { _id: group._id, name: group.name }
        });
    } catch (error) {
        console.error("Error requesting to join group:", error);
        res.status(500).json({ error: "Failed to submit join request" });
    }
};

// Get pending join requests (admin or moderator)
export const getJoinRequests = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId)
            .populate('joinRequests.userId', 'firstName lastName email');

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if user is admin or moderator of this group
        const isAdmin = req.user.role === 'admin';
        // Moderator by moderatorId
        const isModeratorId = group.moderatorId && group.moderatorId.toString() === userId;
        // Moderator by member role
        const isModeratorRole = Array.isArray(group.members) && group.members.some(
            m => m.userId && m.userId.toString() === userId && m.role === "moderator"
        );

        if (!isAdmin && !isModeratorId && !isModeratorRole) {
            return res.status(403).json({
                error: "Only admins and moderators can view join requests"
            });
        }

        // Get only pending requests
        const pendingRequests = group.joinRequests.filter(req => req.status === 'pending');

        res.status(200).json({
            group: { _id: group._id, name: group.name },
            requests: pendingRequests
        });
    } catch (error) {
        console.error("Error fetching join requests:", error);
        res.status(500).json({ error: "Failed to fetch join requests" });
    }
};

// Approve join request
export const approveJoinRequest = async (req, res) => {
    try {
        const { groupId, requestId } = req.params;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check if user is admin or moderator
        const isAdmin = req.user.role === 'admin';
        // Moderator by moderatorId
        const isModeratorId = group.moderatorId && group.moderatorId.toString() === userId;
        // Moderator by member role
        const isModeratorRole = Array.isArray(group.members) && group.members.some(
            m => m.userId && m.userId.toString() === userId && m.role === "moderator"
        );

        if (!isAdmin && !isModeratorId && !isModeratorRole) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Find the request
        const request = group.joinRequests.id(requestId);

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: "Request already processed" });
        }

        // Check if group is still not full
        if (group.members.length >= group.maxMembers) {
            return res.status(400).json({ error: "Group is now full" });
        }

        // Add user to members
        group.members.push({
            userId: request.userId,
            joinedAt: new Date(),
            role: 'member'
        });

        // Update request status
        request.status = 'approved';
        request.reviewedBy = userId;
        request.reviewedAt = new Date();

        await group.save();

        // Notify the user (in-app notification)
        await notificationService.createNotification({
            userId: request.userId,
            type: "GROUP_JOIN_APPROVED",
            title: `Group Join Request Approved`,
            message: `Your request to join group '${group.name}' was approved! You are now a member.`,
            data: {
                groupId: group._id,
                groupName: group.name,
                status: "approved"
            }
        });

        res.status(200).json({
            message: "Join request approved successfully",
            group: { _id: group._id, name: group.name }
        });
    } catch (error) {
        console.error("Error approving request:", error);
        res.status(500).json({ error: "Failed to approve request" });
    }
};

// Reject join request
export const rejectJoinRequest = async (req, res) => {
    try {
        const { groupId, requestId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const group = await SupportGroup.findById(groupId);

        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }

        // Check authorization
        const isAdmin = req.user.role === 'admin';
        // Moderator by moderatorId
        const isModeratorId = group.moderatorId && group.moderatorId.toString() === userId;
        // Moderator by member role
        const isModeratorRole = Array.isArray(group.members) && group.members.some(
            m => m.userId && m.userId.toString() === userId && m.role === "moderator"
        );

        if (!isAdmin && !isModeratorId && !isModeratorRole) {
            return res.status(403).json({ error: "Unauthorized" });
        }

        // Find request
        const request = group.joinRequests.id(requestId);

        if (!request) {
            return res.status(404).json({ error: "Request not found" });
        }

        if (request.status !== 'pending') {
            return res.status(400).json({ error: "Request already processed" });
        }

        // Update request
        request.status = 'rejected';
        request.reviewedBy = userId;
        request.reviewedAt = new Date();
        request.rejectionReason = reason || "Not specified";

        await group.save();

        // Notify the user (in-app notification)
        await notificationService.createNotification({
            userId: request.userId,
            type: "GROUP_JOIN_REJECTED",
            title: `Group Join Request Rejected`,
            message: `Your request to join group '${group.name}' was rejected.${reason ? ` Reason: ${reason}` : ""}`,
            data: {
                groupId: group._id,
                groupName: group.name,
                status: "rejected",
                reason: reason || "Not specified"
            }
        });

        res.status(200).json({
            message: "Join request rejected",
            group: { _id: group._id, name: group.name }
        });
    } catch (error) {
        console.error("Error rejecting request:", error);
        res.status(500).json({ error: "Failed to reject request" });
    }
};

// ==================== MANUAL MODERATOR SELECTION ====================

// Get all members of a group (for manual selection)
export const getGroupMembers = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await SupportGroup.findById(groupId)
            .populate('members.userId', 'firstName lastName email points');
        if (!group) {
            return res.status(404).json({ error: "Group not found" });
        }
        // Only admin can view for moderator selection
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: "Unauthorized" });
        }
        // Attach eligibility info, exclude admin
        const adminId = group.createdBy?.toString?.() || group.createdBy;
        const members = group.members
            .filter(m => m.userId && m.userId._id?.toString() !== adminId && m.userId.toString() !== adminId)
            .map(m => ({
                ...m.toObject(),
                points: m.userId.points,
                eligible: m.userId.points >= (group.requiredPoints || 100)
            }));
        res.status(200).json({
            group: { _id: group._id, name: group.name, requiredPoints: group.requiredPoints },
            members
        });
    } catch (error) {
        console.error("Error fetching members:", error);
        res.status(500).json({ error: "Failed to fetch members" });
    }
};

// Assign moderator (admin only) — sends invitation; user must accept
export const assignModerator = async (req, res) => {
    req.body.groupId = req.params.groupId;
    const { promoteToModerator } = await import("./moderatorController.js");
    return promoteToModerator(req, res);
};
export const getUserJoinRequests = async (req, res) => {
    const userId = req.user.id;

    const groups = await SupportGroup.find({
        'joinRequests.userId': userId
    });

    const requests = groups.map(group => {
        const userRequest = group.joinRequests.find(
            r => r.userId.toString() === userId
        );
        return {
            groupId: group._id,
            groupName: group.name,
            status: userRequest.status,
            requestedAt: userRequest.requestedAt,
            reason: userRequest.rejectionReason
        };
    });

    res.json({ requests });
};