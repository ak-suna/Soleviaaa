import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Sidebar from "../components/Sidebar";
import MobileMenu from "../components/MobileMenu";
import RightSidebarCards from "../components/RightSidebarCards";
import { Plus, Users, Trophy, ArrowRight, CheckCircle, Menu } from 'lucide-react';
import { getPosts, getUserGroups, getUserChallenges } from "../services/communityService";
import CreatePostModal from "../components/CreatePostModal";
import CommunityFeed from "../components/CommunityFeed";
import config from "../config";
import { getToken } from "../services/auth";

const CommunityPage = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("feed"); // feed, groups, challenges
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [showCreatePostModal, setShowCreatePostModal] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    // Focus post logic
    const searchParams = new URLSearchParams(location.search);
    const focusPostId = searchParams.get("focus");
    const focusCommentId = searchParams.get("comment");

    // Listen for navigation state to set active tab
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab);
        }
    }, [location.state]);

    const { data: postsData, isLoading: loadingPosts } = useQuery({
        queryKey: ["community", "posts", categoryFilter],
        queryFn: () => getPosts(1, 10, categoryFilter === "all" ? null : categoryFilter),
        enabled: activeTab === "feed",
        refetchInterval: 5000,
    });

    const { data: groupsData } = useQuery({
        queryKey: ["community", "userGroups"],
        queryFn: getUserGroups,
        refetchInterval: 5000,
    });

    const { data: challengesData } = useQuery({
        queryKey: ["community", "userChallenges"],
        queryFn: getUserChallenges,
        refetchInterval: 5000,
    });

    const { data: pastChallengesData } = useQuery({
        queryKey: ["community", "pastChallenges"],
        queryFn: async () => {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/past`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch past challenges");
            return data;
        },
        refetchInterval: 5000
    });

    const posts = postsData?.posts ?? [];
    const myGroups = groupsData?.groups ?? [];
    const myChallenges = challengesData?.challenges ?? [];
    const pastChallenges = pastChallengesData?.challenges ?? [];
    const loading = activeTab === "feed" ? loadingPosts : false;

    const tabs = [
        { id: "feed", label: "Community Feed", icon: "📰" },
        { id: "groups", label: "My Groups", icon: "👥" },
        { id: "challenges", label: "Challenges", icon: "🏆" }
    ];

    const categories = [
        { id: "all", label: "All", icon: "📋" },
        { id: "wellbeing", label: "Wellbeing", icon: "💚" },
        { id: "habits", label: "Habits", icon: "✅" },
        { id: "journaling", label: "Journaling", icon: "📝" },
        { id: "gratitude", label: "Gratitude", icon: "🙏" },
        { id: "mindfulness", label: "Mindfulness", icon: "🧘" },
        { id: "fitness", label: "Fitness", icon: "💪" },
        { id: "other", label: "Other", icon: "✨" }
    ];

    const getCategoryColor = (category) => {
        const colors = {
            wellbeing: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            habits: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            journaling: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            gratitude: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            mindfulness: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
            fitness: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            other: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400"
        };
        return colors[category] || colors.other;
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-3 pt-16 sm:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 overflow-x-hidden">
            {/* Mobile Menu Button */}
            <button
                onClick={() => setShowMobileMenu(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
            >
                <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
            </button>

            {/* LEFT SIDEBAR */}
            <Sidebar />
            <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} type="user" />

            {/* MAIN CONTENT AREA - Matches dashboard width */}
            <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl lg:rounded-[50px] p-4 sm:p-5 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] max-h-none lg:max-h-[775px] overflow-y-auto">

                {/* Header */}
                <div className="mb-6 text-left">
                    <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Brasika" }}>
                        <span className="text-[#f4873e] dark:text-orange-400">Community </span>
                        <span className="text-[#89beab] dark:text-teal-400">Space</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">Connect, share, and grow together</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 lg:gap-6 mb-6 border-b-2 border-gray-200 dark:border-gray-700 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                pb-3 px-2 font-semibold transition-all flex items-center gap-2
                                ${activeTab === tab.id
                                    ? 'text-[#f4873e] border-b-4 border-[#f4873e]'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-[#f4873e]'
                                }
                            `}
                        >
                            <span className="text-xl">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Category Filters (Only show in Feed tab) */}
                {activeTab === "feed" && (
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
                        {categories.map(category => (
                            <button
                                key={category.id}
                                onClick={() => setCategoryFilter(category.id)}
                                className={`
                                    px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2
                                    ${categoryFilter === category.id
                                        ? 'bg-[#f4873e] text-white shadow-lg'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:shadow-md'
                                    }
                                `}
                            >
                                <span>{category.icon}</span>
                                {category.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Tab Content */}
                <div>
                    {/* FEED TAB */}
                    {activeTab === "feed" && (
                        <div>
                            {loading ? (
                                <div className="flex justify-center items-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]"></div>
                                </div>
                            ) : posts.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-600 dark:text-gray-400">No posts yet. Be the first to share!</p>
                                    <button className="mt-4 px-6 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg">
                                        Create Post
                                    </button>
                                </div>
                            ) : (
                                <CommunityFeed posts={posts} getCategoryColor={getCategoryColor} focusPostId={focusPostId} highlightCommentId={focusCommentId} />
                            )}
                        </div>
                    )}

                    {/* MY GROUPS TAB */}
                    {activeTab === "groups" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Groups</h2>
                                <button
                                    onClick={() => navigate('/community/groups/browse', { state: { fromTab: 'groups' } })}
                                    className="px-6 py-2 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full font-bold hover:shadow-lg flex items-center gap-2"
                                >
                                    Explore Groups
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Joined Groups */}
                            {myGroups.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-4">✓ Joined Groups</h3>
                                    <div className="grid grid-cols-1 gap-4">
                                        {myGroups.map(group => (
                                            <div key={group._id} className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-900/20 dark:to-gray-800 rounded-2xl p-5 border-2 border-teal-200 dark:border-teal-800 hover:shadow-lg transition-all cursor-pointer"
                                                onClick={() => navigate(`/community/group/${group._id}`)}>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{group.icon || "📝"}</span>
                                                    <div className="flex-1">
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{group.name}</h4>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            {group.members?.length || 0} members
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {myGroups.length === 0 && (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't joined any groups yet</p>
                                    <button
                                        onClick={() => navigate('/community/groups/browse', { state: { fromTab: 'groups' } })}
                                        className="px-6 py-3 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full font-bold hover:shadow-lg"
                                    >
                                        Explore Groups
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* CHALLENGES TAB */}
                    {activeTab === "challenges" && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Challenges</h2>
                                <button
                                    onClick={() => navigate('/community/challenges/browse', { state: { fromTab: 'challenges' } })}
                                    className="px-6 py-2 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg flex items-center gap-2"
                                >
                                    Browse Challenges
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Show ONLY joined challenges (myChallenges) */}
                            {myChallenges.filter(c => c.isJoined !== false).length > 0 ? (
                                <div className="grid grid-cols-1 gap-4 mb-6">
                                    {myChallenges.filter(c => c.isJoined !== false).map(challenge => (
                                        <div
                                            key={challenge._id}
                                            onClick={() => navigate(`/challenges/${challenge._id}`)}
                                            className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-gray-800 rounded-2xl p-5 border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-all cursor-pointer"
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-3xl">{challenge.icon || "🏆"}</span>
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{challenge.title}</h4>
                                                        {challenge.isNew && (
                                                            <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                                New Challenge
                                                            </span>
                                                        )}
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">{challenge.duration} days</p>
                                                    </div>
                                                </div>
                                                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold">
                                                    Active
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">Your Progress</span>
                                                    <span className="font-bold text-[#f4873e]">{challenge.completionPercentage || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] h-2 rounded-full transition-all"
                                                        style={{ width: `${challenge.completionPercentage || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                                <span>{challenge.participantCount || 0} participants</span>
                                                <span className="text-[#f4873e] font-bold">View details →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                                    <p className="text-gray-600 dark:text-gray-400 mb-4">You're not participating in any challenges</p>
                                    {/* <button
                                        onClick={() => navigate('/community/challenges/browse', { state: { fromTab: 'challenges' } })}
                                        className="px-6 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg"
                                    >
                                        Browse Challenges
                                    </button> */}
                                </div>
                            )}

                            <div className="mt-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Past Challenges</h3>
                                {pastChallenges.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {pastChallenges.slice(0, 5).map(challenge => (
                                            <div
                                                key={challenge._id}
                                                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 border border-gray-200 dark:border-gray-600"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{challenge.title}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    {challenge.isCompleted && (
                                                        <span className="flex items-center gap-1 text-xs font-bold text-green-600 dark:text-green-400">
                                                            <CheckCircle className="w-3 h-3" /> Completed
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span className="text-gray-600 dark:text-gray-400">Completion</span>
                                                    <span className="font-bold text-[#f4873e]">{challenge.completionPercentage || 0}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${challenge.isCompleted ? "bg-green-500" : "bg-gray-400"}`}
                                                        style={{ width: `${challenge.completionPercentage || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-700 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No past challenges yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT SIDEBAR CARDS - Reusable Component */}
            <div className="hidden lg:block">
                <RightSidebarCards
                    myGroups={myGroups}
                    myChallenges={myChallenges}
                />
            </div>

            {/* Floating Action Button */}
            <button
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110"
                onClick={() => { setShowCreatePostModal(true) }}
            >
                <Plus className="w-7 h-7" />
            </button>

            {/* CREATE POST MODAL */}
            {showCreatePostModal && (
                <CreatePostModal
                    onClose={() => setShowCreatePostModal(false)}
                    onPostCreated={() => {
                        setShowCreatePostModal(false);
                        queryClient.invalidateQueries({ queryKey: ["community"] });
                    }}
                />
            )}
        </div>
    );
};

export default CommunityPage;