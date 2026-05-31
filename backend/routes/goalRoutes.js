import express from 'express';
import Goal from '../models/Goal.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// ─── GET ALL GOALS ────────────────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id })
      .populate('linkedHabits.habitId', 'name category')
      .sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET COMPLETED / PAST GOALS ──────────────────────────────────────────────
// NOTE: Must be placed before any /:id routes so Express doesn't treat
//       "past" as an ID parameter.
router.get('/past', authenticate, async (req, res) => {
  try {
    const goals = await Goal.find({
      user: req.user.id,
      $or: [{ status: 'completed' }, { progress: 100 }]
    })
      .populate('linkedHabits.habitId', 'name category')
      .sort({ updatedAt: -1 });

    // Attach completion-timing metadata so the frontend can show
    // "completed X days early / on time / X days late"
    const goalsWithMeta = goals.map(goal => {
      const g = goal.toObject();

      if (g.deadline) {
        const completedAt = new Date(g.updatedAt);
        const deadline = new Date(g.deadline);
        completedAt.setHours(0, 0, 0, 0);
        deadline.setHours(0, 0, 0, 0);

        // Positive → completed before deadline; negative → after
        const diffDays = Math.ceil((deadline - completedAt) / (1000 * 60 * 60 * 24));

        g.completionStatus = diffDays >= 0 ? 'ontime' : 'overdue';
        g.daysFromDeadline = Math.abs(diffDays);
      } else {
        g.completionStatus = 'nodeadline';
        g.daysFromDeadline = null;
      }

      return g;
    });

    res.json(goalsWithMeta);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── CREATE GOAL ─────────────────────────────────────────────────────────────
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, target, unit, deadline, category } = req.body;

    const goal = new Goal({
      user: req.user.id,
      name,
      target,
      unit,
      deadline: deadline || null,
      category: category || 'Other',
      progress: 0,
      current: 0,
      status: 'active'
    });

    await goal.save();
    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── UPDATE GOAL PROGRESS ────────────────────────────────────────────────────
router.patch('/:id/progress', authenticate, async (req, res) => {
  try {
    const { currentIncrement } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Update current value
    goal.current = Math.max(0, goal.current + (currentIncrement || 0));

    // Auto-calculate progress from current and target
    goal.progress = goal.target > 0
      ? Math.min(100, Math.max(0, Math.round((goal.current / goal.target) * 100)))
      : 0;

    // Update status on completion / un-completion
    if (goal.progress >= 100) {
      goal.status = 'completed';
      goal.current = Math.min(goal.current, goal.target);
      goal.progress = 100;
    } else if (goal.status === 'completed' && goal.progress < 100) {
      goal.status = 'active';
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── DELETE GOAL ─────────────────────────────────────────────────────────────
// BUG FIX: previously only removed from the old linkedGoals[] array.
// Now also clears linkedGoalId so habits don't try to update a deleted goal
// when toggled.
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const Habit = (await import('../models/Habit.js')).default;

    // Clear BOTH the legacy linkedGoals array and the newer linkedGoalId field
    await Habit.updateMany(
      {
        user: req.user.id,
        $or: [
          { linkedGoals: req.params.id },
          { linkedGoalId: req.params.id }
        ]
      },
      {
        $pull: { linkedGoals: req.params.id },
        $set: { linkedGoalId: null }
      }
    );

    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── LINK HABITS TO GOAL ─────────────────────────────────────────────────────
router.patch('/:id/link-habits', authenticate, async (req, res) => {
  try {
    const { habitIds, contributionValues } = req.body;
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    const Habit = (await import('../models/Habit.js')).default;

    // Remove old links from habits
    const oldHabitIds = goal.linkedHabits.map(link => link.habitId.toString());
    await Habit.updateMany(
      { _id: { $in: oldHabitIds } },
      { $pull: { linkedGoals: req.params.id } }
    );

    // Build new linked-habits array
    const linkedHabits = habitIds.map((habitId, index) => ({
      habitId,
      contributionValue:
        contributionValues && contributionValues[index] !== undefined
          ? contributionValues[index]
          : 1
    }));

    goal.linkedHabits = linkedHabits;
    await goal.save();

    // Add goal reference back to each selected habit
    if (habitIds && habitIds.length > 0) {
      await Habit.updateMany(
        { _id: { $in: habitIds }, user: req.user.id },
        { $addToSet: { linkedGoals: req.params.id } }
      );
    }

    const populatedGoal = await Goal.findById(goal._id)
      .populate('linkedHabits.habitId', 'name category');
    res.json(populatedGoal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ─── GET LINKED HABITS FOR A GOAL ────────────────────────────────────────────
router.get('/:id/linked-habits', authenticate, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id })
      .populate('linkedHabits.habitId', 'name category')
      .select('linkedHabits user');

    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }

    // Also fetch habits linked via the newer one-directional linkedGoalId field
    const Habit = (await import('../models/Habit.js')).default;
    const habitsLinkedToGoal = await Habit.find({
      user: req.user.id,
      linkedGoalId: req.params.id
    }).select('name category goalContribution isRecurring');

    res.json({
      oldLinkedHabits: goal.linkedHabits || [],
      newLinkedHabits: habitsLinkedToGoal || []
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;