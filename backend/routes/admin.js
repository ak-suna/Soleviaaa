
import express from "express";
import { authenticate, authorizeRole } from "../middleware/authMiddleware.js";
import { User } from "../models/User.js";

const router = express.Router();

// Get all users (Admin only)
router.get("/users", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Don't send passwords
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Delete a user (Admin only)
router.delete("/users/:id", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete user" });
    }
});

// Update user role (Admin only)
router.patch("/users/:id/role", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const { role } = req.body;
        if (!["user", "admin"].includes(role)) {
            return res.status(400).json({ error: "Invalid role" });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { role },
            { new: true }
        ).select("-password");

        res.status(200).json({ message: "Role updated", user });
    } catch (error) {
        res.status(500).json({ error: "Failed to update role" });
    }
});

// ✅ NEW: Toggle user disabled status (Admin only)

import { sendUserDisabledEmail } from "../utils/sendEmail.js";
import { Challenge } from "../models/Challenge.js";
import { ChallengeTemplate } from "../models/ChallengeTemplate.js";
import { ChallengeParticipant } from "../models/ChallengeParticipant.js";
import { Mood } from "../models/Mood.js";
import Journal from "../models/Journal.js";
import HabitDay from "../models/HabitDay.js";

router.patch("/users/:id/status", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const { disabled, reason } = req.body;

        // Prevent admin from disabling themselves
        if (req.user.userId === req.params.id || req.user.id === req.params.id) {
            return res.status(400).json({ error: "You cannot disable your own account" });
        }

        if (disabled && (!reason || reason.trim() === "")) {
            return res.status(400).json({ error: "A reason is required to disable a user." });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { disabled, disabledReason: disabled ? reason : "" },
            { new: true }
        ).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Send email if user is disabled
        if (disabled) {
            try {
                await sendUserDisabledEmail(user, reason);
            } catch (e) {
                console.error("Failed to send disabled email:", e);
            }
        }

        res.status(200).json({
            success: true,
            message: `User ${disabled ? 'disabled' : 'enabled'} successfully`,
            user
        });
    } catch (error) {
        console.error("[ADMIN_DISABLE] Failed to update user status:", error);
        res.status(500).json({ error: "Failed to update user status", details: error?.message || error });
    }
});
// TEMPORARY TEST ROUTE
router.post("/test/activate-meditation", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const title = "Meditate everyday for at least half an hour";
        const description = "Focus on your breath and find inner peace for 30 minutes daily.";

        const startDate = new Date();
        startDate.setHours(0, 0, 0, 0);

        const duration = 7; // 1 week challenge
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + duration - 1);
        endDate.setHours(23, 59, 59, 999);

        const challenge = await Challenge.create({
            title,
            description,
            trackingType: "manual",
            duration,
            difficulty: "easy",
            status: "active",
            startDate,
            endDate,
            participantCount: 0,
            createdBy: req.user.id
        });

        res.status(200).json({
            message: "Meditation Challenge activated successfully",
            challenge
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/test/activate-challenge", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const { ChallengeTemplate } = await import("../models/ChallengeTemplate.js");
        const { Challenge } = await import("../models/Challenge.js");

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const eligible = await ChallengeTemplate.find({
            status: "active",
            $or: [
                { lastUsedAt: null },
                { lastUsedAt: { $lt: sixtyDaysAgo } }
            ]
        });

        if (eligible.length === 0) {
            return res.status(400).json({ error: "No eligible templates found" });
        }

        const template = eligible[Math.floor(Math.random() * eligible.length)];

        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + template.duration);

        const challenge = await Challenge.create({
            templateId: template._id,
            title: template.title,
            description: template.description,
            trackingType: template.trackingType,
            duration: template.duration,
            difficulty: template.difficulty,
            status: "active",
            startDate,
            endDate,
            participantCount: 0
        });

        template.lastUsedAt = new Date();
        await template.save();

        res.status(200).json({
            message: "Challenge activated successfully",
            challenge
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

router.post("/test/run-tracking", authenticate, authorizeRole("admin"), async (req, res) => {
    try {
        const { Challenge } = await import("../models/Challenge.js");
        const { ChallengeParticipant } = await import("../models/ChallengeParticipant.js");
        const { Mood } = await import("../models/Mood.js");
        const Journal = (await import("../models/Journal.js")).default;
        const HabitDay = (await import("../models/HabitDay.js")).default;

        const todayStr = new Date().toISOString().split("T")[0];
        const today = new Date(`${todayStr}T00:00:00.000Z`);
        const tomorrow = new Date(`${todayStr}T23:59:59.999Z`);

        const activeChallenges = await Challenge.find({
            status: "active",
            trackingType: { $ne: "manual" }
        });

        let updatedCount = 0;

        for (const challenge of activeChallenges) {
            const participants = await ChallengeParticipant.find({
                challengeId: challenge._id
            });

            for (const participant of participants) {
                const dayEntry = participant.days.find(d => d.date === todayStr);
                if (!dayEntry || dayEntry.completed) continue;

                let hasActivity = false;

                if (challenge.trackingType === "mood") {
                    const mood = await Mood.findOne({
                        userId: participant.userId,
                        date: { $gte: today, $lt: tomorrow }
                    });
                    hasActivity = !!mood;

                } else if (challenge.trackingType === "habit") {
                    const habitDay = await HabitDay.findOne({
                        user: participant.userId,
                        date: { $gte: today, $lt: tomorrow },
                        "habits.completed": true
                    });
                    hasActivity = !!habitDay;

                } else if (challenge.trackingType === "journal") {
                    const journal = await Journal.findOne({
                        user: participant.userId,
                        createdAt: { $gte: today, $lt: tomorrow }
                    });
                    hasActivity = !!journal;
                }

                if (hasActivity) {
                    dayEntry.completed = true;
                    const completedCount = participant.days.filter(d => d.completed).length;
                    participant.completionPercentage = Math.round(
                        (completedCount / participant.days.length) * 100
                    );
                    await participant.save();
                    updatedCount++;
                }
            }
        }

        res.status(200).json({
            message: "Tracking job ran successfully",
            updatedCount,
            checkedChallenges: activeChallenges.length,
            dateRange: { from: today, to: tomorrow }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

export default router;