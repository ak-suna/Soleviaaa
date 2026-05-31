import React, { useState, useEffect, useRef, useMemo } from "react";
import Toast from "../components/Toast";
import Modal from "../components/Modal";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import NotificationBell from '../components/NotificationBell';
import { Settings, ArrowLeft, Users, CheckCircle, Plus, Calendar } from 'lucide-react';
import {
    getGroupById,
    getGroupPosts,
    leaveGroup,
    completeWeeklyTask,
    sendPeerConnectRequest,
    getMyPeerConnections,
    getPendingPeerRequests,
    respondToPeerRequest
} from "../services/communityService";
import CreatePostModal from "../components/CreatePostModal";
import ModeratorCandidatesModal from "../components/ModeratorCandidatesModal";
import WeeklyTaskModal from "../components/WeeklyTaskModal";
import { jwtDecode } from "jwt-decode";
import CommunityFeed from "../components/CommunityFeed";


const GroupDetailsPage = () => {
    const { groupId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [showCreatePost, setShowCreatePost] = useState(false);
    const [taskCompleted, setTaskCompleted] = useState(false);

    const location = useLocation();  // add this import too if not already there
    const searchParams = new URLSearchParams(location.search);
    const focusPostId = searchParams.get("focus");
    const focusCommentId = searchParams.get("comment");
    const showRequests = searchParams.get("showRequests");
    const focusPostRef = useRef(null);

    // Get current user ID
    const token = localStorage.getItem("token");
    const currentUserId = token ? jwtDecode(token).id : null;

    // Open requests modal if query param is present
    useEffect(() => {
        if (showRequests === "true") {
            setShowRequestsModal(true);
        }
    }, [showRequests]);

    const { data: groupData, isLoading: loadingGroup, isError: groupError } = useQuery({
        queryKey: ["community", "group", groupId],
        queryFn: () => getGroupById(groupId),
        enabled: !!groupId,
        refetchInterval: 5000,
    });

    const { data: postsData } = useQuery({
        queryKey: ["community", "groupPosts", groupId],
        queryFn: () => getGroupPosts(groupId),
        enabled: !!groupId,
        refetchInterval: 5000,
    });

    // Helper: is current user a member and not disabled?
    const group = groupData?.group ?? null;
    const memberObj = group?.members?.find(m => m.userId === currentUserId || m.userId?._id === currentUserId);
    const isMember = !!memberObj && !memberObj.disabled;
    const isDisabled = !!memberObj && memberObj.disabled;
    // Helper: is current user a moderator (by moderatorId or member role)
    const isModerator = (group?.moderatorId && (group.moderatorId === currentUserId || group.moderatorId?._id === currentUserId)) ||
        group?.members?.some(m => (m.userId === currentUserId || m.userId?._id === currentUserId) && m.role === "moderator");


    const { data: connectionsData, refetch: refetchConnections } = useQuery({
        queryKey: ["peer", "connections", groupId],
        queryFn: () => getMyPeerConnections(groupId),
        enabled: !!groupId && isMember,
    });

    // Pending peer connect requests
    const { data: pendingData, refetch: refetchPending } = useQuery({
        queryKey: ["peer", "pending"],
        queryFn: getPendingPeerRequests,
        enabled: isMember,
        refetchInterval: 15000,
    });
    const pendingRequests = pendingData?.requests ?? [];
    // Only requests for this group
    const groupPendingRequests = pendingRequests.filter(
        r => (r.groupId?._id || r.groupId)?.toString() === groupId
    );

    // Removed openChat state; chat is now a separate page
    const myConnections = connectionsData?.connections ?? [];
    const posts = useMemo(() => postsData?.posts ?? [], [postsData?.posts]);
    const loading = loadingGroup;

    // Modal/Toast state
    const [modal, setModal] = useState({ open: false, type: '', message: '', onConfirm: null });
    const [toast, setToast] = useState(null);

    // Weekly Task Modal state
    const [showWeeklyTaskModal, setShowWeeklyTaskModal] = useState(false);

    // State for modals
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [showRequestsModal, setShowRequestsModal] = useState(false);

    // Block disabled users from accessing the group
    useEffect(() => {
        if (groupError && groupData === undefined && groupError.response && groupError.response.data && groupError.response.data.error) {
            setModal({ open: true, type: 'error', message: groupError.response.data.error, onConfirm: () => window.location.href = '/' });
        }
    }, [groupError, groupData]);


    // Sync task completed from group data (must match userId as string)
    useEffect(() => {
        if (group?.weeklyTask?.completedBy?.some(entry => entry.userId === currentUserId || entry.userId?._id === currentUserId)) {
            setTaskCompleted(true);
        } else {
            setTaskCompleted(false);
        }
    }, [group, currentUserId]);

    // Modal for assigning moderator
    const [showModeratorModal, setShowModeratorModal] = useState(false);

    useEffect(() => {
        if (groupError) {
            setModal({ open: true, type: 'error', message: 'Failed to load group. You may not have access.', onConfirm: () => { setModal({ ...modal, open: false }); navigate('/community'); } });
        }
        // eslint-disable-next-line
    }, [groupError, navigate]);

    useEffect(() => {
        if (focusPostId && focusPostRef.current && posts.length > 0) {
            setTimeout(() => {
                focusPostRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                focusPostRef.current?.classList.add("ring-4", "ring-[#f4873e]");
                setTimeout(() => {
                    focusPostRef.current?.classList.remove("ring-4", "ring-[#f4873e]");
                }, 2000);
            }, 400);
        }
    }, [focusPostId, posts]);
    // Save weekly task handler
    const handleSaveWeeklyTask = async (task) => {
        try {
            // Call backend API to update weekly task
            await fetch(`/api/groups/${groupId}/weekly-task`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ task })
            });
            // Invalidate and refetch group data to ensure latest task is shown
            await queryClient.invalidateQueries({ queryKey: ["community", "group", groupId] });
            setShowWeeklyTaskModal(false);
            setToast({ message: 'Weekly task updated!', type: 'success' });
        } catch (error) {
            setToast({ message: 'Failed to update weekly task', type: 'error' });
        }
    };

    const handleLeaveGroup = () => {
        setModal({
            open: true,
            type: 'confirm',
            message: 'Are you sure you want to leave this group?',
            onConfirm: async () => {
                setModal({ ...modal, open: false });
                try {
                    await leaveGroup(groupId);
                    setToast({ message: 'You have left the group', type: 'success' });
                    navigate('/community');
                } catch (error) {
                    setToast({ message: 'Failed to leave group', type: 'error' });
                }
            }
        });
    };


    const handleCompleteTask = async () => {
        try {
            await completeWeeklyTask(groupId);
            setTaskCompleted(true);
            setToast({ message: 'Great job! Weekly task completed! 🎉', type: 'success' });
            queryClient.invalidateQueries({ queryKey: ["community", "group", groupId] });
        } catch (error) {
            setToast({ message: error.message || 'Failed to complete task', type: 'error' });
        }
    };

    const handlePostCreated = () => {
        setShowCreatePost(false);
        queryClient.invalidateQueries({ queryKey: ["community"] });
    };

    const handleConnect = async (recipientId) => {
        try {
            await sendPeerConnectRequest(recipientId, groupId);
            setToast({ message: "Connect request sent!", type: "success" });
            refetchConnections();
        } catch (error) {
            setToast({ message: error.message || "Failed to send request", type: "error" });
        }
    };

    const handleRespondToRequest = async (connectionId, action) => {
        try {
            await respondToPeerRequest(connectionId, action);
            setToast({
                message: action === "accept" ? "Connection accepted! 🎉" : "Request declined",
                type: action === "accept" ? "success" : "error"
            });
            refetchConnections();
            refetchPending();
        } catch (error) {
            setToast({ message: error.message || "Failed to respond", type: "error" });
        }
    };

    const categoryColors = {
        journaling: "from-purple-500 to-purple-600",
        gratitude: "from-yellow-500 to-yellow-600",
        mindfulness: "from-indigo-500 to-indigo-600",
        fitness: "from-red-500 to-red-600",
        habits: "from-blue-500 to-blue-600",
        goals: "from-green-500 to-green-600",
        wellness: "from-pink-500 to-pink-600",
        other: "from-gray-500 to-gray-600"
    };

    const gradientColor = categoryColors[group?.category] || categoryColors.other;

    // State for showing connections modal
    const [showConnectionsModal, setShowConnectionsModal] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]"></div>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <p className="text-gray-600 dark:text-gray-400">Group not found</p>
                {/* Toast notification */}
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type === "error" ? "error" : "success"}
                            onClose={() => setToast(null)}
                            duration={3000}
                        />
                    )}
                </div>
            </div>
        );
    }

    // If not a member, show access denied
    if (!isMember && !isDisabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl text-center max-w-lg">
                    <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Access Denied</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">You must be a member of this group to view its content.</p>
                    <button
                        onClick={() => navigate('/community')}
                        className="px-6 py-3 bg-[#f4873e] text-white rounded-full font-bold hover:bg-[#ffa669] transition-colors"
                    >
                        Back to Community
                    </button>
                </div>
                {/* Toast notification */}
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type === "error" ? "error" : "success"}
                            onClose={() => setToast(null)}
                            duration={3000}
                        />
                    )}
                </div>
            </div>
        );
    }
    // If disabled, show disabled message
    if (isDisabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-10 shadow-xl text-center max-w-lg">
                    <h2 className="text-2xl font-bold mb-4 text-red-600 dark:text-red-400">You are disabled from this group</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">{memberObj.disabledReason || 'You have been disabled by a moderator and cannot access this group.'}</p>
                    <button
                        onClick={() => navigate('/community')}
                        className="px-6 py-3 bg-[#f4873e] text-white rounded-full font-bold hover:bg-[#ffa669] transition-colors"
                    >
                        Back to Community
                    </button>
                </div>
                {/* Toast notification */}
                <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
                    {toast && (
                        <Toast
                            message={toast.message}
                            type={toast.type === "error" ? "error" : "success"}
                            onClose={() => setToast(null)}
                            duration={3000}
                        />
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            {showCreatePost && (
                <CreatePostModal
                    onClose={() => setShowCreatePost(false)}
                    onPostCreated={handlePostCreated}
                    groupId={groupId}
                />
            )}
            {showModeratorModal && (
                <ModeratorCandidatesModal
                    groupId={groupId}
                    groupName={group?.name}
                    onClose={() => setShowModeratorModal(false)}
                    onSuccess={() => {
                        setShowModeratorModal(false);
                        queryClient.invalidateQueries({ queryKey: ["community", "group", groupId] });
                    }}
                />
            )}

            <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
                {/* LEFT SIDEBAR */}
                <Sidebar />

                {/* MAIN CENTER PANEL */}
                <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative max-h-[775px] overflow-y-auto">

                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/community', { state: { activeTab: 'groups' } })}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#f4873e] mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span className="font-semibold">Back to Group</span>
                    </button>

                    {/* Group Header with Members/Requests buttons */}
                    <div className={`bg-gradient-to-r ${gradientColor} rounded-3xl p-4 lg:p-6 mb-6 text-white shadow-lg`}>
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="text-5xl">{group.icon || "📝"}</div>
                                <div>
                                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2" style={{ fontFamily: "Brasika" }}>
                                        {group.name}
                                        {group.moderatorId && (group.moderatorId === currentUserId || group.moderatorId?._id === currentUserId) && (
                                            <span title="You are the moderator" className="ml-2 text-yellow-400 text-2xl">👑</span>
                                        )}
                                    </h1>
                                    <p className="text-white/90 mb-3">{group.description}</p>
                                    <div className="flex items-center gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Users className="w-4 h-4" />
                                            <span>{group.memberCount || group.members?.length || 0} members</span>
                                        </div>
                                        <span className="px-3 py-1 bg-white/20 rounded-full">{group.category}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2 items-end">
                                <button
                                    onClick={handleLeaveGroup}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-semibold transition-colors"
                                >
                                    Leave Group
                                </button>
                                {group && group.adminId === currentUserId && (
                                    <button
                                        onClick={() => setShowModeratorModal(true)}
                                        className="px-4 py-2 bg-[#89beab] hover:bg-[#6fa893] text-white rounded-full text-sm font-semibold transition-colors mt-2"
                                    >
                                        Assign Moderator
                                    </button>
                                )}
                                {group && (group.adminId === currentUserId || isModerator) && (
                                    <button
                                        onClick={() => setShowWeeklyTaskModal(true)}
                                        className="px-4 py-2 bg-[#f4873e] hover:bg-[#f8ba90] text-white rounded-full text-sm font-semibold transition-colors mt-2"
                                    >
                                        Set Weekly Task
                                    </button>
                                )}
                                {group && (group.adminId === currentUserId || isModerator) && (
                                    <button
                                        onClick={() => navigate(`/admin/groups/${group._id}/moderator/dashboard`)}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-semibold transition-colors mt-2"
                                    >
                                        Moderator Tools
                                    </button>
                                )}
                                {groupPendingRequests.length > 0 && (
                                    <button
                                        onClick={() => setShowRequestsModal(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-[#f4873e] hover:bg-[#f8ba90] rounded-full text-sm font-semibold text-white shadow-md relative animate-pulse"
                                        title="Pending Peer Requests"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        Peer Requests
                                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                                            {groupPendingRequests.length}
                                        </span>
                                    </button>
                                )}
                                <div className="flex gap-2 mt-2 flex-wrap">
                                    <button
                                        onClick={() => setShowMembersModal(true)}
                                        className="flex items-center gap-1 px-3 py-1.5 bg-white/30 hover:bg-white/40 rounded-full text-sm font-semibold text-white"
                                        title="View Members"
                                    >
                                        <Users className="w-4 h-4" />
                                        Members
                                    </button>
                                </div>
                            </div>
                            <WeeklyTaskModal
                                isOpen={showWeeklyTaskModal}
                                onClose={() => setShowWeeklyTaskModal(false)}
                                onSave={handleSaveWeeklyTask}
                                initialTask={group?.weeklyTask?.task || ''}
                            />
                        </div>
                    </div>

                    {/* Weekly Task */}
                    {group.weeklyTask?.task && (
                        <div className="bg-gradient-to-br from-[#f8ba90] to-[#f4873e]/50 rounded-2xl p-4 lg:p-6 mb-6 shadow-md">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Calendar className="w-5 h-5 text-white" />
                                        <h3 className="text-lg font-bold text-white">This Week's Challenge</h3>
                                    </div>
                                    <p className="text-white/90 mb-4">
                                        {group.weeklyTask.task}
                                    </p>
                                    <div className="flex items-center gap-2 text-sm text-white/80">
                                        <Users className="w-4 h-4" />
                                        <span>
                                            {(() => {
                                                const completed = group.weeklyTask.completedBy?.length || 0;
                                                const total = group.memberCount || group.members?.length || 0;
                                                const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
                                                return `${completed}/${total} members completed · ${percent}%`;
                                            })()}
                                        </span>
                                    </div>
                                </div>
                                {!taskCompleted ? (
                                    <button
                                        onClick={handleCompleteTask}
                                        className="px-6 py-3 bg-white text-[#f4873e] rounded-full font-semibold hover:bg-gray-100 transition-colors shadow-md"
                                    >
                                        Mark Complete
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-2 px-6 py-3 bg-green-500 text-white rounded-full font-semibold shadow-md">
                                        <CheckCircle className="w-5 h-5" />
                                        Completed!
                                    </div>
                                )}
                            </div>
                        </div>
                    )}


                    {/* Connections Row Section */}
                    {myConnections.filter(c => c.status === "accepted").length > 0 && (
                        <div className="mb-8">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 text-center">
                                Your connections in this group
                            </h2>
                            <div className="flex flex-wrap gap-4 lg:gap-6 justify-center py-2">
                                {myConnections.filter(c => c.status === "accepted").map((conn, idx) => {
                                    const other = conn.requesterId?._id === currentUserId || conn.requesterId === currentUserId
                                        ? conn.recipientId
                                        : conn.requesterId;
                                    const name = other?.firstName ? `${other.firstName} ${other.lastName}` : "Member";
                                    const avatarUrl = other?.profilePicture || null;
                                    return (
                                        <div key={conn._id} className="flex flex-col items-center gap-2 w-24">
                                            <button
                                                onClick={() => navigate(`/community/group/${groupId}/chat/${conn._id}`)}
                                                className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white text-2xl font-bold shadow-md hover:scale-105 transition border-4 border-white"
                                                title={name}
                                            >
                                                {avatarUrl ? (
                                                    <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                                                ) : (
                                                    name.charAt(0).toUpperCase()
                                                )}
                                            </button>
                                            <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center truncate w-full" title={name}>{name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}



                    {/* Group Feed */}
                    <div className="mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            Group Feed
                        </h2>

                        {posts.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-700/50 rounded-2xl">
                                <p className="text-gray-600 dark:text-gray-400 mb-4">
                                    No posts yet. Be the first to share!
                                </p>
                            </div>
                        ) : (
                            <CommunityFeed
                                posts={posts}
                                getCategoryColor={() => "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"}
                                focusPostId={focusPostId}
                                highlightCommentId={focusCommentId}
                            />
                        )}
                    </div>
                </div>

                {/* Top Right Navigation Buttons */}
                <div className="absolute top-4 lg:top-6 right-4 lg:right-6 flex items-center gap-4 lg:gap-6">
                    <NotificationBell />
                    <button
                        onClick={() => navigate('/settings')}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
                    >
                        <Settings className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Create Post Button */}
                <button
                    onClick={() => setShowCreatePost(true)}
                    className="absolute bottom-8 right-8 bg-[#89beab] dark:bg-teal-600 text-white p-5 rounded-full shadow-lg hover:bg-[#FFA669] dark:hover:bg-teal-700 hover:shadow-xl transition-all flex items-center gap-2 group"
                >
                    <Plus className="w-6 h-6" />
                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                        New Post
                    </span>
                </button>
            </div>

            {/* Members Modal */}
            <Modal
                isOpen={showMembersModal}
                onClose={() => setShowMembersModal(false)}
                title={`Members (${group?.members?.filter(m => m.role !== "admin").length || 0})`}
            >
                <div className="space-y-2 max-h-96 overflow-y-auto">
                    {group?.members?.filter(m => m.role !== "admin").map((member) => {
                        const user = member.userId || member;
                        const isCurrentUser = (user._id || user) === currentUserId;
                        const isConnected = myConnections.some(conn =>
                            conn.status === "accepted" && (
                                (conn.requesterId?._id === (user._id || user) || conn.recipientId?._id === (user._id || user))
                            )
                        );
                        return (
                            <div key={user._id || user} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white font-bold">
                                        {user.firstName?.charAt(0) || user.username?.charAt(0) || "?"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {user.firstName} {user.lastName}
                                            {isCurrentUser && " (You)"}
                                            {member.role === "moderator" && " 🛡️"}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {!isCurrentUser && !isConnected && (
                                    <button
                                        onClick={() => handleConnect(user._id || user)}
                                        className="px-3 py-1.5 bg-[#89beab] hover:bg-[#6fa893] text-white rounded-full text-xs font-semibold transition"
                                    >
                                        Connect
                                    </button>
                                )}
                                {isConnected && (
                                    <span className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-semibold">
                                        Connected
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {/* Requests Modal */}
            <Modal
                isOpen={showRequestsModal}
                onClose={() => setShowRequestsModal(false)}
                title={`Pending Requests (${groupPendingRequests.length})`}
            >
                <div className="space-y-2">
                    {groupPendingRequests.length === 0 && (
                        <p className="text-gray-500">No pending requests.</p>
                    )}
                    {groupPendingRequests.map(req => {
                        const requesterName = req.requesterId?.firstName
                            ? `${req.requesterId.firstName} ${req.requesterId.lastName}`
                            : "A member";
                        return (
                            <div
                                key={req._id}
                                className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white font-bold text-sm">
                                        {requesterName.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{requesterName}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">wants to connect with you</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRespondToRequest(req._id, "accept")}
                                        className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-full text-xs font-semibold transition"
                                    >
                                        Accept
                                    </button>
                                    <button
                                        onClick={() => handleRespondToRequest(req._id, "decline")}
                                        className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 hover:bg-red-100 dark:hover:bg-red-900/30 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 rounded-full text-xs font-semibold transition"
                                    >
                                        Decline
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {/* Connections Modal */}
            <Modal
                isOpen={showConnectionsModal}
                onClose={() => setShowConnectionsModal(false)}
                title="Your Connections in this Group"
            >
                <div className="flex flex-wrap gap-4 lg:gap-6 justify-center py-4">
                    {myConnections.filter(c => c.status === "accepted").map((conn, idx) => {
                        const other = conn.requesterId?._id === currentUserId || conn.requesterId === currentUserId
                            ? conn.recipientId
                            : conn.requesterId;
                        const name = other?.firstName ? `${other.firstName} ${other.lastName}` : "Member";
                        // Use avatar if available, else fallback to initials
                        const avatarUrl = other?.profilePicture || null;
                        return (
                            <div key={conn._id} className="flex flex-col items-center gap-2 w-24">
                                <button
                                    onClick={() => {
                                        setShowConnectionsModal(false);
                                        navigate(`/community/group/${groupId}/chat/${conn._id}`);
                                    }}
                                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f8ba90] to-[#f4873e] flex items-center justify-center text-white text-2xl font-bold shadow-md hover:scale-105 transition border-4 border-white"
                                    title={name}
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        name.charAt(0).toUpperCase()
                                    )}
                                </button>
                                <span className="text-xs font-semibold text-gray-800 dark:text-gray-200 text-center truncate w-full" title={name}>{name}</span>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {/* Modal Dialogs */}
            <Modal
                isOpen={modal.open}
                onClose={() => setModal({ ...modal, open: false })}
                title={modal.type === 'confirm' ? 'Confirm' : modal.type === 'error' ? 'Error' : ''}
            >
                <p className="mb-4">{modal.message}</p>
                <div className="flex justify-end gap-2">
                    <button
                        className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-300 dark:hover:bg-gray-500"
                        onClick={() => setModal({ ...modal, open: false })}
                    >
                        Cancel
                    </button>
                    {modal.type === 'confirm' && (
                        <button
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-bold hover:shadow-lg"
                            onClick={modal.onConfirm}
                        >
                            Confirm
                        </button>
                    )}
                    {modal.type === 'error' && (
                        <button
                            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold hover:shadow-lg"
                            onClick={modal.onConfirm}
                        >
                            OK
                        </button>
                    )}
                </div>
            </Modal>

            {/* Toast notification */}
            <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100]">
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type === "error" ? "error" : "success"}
                        onClose={() => setToast(null)}
                        duration={3000}
                    />
                )}
            </div>
        </>
    );
};

export default GroupDetailsPage;