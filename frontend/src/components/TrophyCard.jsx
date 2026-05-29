import React, { useState, useEffect } from "react";
import { getToken } from "../services/auth";
import config from "../config";
import { Trophy } from "lucide-react";

const TrophyCard = () => {
    const [completedCount, setCompletedCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPastChallenges = async () => {
            try {
                const res = await fetch(`${config.BACKEND_URL}/api/challenges/past`, {
                    headers: { Authorization: `Bearer ${getToken()}` }
                });
                const data = await res.json();
                if (res.ok) {
                    const completed = (data.challenges || []).filter(c => c.isCompleted).length;
                    setCompletedCount(completed);
                }
            } catch (err) {
                console.error("Error fetching past challenges for trophies:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPastChallenges();

        const handleTrophyUpdate = (event) => {
            if (typeof event?.detail?.completedCount === "number") {
                setCompletedCount(event.detail.completedCount);
                setLoading(false);
                return;
            }
            fetchPastChallenges();
        };

        window.addEventListener("challenge-trophies-updated", handleTrophyUpdate);
        const intervalId = setInterval(fetchPastChallenges, 15000);

        return () => {
            window.removeEventListener("challenge-trophies-updated", handleTrophyUpdate);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 dark:from-yellow-600 dark:to-yellow-800 rounded-[40px] p-4 lg:p-6 shadow-lg flex flex-col min-h-[160px] border-2 border-yellow-200/50">
            <div className="mb-3 flex justify-between items-center">
                <h3 className="text-yellow-900 dark:text-yellow-100 text-sm uppercase tracking-wide font-bold">
                    Trophies
                </h3>
                <span className="text-2xl" title="Crown">👑</span>
            </div>
            <div className="flex items-center justify-center mt-3">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/30 rounded-full flex items-center justify-center shadow-inner">
                        <Trophy className="w-7 h-7 text-yellow-100" fill="currentColor" />
                    </div>
                    <div className="flex flex-col items-start">
                        {loading ? (
                            <div className="h-8 w-12 bg-white/20 animate-pulse rounded" />
                        ) : (
                            <span className="text-4xl font-black text-white drop-shadow-md">
                                {completedCount}
                            </span>
                        )}
                        <span className="text-xs font-bold text-yellow-100/90 uppercase tracking-wider mt-1">
                            Challenges Completed
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TrophyCard;
