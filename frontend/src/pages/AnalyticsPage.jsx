import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import { getAnalyticsSummary } from '../services/analyticsService';
import SummaryCards from '../components/analytics/SummaryCards';
import MoodTrendChart from '../components/analytics/MoodTrendChart';
import CalendarHeatmap from '../components/analytics/CalendarHeatmap';
import MoodDistribution from '../components/analytics/MoodDistribution';
import ActivityCharts from '../components/analytics/ActivityCharts';
import AchievementBadges from '../components/analytics/AchievementBadges';
import { BarChart2, Lightbulb } from 'lucide-react';
import { getToken } from '../services/auth';
import config from '../config';

const AnalyticsPage = () => {
    const [mainDashboardData, setMainDashboardData] = useState(null);
    const [moodDistributionData, setMoodDistributionData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filteringMood, setFilteringMood] = useState(false);
    const [selectedMood, setSelectedMood] = useState(null);
    const [range, setRange] = useState(30);
    const [activeGoals, setActiveGoals] = useState([]);

    // Get auth header helper
    const getAuthHeader = () => ({
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    // Initial load: Fetch the baseline dashboard once
    useEffect(() => {
        const loadInitialDashboard = async () => {
            try {
                setLoading(true);
                // Fetch default dashboard state
                const data = await getAnalyticsSummary(30);
                setMainDashboardData(data);
                setMoodDistributionData(data.moodDistribution);
            } catch (error) {
                console.error('Error loading baseline dashboard analytics:', error);
            } finally {
                setLoading(false);
            }
        };
        loadInitialDashboard();
    }, []);

    // Fetch active goals separately
    useEffect(() => {
        const fetchActiveGoals = async () => {
            try {
                const response = await axios.get(`${config.BACKEND_URL}/api/goals`, getAuthHeader());
                const active = response.data.filter(g => g.status === 'active');
                setActiveGoals(active);
            } catch (error) {
                console.error('Error fetching active goals:', error);
            }
        };
        fetchActiveGoals();
    }, []);

    // Isolated tracking: Trigger an independent updates ONLY for the distribution metric data block
    useEffect(() => {
        // Skip execution on initial mount since it's already handled above
        if (!mainDashboardData) return;

        const updateMoodFilter = async () => {
            try {
                setFilteringMood(true);
                const targetedData = await getAnalyticsSummary(range);
                setMoodDistributionData(targetedData.moodDistribution);
            } catch (error) {
                console.error('Error fetching filtered distribution data:', error);
            } finally {
                setFilteringMood(false);
            }
        };

        updateMoodFilter();
    }, [range, mainDashboardData]);

    if (loading || !mainDashboardData) {
        return (
            <div className="min-h-screen bg-white dark:bg-gray-900 p-3 pt-16 sm:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative overflow-x-hidden">
                <Sidebar />
                <div className="flex-1 lg:ml-28 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#89beab] mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Loading your analytics...</p>
                    </div>
                </div>
            </div>
        );
    }

    const buildActionableInsights = () => {
        if (!mainDashboardData) return [];
        const insights = [...(mainDashboardData.insights || [])];

        if (mainDashboardData.lastJournalDate) {
            const lastJournal = new Date(mainDashboardData.lastJournalDate);
            const daysSince = Math.floor((Date.now() - lastJournal) / 86400000);
            if (daysSince >= 2) {
                insights.unshift(
                    `You haven't journaled in ${daysSince} days. Taking 2 minutes now could boost your mood score!`
                );
            }
        }

        if (mainDashboardData.thisWeek?.habitsCompleted < mainDashboardData.thisWeek?.habitsTotal * 0.5) {
            insights.push("You're below 50% habit completion this week — a quick check-in now can turn it around.");
        }

        return insights;
    };

    const actionableInsights = buildActionableInsights();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
            <Sidebar />

            <div className="ml-0 lg:ml-28 p-3 sm:p-4 lg:p-6">
                <div className="bg-white dark:bg-gray-800 rounded-3xl lg:rounded-[50px] p-4 sm:p-6 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">

                    {/* Simplified Layout Header - Global controls removed */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        style={{ fontFamily: "Brasika" }}
                    >
                        <div className="flex items-center gap-3">
                            <BarChart2 className="w-8 h-8 text-[#89beab] dark:text-teal-400" />
                            <h1 className="text-3xl font-bold">
                                <span className="text-[#89beab] dark:text-teal-400">Your Wellness </span>
                                <span className="text-[#f4873e] dark:text-orange-400">Summary</span>
                            </h1>
                        </div>
                    </motion.div>

                    {actionableInsights.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-5 mb-5 border-2 border-yellow-200 dark:border-yellow-800"
                        >
                            <div className="flex items-start gap-3">
                                <Lightbulb className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-bold text-yellow-900 dark:text-yellow-300 mb-2">
                                        Insights for you
                                    </h3>
                                    <div className="space-y-1.5">
                                        {actionableInsights.map((insight, index) => (
                                            <p key={index} className="text-yellow-800 dark:text-yellow-200 text-sm">
                                                • {insight}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Baseline components remain static */}
                    <SummaryCards
                        thisWeek={mainDashboardData.thisWeek}
                        thisMonth={mainDashboardData.thisMonth}
                    />

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="mb-6"
                    >
                        <MoodTrendChart
                            data={mainDashboardData.moodTrends}
                            highlightMood={selectedMood}
                        />
                    </motion.div>

                    {/* Grid containing Calendar Heatmap and isolated Mood Distribution */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 items-stretch">
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col"
                        >
                            <CalendarHeatmap data={mainDashboardData.habitHeatmap} />
                        </motion.div>

                        {/* Mood Distribution Card Container with cleaner props management */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                            className="flex flex-col relative bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm"
                        >
                            {/* Standard internal chart rendering with loading mask overlays */}
                            <div className={`flex-1 transition-opacity duration-200 ${filteringMood ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                <MoodDistribution
                                    data={moodDistributionData}
                                    selectedMood={selectedMood}
                                    onMoodSelect={setSelectedMood}
                                    range={range}
                                    onRangeChange={setRange}
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Activity Overview - Now only shows Goal Milestone Roadmap */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6"
                    >
                        <ActivityCharts activeGoals={activeGoals} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <AchievementBadges achievements={mainDashboardData.achievements} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;