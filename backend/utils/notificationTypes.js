export const NOTIFICATION_TYPES = {
  HABIT_REMINDER: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 7
  },
  MOOD_REMINDER_MORNING: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 1
  },
  MOOD_REMINDER_EVENING: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 1
  },
  STREAK_ACHIEVED: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 30
  },
  STREAK_AT_RISK: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 2
  },
  JOURNAL_PROMPT: {
    priority: "LOW",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 1
  },
  WEEKLY_INSIGHTS: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 30
  },
  COMMUNITY_LIKE: {
    priority: "LOW",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  },
  COMMUNITY_COMMENT: {
    priority: "LOW",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  },
  SYSTEM_WARNING: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 30
  },
  SYSTEM_ALERT: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 30
  },
  PEER_CONNECT_REQUEST: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  },
  PEER_CONNECT_ACCEPTED: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  },
  GROUP_SESSION_CREATED: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 3
  },
  GROUP_JOIN_APPROVED: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  },
  GROUP_JOIN_REJECTED: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  },
  GROUP_MODERATOR_ASSIGNED: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 30
  },
  GROUP_MODERATOR_INVITATION: {
    priority: "HIGH",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 7
  },
  GROUP_MODERATOR_ACCEPTED: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 14
  },
  GROUP_MODERATOR_DECLINED: {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: true },
    expiresInDays: 14
  },
};

export const getNotificationConfig = (type) => {
  return NOTIFICATION_TYPES[type] || {
    priority: "MEDIUM",
    defaultChannels: { inApp: true, email: false },
    expiresInDays: 7
  };
};

export const calculateExpiryDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date;
};