import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, Search, CheckCircle } from "lucide-react";
import { getToken } from "../services/auth";
import Sidebar from "../components/Sidebar";
import confetti from "canvas-confetti";
import config from "../config";

const ChallengesPage = () => {
    const navigate = useNavigate();
    const [joinedChallenges, setJoinedChallenges] = useState([]);
    const [pastChallenges, setPastChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [celebrationChallenge, setCelebrationChallenge] = useState(null);

    useEffect(() => {
        fetchJoinedChallenges();
        fetchPastChallenges();
    }, []);

    const fetchJoinedChallenges = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            // Only show ones user has joined
            setJoinedChallenges((data.challenges || []).filter(c => c.isJoined));
        } catch (err) {
            console.error("Error fetching challenges:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPastChallenges = async () => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/past`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            const challenges = data.challenges || [];
            setPastChallenges(challenges);

            const completedCount = challenges.filter(c => c.isCompleted).length;
            window.dispatchEvent(new CustomEvent("challenge-trophies-updated", { detail: { completedCount } }));
        } catch (err) {
            console.error("Error fetching past challenges:", err);
        }
    };

    // Celebration effect for newly completed challenges
    useEffect(() => {
        if (pastChallenges.length > 0) {
            const newlyCompleted = pastChallenges.filter(c => c.isCompleted);
            const celebratedIds = JSON.parse(localStorage.getItem('celebratedChallenges') || '[]');
            
            let shouldCelebrate = false;
            newlyCompleted.forEach(c => {
                if (!celebratedIds.includes(c._id)) {
                    shouldCelebrate = true;
                    celebratedIds.push(c._id);
                }
            });

            if (shouldCelebrate) {
                localStorage.setItem('celebratedChallenges', JSON.stringify(celebratedIds));
                setCelebrationChallenge(newlyCompleted[newlyCompleted.length - 1]);
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    colors: ['#f4873e', '#89beab', '#ff9e5e', '#6fa893']
                });
            }
        }
    }, [pastChallenges]);

    const trackingTypeColors = {
        mood: "from-purple-500 to-purple-600",
        habit: "from-blue-500 to-blue-600",
        journal: "from-green-500 to-green-600",
        manual: "from-orange-500 to-orange-600"
    };

    const difficultyColors = {
        easy: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
        medium: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
        hard: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
    };

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
            {celebrationChallenge && (
                <div
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4"
                    onClick={() => setCelebrationChallenge(null)}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white dark:bg-gray-800 rounded-[32px] p-8 w-full max-w-md shadow-2xl border-2 border-orange-200 dark:border-orange-800 text-center"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-r from-[#89beab] to-[#6fa893] text-white mx-auto flex items-center justify-center mb-4">
                            <CheckCircle className="w-10 h-10" />
                        </div>
                        <p className="text-xs tracking-[0.2em] uppercase text-[#89beab] font-bold mb-1">
                            Challenge Completed
                        </p>
                        <h2 className="text-2xl text-gray-900 dark:text-white mb-2" style={{ fontFamily: "Brasika" }}>
                            Wow! {celebrationChallenge.title}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            {celebrationChallenge.completionPercentage}% completed - amazing consistency!
                        </p>
                        <button
                            onClick={() => setCelebrationChallenge(null)}
                            className="px-6 py-2 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold"
                        >
                            Awesome
                        </button>
                    </div>
                </div>
            )}

            <Sidebar />

            <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] max-h-[775px] overflow-y-auto">

                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold" style={{ fontFamily: "Brasika" }}>
                        <span className="text-[#f4873e] dark:text-orange-400">My </span>
                        <span className="text-[#89beab] dark:text-teal-400">Challenges</span>
                    </h1>
                    <button
                        onClick={() => navigate('/challenges/browse')}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg transition-all"
                    >
                        <Search className="w-5 h-5" />
                        Browse Challenges
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]" />
                    </div>
                ) : (
                    <>
                        {/* Active joined challenges */}
                        <div className="mb-8">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>
                                Active Challenges
                            </h2>

                            {joinedChallenges.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-3xl">
                                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                                    <p className="text-gray-600 dark:text-gray-400 font-medium mb-1">
                                        You haven't joined any challenges yet
                                    </p>
                                    <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">
                                        Browse available challenges and start tracking your progress
                                    </p>
                                    <button
                                        onClick={() => navigate('/challenges/browse')}
                                        className="px-6 py-3 bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white rounded-full font-bold hover:shadow-lg transition-all"
                                    >
                                        Browse Challenges
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    {joinedChallenges.map(challenge => (
                                        <div
                                            key={challenge._id}
                                            onClick={() => navigate(`/challenges/${challenge._id}`)}
                                            className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4 lg:p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-[#f4873e] dark:hover:border-orange-500 transition-all cursor-pointer"
                                        >
                                            {/* Top row */}
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-2 flex-wrap">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${trackingTypeColors[challenge.trackingType]}`}>
                                                        {challenge.trackingType}
                                                    </span>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${difficultyColors[challenge.difficulty]}`}>
                                                        {challenge.difficulty}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    {challenge.daysRemaining}d left
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">
                                                {challenge.title}
                                            </h3>
                                            {challenge.isNew && (
                                                <span className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                                    New Challenge
                                                </span>
                                            )}
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                                                {challenge.description}
                                            </p>

                                            {/* Progress */}
                                            <div className="mb-3">
                                                <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                                    <span>Your progress</span>
                                                    <span className="font-bold text-[#f4873e]">{challenge.completionPercentage}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                                    <div
                                                        className="bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] h-2 rounded-full transition-all"
                                                        style={{ width: `${challenge.completionPercentage}%` }}
                                                    />
                                                </div>
                                            </div>

                                            <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                                                <span>{challenge.participantCount} participants</span>
                                                <span className="text-[#f4873e] font-bold">View details →</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Past challenges */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>
                                Past Challenges
                            </h2>
                            {pastChallenges.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-2xl opacity-80 border-2 border-dashed border-gray-300 dark:border-gray-600">
                                    <p className="text-gray-500 dark:text-gray-400 font-medium">No past challenges yet.</p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Complete your active challenges to see them here.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {pastChallenges.map(challenge => (
                                        <div
                                            key={challenge._id}
                                            className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-5 border-2 border-gray-200 dark:border-gray-600 opacity-80"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h3 className="font-bold text-gray-900 dark:text-white">
                                                    {challenge.title}
                                                </h3>
                                                {challenge.badgeAwarded && (
                                                    <span className="text-xl" title="Badge earned">🏆</span>
                                                )}
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex justify-between">
                                                <span>
                                                    {new Date(challenge.startDate).toLocaleDateString()} - {new Date(challenge.endDate).toLocaleDateString()}
                                                </span>
                                                <span className="capitalize">{challenge.trackingType} Tracking</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm mb-2">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {challenge.completionPercentage}% completed
                                                </span>
                                                {challenge.isCompleted && (
                                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-xs">
                                                        <CheckCircle className="w-3 h-3" /> Completed
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                Milestone: {challenge.isCompleted ? "Challenge fully completed (80%+ target reached)" : "Challenge participated"}
                                            </p>
                                            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                                <div
                                                    className={`h-1.5 rounded-full ${challenge.isCompleted ? "bg-green-500" : "bg-gray-400"}`}
                                                    style={{ width: `${challenge.completionPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChallengesPage;