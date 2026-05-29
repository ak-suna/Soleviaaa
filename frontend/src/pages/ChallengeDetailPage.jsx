import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Trophy } from "lucide-react";
import { getToken } from "../services/auth";
import Sidebar from "../components/Sidebar";
import confetti from "canvas-confetti";
import { showError, confirmAction } from "../utils/uiFeedback";
import config from "../config";

const ChallengeDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [challenge, setChallenge] = useState(null);
    const [days, setDays] = useState([]);
    const [isJoined, setIsJoined] = useState(false);
    const [completionPercentage, setCompletionPercentage] = useState(0);
    const [completedTodayCount, setCompletedTodayCount] = useState(0);
    const [totalParticipants, setTotalParticipants] = useState(0);
    const [feed, setFeed] = useState([]);
    const [postContent, setPostContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [markingDone, setMarkingDone] = useState(false);
    const [posting, setPosting] = useState(false);
    const [showCompletedPopup, setShowCompletedPopup] = useState(false);

    const todayStr = new Date().toISOString().split("T")[0];

    useEffect(() => {
        fetchChallenge();
        fetchFeed();
    }, [id]);

    const fetchChallenge = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setChallenge(data.challenge);
            setDays(data.days || []);
            setIsJoined(data.isJoined);
            setCompletionPercentage(data.completionPercentage || 0);
            setCompletedTodayCount(data.completedTodayCount || 0);
            setTotalParticipants(data.totalParticipants || 0);
        } catch (err) {
            console.error("Error fetching challenge:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchFeed = async () => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}/feed`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setFeed(data.posts || []);
        } catch (err) {
            console.error("Error fetching feed:", err);
        }
    };

    const handleJoin = async () => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}/join`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchChallenge();
        } catch (err) {
            showError(err.message || "Failed to join challenge");
        }
    };

    const handleLeave = async () => {
        const confirmed = await confirmAction("Leave this challenge?", { confirmText: "Leave" });
        if (!confirmed) return;
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}/leave`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchChallenge();
        } catch (err) {
            showError(err.message || "Failed to leave challenge");
        }
    };

    const handleMarkDone = async () => {
        setMarkingDone(true);
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}/complete-today`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            if (data.newlyCompleted || data.isCompleted) {
                setShowCompletedPopup(true);
                confetti({
                    particleCount: 180,
                    spread: 85,
                    origin: { y: 0.55 },
                    colors: ["#f4873e", "#89beab", "#ff9e5e", "#46c294", "#ffd700"]
                });
                window.dispatchEvent(new Event("challenge-trophies-updated"));
            }
            fetchChallenge();
        } catch (err) {
            showError(err.message || "Failed to mark day complete");
        } finally {
            setMarkingDone(false);
        }
    };

    const handlePost = async () => {
        if (!postContent.trim()) return;
        setPosting(true);
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}/feed`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ content: postContent })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setPostContent("");
            fetchFeed();
        } catch (err) {
            showError(err.message || "Failed to post update");
        } finally {
            setPosting(false);
        }
    };

    const handleReact = async (postId, emoji) => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${id}/feed/${postId}/react`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${getToken()}`
                },
                body: JSON.stringify({ emoji })
            });
            if (!res.ok) throw new Error("Failed to react");
            fetchFeed();
        } catch (err) {
            console.error(err);
        }
    };

    const isTodayDone = days.find(d => d.date === todayStr)?.completed || false;

    const difficultyColors = {
        easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
        hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    };

    const trackingTypeColors = {
        mood: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
        habit: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
        journal: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        manual: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
                <Sidebar />
                <div className="flex-1 lg:ml-28 flex justify-center items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]" />
                </div>
            </div>
        );
    }

    if (!challenge) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
                <Sidebar />
                <div className="flex-1 lg:ml-28 flex justify-center items-center">
                    <p className="text-gray-500 dark:text-gray-400">Challenge not found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
            {showCompletedPopup && (
                <div
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
                    onClick={() => setShowCompletedPopup(false)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-[30px] p-8 w-full max-w-md shadow-2xl border-2 border-orange-200 dark:border-orange-800 text-center"
                    >
                        <div className="text-5xl mb-3">🏆</div>
                        <p className="text-xs uppercase tracking-[0.2em] text-[#89beab] font-bold mb-1">Challenge Completed</p>
                        <h2 className="text-2xl text-gray-900 dark:text-white mb-2" style={{ fontFamily: "Brasika" }}>
                            Wow! {challenge?.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
                            Great job - your challenge completion has been recorded.
                        </p>
                        <button
                            onClick={() => setShowCompletedPopup(false)}
                            className="px-6 py-2 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold"
                        >
                            Nice!
                        </button>
                    </div>
                </div>
            )}

            <Sidebar />

            <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] max-h-[775px] overflow-y-auto">

                {/* Back */}
                <button
                    onClick={() => navigate('/community', { state: { activeTab: 'challenges' } })}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#f4873e] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold">Back to Challenges</span>
                </button>

                {/* Challenge Header */}
                <div className="mb-6">
                    <div className="flex gap-2 mb-3 flex-wrap overflow-x-auto">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${trackingTypeColors[challenge.trackingType]}`}>
                            {challenge.trackingType}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyColors[challenge.difficulty]}`}>
                            {challenge.difficulty}
                        </span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            {challenge.duration} days
                        </span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2" style={{ fontFamily: "Brasika" }}>
                        {challenge.title}
                    </h1>
                    {((new Date() - new Date(challenge.startDate)) <= (6 * 60 * 60 * 1000)) && (
                        <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            New Challenge
                        </span>
                    )}
                    <p className="text-gray-600 dark:text-gray-400">{challenge.description}</p>
                </div>

                {/* Join / Leave */}
                {!isJoined ? (
                    <button
                        onClick={handleJoin}
                        className="mb-6 px-8 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg transition-all"
                    >
                        Join Challenge
                    </button>
                ) : (
                    <button
                        onClick={handleLeave}
                        className="mb-6 px-8 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full font-bold hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 transition-all"
                    >
                        Leave Challenge
                    </button>
                )}

                {/* Progress Section */}
                {isJoined && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4 lg:p-6 mb-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                Your Progress
                            </h2>
                            <span className="text-2xl font-bold text-[#f4873e]">
                                {completionPercentage}%
                            </span>
                        </div>

                        {/* Day Circles */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {days.map((day, index) => {
                                // const isPast = day.date < todayStr;
                                const isToday = day.date === todayStr;
                                const isFuture = day.date > todayStr;

                                return (
                                    <div
                                        key={index}
                                        title={day.date}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${day.completed
                                            ? "bg-gradient-to-br from-[#f4873e] to-[#ff9e5e] text-white shadow-md"
                                            : isToday
                                                ? "border-2 border-[#f4873e] text-[#f4873e] bg-orange-50 dark:bg-orange-900/20"
                                                : isFuture
                                                    ? "bg-gray-200 dark:bg-gray-600 text-gray-400"
                                                    : "bg-gray-300 dark:bg-gray-500 text-gray-500 dark:text-gray-400"
                                            }`}
                                    >
                                        {index + 1}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Overall progress bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-4">
                            <div
                                className="bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] h-2 rounded-full transition-all"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>

                        {/* Auto track message or manual button */}
                        {challenge.trackingType !== "manual" ? (
                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                                <span className="text-blue-500">ℹ️</span>
                                <p className="text-sm text-blue-700 dark:text-blue-400">
                                    Your progress is tracked automatically based on your {challenge.trackingType} activity. Just use the app normally!
                                </p>
                            </div>
                        ) : (
                            <button
                                onClick={handleMarkDone}
                                disabled={isTodayDone || markingDone || challenge.status === "expired"}
                                className={`w-full py-3 rounded-full font-bold transition-all ${isTodayDone
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed"
                                    : challenge.status === "expired"
                                        ? "bg-gray-200 dark:bg-gray-600 text-gray-400 cursor-not-allowed"
                                        : "bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white hover:shadow-lg"
                                    }`}
                            >
                                {isTodayDone
                                    ? "✓ Completed for today"
                                    : markingDone
                                        ? "Saving..."
                                        : "Mark today as done"}
                            </button>
                        )}
                    </div>
                )}

                {/* Community stat */}
                {isJoined && (
                    <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-[#f8ba90]/20 dark:bg-orange-900/20 rounded-2xl">
                        <span className="text-[#f4873e] font-bold text-lg">{completedTodayCount}</span>
                        <span className="text-gray-600 dark:text-gray-400 text-sm">
                            out of {totalParticipants} members completed today
                        </span>
                    </div>
                )}

                {/* Challenge Feed */}
                {isJoined && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>
                            Challenge Feed
                        </h2>

                        {/* Post input */}
                        <div className="flex gap-3 mb-6 flex-col sm:flex-row">
                            <input
                                type="text"
                                value={postContent}
                                onChange={e => setPostContent(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && handlePost()}
                                placeholder="Share your progress..."
                                className="flex-1 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:border-[#f4873e]"
                            />
                            <button
                                onClick={handlePost}
                                disabled={posting || !postContent.trim()}
                                className="w-12 h-12 flex items-center justify-center bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Posts */}
                        {feed.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">
                                    No posts yet. Be the first to share your progress!
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {feed.map(post => (
                                    <div key={post._id} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-gradient-to-br from-[#f4873e] to-[#ff9e5e] rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {post.userId?.firstName?.[0] || "U"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-gray-900 dark:text-white">
                                                    {post.userId?.firstName} {post.userId?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(post.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="text-gray-800 dark:text-gray-200 text-sm mb-3">
                                            {post.content}
                                        </p>
                                        <div className="flex gap-2 flex-wrap overflow-x-auto">
                                            {["❤️", "😆", "😢", "🤩", "😡"].map(emoji => {
                                                const reaction = post.reactions?.find(r => r.emoji === emoji);
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => handleReact(post._id, emoji)}
                                                        className="flex items-center gap-1 px-3 py-1 bg-white dark:bg-gray-600 rounded-full text-sm hover:shadow-md transition-all border border-gray-200 dark:border-gray-500"
                                                    >
                                                        <span>{emoji}</span>
                                                        {reaction?.count > 0 && (
                                                            <span className="text-xs text-gray-600 dark:text-gray-300 font-bold">
                                                                {reaction.count}
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Not joined message for feed */}
                {!isJoined && (
                    <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-3xl">
                        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-500" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">
                            Join this challenge to see the community feed and track your progress
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChallengeDetailPage;