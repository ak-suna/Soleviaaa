import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, TrendingUp, CheckCircle2, Plus, Trash2, Link2, X, Calendar, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import Sidebar from '../components/Sidebar';
import { useGoals } from '../contexts/GoalsContext';
import { useHabits } from '../contexts/HabitsContext';
import { linkHabitsToGoal, getLinkedHabits, getPastGoals } from '../services/goalService';
import { showError, showInfo } from "../utils/uiFeedback";

// ─── Confetti helpers ─────────────────────────────────────────────────────────
const fireCompletionConfetti = () => {
  // Immediate burst - no setTimeout for first burst
  const opts = { zIndex: 9999 };

  // Centre burst - fires immediately
  confetti({ ...opts, particleCount: 150, spread: 100, origin: { x: 0.5, y: 0.55 }, colors: ['#f4873e', '#89beab', '#f096b3', '#ffd700', '#46c294'] });

  // Right cannon - very short delay
  setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 60, spread: 75, origin: { x: 0.85, y: 0.6 }, colors: ['#f4873e', '#ffd700', '#fff'] }), 80);

  // Left cannon - very short delay
  setTimeout(() => confetti({ ...opts, particleCount: 80, angle: 120, spread: 75, origin: { x: 0.15, y: 0.6 }, colors: ['#89beab', '#f096b3', '#fff'] }), 80);

  // Top shower - short delay
  setTimeout(() => confetti({ ...opts, particleCount: 100, spread: 140, startVelocity: 50, origin: { x: 0.5, y: 0.2 }, colors: ['#f4873e', '#89beab', '#f096b3', '#ffd700'] }), 150);

  // Extra side bursts for more impact
  setTimeout(() => confetti({ ...opts, particleCount: 60, angle: 45, spread: 60, origin: { x: 0, y: 0.5 }, colors: ['#ffd700', '#f4873e'] }), 200);
  setTimeout(() => confetti({ ...opts, particleCount: 60, angle: 135, spread: 60, origin: { x: 1, y: 0.5 }, colors: ['#89beab', '#46c294'] }), 200);
};

// ─── Celebration Overlay ──────────────────────────────────────────────────────
const CelebrationOverlay = ({ goal, onDismiss }) => {
  const hasFiredConfetti = useRef(false);

  useEffect(() => {
    // Only fire confetti once when the component mounts and goal exists
    if (goal && !hasFiredConfetti.current) {
      hasFiredConfetti.current = true;
      fireCompletionConfetti();
    }

    const timer = setTimeout(() => {
      onDismiss();
    }, 3800);

    return () => clearTimeout(timer);
  }, [goal, onDismiss]);

  if (!goal) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onDismiss}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.7, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 22 } }}
        exit={{ opacity: 0, scale: 0.8, y: -30, transition: { duration: 0.3 } }}
        onClick={onDismiss}
        className="fixed inset-0 m-auto z-[101] flex flex-col items-center justify-center"
        style={{ width: 'fit-content', height: 'fit-content' }}
      >
        <div
          className="relative bg-white dark:bg-gray-800 rounded-[40px] px-14 py-12 shadow-2xl flex flex-col items-center gap-5 cursor-pointer select-none"
          style={{ minWidth: 340, maxWidth: 480, boxShadow: '0 0 80px rgba(244,135,62,0.35), 0 25px 60px rgba(0,0,0,0.3)' }}
        >
          {/* Shimmer ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-[40px] pointer-events-none"
            style={{
              background: 'conic-gradient(from 0deg, transparent 60%, rgba(244,135,62,0.4) 70%, rgba(137,190,171,0.4) 80%, transparent 90%)',
              mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              maskComposite: 'exclude',
              WebkitMaskComposite: 'destination-out',
              padding: 2,
            }}
          />

          {/* Check icon with pulse */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.25, 1] }}
            transition={{ delay: 0.1, duration: 0.5, times: [0, 0.6, 1] }}
            className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #46c294, #89beab)' }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
          </motion.div>

          {/* Stars */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-1"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -30 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3 + i * 0.07, type: 'spring', stiffness: 400 }}
              >
                <Star className="w-5 h-5 text-[#ffd700] fill-[#ffd700]" />
              </motion.div>
            ))}
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-center"
          >
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#89beab] mb-1">
              Goal Achieved!
            </p>
            <h2
              className="text-2xl font-bold text-gray-900 dark:text-white leading-tight"
              style={{ fontFamily: 'Brasika' }}
            >
              {goal.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {goal.target} {goal.unit} — completed 🎉
            </p>
          </motion.div>

          {/* Progress bar — full, animated in */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
            className="w-full origin-left"
          >
            <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
              <div className="h-full w-full rounded-full bg-gradient-to-r from-[#89beab] to-[#46c294] relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
              </div>
            </div>
          </motion.div>

          {/* Hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-xs text-gray-400 dark:text-gray-500"
          >
            Tap anywhere to dismiss · Moving to Past Goals
          </motion.p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const GoalsPage = () => {
  const { goals, addGoal, updateProgress, deleteGoal, loadGoals } = useGoals();
  const { habits } = useHabits();

  // ─── Add Goal form ──────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '', target: '', unit: '', deadline: '', category: 'Other'
  });
  const getTodayDateString = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ─── Category filter ────────────────────────────────────────────────────────
  const [selectedCategory, setSelectedCategory] = useState('All');

  // ─── Link-habits modal ──────────────────────────────────────────────────────
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [selectedHabitIds, setSelectedHabitIds] = useState([]);
  const [contributionValues, setContributionValues] = useState({});

  // ─── Past Goals modal ───────────────────────────────────────────────────────
  const [showPastGoals, setShowPastGoals] = useState(false);
  const [pastGoals, setPastGoals] = useState([]);
  const [loadingPastGoals, setLoadingPastGoals] = useState(false);

  // ─── Celebration state ──────────────────────────────────────────────────────
  const [celebratingGoal, setCelebratingGoal] = useState(null);

  // Load past goals whenever the modal opens
  useEffect(() => {
    if (!showPastGoals) return;
    const load = async () => {
      try {
        setLoadingPastGoals(true);
        const data = await getPastGoals();
        setPastGoals(data.map(g => ({ ...g, id: g._id })));
      } catch (error) {
        console.error('Error loading past goals:', error);
      } finally {
        setLoadingPastGoals(false);
      }
    };
    load();
  }, [showPastGoals]);

  // ─── Derived values ─────────────────────────────────────────────────────────
  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoalsCount = goals.filter(g => g.progress === 100).length;
  const avgProgress = activeGoals.length > 0
    ? Math.round(activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length)
    : 0;

  const categories = ['All', 'Fitness', 'Health', 'Learning', 'Career', 'Finance', 'Personal', 'Other'];
  const filteredGoals = selectedCategory === 'All'
    ? goals.filter(g => g.status === 'active')
    : goals.filter(g => g.category === selectedCategory && g.status === 'active');

  const categoryColors = {
    Fitness: 'bg-blue-100   dark:bg-blue-900   text-blue-800   dark:text-blue-200   border-blue-300   dark:border-blue-700',
    Health: 'bg-green-100  dark:bg-green-900  text-green-800  dark:text-green-200  border-green-300  dark:border-green-700',
    Learning: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 border-purple-300 dark:border-purple-700',
    Career: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 border-orange-300 dark:border-orange-700',
    Finance: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-300 dark:border-yellow-700',
    Personal: 'bg-pink-100   dark:bg-pink-900   text-pink-800   dark:text-pink-200   border-pink-300   dark:border-pink-700',
    Other: 'bg-gray-100   dark:bg-gray-700   text-gray-800   dark:text-gray-200   border-gray-300   dark:border-gray-600'
  };

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  };

  const calculateDaysRemaining = (deadline) => {
    if (!deadline) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline); deadlineDate.setHours(0, 0, 0, 0);
    return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStatus = (deadline, progress) => {
    if (!deadline) return null;
    const daysRemaining = calculateDaysRemaining(deadline);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline); deadlineDate.setHours(0, 0, 0, 0);
    if (deadlineDate < today && progress < 100) return 'overdue';
    const totalDays = Math.max(1, Math.ceil((deadlineDate - new Date(deadlineDate.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24)));
    const elapsedDays = totalDays - daysRemaining;
    const expectedProg = Math.min(100, Math.max(0, (elapsedDays / totalDays) * 100));
    if (progress < expectedProg && daysRemaining >= 0) return 'behind';
    return 'ontrack';
  };

  // ─── Progress update wrapper — detects completion & fires celebration ───────
  const handleUpdateProgress = useCallback(async (goalId, increment) => {
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const newCurrent = Math.max(0, (goal.current || 0) + increment);
    const willComplete = newCurrent >= goal.target && goal.status !== 'completed';

    // Update the progress
    await updateProgress(goalId, increment);

    // If goal is now complete, show celebration overlay immediately
    if (willComplete) {
      // Create a snapshot of the completed goal for celebration
      const completedGoalSnapshot = {
        ...goal,
        current: goal.target,
        progress: 100,
        status: 'completed'
      };
      setCelebratingGoal(completedGoalSnapshot);

      // Reload goals to refresh the list after a short delay
      setTimeout(() => {
        loadGoals();
      }, 500);
    }
  }, [goals, updateProgress, loadGoals]);

  const handleDismissCelebration = useCallback(() => {
    setCelebratingGoal(null);
    // Reload goals to ensure the list is up to date
    loadGoals();
  }, [loadGoals]);

  // ─── Add goal ───────────────────────────────────────────────────────────────
  const handleAddGoal = () => {
    if (!newGoal.name.trim()) {
      showInfo('Please enter a goal name.');
      return;
    }
    if (!newGoal.target) {
      showInfo('Please fill the target value before creating a goal.');
      return;
    }
    if (!newGoal.unit.trim()) {
      showInfo('Please fill the unit before creating a goal.');
      return;
    }
    addGoal({
      name: newGoal.name,
      target: parseFloat(newGoal.target),
      unit: newGoal.unit.trim(),
      deadline: newGoal.deadline || null,
      category: newGoal.category || 'Other'
    });
    setNewGoal({ name: '', target: '', unit: '', deadline: '', category: 'Other' });
    setShowAddForm(false);
  };

  // ─── Link-habits modal handlers ─────────────────────────────────────────────
  const handleLinkHabits = async (goal) => {
    try {
      const response = await getLinkedHabits(goal.id);
      const oldLinked = response.oldLinkedHabits || [];
      const newLinked = response.newLinkedHabits || [];
      const selectedIds = [
        ...oldLinked.map(link => (link.habitId?._id || link.habitId)?.toString()),
        ...newLinked.map(h => h._id?.toString())
      ].filter(Boolean);
      const values = {};
      oldLinked.forEach(link => {
        const id = (link.habitId?._id || link.habitId)?.toString();
        if (id) values[id] = link.contributionValue || 1;
      });
      newLinked.forEach(h => {
        const id = h._id?.toString();
        if (id) values[id] = h.goalContribution || 10;
      });
      setSelectedGoal(goal);
      setSelectedHabitIds(selectedIds);
      setContributionValues(values);
      setShowLinkModal(true);
    } catch (error) {
      console.error('Error loading linked habits:', error);
      setSelectedGoal(goal);
      setSelectedHabitIds([]);
      setContributionValues({});
      setShowLinkModal(true);
    }
  };

  const handleSaveLinks = async () => {
    if (!selectedGoal) return;
    try {
      const values = selectedHabitIds.map(id => contributionValues[id] || 1);
      await linkHabitsToGoal(selectedGoal.id, selectedHabitIds, values);
      await loadGoals();
      closeLinkModal();
    } catch (error) {
      console.error('Error linking habits:', error);
      showError('Failed to link habits. Please try again.');
    }
  };

  const closeLinkModal = () => {
    setShowLinkModal(false);
    setSelectedGoal(null);
    setSelectedHabitIds([]);
    setContributionValues({});
  };

  const toggleHabitSelection = (habitId) => {
    if (selectedHabitIds.includes(habitId)) {
      setSelectedHabitIds(selectedHabitIds.filter(id => id !== habitId));
      const updated = { ...contributionValues };
      delete updated[habitId];
      setContributionValues(updated);
    } else {
      setSelectedHabitIds([...selectedHabitIds, habitId]);
      setContributionValues({ ...contributionValues, [habitId]: 1 });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 p-3 pt-16 sm:p-4 lg:p-6 flex flex-col lg:flex-row gap-4 lg:gap-6 relative overflow-x-hidden">
      <Sidebar />

      {/* ── Celebration overlay (only shows when a goal is completed) ── */}
      {celebratingGoal && (
        <CelebrationOverlay goal={celebratingGoal} onDismiss={handleDismissCelebration} />
      )}

      {/* ── Main card ── */}
      <div className="flex-1 ml-0 lg:ml-28 border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-3xl lg:rounded-[50px] p-4 sm:p-5 lg:p-8 shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] relative max-h-none lg:max-h-[775px] overflow-y-auto">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
          style={{ fontFamily: 'Brasika' }}
        >
          <div className="flex items-center gap-3">
            <div>
              <TrendingUp className="w-8 h-8 text-[#f096b3] dark:text-[#f4873e]" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Goals</h1>
            </div>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowPastGoals(true)}
              className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm sm:text-base"
            >
              <Calendar className="w-5 h-5" />
              Past Goals
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 bg-[#89beab] text-black px-4 py-2.5 sm:px-6 sm:py-3 rounded-xl hover:bg-[#FFA669] dark:hover:bg-orange-700 transition-all text-sm sm:text-base"
            >
              <Plus className="w-5 h-5" />
              New Goal
            </motion.button>
          </div>
        </motion.div>

        {/* ── Add Goal form ── */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6 mb-6 overflow-hidden"
            >
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Add New Goal</h3>
              <input
                type="text"
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="Goal name (e.g., Read 12 books this year)"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#f4873e] outline-none"
              />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="number"
                  value={newGoal.target}
                  onChange={(e) => setNewGoal({ ...newGoal, target: e.target.value })}
                  placeholder="Target (e.g., 12)"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#f4873e] outline-none"
                />
                <input
                  type="text"
                  value={newGoal.unit}
                  onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                  placeholder="Unit (e.g., books)"
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#f4873e] outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <input
                  type="date"
                  min={getTodayDateString()}
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#f4873e] outline-none"
                />
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value })}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#f4873e] outline-none"
                >
                  {['Fitness', 'Health', 'Learning', 'Career', 'Finance', 'Personal', 'Other'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddGoal}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                >
                  Add Goal
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewGoal({ name: '', target: '', unit: '', deadline: '', category: 'Other' }); }}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Overview stats ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
        >
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-blue-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Active Goals</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{activeGoals.length}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingUp className="w-6 h-6 text-black dark:text-white" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Avg Progress</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{avgProgress}%</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle2 className="w-6 h-6 text-purple-600" />
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Completed</p>
            </div>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{completedGoalsCount}</p>
          </div>
        </motion.div>

        {/* ── Category filter ── */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 mb-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by category:</span>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${selectedCategory === category
                  ? 'bg-[#FFA669] text-white'
                  : 'bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-500'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* ── Goals list ── */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-6">
          <h2
            className="text-xl font-semibold text-gray-900 dark:text-white mb-6"
            style={{ fontFamily: 'Brasika' }}
          >
            {selectedCategory === 'All' ? 'All Goals' : `${selectedCategory} Goals`}
          </h2>

          <div className="space-y-4">
            {filteredGoals.length === 0 ? (
              <div className="text-center py-12">
                <Target className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No goals yet. Create your first goal!</p>
              </div>
            ) : (
              <AnimatePresence>
                {filteredGoals.map((goal, index) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-5 bg-white dark:bg-gray-600 rounded-xl hover:shadow-md transition-all group border-2 ${goal.deadline
                      ? getDeadlineStatus(goal.deadline, goal.progress || 0) === 'overdue'
                        ? 'border-red-300 dark:border-red-700'
                        : getDeadlineStatus(goal.deadline, goal.progress || 0) === 'behind'
                          ? 'border-yellow-300 dark:border-yellow-700'
                          : 'border-green-300 dark:border-green-700'
                      : 'border-transparent'
                      } hover:border-[#f4873e]`}
                  >
                    {/* Card top row */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-lg text-gray-900 dark:text-white">{goal.name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${categoryColors[goal.category] || categoryColors.Other}`}>
                            {goal.category || 'Other'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                          Current: {goal.current || 0} | Target: {goal.target} {goal.unit} | Progress: {goal.progress || 0}%
                        </p>
                        {goal.deadline && (() => {
                          const daysRemaining = calculateDaysRemaining(goal.deadline);
                          const status = getDeadlineStatus(goal.deadline, goal.progress || 0);
                          const statusColors = {
                            overdue: 'text-red-600 dark:text-red-400',
                            behind: 'text-yellow-600 dark:text-yellow-400',
                            ontrack: 'text-green-600 dark:text-green-400'
                          };
                          return (
                            <div className="flex items-center gap-2 text-xs">
                              <span className={`font-semibold ${statusColors[status] || 'text-gray-600 dark:text-gray-400'}`}>
                                Due: {formatDate(goal.deadline)}
                              </span>
                              <span className={`font-medium ${statusColors[status] || 'text-gray-600 dark:text-gray-400'}`}>
                                {daysRemaining !== null && (
                                  daysRemaining < 0
                                    ? `${Math.abs(daysRemaining)} days overdue`
                                    : daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`
                                )}
                              </span>
                            </div>
                          );
                        })()}
                      </div>

                      {/* Percentage + action buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                        <span className="text-2xl font-bold text-[#f4873e]">{goal.progress}%</span>
                        <button
                          onClick={() => handleLinkHabits(goal)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg"
                          title="Link habits to this goal"
                        >
                          <Link2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => deleteGoal(goal.id)}
                          className="opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg"
                          title="Delete goal"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-500 rounded-full h-3 mb-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#a5c7bb] to-[#46c294] h-3 rounded-full transition-all duration-500 relative overflow-hidden"
                        style={{ width: `${goal.progress}%` }}
                      >
                        {goal.progress === 100 && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                        )}
                      </div>
                    </div>

                    {/* Manual progress controls — use handleUpdateProgress wrapper */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => handleUpdateProgress(goal.id, -5)}
                        disabled={(goal.current || 0) <= 0}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-500 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-400 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >-5</button>
                      <button
                        onClick={() => handleUpdateProgress(goal.id, -1)}
                        disabled={(goal.current || 0) <= 0}
                        className="px-3 py-1 bg-gray-200 dark:bg-gray-500 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-400 text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >-1</button>
                      <button
                        onClick={() => handleUpdateProgress(goal.id, 1)}
                        disabled={(goal.current || 0) >= goal.target}
                        className="px-3 py-1 bg-[#FFA669] text-white rounded-lg hover:bg-[#fd9048] text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >+1</button>
                      <button
                        onClick={() => handleUpdateProgress(goal.id, 5)}
                        disabled={(goal.current || 0) >= goal.target}
                        className="px-3 py-1 bg-[#FFA669] text-white rounded-lg hover:bg-[#fd9048] text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >+5</button>
                      <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">Update value</span>
                    </div>

                    {/* Completion badge (only shown if progress is 100) */}
                    {goal.progress === 100 && (
                      <div className="mt-3 flex items-center gap-2 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">Goal Completed! 🎉</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* ── Motivational footer ── */}
        {activeGoals.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-pink-50 dark:from-orange-900/20 dark:to-pink-900/20 rounded-xl border-2 border-orange-100 dark:border-orange-800"
          >
            <p className="text-center text-gray-700 dark:text-gray-300">
              💪 Keep pushing! You're {avgProgress}% of the way there on average.
            </p>
          </motion.div>
        )}

        {/* ════════════ LINK HABITS MODAL ════════════ */}
        <AnimatePresence>
          {showLinkModal && selectedGoal && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeLinkModal}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-3 sm:inset-6 lg:inset-0 lg:m-auto lg:ml-[10rem] lg:w-[calc(100%-15rem)] lg:max-h-[600px] lg:h-fit bg-white dark:bg-gray-800 rounded-3xl lg:rounded-[40px] shadow-xl z-50 overflow-hidden flex flex-col"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center flex-shrink-0">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Link Habits to "{selectedGoal.name}"
                  </h2>
                  <button onClick={closeLinkModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all">
                    <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {habits.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No habits available. Create some habits first!</p>
                  ) : habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                      <label className="flex items-center gap-3 cursor-pointer flex-1">
                        <input
                          type="checkbox"
                          checked={selectedHabitIds.includes(habit.id)}
                          onChange={() => toggleHabitSelection(habit.id)}
                          className="w-4 h-4 text-[#89beab] rounded focus:ring-[#89beab]"
                        />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">{habit.name}</span>
                        {habit.category && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full">
                            {habit.category}
                          </span>
                        )}
                      </label>
                      {selectedHabitIds.includes(habit.id) && (
                        <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                          <span className="text-xs text-gray-600 dark:text-gray-400">Contribution:</span>
                          <input
                            type="number" min="1" max="100"
                            value={contributionValues[habit.id] || 1}
                            onChange={(e) => setContributionValues({ ...contributionValues, [habit.id]: parseInt(e.target.value) || 1 })}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-[#89beab] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 flex-shrink-0">
                  <button onClick={handleSaveLinks} className="px-6 py-2 bg-[#89beab] text-black rounded-xl hover:bg-[#FFA669] transition-all font-medium">
                    Save Links
                  </button>
                  <button onClick={closeLinkModal} className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all">
                    Cancel
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ════════════ PAST GOALS MODAL ════════════ */}
        <AnimatePresence>
          {showPastGoals && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setShowPastGoals(false)}
                className="fixed inset-0 bg-black/50 z-40"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="fixed inset-3 sm:inset-6 lg:inset-0 lg:m-auto lg:ml-[10rem] lg:w-[calc(100%-15rem)] lg:h-[775px] bg-white dark:bg-gray-800 rounded-3xl lg:rounded-[50px] shadow-[0_10px_25px_rgba(248,186,144,0.25)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)] z-50 overflow-hidden flex flex-col"
              >
                <div className="bg-gray-50 dark:bg-gray-700 p-6 border-b border-gray-200 dark:border-gray-600 flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Past Goals</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {pastGoals.length} goal{pastGoals.length !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <button
                      onClick={() => setShowPastGoals(false)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-all"
                    >
                      <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {loadingPastGoals ? (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-gray-500 dark:text-gray-400">Loading past goals...</p>
                    </div>
                  ) : pastGoals.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <CheckCircle2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No completed goals yet. Keep working towards your goals!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pastGoals.map((goal, index) => (
                        <motion.div
                          key={goal._id || goal.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-5 border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{goal.name}</h3>
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${categoryColors[goal.category] || categoryColors.Other}`}>
                                  {goal.category || 'Other'}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 ml-7">
                                Achieved: {goal.target} / {goal.target} {goal.unit}
                              </p>
                            </div>
                            <span className="text-2xl font-bold text-green-500 flex-shrink-0 ml-3">100%</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 mb-3 overflow-hidden">
                            <div className="h-3 w-full rounded-full bg-gradient-to-r from-green-400 to-green-600 relative overflow-hidden">
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
                            </div>
                          </div>
                          <div className="flex items-center gap-4 flex-wrap text-xs">
                            {goal.deadline && (
                              <span className={`font-medium ${goal.completionStatus === 'ontime' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {goal.completionStatus === 'ontime'
                                  ? `✓ Completed ${goal.daysFromDeadline === 0 ? 'on deadline' : `${goal.daysFromDeadline} day${goal.daysFromDeadline !== 1 ? 's' : ''} early`}`
                                  : `✗ Completed ${goal.daysFromDeadline} day${goal.daysFromDeadline !== 1 ? 's' : ''} after deadline`
                                }
                              </span>
                            )}
                            <span className="text-gray-500 dark:text-gray-400">
                              Completed {new Date(goal.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {goal.linkedHabits && goal.linkedHabits.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-gray-500 dark:text-gray-400">
                                <Link2 className="w-3 h-3" />
                                {goal.linkedHabits.length} linked habit{goal.linkedHabits.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

      </div>{/* end main card */}
    </div>
  );
};

export default GoalsPage;