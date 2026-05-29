import React, { useState, useEffect } from "react";
import { getToken } from "../services/auth";
import { Trophy, Plus, Edit2, Trash2, X, AlertTriangle, Users, Calendar, Menu } from 'lucide-react';
import AdminSidebar from "../components/AdminSidebar";
import MobileMenu from "../components/MobileMenu";
import { showError, showSuccess, confirmAction } from "../utils/uiFeedback";
import config from "../config";

const AdminChallengesPage = () => {
    const [activeTab, setActiveTab] = useState("templates");
    const [templates, setTemplates] = useState([]);
    const [liveChallenges, setLiveChallenges] = useState([]);
    const [eligibleCount, setEligibleCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        trackingType: "mood",
        duration: 7,
        difficulty: "easy",
        status: "active"
    });

    useEffect(() => {
        fetchTemplates();
        fetchLiveChallenges();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/admin/templates`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setTemplates(data.templates || []);
            setEligibleCount(data.eligibleCount || 0);
        } catch (err) {
            showError(err.message || "Failed to load templates");
        } finally {
            setLoading(false);
        }
    };

    const fetchLiveChallenges = async () => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setLiveChallenges(data.challenges || []);
        } catch (err) {
            console.error("Error fetching live challenges:", err);
        }
    };

    const resetForm = () => {
        setFormData({
            title: "",
            description: "",
            trackingType: "mood",
            duration: 7,
            difficulty: "easy",
            status: "active"
        });
        setEditingTemplate(null);
    };

    const handleOpenEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            title: template.title,
            description: template.description,
            trackingType: template.trackingType,
            duration: template.duration,
            difficulty: template.difficulty,
            status: template.status
        });
        setShowCreateModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingTemplate
            ? `${config.BACKEND_URL}/api/challenges/admin/templates/${editingTemplate._id}`
            : `${config.BACKEND_URL}/api/challenges/admin/templates`;
        const method = editingTemplate ? "PATCH" : "POST";

        try {
            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showSuccess(editingTemplate ? "Template updated!" : "Template created!");
            setShowCreateModal(false);
            resetForm();
            fetchTemplates();
        } catch (err) {
            showError(err.message || "Failed to save template");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await confirmAction("Delete this template?", { confirmText: "Delete" });
        if (!confirmed) return;
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/admin/templates/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showSuccess("Template deleted");
            fetchTemplates();
        } catch (err) {
            showError(err.message || "Failed to delete template");
        }
    };

    const trackingTypeColors = {
        mood: "from-purple-500 to-purple-600",
        habit: "from-blue-500 to-blue-600",
        journal: "from-green-500 to-green-600",
        manual: "from-orange-500 to-orange-600"
    };

    const difficultyColors = {
        easy: "from-green-500 to-green-600",
        medium: "from-yellow-500 to-yellow-600",
        hard: "from-red-500 to-red-600"
    };

    const trackingTypeIcons = {
        mood: "😊",
        habit: "✅",
        journal: "📝",
        manual: "👆"
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
                <AdminSidebar />
                <div className="flex-1 lg:ml-28 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]"></div>
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

                {/* Low pool warning */}
                {eligibleCount <= 2 && (
                    <div className="flex items-center gap-3 p-4 mb-6 bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-300 dark:border-yellow-700 rounded-3xl">
                        <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        <p className="text-yellow-700 dark:text-yellow-400 font-medium text-sm">
                            Only {eligibleCount} eligible template(s) available. Add more templates to keep challenges running automatically.
                        </p>
                    </div>
                )}

                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3" style={{ fontFamily: "Brasika" }}>
                        <Trophy className="w-7 h-7 text-[#f4873e]" />
                        Challenge Management
                    </h2>
                    {activeTab === "templates" && (
                        <button
                            onClick={() => { resetForm(); setShowCreateModal(true); }}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg transition-all"
                        >
                            <Plus className="w-5 h-5" />
                            Create Template
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-6 overflow-x-auto">
                    {[
                        { id: "templates", label: "Templates" },
                        { id: "live", label: "Live Challenges" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-full font-bold transition-all ${activeTab === tab.id
                                    ? "bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white shadow-lg scale-105"
                                    : "bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:scale-102 hover:shadow-md"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Templates Tab */}
                {activeTab === "templates" && (
                    templates.length === 0 ? (
                        <div className="text-center py-12">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400">No templates yet. Create your first one.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {templates.map(template => (
                                <div key={template._id} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-3xl p-4 lg:p-6 shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all">

                                    {/* Icon + badges row */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">{trackingTypeIcons[template.trackingType]}</span>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                                {template.title}
                                            </h3>
                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                <span className={`inline-block px-3 py-1 bg-gradient-to-r ${trackingTypeColors[template.trackingType]} text-white rounded-full text-xs font-bold`}>
                                                    {template.trackingType}
                                                </span>
                                                <span className={`inline-block px-3 py-1 bg-gradient-to-r ${difficultyColors[template.difficulty]} text-white rounded-full text-xs font-bold`}>
                                                    {template.difficulty}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                        {template.description}
                                    </p>

                                    {/* Stats */}
                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                            <Calendar className="w-4 h-4 mx-auto mb-1 text-[#f4873e]" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{template.duration}d</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                            <div className={`w-3 h-3 mx-auto mb-1 rounded-full ${template.status === "active" ? "bg-green-500" : "bg-gray-400"}`} />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Status</p>
                                            <p className={`font-bold text-xs ${template.status === "active" ? "text-green-600 dark:text-green-400" : "text-gray-500"}`}>
                                                {template.status}
                                            </p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                            <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Eligible</p>
                                            <p className={`font-bold text-xs ${template.isEligible ? "text-green-600 dark:text-green-400" : "text-orange-500"}`}>
                                                {template.isEligible ? "Yes" : "Cooldown"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Last used */}
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                                        {template.lastUsedAt
                                            ? `Last used: ${new Date(template.lastUsedAt).toLocaleDateString()}`
                                            : "Never used"}
                                    </p>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleOpenEdit(template)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full font-bold hover:shadow-md transition-all"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template._id)}
                                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full font-bold hover:shadow-md transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Live Challenges Tab */}
                {activeTab === "live" && (
                    liveChallenges.length === 0 ? (
                        <div className="text-center py-12">
                            <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-gray-500 dark:text-gray-400">No active challenges right now.</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Agenda will create one next Sunday at 8am.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                            {liveChallenges.map(challenge => (
                                <div key={challenge._id} className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 rounded-3xl p-4 lg:p-6 shadow-lg border-2 border-gray-200 dark:border-gray-600 hover:shadow-xl transition-all">

                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="text-4xl">{trackingTypeIcons[challenge.trackingType]}</span>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                                {challenge.title}
                                            </h3>
                                            <div className="flex gap-2 mt-1">
                                                <span className={`inline-block px-3 py-1 bg-gradient-to-r ${trackingTypeColors[challenge.trackingType]} text-white rounded-full text-xs font-bold`}>
                                                    {challenge.trackingType}
                                                </span>
                                                <span className="inline-block px-3 py-1 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full text-xs font-bold">
                                                    Active
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                                        {challenge.description}
                                    </p>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                            <Users className="w-4 h-4 mx-auto mb-1 text-[#89beab]" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Members</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{challenge.participantCount}</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                            <Calendar className="w-4 h-4 mx-auto mb-1 text-[#f4873e]" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Duration</p>
                                            <p className="font-bold text-gray-900 dark:text-white">{challenge.duration}d</p>
                                        </div>
                                        <div className="bg-white dark:bg-gray-600 rounded-2xl p-3 text-center">
                                            <Trophy className="w-4 h-4 mx-auto mb-1 text-yellow-500" />
                                            <p className="text-xs text-gray-600 dark:text-gray-400">Left</p>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {Math.max(0, Math.ceil((new Date(challenge.endDate) - new Date()) / (1000 * 60 * 60 * 24)))}d
                                            </p>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Ends: {new Date(challenge.endDate).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )
                )}

                {/* Create / Edit Modal */}
                {showCreateModal && (
                    <div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => { setShowCreateModal(false); resetForm(); }}
                    >
                        <div
                            className="bg-white dark:bg-gray-800 rounded-[40px] p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                                    {editingTemplate ? "Edit Template" : "Create New Template"}
                                </h2>
                                <button
                                    onClick={() => { setShowCreateModal(false); resetForm(); }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Title *</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                                        placeholder="e.g., 7 Day Mood Streak"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Description *</label>
                                    <textarea
                                        required
                                        rows="3"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e] resize-none"
                                        placeholder="Describe the challenge..."
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Tracking Type *</label>
                                    <select
                                        value={formData.trackingType}
                                        onChange={e => setFormData({ ...formData, trackingType: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                                    >
                                        <option value="mood">😊 Mood (auto tracked)</option>
                                        <option value="habit">✅ Habit (auto tracked)</option>
                                        <option value="journal">📝 Journal (auto tracked)</option>
                                        <option value="manual">👆 Manual (user taps done)</option>
                                    </select>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {formData.trackingType === "manual"
                                            ? "User must manually mark each day as done"
                                            : `Progress tracked automatically from user's ${formData.trackingType} activity`}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Duration (days) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="1"
                                            value={formData.duration}
                                            onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Difficulty *</label>
                                        <select
                                            value={formData.difficulty}
                                            onChange={e => setFormData({ ...formData, difficulty: e.target.value })}
                                            className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                                        className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-2xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                                    >
                                        <option value="active">Active (eligible for scheduling)</option>
                                        <option value="inactive">Inactive (excluded from scheduling)</option>
                                    </select>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowCreateModal(false); resetForm(); }}
                                        className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg transition-all"
                                    >
                                        {editingTemplate ? "Update Template" : "Create Template"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminChallengesPage;