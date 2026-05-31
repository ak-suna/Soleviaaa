import config from "../config";

// Mark weekly group task as completed
export const completeWeeklyTask = async (groupId) => {
    const response = await fetch(`${API_BASE_URL}/groups/${groupId}/complete-weekly-task`, {
        method: "POST",
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to complete task");
    }
    return await response.json();
};
// ==================== GROUP MODERATOR TOOLS ====================
export const getGroupReports = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/moderator-tools/${groupId}/reports`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to fetch group reports");
        return await response.json();
    } catch (error) {
        console.error("Error fetching group reports:", error);
        throw error;
    }
};

export const resolveGroupReport = async (groupId, reportId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/moderator-tools/${groupId}/reports/${reportId}/resolve`, {
            method: "PUT",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to resolve report");
        return await response.json();
    } catch (error) {
        console.error("Error resolving report:", error);
        throw error;
    }
};

export const removeGroupMember = async (groupId, userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/moderator-tools/${groupId}/members/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error("Failed to remove member");
        return await response.json();
    } catch (error) {
        console.error("Error removing member:", error);
        throw error;
    }
};

export const disableGroupMember = async (groupId, userId, disabled, reason) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${userId}/disable`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify({ disabled, reason })
        });
        if (!response.ok) throw new Error("Failed to update member status");
        return await response.json();
    } catch (error) {
        console.error("Error updating member status:", error);
        throw error;
    }
};
const API_BASE_URL = `${config.BACKEND_URL}/api`;

// Helper to get auth headers
const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
    };
};

// ==================== POSTS ====================

export const getPosts = async (page = 1, limit = 10, category = null, type = null) => {
    try {
        let url = `${API_BASE_URL}/posts?page=${page}&limit=${limit}`;
        if (category && category !== "all") url += `&category=${category}`;
        if (type && type !== "all") url += `&type=${type}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch posts");
        return await response.json();
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
};

export const getPostById = async (postId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch post");
        return await response.json();
    } catch (error) {
        console.error("Error fetching post:", error);
        throw error;
    }
};

export const getUserPosts = async (page = 1, limit = 10) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/user?page=${page}&limit=${limit}`,
            { headers: getAuthHeaders() }
        );

        if (!response.ok) throw new Error("Failed to fetch user posts");
        return await response.json();
    } catch (error) {
        console.error("Error fetching user posts:", error);
        throw error;
    }
};

export const createPost = async (postData) => {
    try {
        const formData = new FormData();
        formData.append('content', postData.content);
        formData.append('type', postData.type);
        formData.append('category', postData.category);

        // Handle tags: If your backend expects a string, just send postData.tags
        // If it expects an array, split it here:
        const tagArray = postData.tags.split(',').map(t => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tagArray));

        if (postData.groupId) formData.append('groupId', postData.groupId);
        if (postData.image) formData.append('image', postData.image);

        const token = localStorage.getItem("token");
        const response = await fetch(`${API_BASE_URL}/posts`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
                // Leave Content-Type out!
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create post");
        }
        return await response.json();
    } catch (error) {
        console.error("Service Error:", error);
        throw error;
    }
};

export const updatePost = async (postId, postData) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(postData)
        });

        if (!response.ok) throw new Error("Failed to update post");
        return await response.json();
    } catch (error) {
        console.error("Error updating post:", error);
        throw error;
    }
};

export const deletePost = async (postId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to delete post");
        return await response.json();
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
};

export const addReaction = async (postId, emoji) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/react`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ emoji })
        });

        if (!response.ok) throw new Error("Failed to add reaction");
        return await response.json();
    } catch (error) {
        console.error("Error adding reaction:", error);
        throw error;
    }
};

export const getCommentsByPost = async (postId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/comments/post/${postId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch comments");
        return await response.json();
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
};

export const addComment = async (postId, content) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/comment`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ content })
        });

        if (!response.ok) throw new Error("Failed to add comment");
        return await response.json();
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const deleteComment = async (postId, commentId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/posts/${postId}/comment/${commentId}`,
            {
                method: "DELETE",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) throw new Error("Failed to delete comment");
        return await response.json();
    } catch (error) {
        console.error("Error deleting comment:", error);
        throw error;
    }
};

export const reportPost = async (postId, reason, description) => {
    try {
        const response = await fetch(`${API_BASE_URL}/posts/${postId}/report`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ reason, description })
        });

        if (!response.ok) throw new Error("Failed to report post");
        return await response.json();
    } catch (error) {
        console.error("Error reporting post:", error);
        throw error;
    }
};

// ==================== GROUPS ====================

export const getAllGroups = async (category = null, page = 1, limit = 20) => {
    try {
        let url = `${API_BASE_URL}/groups?page=${page}&limit=${limit}`;
        if (category && category !== "all") url += `&category=${category}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch groups");
        return await response.json();
    } catch (error) {
        console.error("Error fetching groups:", error);
        throw error;
    }
};

export const getGroupById = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch group");
        return await response.json();
    } catch (error) {
        console.error("Error fetching group:", error);
        throw error;
    }
};

export const getUserGroups = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/user`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch user groups");
        return await response.json();
    } catch (error) {
        console.error("Error fetching user groups:", error);
        throw error;
    }
};

export const joinGroup = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/join`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to join group");
        return await response.json();
    } catch (error) {
        console.error("Error joining group:", error);
        throw error;
    }
};

export const leaveGroup = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to leave group");
        return await response.json();
    } catch (error) {
        console.error("Error leaving group:", error);
        throw error;
    }
};

export const getGroupPosts = async (groupId, page = 1, limit = 10) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/posts?page=${page}&limit=${limit}`,
            { headers: getAuthHeaders() }
        );

        if (!response.ok) throw new Error("Failed to fetch group posts");
        return await response.json();
    } catch (error) {
        console.error("Error fetching group posts:", error);
        throw error;
    }
};



// ==================== CHALLENGES ====================

// ==================== CHALLENGES ====================

export const getAllChallenges = async ({ category = null, status = "all", page = 1, limit = 10 } = {}) => {
    try {
        let url = `${API_BASE_URL}/challenges?page=${page}&limit=${limit}&status=${status}`;
        if (category && category !== "all") url += `&category=${category}`;

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch challenges");
        return await response.json();
    } catch (error) {
        console.error("Error fetching challenges:", error);
        throw error;
    }
};

export const getChallengeById = async (challengeId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch challenge");
        return await response.json();
    } catch (error) {
        console.error("Error fetching challenge:", error);
        throw error;
    }
};

export const getUserChallenges = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/challenges`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch user challenges");
        const data = await response.json();

        // Filter only joined ones
        return { challenges: (data.challenges || []).filter(c => c.isJoined) };
    } catch (error) {
        console.error("Error fetching user challenges:", error);
        throw error;
    }
};

export const joinChallenge = async (challengeId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/join`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to join challenge");
        return await response.json();
    } catch (error) {
        console.error("Error joining challenge:", error);
        throw error;
    }
};

export const leaveChallenge = async (challengeId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/challenges/${challengeId}/leave`, {
            method: "POST",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to leave challenge");
        return await response.json();
    } catch (error) {
        console.error("Error leaving challenge:", error);
        throw error;
    }
};

export const updateChallengeProgress = async (challengeId, completed) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/challenges/${challengeId}/progress`,
            {
                method: "POST",
                headers: getAuthHeaders(),
                body: JSON.stringify({ completed })
            }
        );

        if (!response.ok) throw new Error("Failed to update progress");
        return await response.json();
    } catch (error) {
        console.error("Error updating progress:", error);
        throw error;
    }
};

export const getChallengeLeaderboard = async (challengeId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/challenges/${challengeId}/leaderboard`,
            { headers: getAuthHeaders() }
        );

        if (!response.ok) throw new Error("Failed to fetch leaderboard");
        return await response.json();
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        throw error;
    }
};

// ==================== REPORTS ====================

export const createReport = async (targetId, reportType, reason, description) => {
    try {
        const response = await fetch(`${API_BASE_URL}/reports`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ targetId, reportType, reason, description })
        });

        if (!response.ok) throw new Error("Failed to create report");
        return await response.json();
    } catch (error) {
        console.error("Error creating report:", error);
        throw error;
    }
};

// ADD THESE FUNCTIONS TO YOUR EXISTING communityService.js:

// ==================== JOIN REQUESTS ====================

export const requestToJoinGroup = async (groupId, message = "") => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/request`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ message })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Failed to submit join request");
        }

        return await response.json();
    } catch (error) {
        console.error("Error requesting to join:", error);
        throw error;
    }
};

