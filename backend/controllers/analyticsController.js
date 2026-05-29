import { Mood } from "../models/Mood.js";
import config from "../src/config.js";
import Habit from "../models/Habit.js";
import HabitDay from "../models/HabitDay.js";
import Journal from "../models/Journal.js";
import Goal from "../models/Goal.js";

// Helper function to get date range
const getDateRange = (days) => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
};

// Helper function to get week boundaries
const getWeekBoundaries = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
};

// Helper: last week boundaries
const getLastWeekBoundaries = () => {
    const now = new Date();
    const startOfLastWeek = new Date(now);
    startOfLastWeek.setDate(now.getDate() - now.getDay() - 7);
    startOfLastWeek.setHours(0, 0, 0, 0);

    const endOfLastWeek = new Date(startOfLastWeek);
    endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
    endOfLastWeek.setHours(23, 59, 59, 999);

    return { startOfLastWeek, endOfLastWeek };
};

// Helper function to get month boundaries
const getMonthBoundaries = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);

    return { startOfMonth, endOfMonth };
};

// Calculate mood average (happy=5, excited=5, neutral=3, sad=1, angry=1, anxious=2, tired=2)
const moodToScore = (mood) => {
    const scores = {
        happy: 5,
        excited: 5,
        neutral: 3,
        sad: 1,
        angry: 1,
        anxious: 2,
        tired: 2
    };
    return scores[mood] || 3;
};

// NEW: Helper function to get daily habit breakdown with goal linkage
const getDailyHabitBreakdown = async (userId, days = 30) => {
    const { startDate } = getDateRange(days);

    // Get all habits with their goal linkage info
    const habits = await Habit.find({
        user: userId,
        isArchived: false
    }).select('_id name linkedGoalId goalContribution');

    // Create a map for quick lookup
    const habitGoalMap = {};
    habits.forEach(habit => {
        habitGoalMap[habit._id.toString()] = {
            linked: !!habit.linkedGoalId,
            contribution: habit.goalContribution || 10,
            name: habit.name
        };
    });

    // Get daily habit completions for the last 30 days
    const dailyHabits = await Habit.find({
        user: userId,
        habitDate: { $gte: startDate },
        isArchived: false
    }).sort({ habitDate: 1 });

    // Group by date
    const dailyBreakdown = {};

    dailyHabits.forEach(habit => {
        const dateKey = habit.habitDate.toISOString().split('T')[0];

        if (!dailyBreakdown[dateKey]) {
            dailyBreakdown[dateKey] = {
                date: dateKey,
                goalLinked: [],
                standalone: [],
                goalLinkedCount: 0,
                standaloneCount: 0,
                totalCount: 0,
                goalProgress: {}
            };
        }

        const habitInfo = habitGoalMap[habit._id.toString()];
        const isGoalLinked = habitInfo?.linked || false;

        if (habit.completedToday) {
            if (isGoalLinked) {
                dailyBreakdown[dateKey].goalLinked.push({
                    habitId: habit._id,
                    name: habit.name,
                    contribution: habitInfo?.contribution || 10,
                    linkedGoalId: habit.linkedGoalId
                });
                dailyBreakdown[dateKey].goalLinkedCount++;
            } else {
                dailyBreakdown[dateKey].standalone.push({
                    habitId: habit._id,
                    name: habit.name
                });
                dailyBreakdown[dateKey].standaloneCount++;
            }
            dailyBreakdown[dateKey].totalCount++;
        }
    });

    // Convert to array and sort by date
    const dailyBreakdownArray = Object.values(dailyBreakdown).sort((a, b) =>
        new Date(a.date) - new Date(b.date)
    );

    // Calculate effort allocation totals
    const effortAllocation = {
        goalLinked: 0,
        standalone: 0,
        total: 0
    };

    dailyBreakdownArray.forEach(day => {
        effortAllocation.goalLinked += day.goalLinkedCount;
        effortAllocation.standalone += day.standaloneCount;
        effortAllocation.total += day.totalCount;
    });

    return { dailyBreakdown: dailyBreakdownArray, effortAllocation };
};

// NEW: Helper function to get goal milestones per day (for trophy icons)
const getGoalMilestonesByDay = async (userId, days = 30) => {
    const { startDate } = getDateRange(days);

    // Get all completed goals in the last 30 days
    const completedGoals = await Goal.find({
        user: userId,
        status: 'completed',
        updatedAt: { $gte: startDate }
    }).select('name updatedAt progress current target');

    // Group by date
    const milestonesByDay = {};

    completedGoals.forEach(goal => {
        const dateKey = goal.updatedAt.toISOString().split('T')[0];

        if (!milestonesByDay[dateKey]) {
            milestonesByDay[dateKey] = [];
        }

        milestonesByDay[dateKey].push({
            name: goal.name,
            progress: goal.progress,
            current: goal.current,
            target: goal.target
        });
    });

    return milestonesByDay;
};

// Main analytics summary endpoint
export const getAnalyticsSummary = async (req, res) => {
    try {
        const userId = req.user.id;

        // ===== 1. HANDLE DYNAMIC FILTER RANGE =====
        // Accepts '7', '30', or '90'. Defaults to 30 if missing or invalid.
        const allowedRanges = [7, 30, 90];
        const queryRange = parseInt(req.query.range, 10);
        const filterDays = allowedRanges.includes(queryRange) ? queryRange : 30;

        // Get the specific start date for the selected filter range
        const { startDate: filterStartDate } = getDateRange(filterDays);

        // Get date ranges
        const { startOfWeek, endOfWeek } = getWeekBoundaries();
        const { startOfLastWeek, endOfLastWeek } = getLastWeekBoundaries();
        const { startOfMonth, endOfMonth } = getMonthBoundaries();
        const { startDate: start30Days } = getDateRange(30);
        const { startDate: start90Days } = getDateRange(90);

        // ===== THIS WEEK STATS =====
        const thisWeekMoods = await Mood.find({
            userId,
            date: { $gte: startOfWeek, $lte: endOfWeek }
        });

        const thisWeekHabits = await Habit.find({
            user: userId,
            habitDate: { $gte: startOfWeek, $lte: endOfWeek },
            isArchived: false
        });

        const thisWeekJournals = await Journal.countDocuments({
            user: userId,
            date: { $gte: startOfWeek, $lte: endOfWeek }
        });

        const thisWeekGoals = await Goal.find({
            user: userId,
            status: 'completed',
            updatedAt: { $gte: startOfWeek, $lte: endOfWeek }
        });

        // ===== LAST WEEK STATS (for deltas) =====
        const lastWeekMoods = await Mood.find({
            userId,
            date: { $gte: startOfLastWeek, $lte: endOfLastWeek }
        });

        const lastWeekHabits = await Habit.find({
            user: userId,
            habitDate: { $gte: startOfLastWeek, $lte: endOfLastWeek },
            isArchived: false
        });

        const lastWeekJournals = await Journal.countDocuments({
            user: userId,
            date: { $gte: startOfLastWeek, $lte: endOfLastWeek }
        });

        // Calculate this week stats
        const habitsCompleted = thisWeekHabits.filter(h => h.completedToday).length;
        const habitsTotal = thisWeekHabits.length;

        const avgMoodThisWeek = thisWeekMoods.length > 0
            ? parseFloat((thisWeekMoods.reduce((sum, m) => sum + moodToScore(m.mood), 0) / thisWeekMoods.length).toFixed(1))
            : 0;

        // Calculate last week stats for deltas
        const lastWeekHabitsCompleted = lastWeekHabits.filter(h => h.completedToday).length;
        const avgMoodLastWeek = lastWeekMoods.length > 0
            ? parseFloat((lastWeekMoods.reduce((sum, m) => sum + moodToScore(m.mood), 0) / lastWeekMoods.length).toFixed(1))
            : 0;

        // Deltas
        const avgMoodDelta = avgMoodLastWeek > 0
            ? parseFloat((avgMoodThisWeek - avgMoodLastWeek).toFixed(1))
            : null;
        const habitsDelta = lastWeekHabitsCompleted > 0
            ? habitsCompleted - lastWeekHabitsCompleted
            : null;
        const journalDelta = lastWeekJournals > 0
            ? thisWeekJournals - lastWeekJournals
            : null;

        // ===== THIS MONTH STATS =====
        const thisMonthJournals = await Journal.countDocuments({
            user: userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const thisMonthGoals = await Goal.find({
            user: userId,
            status: 'completed',
            updatedAt: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const thisMonthHabits = await Habit.find({
            user: userId,
            habitDate: { $gte: startOfMonth, $lte: endOfMonth },
            isArchived: false
        });

        const thisMonthMoods = await Mood.find({
            userId,
            date: { $gte: startOfMonth, $lte: endOfMonth }
        });

        const avgMoodThisMonth = thisMonthMoods.length > 0
            ? parseFloat((thisMonthMoods.reduce((sum, m) => sum + moodToScore(m.mood), 0) / thisMonthMoods.length).toFixed(1))
            : 0;

        // ===== LAST JOURNAL DATE =====
        const lastJournalEntry = await Journal.findOne({ user: userId })
            .sort({ date: -1 })
            .select('date');
        const lastJournalDate = lastJournalEntry ? lastJournalEntry.date : null;

        // ===== MOOD TRENDS (30 DAYS) =====
        const moodTrends = await Mood.find({
            userId,
            date: { $gte: start30Days }
        }).sort({ date: 1 });

        // Group by date
        const moodByDate = {};
        moodTrends.forEach(mood => {
            const dateKey = mood.date.toISOString().split('T')[0];
            if (!moodByDate[dateKey]) {
                moodByDate[dateKey] = { date: dateKey, morning: null, evening: null };
            }
            if (mood.period === 'morning') {
                moodByDate[dateKey].morning = moodToScore(mood.mood);
            } else {
                moodByDate[dateKey].evening = moodToScore(mood.mood);
            }
        });

        const moodTrendsArray = Object.values(moodByDate);

        // ===== HABIT HEATMAP (90 DAYS) =====
        const habitHeatmap = [];
        
        // Get HabitDay snapshots for the last 90 days
        const habitDays = await HabitDay.find({
            user: userId,
            date: { $gte: start90Days }
        }).sort({ date: 1 });

        // Create a map for quick lookup
        const habitDayMap = {};
        habitDays.forEach(day => {
            const dateKey = day.date.toISOString().split('T')[0];
            habitDayMap[dateKey] = {
                completionPercentage: day.completionPercentage,
                completedCount: day.completedCount,
                totalCount: day.totalCount
            };
        });

        // Create array for last 90 days
        for (let i = 89; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            const dateKey = date.toISOString().split('T')[0];

            const dayData = habitDayMap[dateKey] || { completionPercentage: 0, completedCount: 0, totalCount: 0 };
            
            // Convert percentage to 0-1 range
            const completion = dayData.totalCount > 0
                ? (dayData.completionPercentage / 100)
                : 0;

            habitHeatmap.push({
                date: dateKey,
                completion: parseFloat(completion.toFixed(2))
            });
        }

        // ===== MOOD DISTRIBUTION =====
        const filteredMoods = await Mood.find({
            userId,
            date: { $gte: filterStartDate }
        });

        const moodCounts = {
            happy: 0,
            excited: 0,
            neutral: 0,
            sad: 0,
            angry: 0,
            anxious: 0,
            tired: 0
        };

        filteredMoods.forEach(mood => {
            if (moodCounts.hasOwnProperty(mood.mood)) {
                moodCounts[mood.mood]++;
            }
        });

        const totalMoods = filteredMoods.length;
        const moodDistribution = {};
        Object.keys(moodCounts).forEach(mood => {
            moodDistribution[mood] = totalMoods > 0
                ? Math.round((moodCounts[mood] / totalMoods) * 100)
                : 0;
        });

        // ===== JOURNAL FREQUENCY (Last 4 weeks) =====
        const journalFrequency = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - ((i + 1) * 7));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            weekEnd.setHours(23, 59, 59, 999);

            const count = await Journal.countDocuments({
                user: userId,
                date: { $gte: weekStart, $lte: weekEnd }
            });

            journalFrequency.push({
                week: `Week ${4 - i}`,
                count
            });
        }

        // ===== HABIT COMPLETION TREND (Last 4 weeks) =====
        const habitCompletionTrend = [];
        for (let i = 3; i >= 0; i--) {
            const weekStart = new Date();
            weekStart.setDate(weekStart.getDate() - ((i + 1) * 7));
            weekStart.setHours(0, 0, 0, 0);

            const weekEnd = new Date();
            weekEnd.setDate(weekEnd.getDate() - (i * 7));
            weekEnd.setHours(23, 59, 59, 999);

            const weekHabits = await Habit.find({
                user: userId,
                habitDate: { $gte: weekStart, $lte: weekEnd },
                isArchived: false
            });

            const completed = weekHabits.filter(h => h.completedToday).length;
            const total = weekHabits.length;
            const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

            habitCompletionTrend.push({
                week: `Week ${4 - i}`,
                percentage
            });
        }

        // ===== NEW: GOAL-LINKED HABIT BREAKDOWN (for stacked bar chart) =====
        const { dailyBreakdown, effortAllocation } = await getDailyHabitBreakdown(userId, 30);

        // ===== NEW: DAILY GOAL MILESTONES (for trophy icons) =====
        const goalMilestonesByDay = await getGoalMilestonesByDay(userId, 30);

        // Enhance dailyBreakdown with milestone info
        const enhancedDailyBreakdown = dailyBreakdown.map(day => ({
            ...day,
            milestones: goalMilestonesByDay[day.date] || []
        }));

        // ===== GOAL MILESTONES (map completed goals to their completion week) =====
        const completedGoalsAll = await Goal.find({
            user: userId,
            status: 'completed',
            updatedAt: { $gte: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000) } // last 4 weeks
        }).select('name updatedAt');

        // Map each completed goal to the matching week label in habitCompletionTrend
        const goalMilestones = completedGoalsAll.map(goal => {
            const completedDate = new Date(goal.updatedAt);
            // Find which week slot this date falls into
            for (let i = 3; i >= 0; i--) {
                const weekStart = new Date();
                weekStart.setDate(weekStart.getDate() - ((i + 1) * 7));
                weekStart.setHours(0, 0, 0, 0);

                const weekEnd = new Date();
                weekEnd.setDate(weekEnd.getDate() - (i * 7));
                weekEnd.setHours(23, 59, 59, 999);

                if (completedDate >= weekStart && completedDate <= weekEnd) {
                    return { week: `Week ${4 - i}`, goalName: goal.name };
                }
            }
            return null;
        }).filter(Boolean);

        // ===== ACHIEVEMENTS =====
        const allHabits = await Habit.find({ user: userId, isArchived: false });
        const allJournals = await Journal.find({ user: userId });
        const allGoalsCompleted = await Goal.find({ user: userId, status: 'completed' });

        // Calculate streaks from backend service
        const streaksResponse = await fetch(`${config.BACKEND_URL}/api/mood/streaks`, {
            headers: { Authorization: req.headers.authorization }
        });
        const streaks = await streaksResponse.json();

        const achievements = [
            {
                id: '7-day-streak',
                name: '7-Day Streak',
                description: 'Check in for 7 consecutive days',
                icon: 'flame', // Lucide Flame icon
                unlocked: streaks.moodStreak.current >= 7,
                progress: Math.min(streaks.moodStreak.current, 7),
                target: 7
            },
            {
                id: 'journal-pro',
                name: 'Journal Pro',
                description: 'Write 30 journal entries',
                icon: 'notebook-pen', // Lucide NotebookPen icon
                unlocked: allJournals.length >= 30,
                progress: Math.min(allJournals.length, 30),
                target: 30
            },
            {
                id: 'goal-master',
                name: 'Goal Master',
                description: 'Complete 5 goals',
                icon: 'target', // Lucide Target icon
                unlocked: allGoalsCompleted.length >= 5,
                progress: Math.min(allGoalsCompleted.length, 5),
                target: 5
            },
            {
                id: 'habit-hero',
                name: 'Habit Hero',
                description: '100% habit completion for a week',
                icon: 'dumbbell', // Lucide Dumbbell icon
                unlocked: habitCompletionTrend.some(w => w.percentage === 100),
                progress: Math.max(...habitCompletionTrend.map(w => w.percentage), 0),
                target: 100
            },
            {
                id: 'consistency-king',
                name: 'Consistency King',
                description: '30-day mood check-in streak',
                icon: 'crown', // Lucide Crown icon
                unlocked: streaks.moodStreak.best >= 30,
                progress: Math.min(streaks.moodStreak.best, 30),
                target: 30
            }
        ];

        // ===== INSIGHTS =====
        const insights = [];

        const happyPercentage = moodDistribution.happy || 0;
        const sadPercentage = moodDistribution.sad || 0;

        if (happyPercentage > 50) {
            insights.push("You've been feeling great lately! Keep it up! ");
        } else if (sadPercentage > 30) {
            insights.push("Consider talking to someone if you're feeling down. ");
        }

        if (streaks.moodStreak.current > 0) {
            insights.push(`Amazing! You're on a ${streaks.moodStreak.current}-day check-in streak! `);
        }

        const thisWeekCompletion = habitsTotal > 0
            ? Math.round((habitsCompleted / habitsTotal) * 100)
            : 0;

        if (thisWeekCompletion >= 80) {
            insights.push("You're crushing your habits this week! ");
        } else if (thisWeekCompletion < 50) {
            insights.push("Don't give up! Small steps lead to big changes. ");
        }

        if (thisWeekJournals >= 5) {
            insights.push("You've been journaling consistently! Great for reflection! ");
        }

        if (insights.length === 0) {
            insights.push("Keep tracking your progress. Every day is a new opportunity! ");
        }

        // ===== RESPONSE =====
        res.json({
            activeFilterRange: filterDays, // <-- ADD THIS NEW LINE HERE
            thisWeek: {
                moodCheckins: thisWeekMoods.length,
                habitsCompleted,
                habitsTotal,
                journalEntries: thisWeekJournals,
                avgMood: avgMoodThisWeek,
                goalsCompleted: thisWeekGoals.length,
                // Delta fields for spark cards
                avgMoodDelta,
                habitsDelta,
                journalDelta
            },
            thisMonth: {
                journalEntries: thisMonthJournals,
                goalsCompleted: thisMonthGoals.length,
                habitsCompleted: thisMonthHabits.filter(h => h.completedToday).length,
                avgMood: avgMoodThisMonth
            },
            lastJournalDate,           // NEW — for actionable insight
            moodTrends: moodTrendsArray,
            habitHeatmap,
            moodDistribution,          // This will now automatically contain the filtered version!
            journalFrequency,
            habitCompletionTrend,
            goalMilestones,            // NEW — for ActivityCharts trophy overlay
            // NEW FIELDS FOR GOAL-LINKED HABIT TRACKING
            dailyHabitBreakdown: enhancedDailyBreakdown,  // For stacked bar chart
            effortAllocation,                              // For pie chart
            achievements,
            insights,
            streaks: {
                mood: streaks.moodStreak,
                habit: streaks.habitStreak
            }
        });

    } catch (error) {
        console.error("Error fetching analytics:", error);
        res.status(500).json({
            message: "Failed to fetch analytics",
            error: error.message
        });
    }
};
