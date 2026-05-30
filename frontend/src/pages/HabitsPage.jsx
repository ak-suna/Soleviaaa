import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Calendar, X, Repeat, Target, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '../components/Sidebar';
import MobileMenu from '../components/MobileMenu';
import { useHabits } from '../contexts/HabitsContext';
import { useGoals } from '../contexts/GoalsContext';
import { getHabitHistory, getLinkedGoals, getPastHabits } from '../services/habitService';
import { useToast } from '../hooks/useToast';

const HabitsPage = () => {
  const { habits, addHabit, toggleHabit, deleteHabit, globalStreak } = useHabits();
  const { goals } = useGoals();
  const { showToast, ToastContainer } = useToast();
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('Other');
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState('daily');
  const [daysOfWeek, setDaysOfWeek] = useState([]);
  const [linkedGoalId, setLinkedGoalId] = useState('');
  const [, setLinkedGoalsMap] = useState({});
  const [goalContribution, setGoalContribution] = useState(10);
  const [habitDate, setHabitDate] = useState(new Date().toISOString().split('T')[0]);

  // const categoryColors = {
  //   Fitness: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-300 dark:border-blue-700',
  //   Health: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-300 dark:border-green-700',
  //   Learning: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
  //   Career: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
  //   Finance: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
  //   Personal: 'bg-pink-100 dark:bg-pink-900 text-pink-800 dark:text-pink-200 border-pink-300 dark:border-pink-700',
  //   Other: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-300 dark:border-gray-600'
  // };

  const [showHistory, setShowHistory] = useState(false);
  const [habitHistory, setHabitHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);       // NEW
  const [historyPage, setHistoryPage] = useState(1);           // NEW
  const [hasMoreHistory, setHasMoreHistory] = useState(false); // NEW
  // const [setLinkedGoalsMap] = useState({});
  const [, setPastHabits] = useState([]);

  const handleAddHabit = async () => {
    if (newHabitName.trim()) {
      const habitData = {
        name: newHabitName,
        category: newHabitCategory,
        isRecurring,
        frequency: isRecurring ? frequency : null,
        daysOfWeek: isRecurring ? daysOfWeek : [],
        linkedGoalId: linkedGoalId || null,
        goalContribution: goalContribution || 10,
        habitDate: isRecurring ? null : habitDate
      };

      try {
        await addHabit(habitData);
        // Reset form
        setNewHabitName('');
        setNewHabitCategory('Other');
        setIsRecurring(false);
        setFrequency('daily');
        setDaysOfWeek([]);
        setLinkedGoalId('');
        setGoalContribution(10);
        setHabitDate(new Date().toISOString().split('T')[0]);
        setShowAddForm(false);
      } catch (error) {
        console.error('Error adding habit:', error);
      }
    }
  };

  const handleToggleHabit = async (id) => {
    try {
      const response = await toggleHabit(id);
      // Show toast if goal was updated
      if (response.updatedGoal) {
        const goalName = response.updatedGoal.name || 'Goal';
        const habit = habits.find(h => h.id === id);
        const contribution = habit?.goalContribution || 10;
        showToast(`✓ Habit completed! '${goalName}' +${contribution}%`, 'success');
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  const toggleDayOfWeek = (day) => {
    setDaysOfWeek(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort()
    );
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const completedCount = habits.filter(h => h.completedToday).length;
  const percentage = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  // Load next page and append
  const loadMoreHistory = async () => {
    try {
      setLoadingMore(true);
      const nextPage = historyPage + 1;
      const result = await getHabitHistory(nextPage, 7);
      setHabitHistory(prev => [...prev, ...result.data]);
      setHistoryPage(nextPage);
      setHasMoreHistory(result.hasMore);
    } catch (error) {
      console.error('Error loading more history:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      const loadHistory = async () => {
        try {
          setLoadingHistory(true);
          setHistoryPage(1);
          const [result, past] = await Promise.all([
            getHabitHistory(1, 7),
            getPastHabits()
          ]);
          setHabitHistory(result.data);
          setHasMoreHistory(result.hasMore);
          setPastHabits(past);
        } catch (error) {
          console.error('Error loading habit history:', error);
        } finally {
          setLoadingHistory(false);
        }
      };

      loadHistory();
    }
  }, [showHistory]);

  useEffect(() => {
    let isMounted = true;

    const loadLinkedGoals = async () => {
      const goalsMap = {};
      for (const habit of habits) {
        try {
          const linkedGoals = await getLinkedGoals(habit.id);
          goalsMap[habit.id] = linkedGoals;
        } catch (error) {
          console.error(`Error loading linked goals for habit ${habit.id}:`, error);
          goalsMap[habit.id] = [];
        }
      }
      if (isMounted) {
        setLinkedGoalsMap(goalsMap);
      }
    };

    if (habits.length > 0) {
      loadLinkedGoals();
    }

    return () => {
      isMounted = false;
    };
  }, [habits]);

  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';

    // Compare using local date strings (avoids UTC vs local midnight mismatch)
    const toLocalStr = (d) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const dateStr = toLocalStr(date);
    const today = new Date();
    const todayStr = toLocalStr(today);

    if (dateStr === todayStr) return 'Today';

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = toLocalStr(yesterday);

    if (dateStr === yesterdayStr) return 'Yesterday';

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Filter goals by category for the dropdown (but allow selecting from any)
  const filteredGoals = (newHabitCategory && newHabitCategory !== 'Other'
    ? goals.filter(g => g.category === newHabitCategory)
    : goals
).filter(goal => goal.status === 'active');
const hasActiveGoals = filteredGoals.some(goal => goal.status === 'active');

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setShowMobileMenu(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-700"
      >
        <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
      </button>

      <Sidebar />
      <MobileMenu isOpen={showMobileMenu} onClose={() => setShowMobileMenu(false)} type="user" />
      <ToastContainer />

      <div className="flex-1 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-[50px] p-4 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative max-h-[775px] overflow-y-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
          style={{ fontFamily: "Brasika" }}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-[#89beab] dark:text-[#6ca859]" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Daily Habits</h1>
            </div>
          </div>
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-6 py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              <Calendar className="w-5 h-5" />
              View Past Habits
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-[#89beab] dark:bg-teal-600 text-black px-6 py-3 rounded-xl hover:bg-[#FFA669] dark:hover:bg-teal-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Habit
            </motion.button>
          </div>
        </motion.div>

        {/* Add Habit Form */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6 overflow-hidden"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Habit</h3>

              {/* Habit Name */}
              <input
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="Enter habit name..."
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
                onKeyPress={(e) => e.key === 'Enter' && handleAddHabit()}
              />

              {/* Category */}
              <select
                value={newHabitCategory}
                onChange={(e) => setNewHabitCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
              >
                <option value="Fitness">Fitness</option>
                <option value="Health">Health</option>
                <option value="Learning">Learning</option>
                <option value="Career">Career</option>
                <option value="Finance">Finance</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>

              {/* Date (disabled if recurring) */}
              {!isRecurring && (
                <input
                  type="date"
                  value={habitDate}
                  onChange={(e) => setHabitDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} 
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
                />
              )}

              {/* Recurring Checkbox */}
              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 text-[#89beab] rounded focus:ring-[#89beab]"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make this a recurring habit
                  </span>
                </label>
              </div>

              {/* Recurring Options */}
              {isRecurring && (
                <div className="mb-3 pl-6 border-l-2 border-[#89beab]">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency:
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => {
                      setFrequency(e.target.value);
                      if (e.target.value !== 'weekly' && e.target.value !== 'custom') {
                        setDaysOfWeek([]);
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Days</option>
                  </select>

                  {/* Days of Week Selection */}
                  {(frequency === 'weekly' || frequency === 'custom') && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Select Days:
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {dayLabels.map((label, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => toggleDayOfWeek(index)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${daysOfWeek.includes(index)
                              ? 'bg-[#89beab] text-white'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                              }`}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Link to Goal */}
<div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Link to Goal (Optional):
    </label>
    <select
        value={linkedGoalId}
        onChange={(e) => setLinkedGoalId(e.target.value)}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
    >
        <option value="">None</option>
        {filteredGoals.map(goal => (
            <option key={goal.id} value={goal.id}>
                {goal.name} ({goal.progress}% complete)
            </option>
        ))}
    </select>
    {!hasActiveGoals && goals.length > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            ⚠️ No active goals available. Only goals with status "active" can be linked.
        </p>
    )}
    {goals.length === 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            No goals yet. Create a goal first to link habits.
        </p>
    )}
</div>

              {/* Goal Contribution */}
              {linkedGoalId && (
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Contribution per completion (%):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={goalContribution}
                    onChange={(e) => setGoalContribution(parseInt(e.target.value) || 10)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleAddHabit}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Add
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewHabitName('');
                    setNewHabitCategory('Other');
                    setIsRecurring(false);
                    setFrequency('daily');
                    setDaysOfWeek([]);
                    setLinkedGoalId('');
                    setGoalContribution(10);
                    setHabitDate(new Date().toISOString().split('T')[0]);
                  }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Today's Progress</h2>
            <span className="text-3xl font-bold text-[#89beab]">{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mb-2">
            <div
              className="bg-gradient-to-r from-[#89beab] to-[#7ac0a6] h-4 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {completedCount} of {habits.length} habits completed ({percentage}%)
            </p>
            {globalStreak && globalStreak.current > 0 && (
              <p className="text-sm font-semibold text-[#89beab] dark:text-teal-400">
                🔥 {globalStreak.current} days streak
              </p>
            )}
          </div>
        </motion.div>

        {/* Habits List */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4" style={{ fontFamily: "Brasika" }}>Habit Checklist</h2>

          <div className="space-y-3">
            {habits.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No habits yet. Create your first habit!</p>
              </div>
            ) : (
              <AnimatePresence>
                {habits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between p-4 bg-white dark:bg-gray-600 rounded-xl hover:shadow-md transition-all group border-2 border-transparent hover:border-[#89beab]"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <button
                        onClick={() => handleToggleHabit(habit.id)}
                        className="flex-shrink-0"
                      >
                        {habit.completedToday ? (
                          <CheckCircle2 className="w-7 h-7 text-green-500" />
                        ) : (
                          <Circle className="w-7 h-7 text-gray-300 dark:text-gray-500 hover:text-gray-400" />
                        )}
                      </button>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={`font-medium ${habit.completedToday
                            ? 'text-gray-500 dark:text-gray-400 line-through'
                            : 'text-gray-900 dark:text-white'
                            }`}>
                            {habit.name}
                          </p>

                          {/* Recurring Icon */}
                          {habit.isRecurring && (
                            <span className="text-[#89beab] dark:text-teal-400" title="Recurring habit">
                              <Repeat className="w-4 h-4" />
                            </span>
                          )}

                          {/* Linked Goal Badge */}
                          {habit.linkedGoalId && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs font-medium">
                              <Target className="w-3 h-3" />
                              {typeof habit.linkedGoalId === 'object' && habit.linkedGoalId.name
                                ? habit.linkedGoalId.name
                                : 'Goal'} (+{habit.goalContribution || 10}%)
                            </span>
                          )}

                          {/* Date for one-time habits */}
                          {!habit.isRecurring && habit.habitDate && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatDate(habit.habitDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                      title="Delete habit"
                    >
                      <Trash2 className="w-5 h-5 text-red-600" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Current Streak</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              🔥 {globalStreak?.current || 0}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Best Streak</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {globalStreak?.best || 0} days
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Today's Completion</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{percentage}%</p>
          </div>
        </div>

        {/* History Overlay Modal */}
        <AnimatePresence>
          {showHistory && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowHistory(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />

              {/* Modal */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-0 m-auto lg:ml-[10rem] w-full lg:w-[calc(100%-15rem)] h-[775px] bg-white dark:bg-gray-800 rounded-[50px] shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] z-50 overflow-hidden"
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-6 border-b border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Past Habits</h2>
                    <button
                      onClick={() => setShowHistory(false)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                    >
                      <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(775px-88px)]">
                  {loadingHistory ? (
                    <div className="text-center py-12">
                      <p className="text-gray-500 dark:text-gray-400">Loading history...</p>
                    </div>
                  ) : habitHistory.length === 0 ? (
                    <div className="text-center py-12">
                      <Calendar className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No history available yet. Start completing habits to build your history!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {habitHistory.map((day, index) => (
                        <motion.div
                          key={day._id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex justify-between items-center mb-3">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(day.date)}
                            </h3>
                            <span className="text-sm font-bold text-[#89beab] dark:text-teal-400">
                              {day.completedCount}/{day.totalCount} ({day.completionPercentage}%)
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-3">
                            <div
                              className={`h-2 rounded-full transition-all ${day.completionPercentage >= 80
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : day.completionPercentage >= 50
                                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                  : 'bg-gradient-to-r from-red-500 to-red-600'
                                }`}
                              style={{ width: `${day.completionPercentage}%` }}
                            />
                          </div>
                          <div className="space-y-2">
                            {day.habits && day.habits.length > 0 ? (
                              day.habits.map((habitItem, habitIndex) => (
                                <div
                                  key={habitItem.habitId || habitIndex}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  {habitItem.completed ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-gray-300 dark:text-gray-500 flex-shrink-0" />
                                  )}
                                  <span
                                    className={
                                      habitItem.completed
                                        ? 'text-gray-500 dark:text-gray-400 line-through'
                                        : 'text-gray-900 dark:text-white'
                                    }
                                  >
                                    {habitItem.name}
                                  </span>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">No habits recorded</p>
                            )}
                          </div>
                        </motion.div>
                      ))}

                      {/* Load More Button */}
                      {hasMoreHistory && (
                        <button
                          onClick={loadMoreHistory}
                          disabled={loadingMore}
                          className="w-full py-3 mt-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl hover:bg-[#89beab] hover:text-white dark:hover:bg-teal-600 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default HabitsPage;