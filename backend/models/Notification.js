// backend/models/Notification.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      "HABIT_REMINDER",
      "MOOD_REMINDER_MORNING",
      "MOOD_REMINDER_EVENING",
      "STREAK_ACHIEVED",
      "STREAK_AT_RISK",
      "JOURNAL_PROMPT",
      "WEEKLY_INSIGHTS",
      "COMMUNITY_LIKE",
      "COMMUNITY_COMMENT",
      "SYSTEM_ALERT",
      "SYSTEM_WARNING",
      "CHALLENGE_STARTED",
      "CHALLENGE_COMPLETED",
      "CHALLENGE_POOL_LOW",
      "GROUP_MEMBER_DISABLED",
      "GROUP_JOIN_APPROVED",
      "GROUP_JOIN_REJECTED",
      "GROUP_MODERATOR_ASSIGNED",
      "GROUP_MODERATOR_INVITATION",
      "GROUP_MODERATOR_ACCEPTED",
      "GROUP_MODERATOR_DECLINED",
      "PEER_CONNECT_REQUEST",
      "PEER_CONNECT_ACCEPTED",
      "PEER_CONNECT_DECLINED",
      "PEER_CONNECT_REMOVED",
      "GROUP_SESSION_CREATED"
    ]
  },
  priority: {
    type: String,
    enum: ["HIGH", "MEDIUM", "LOW"],
    default: "MEDIUM"
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  // Additional context data (habitId, streakCount, etc.)
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Delivery channels
  channels: {
    inApp: { type: Boolean, default: true },
    email: { type: Boolean, default: false }
  },
  // Delivery status tracking
  delivered: {
    inApp: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    inAppAt: { type: Date, default: null },
    emailAt: { type: Date, default: null }
  },
  // Read status
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  // Auto-expire old notifications (optional)
  expiresAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Static method to get unread count
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ userId, read: false });
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = async function () {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

// Instance method to mark as delivered
notificationSchema.methods.markAsDelivered = async function (channel) {
  if (channel === "inApp") {
    this.delivered.inApp = true;
    this.delivered.inAppAt = new Date();
  } else if (channel === "email") {
    this.delivered.email = true;
    this.delivered.emailAt = new Date();
  }
  return await this.save();
};

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;