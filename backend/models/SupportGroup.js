import { Schema, model } from "mongoose";

const supportGroupSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        maxlength: 500
    },
    category: {
        type: String,
        required: true,
        enum: ["journaling", "gratitude", "mindfulness", "fitness", "habits", "goals", "wellness", "other"]
    },
    icon: {
        type: String,
        default: "📝"
    },

    // ✅ EXISTING: Members array
    members: [{
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        joinedAt: { type: Date, default: Date.now },
        points: { type: Number, default: 0 }, // Per-group points
        role: {
            type: String,
            enum: ["member", "moderator", "admin"],
            default: "member"
        },
        disabled: { type: Boolean, default: false },
        disabledReason: { type: String, default: "" }
    }],

    // ✅ NEW: Join requests (pending approvals)
    joinRequests: [{
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        message: {
            type: String,
            maxlength: 500,
            trim: true
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending"
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        reviewedBy: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        reviewedAt: {
            type: Date
        },
        rejectionReason: {
            type: String,
            maxlength: 200
        }
    }],

    // ✅ NEW: Single moderator per group
    moderatorId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    // Pending moderator invitations (user must accept before promotion)
    moderatorInvitations: [{
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        invitedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
        status: {
            type: String,
            enum: ["pending", "accepted", "declined", "cancelled"],
            default: "pending"
        },
        invitedAt: { type: Date, default: Date.now },
        respondedAt: { type: Date, default: null }
    }],


    // Points required to be eligible for moderator
    requiredPoints: {
        type: Number,
        default: 20
    },

    maxMembers: {
        type: Number,
        default: 50
    },


    weeklyTask: {
        task: { type: String, default: "" },
        week: { type: Date },
        completedBy: [{
            userId: { type: Schema.Types.ObjectId, ref: "User" },
            completedAt: { type: Date, default: Date.now }
        }]
    },

    isActive: {
        type: Boolean,
        default: true
    },

    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for faster queries
supportGroupSchema.index({ category: 1 });
supportGroupSchema.index({ isActive: 1 });
supportGroupSchema.index({ "joinRequests.status": 1 });
supportGroupSchema.index({ moderators: 1 });

// Virtual for member count
supportGroupSchema.virtual('memberCount').get(function () {
    return Array.isArray(this.members) ? this.members.length : 0;
});

// Virtual to check if group is full
supportGroupSchema.virtual('isFull').get(function () {
    return (Array.isArray(this.members) ? this.members.length : 0) >= this.maxMembers;
});

// Virtual for pending request count
supportGroupSchema.virtual('pendingRequestCount').get(function () {
    return Array.isArray(this.joinRequests)
        ? this.joinRequests.filter(req => req.status === 'pending').length
        : 0;
});

supportGroupSchema.set('toJSON', { virtuals: true });
supportGroupSchema.set('toObject', { virtuals: true });

export const SupportGroup = model("SupportGroup", supportGroupSchema);