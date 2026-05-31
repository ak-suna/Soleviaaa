import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, maxlength: 5000 },
    readAt: { type: Date, default: null }
}, { timestamps: true });

const peerConnectSchema = new mongoose.Schema({
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: "SupportGroup", required: true },
    requesterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending"
    },
    calendlyLink: { type: String, default: null },
    messages: [messageSchema]
}, { timestamps: true });

peerConnectSchema.index({ groupId: 1, requesterId: 1, recipientId: 1 });
peerConnectSchema.index({ requesterId: 1, status: 1 });
peerConnectSchema.index({ recipientId: 1, status: 1 });

export const PeerConnect = mongoose.model("PeerConnect", peerConnectSchema);