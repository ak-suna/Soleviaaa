import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Trophy, ArrowLeft, CheckCircle } from 'lucide-react';
import { getToken } from "../services/auth";
import Sidebar from "../components/Sidebar";
import { showError, confirmAction } from "../utils/uiFeedback";
import config from "../config";

const BrowseChallengesPage = () => {
    const navigate = useNavigate();
    const [challenges, setChallenges] = useState([]);
    const [pastChallenges, setPastChallenges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChallenges();
        fetchPastChallenges();
    }, []);

    const fetchChallenges = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges`, {
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setChallenges(data.challenges || []);
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
            setPastChallenges(data.challenges || []);
        } catch (err) {
            console.error("Error fetching past challenges:", err);
        }
    };

    const handleJoin = async (challengeId) => {
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${challengeId}/join`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchChallenges();
        } catch (err) {
            showError(err.message || "Failed to join challenge");
        }
    };

    const handleLeave = async (challengeId) => {
        const confirmed = await confirmAction("Leave this challenge?", { confirmText: "Leave" });
        if (!confirmed) return;
        try {
            const res = await fetch(`${config.BACKEND_URL}/api/challenges/${challengeId}/leave`, {
                method: "POST",
                headers: { Authorization: `Bearer ${getToken()}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            fetchChallenges();
        } catch (err) {
            showError(err.message || "Failed to leave challenge");
        }
    };

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

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6">
            <Sidebar />

            <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] max-h-[775px] overflow-y-auto">

                
                <button
                    onClick={() => navigate('/community', { state: { activeTab: 'challenges' } })}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-[#f4873e] mb-6 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="font-semibold">Back to Challenges</span>
                </button>

                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: "Brasika" }}>
                        <span className="text-[#f4873e] dark:text-orange-400">Browse </span>
                        <span className="text-[#89beab] dark:text-teal-400">Challenges</span>
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Join challenges and track your progress with the community
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f4873e]" />
                    </div>
                ) : challenges.length === 0 ? (
                    <div className="text-center py-12">
                        <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                        <p className="text-gray-500 dark:text-gray-400">No active challenges right now. Check back soon!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                        {challenges.map(challenge => (
                            <div
                                key={challenge._id}
                                className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-4 lg:p-6 border-2 border-gray-200 dark:border-gray-600 hover:border-[#f4873e] dark:hover:border-orange-500 transition-all cursor-pointer"
                                onClick={() => navigate(`/challenges/${challenge._id}`)}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex gap-2 flex-wrap">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${trackingTypeColors[challenge.trackingType]}`}>
                                            {challenge.trackingType}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${difficultyColors[challenge.difficulty]}`}>
                                            {challenge.difficulty}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {challenge.daysRemaining}d left
                                    </span>
                                </div>

                                <h3 className="font-bold text-gray-900 dark:text-white mb-1 text-lg">{challenge.title}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">{challenge.description}</p>

                                {challenge.isJoined && (
                                    <div className="mb-4">
                                        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                                            <span>Your progress</span>
                                            <span>{challenge.completionPercentage}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] h-2 rounded-full transition-all"
                                                style={{ width: `${challenge.completionPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {challenge.participantCount} participants
                                    </span>
                                    <button
                                        onClick={e => {
                                            e.stopPropagation();
                                            challenge.isJoined ? handleLeave(challenge._id) : handleJoin(challenge._id);
                                        }}
                                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all ${challenge.isJoined
                                            ? "bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600"
                                            : "bg-gradient-to-r from-[#f4873e] to-[#ff9e5e] text-white hover:shadow-lg"
                                            }`}
                                    >
                                        {challenge.isJoined ? "✓ Joined" : "Join"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Past Challenges */}
                {pastChallenges.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>
                            Past Challenges
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pastChallenges.map(challenge => (
                                <div key={challenge._id} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-5 border-2 border-gray-200 dark:border-gray-600 opacity-80">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-gray-900 dark:text-white">{challenge.title}</h3>
                                        {challenge.badgeAwarded && (
                                            <span className="text-xl" title="Badge earned">🏆</span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">
                                            {challenge.completionPercentage}% completed
                                        </span>
                                        {challenge.isCompleted && (
                                            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold text-xs">
                                                <CheckCircle className="w-3 h-3" /> Completed
                                            </span>
                                        )}
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                                        <div
                                            className={`h-1.5 rounded-full ${challenge.isCompleted ? "bg-green-500" : "bg-gray-400"}`}
                                            style={{ width: `${challenge.completionPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrowseChallengesPage;