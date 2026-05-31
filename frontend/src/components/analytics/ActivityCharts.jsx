import React from 'react';
import { Target, TrendingUp } from 'lucide-react';

const ActivityCharts = ({ activeGoals = [] }) => {

    // Goal Milestone Roadmap Component
    const GoalMilestoneRoadmap = ({ goals }) => {
        if (!goals || goals.length === 0) {
            return (
                <div className="text-center py-12">
                    <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No active goals yet</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Create goals to see your progress roadmap here
                    </p>
                </div>
            );
        }

        // Get top 4 goals with highest progress or closest deadlines
        const topGoals = [...goals]
            .sort((a, b) => {
                // Sort by progress (higher first) then by days remaining (closer first)
                if (a.progress !== b.progress) return b.progress - a.progress;
                const daysA = a.deadline ? Math.ceil((new Date(a.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : Infinity;
                const daysB = b.deadline ? Math.ceil((new Date(b.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : Infinity;
                return daysA - daysB;
            })
            .slice(0, 4);

        return (
            <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-[#f4873e]" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white" style={{ fontFamily: "Brasika" }}>
                            Goal Milestone Roadmap
                        </h3>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        {goals.length} active goal{goals.length !== 1 ? 's' : ''}
                    </span>
                </div>

                <div className="space-y-6">
                    {topGoals.map((goal, idx) => {
                        const progress = goal.progress || 0;
                        const daysRemaining = goal.deadline
                            ? Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24))
                            : null;

                        // Calculate estimated completion date based on progress rate
                        const createdAt = new Date(goal.createdAt || new Date());
                        const daysSinceCreation = Math.max(1, Math.ceil((new Date() - createdAt) / (1000 * 60 * 60 * 24)));
                        const dailyProgressRate = progress / daysSinceCreation;
                        const daysToComplete = dailyProgressRate > 0 ? (100 - progress) / dailyProgressRate : null;

                        // Define milestones at 25%, 50%, 75%, 100%
                        const milestones = [25, 50, 75, 100];

                        return (
                            <div key={goal.id} className="relative">
                                {/* Goal header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex-1">
                                        <p className="text-base font-semibold text-gray-900 dark:text-white truncate" title={goal.name}>
                                            {goal.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            <span>{goal.current || 0} / {goal.target} {goal.unit}</span>
                                            {daysRemaining !== null && daysRemaining > 0 && (
                                                <span>• {daysRemaining} days left</span>
                                            )}
                                            {daysToComplete && daysToComplete > 0 && daysToComplete < 30 && (
                                                <span className="text-green-600 dark:text-green-400">
                                                    • On track to complete in {Math.ceil(daysToComplete)} days
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-[#f4873e] ml-3">{progress}%</span>
                                </div>

                                {/* Milestone timeline */}
                                <div className="relative mt-4 mb-3">
                                    {/* Background track */}
                                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                                        {/* Progress bar */}
                                        <div
                                            className="h-full bg-gradient-to-r from-[#89beab] to-[#46c294] rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>

                                    {/* Milestone markers */}
                                    <div className="absolute top-0 left-0 right-0 -translate-y-1/2">
                                        {milestones.map((milestone) => {
                                            const isReached = progress >= milestone;
                                            const position = `${milestone}%`;
                                            return (
                                                <div
                                                    key={milestone}
                                                    className="absolute transform -translate-x-1/2"
                                                    style={{ left: position }}
                                                >
                                                    <div className="relative group">
                                                        <div
                                                            className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${isReached
                                                                    ? 'bg-[#46c294] border-[#46c294] shadow-lg'
                                                                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500'
                                                                }`}
                                                        />
                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-7 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                                                            <div className="bg-gray-900 text-white text-xs rounded-lg px-2 py-1">
                                                                {milestone}% Milestone
                                                                {isReached && ' ✓'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Milestone labels */}
                                <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mt-1 px-1">
                                    {milestones.map(milestone => (
                                        <span key={milestone} className="text-center font-medium" style={{ width: '24px' }}>
                                            {milestone}%
                                        </span>
                                    ))}
                                </div>

                                {/* Connection to next goal (except last) */}
                                {idx < topGoals.length - 1 && (
                                    <div className="border-l-2 border-dashed border-gray-300 dark:border-gray-600 h-6 ml-2 my-3" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Summary stat */}
                <div className="mt-6 pt-4 border-t-2 border-gray-200 dark:border-gray-600">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-[#89beab]" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">Average Progress Across All Goals</span>
                        </div>
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                            {Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length)}%
                        </span>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-3xl p-6 border-2 border-gray-200 dark:border-gray-600">
            <GoalMilestoneRoadmap goals={activeGoals} />
        </div>
    );
};

export default ActivityCharts;