export const getGroupJoinRequests = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/requests`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch join requests");
        return await response.json();
    } catch (error) {
        console.error("Error fetching requests:", error);
        throw error;
    }
};

export const approveJoinRequest = async (groupId, requestId) => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/requests/${requestId}/approve`,
            {
                method: "PUT",
                headers: getAuthHeaders()
            }
        );

        if (!response.ok) throw new Error("Failed to approve request");
        return await response.json();
    } catch (error) {
        console.error("Error approving request:", error);
        throw error;
    }
};

export const rejectJoinRequest = async (groupId, requestId, reason = "") => {
    try {
        const response = await fetch(
            `${API_BASE_URL}/groups/${groupId}/requests/${requestId}/reject`,
            {
                method: "PUT",
                headers: getAuthHeaders(),
                body: JSON.stringify({ reason })
            }
        );

        if (!response.ok) throw new Error("Failed to reject request");
        return await response.json();
    } catch (error) {
        console.error("Error rejecting request:", error);
        throw error;
    }
};

// ==================== MODERATOR MANAGEMENT ====================

export const getModeratorCandidates = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/moderators/candidates/${groupId}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch candidates");
        return await response.json();
    } catch (error) {
        console.error("Error fetching candidates:", error);
        throw error;
    }
};


export const assignModerator = async (groupId, userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/moderators/promote`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ userId, groupId })
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || error.error || "Failed to send moderator invitation");
        }
        return await response.json();
    } catch (error) {
        console.error("Error sending moderator invitation:", error);
        throw error;
    }
};

export const respondToModeratorInvitation = async (groupId, action) => {
    const response = await fetch(`${API_BASE_URL}/moderators/respond`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ groupId, action })
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to respond to invitation");
    }
    return data;
};

export const removeModerator = async (groupId, userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/moderators/${groupId}/${userId}`, {
            method: "DELETE",
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to remove moderator");
        return await response.json();
    } catch (error) {
        console.error("Error removing moderator:", error);
        throw error;
    }
};

export const getGroupMembers = async (groupId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch members");
        return await response.json();
    } catch (error) {
        console.error("Error fetching members:", error);
        throw error;
    }
};
export const getUserJoinRequests = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/my-requests`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error("Failed to fetch requests");
        return await response.json();
    } catch (error) {
        console.error("Error fetching requests:", error);
        throw error;
    }
};

// ==================== PEER CONNECT ====================

export const sendPeerConnectRequest = async (recipientId, groupId) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/request`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ recipientId, groupId })
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to send request");
    }
    return await response.json();
};

export const respondToPeerRequest = async (connectionId, action) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${connectionId}/respond`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ action })
    });
    if (!response.ok) throw new Error("Failed to respond");
    return await response.json();
};

export const getMyPeerConnections = async (groupId = null) => {
    let url = `${API_BASE_URL}/groups/connect/mine`;
    if (groupId) url += `?groupId=${groupId}`;
    const response = await fetch(url, { headers: getAuthHeaders() });
    if (!response.ok) throw new Error("Failed to fetch connections");
    return await response.json();
};

export const getPendingPeerRequests = async () => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/pending`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch pending requests");
    return await response.json();
};

export const getPeerMessages = async (connectionId) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${connectionId}/messages`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch messages");
    return await response.json();
};

export const sendPeerMessage = async (connectionId, content) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${connectionId}/messages`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ content })
    });
    if (!response.ok) throw new Error("Failed to send message");
    return await response.json();
};

export const savePeerCalendlyLink = async (connectionId, calendlyLink) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${connectionId}/calendly`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ calendlyLink })
    });
    if (!response.ok) throw new Error("Failed to save link");
    return await response.json();
};

// Backward-compatible alias with generic naming.
export const savePeerMeetingLink = async (connectionId, meetingLink) => {
    return savePeerCalendlyLink(connectionId, meetingLink);
};

export const deletePeerConnection = async (connectionId) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${connectionId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to remove connection");
    }
    return await response.json();
};

// ==================== GROUP SESSIONS ====================


export const createGroupSession = async (groupId, sessionData) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${groupId}/sessions`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(sessionData)
    });
    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create session");
    }
    return await response.json();
};


export const getGroupSessionsList = async (groupId) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/${groupId}/sessions`, {
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to fetch sessions");
    return await response.json();
};


export const rsvpGroupSession = async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/sessions/${sessionId}/rsvp`, {
        method: "POST",
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to RSVP");
    return await response.json();
};


export const deleteGroupSession = async (sessionId) => {
    const response = await fetch(`${API_BASE_URL}/groups/connect/sessions/${sessionId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    if (!response.ok) throw new Error("Failed to delete session");
    return await response.json();
};