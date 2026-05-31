import { Schema, model } from "mongoose";

const challengeSchema = new Schema({
    templateId: {
        type: Schema.Types.ObjectId,
        ref: "ChallengeTemplate",
        default: null
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 100
    },
    description: {
        type: String,
        required: true,
        maxlength: 1000
    },
    trackingType: {
        type: String,
        enum: ["mood", "habit", "journal", "manual"],
        required: true
    },
    duration: {
        type: Number,
        required: true
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        required: true
    },
    status: {
        type: String,
        enum: ["active", "expired"],
        default: "active"
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    participantCount: {
        type: Number,
        default: 0
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
        default: null
    }
}, { timestamps: true });

challengeSchema.index({ status: 1, endDate: 1 });
challengeSchema.index({ templateId: 1 });

export const Challenge = model("Challenge", challengeSchema);