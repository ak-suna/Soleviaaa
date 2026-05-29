import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken } from "../services/auth";
import { UserPlus, Plus, Users, Calendar, Trash2, Edit, X, Trophy, Inbox, LayoutDashboard, Menu } from 'lucide-react';
import ModeratorCandidatesModal from "../components/ModeratorCandidatesModal";
import JoinRequestsModal from "../components/JoinRequestsModal";
import AdminSidebar from "../components/AdminSidebar";
import MobileMenu from "../components/MobileMenu";
import { showError, showSuccess, confirmAction } from "../utils/uiFeedback";
import config from "../config";
// import NotificationBell from '../components/NotificationBell';

const AdminGroupsPage = () => {
    const navigate = useNavigate();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCandidatesModal, setShowCandidatesModal] = useState(null);
    const [showRequestsModal, setShowRequestsModal] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        category: "journaling",
        icon: "📝",
        maxMembers: 50,
        weeklyTask: ""
    });

    useEffect(() => {
        fetchGroups();
    }, []);

    const fetchGroups = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/groups?limit=100`,
                { headers: { Authorization: `Bearer ${getToken()}` } }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error);
            setGroups(data.groups || []);
        } catch (err) {
            showError(err.message || "Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch(`${config.BACKEND_URL}/api/groups`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error("Failed to create group");

            showSuccess("Group created successfully!");
            setShowCreateModal(false);
            resetForm();
            fetchGroups();
        } catch (err) {
            showError(err.message || "Failed to create group");
        }
    };

    const updateWeeklyTask = async (groupId) => {
        const task = prompt("Enter new weekly task:");
        if (!task) return;

        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/groups/${groupId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${getToken()}`
                    },
                    body: JSON.stringify({
                        weeklyTask: {
                            task,
                            week: new Date()
                        }
                    })
                }
            );

            if (!response.ok) throw new Error("Failed to update task");
            showSuccess("Weekly task updated!");
            fetchGroups();
        } catch (err) {
            showError(err.message || "Failed to update task");
        }
    };

    const deleteGroup = async (groupId) => {
        const confirmed = await confirmAction("Are you sure you want to delete this group?", { confirmText: "Delete" });
        if (!confirmed) return;

        try {
            const response = await fetch(
                `${config.BACKEND_URL}/api/groups/${groupId}`,
                {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` }
                }
            );

            if (!response.ok) throw new Error("Failed to delete group");
            showSuccess("Group deleted successfully");
            fetchGroups();
        } catch (err) {
            showError(err.message || "Failed to delete group");
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            category: "journaling",
            icon: "📝",
            maxMembers: 50,
            weeklyTask: ""
        });
    };

    const categoryIcons = {
        journaling: "📝",
        gratitude: "🙏",
        mindfulness: "🧘",
        fitness: "💪",
        habits: "✅",
        goals: "🎯",
        wellness: "💚",
        other: "✨"
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

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
                <AdminSidebar />
                <div className="flex-1 lg:ml-28 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#89beab]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
            >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            {/* LEFT SIDEBAR */}
            <AdminSidebar />
            <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} type="admin" />

            {/* MAIN CENTER PANEL */}
            <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative max-h-[775px] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3" style={{ fontFamily: "Brasika" }}>
                        <UserPlus className="w-7 h-7 text-[#89beab]" />
                        Support Groups Management
                    </h2>
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full font-bold hover:shadow-lg transition-all"
                    >
                        <Plus className="w-5 h-5" />
                        Create Group
                    </button>
                </div>

                {/* Groups Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                    {groups.map(group => (
                        <div key={group._id} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-3xl p-4 lg:p-6 shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-4xl">{group.icon || categoryIcons[group.category]}</span>
                                <div className="flex-1">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                        {group.name}
                                    </h3>
                                    <span className={`inline-block px-3 py-1 bg-gradient-to-r ${categoryColors[group.category]} text-white rounded-full text-xs font-bold`}>
                                        {group.category}
                                    </span>
                                </div>
                            </div>

                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                {group.description}
                            </p>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                    <Users className="w-4 h-4 mx-auto mb-1 text-[#89beab]" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{group.memberCount || group.members?.length || 0}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                    <Users className="w-4 h-4 mx-auto mb-1 text-gray-400" />
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Capacity</p>
                                    <p className="font-bold text-gray-900 dark:text-white">{group.maxMembers}</p>
                                </div>
                                <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                    <div className={`w-4 h-4 mx-auto mb-1 rounded-full ${group.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                                    <p className={`font-bold ${group.isActive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        {group.isActive ? "Active" : "Inactive"}
                                    </p>
                                </div>
                            </div>

                            {group.pendingRequestCount > 0 && (
                                <div className="bg-orange-100 dark:bg-orange-900/30 rounded-2xl p-3 mb-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Inbox className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                            <span className="text-sm font-bold text-orange-900 dark:text-orange-300">
                                                {group.pendingRequestCount} Pending Request{group.pendingRequestCount > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => setShowRequestsModal({ groupId: group._id, groupName: group.name })}
                                            className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
                                        >
                                            Review →
                                        </button>
                                    </div>
                                </div>
                            )}

                            {group.weeklyTask?.task && (
                                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-2xl p-4 mb-4">
                                    <div className="flex items-start gap-2">
                                        <Calendar className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-1" />
                                        <div className="flex-1">
                                            <p className="text-xs font-bold text-orange-900 dark:text-orange-300 mb-1">Weekly Task</p>
                                            <p className="text-sm text-orange-800 dark:text-orange-200">{group.weeklyTask.task}</p>
                                            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                                                ✓ {group.weeklyTask.completedBy?.length || 0} completed
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button
                                    onClick={() => setShowCandidatesModal({ groupId: group._id, groupName: group.name })}
                                    className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-full font-bold text-sm hover:shadow-md transition-all"
                                >
                                    <Trophy className="w-4 h-4" />
                                    View Candidates
                                </button>

                                <button
                                    onClick={() => setShowRequestsModal({ groupId: group._id, groupName: group.name })}
                                    className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold text-sm hover:shadow-md transition-all relative"
                                >
                                    <Inbox className="w-4 h-4" />
                                    Join Requests
                                    {group.pendingRequestCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                                            {group.pendingRequestCount}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => navigate(`/admin/groups/${group._id}/moderator/dashboard`)}
                                    className="flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-full font-bold text-sm hover:shadow-md transition-all"
                                    title="Open Moderator Dashboard"
                                >
                                    <LayoutDashboard className="w-4 h-4" />
                                    Moderator
                                </button>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => updateWeeklyTask(group._id)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full font-bold hover:shadow-md transition-all"
                                >
                                    <Edit className="w-4 h-4" />
                                    Update Task
                                </button>
                                <button
                                    onClick={() => deleteGroup(group._id)}
                                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-md transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Create Group Modal */}
                {showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
                        <div className="bg-white dark:bg-gray-800 rounded-[40px] p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                    Create New Support Group
                                </h2>
                                <button onClick={() => { setShowCreateModal(false); resetForm(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
                                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateGroup} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Group Name *</label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab]" placeholder="e.g., Daily Gratitude Circle" />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                    <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows="4" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab] resize-none" placeholder="Describe the group's purpose..." />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Category *</label>
                                        <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab]">
                                            <option value="journaling">Journaling</option>
                                            <option value="gratitude">Gratitude</option>
                                            <option value="mindfulness">Mindfulness</option>
                                            <option value="fitness">Fitness</option>
                                            <option value="habits">Habits</option>
                                            <option value="goals">Goals</option>
                                            <option value="wellness">Wellness</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Icon</label>
                                        <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab]" placeholder={categoryIcons[formData.category]} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Max Members *</label>
                                    <input type="number" value={formData.maxMembers} onChange={(e) => setFormData({ ...formData, maxMembers: e.target.value })} required min="5" max="100" className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#89beab]" />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">Cancel</button>
                                    <button type="submit" className="flex-1 py-3 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full font-bold hover:shadow-lg transition-all">Create Group</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {showCandidatesModal && (
                    <ModeratorCandidatesModal
                        groupId={showCandidatesModal.groupId}
                        groupName={showCandidatesModal.groupName}
                        onClose={() => setShowCandidatesModal(null)}
                        onSuccess={fetchGroups}
                    />
                )}

                {showRequestsModal && (
                    <JoinRequestsModal
                        groupId={showRequestsModal.groupId}
                        groupName={showRequestsModal.groupName}
                        onClose={() => setShowRequestsModal(null)}
                        onSuccess={fetchGroups}
                    />
                )}
            </div>

            {/* Top Right Navigation */}
            {/* <div className="absolute top-6 right-6 flex items-center gap-6">
                <NotificationBell />
                <button
                    onClick={() => navigate('/settings')}
                    className="w-12 h-12 flex items-center justify-center rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg"
                >
                    <Menu className="w-7 h-7 text-gray-600 dark:text-gray-300" />
                </button>
            </div> */}
        </div>
    );
};

export default AdminGroupsPage;