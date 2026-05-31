import { PeerConnect } from "../models/PeerConnect.js";
import { SupportGroup } from "../models/SupportGroup.js";
import { User } from "../models/User.js";
import notificationService from "../services/notificationService.js";
import { getIO } from "../sockets/notificationSocket.js";
import { encrypt, decrypt } from "../utils/encryption.js";

// Send a peer connect request
export const sendConnectRequest = async (req, res) => {
    try {
        const requesterId = req.user.id;
        const { recipientId, groupId } = req.body;

        if (requesterId === recipientId) {
            return res.status(400).json({ error: "Cannot connect with yourself" });
        }

        const group = await SupportGroup.findById(groupId);
        if (!group) return res.status(404).json({ error: "Group not found" });

        const bothMembers = group.members.some(m => m.userId.toString() === requesterId) &&
            group.members.some(m => m.userId.toString() === recipientId);
        if (!bothMembers) {
            return res.status(403).json({ error: "Both users must be group members" });
        }

        // Check for existing non-declined connection
        const existing = await PeerConnect.findOne({
            groupId,
            $or: [
                { requesterId, recipientId },
                { requesterId: recipientId, recipientId: requesterId }
            ],
            status: { $ne: "declined" }
        });

        if (existing) {
            if (existing.status === "pending") {
                return res.status(400).json({ error: "A connection request is already pending with this member." });
            }
            return res.status(400).json({ error: "You are already connected with this member." });
        }

        const connection = await PeerConnect.create({ groupId, requesterId, recipientId });

        const requester = await User.findById(requesterId).select("firstName lastName");
        await notificationService.createNotification({
            userId: recipientId,
            type: "PEER_CONNECT_REQUEST",
            title: "New Peer Connect Request",
            message: `${requester.firstName} ${requester.lastName} wants to connect with you in your group.`,
            data: { connectionId: connection._id, groupId, requesterId }
        });

        res.status(201).json({ message: "Connect request sent", connection });
    } catch (error) {
        console.error("Error sending connect request:", error);
        res.status(500).json({ error: "Failed to send connect request" });
    }
};

// Accept or decline a connect request
export const respondToRequest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;
        const { action } = req.body; // "accept" or "decline"

        const connection = await PeerConnect.findById(connectionId);
        if (!connection) return res.status(404).json({ error: "Connection not found" });
        if (connection.recipientId.toString() !== userId) {
            return res.status(403).json({ error: "Not authorized" });
        }
        if (connection.status !== "pending") {
            return res.status(400).json({ error: "Request already processed" });
        }

        connection.status = action === "accept" ? "accepted" : "declined";
        await connection.save();

        const recipient = await User.findById(userId).select("firstName lastName");
        if (action === "accept") {
            await notificationService.createNotification({
                userId: connection.requesterId,
                type: "PEER_CONNECT_ACCEPTED",
                title: "Peer Connect Accepted",
                message: `${recipient.firstName} ${recipient.lastName} accepted your connect request!`,
                data: { connectionId: connection._id, groupId: connection.groupId }
            });
        } else {
            await notificationService.createNotification({
                userId: connection.requesterId,
                type: "PEER_CONNECT_DECLINED",
                title: "Peer Connect Declined",
                message: `${recipient.firstName} ${recipient.lastName} declined your connect request.`,
                data: { groupId: connection.groupId }
            });
        }

        res.status(200).json({ message: `Request ${connection.status}`, connection });
    } catch (error) {
        console.error("Error responding to request:", error);
        res.status(500).json({ error: "Failed to respond to request" });
    }
};

// Get all connections for current user (accepted)
export const getMyConnections = async (req, res) => {
    try {
        const userId = req.user.id;
        const { groupId } = req.query;

        const query = {
            status: "accepted",
            $or: [{ requesterId: userId }, { recipientId: userId }]
        };
        if (groupId) query.groupId = groupId;

        const connections = await PeerConnect.find(query)
            .populate("requesterId", "firstName lastName profilePicture")
            .populate("recipientId", "firstName lastName profilePicture")
            .sort({ updatedAt: -1 });

        res.status(200).json({ connections });
    } catch (error) {
        console.error("Error fetching connections:", error);
        res.status(500).json({ error: "Failed to fetch connections" });
    }
};

// Get pending incoming requests for current user
export const getPendingRequests = async (req, res) => {
    try {
        const userId = req.user.id;
        const requests = await PeerConnect.find({ recipientId: userId, status: "pending" })
            .populate("requesterId", "firstName lastName profilePicture")
            .populate("groupId", "name icon");
        res.status(200).json({ requests });
    } catch (error) {
        console.error("Error fetching pending requests:", error);
        res.status(500).json({ error: "Failed to fetch pending requests" });
    }
};

// Send a chat message in an accepted connection
export const sendMessage = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ error: "Message content is required" });
        }

        const connection = await PeerConnect.findById(connectionId);
        if (!connection) return res.status(404).json({ error: "Connection not found" });

        const isParticipant = connection.requesterId.toString() === userId ||
            connection.recipientId.toString() === userId;
        if (!isParticipant) return res.status(403).json({ error: "Not authorized" });
        if (connection.status !== "accepted") {
            return res.status(400).json({ error: "Connection is not active" });
        }

        const encryptedContent = encrypt(content.trim());
        const message = { senderId: userId, content: encryptedContent };
        connection.messages.push(message);
        await connection.save();

        const savedMessage = connection.messages[connection.messages.length - 1];
        const sender = await User.findById(userId).select("firstName lastName");

        // Decrypt for real-time delivery
        const decryptedMessage = {
            ...savedMessage.toObject(),
            content: content.trim(),
            senderName: `${sender.firstName} ${sender.lastName}`
        };

        // Real-time delivery via existing socket
        const recipientId = connection.requesterId.toString() === userId
            ? connection.recipientId
            : connection.requesterId;

        try {
            const io = getIO();
            const recipientUser = await User.findById(recipientId);
            if (recipientUser?.socketId) {
                io.to(recipientUser.socketId).emit("peer-message", {
                    connectionId,
                    message: decryptedMessage
                });
            }
        } catch (e) {
            console.error("Socket emit error (non-fatal):", e.message);
        }

        res.status(201).json({ message: decryptedMessage });
    } catch (error) {
        console.error("Error sending message:", error);
        res.status(500).json({ error: "Failed to send message" });
    }
};

// Get messages for a connection
export const getMessages = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;

        const connection = await PeerConnect.findById(connectionId)
            .populate("messages.senderId", "firstName lastName");
        if (!connection) return res.status(404).json({ error: "Connection not found" });

        const isParticipant = connection.requesterId.toString() === userId ||
            connection.recipientId.toString() === userId;
        if (!isParticipant) return res.status(403).json({ error: "Not authorized" });

        // Mark messages as read
        let updated = false;
        connection.messages.forEach(m => {
            if (m.senderId._id?.toString() !== userId && !m.readAt) {
                m.readAt = new Date();
                updated = true;
            }
        });
        if (updated) await connection.save();

        // Decrypt all messages before sending to client
        const decryptedMessages = connection.messages.map(m => {
            const msgObj = m.toObject();
            msgObj.content = decrypt(msgObj.content);
            return msgObj;
        });

        res.status(200).json({ messages: decryptedMessages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Failed to fetch messages" });
    }
};

// Save meeting link to a connection
export const saveCalendlyLink = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;
        const { calendlyLink } = req.body;

        const connection = await PeerConnect.findById(connectionId);
        if (!connection) return res.status(404).json({ error: "Connection not found" });

        const isParticipant = connection.requesterId.toString() === userId ||
            connection.recipientId.toString() === userId;
        if (!isParticipant) return res.status(403).json({ error: "Not authorized" });

        connection.calendlyLink = calendlyLink || null;
        await connection.save();

        res.status(200).json({ message: "Meeting link saved", calendlyLink: connection.calendlyLink });
    } catch (error) {
        console.error("Error saving meeting link:", error);
        res.status(500).json({ error: "Failed to save link" });
    }
};

// Delete a connection (Disconnect)
export const deleteConnection = async (req, res) => {
    try {
        const userId = req.user.id;
        const { connectionId } = req.params;

        const connection = await PeerConnect.findById(connectionId);
        if (!connection) return res.status(404).json({ error: "Connection not found" });

        const isParticipant = connection.requesterId.toString() === userId ||
            connection.recipientId.toString() === userId;
        if (!isParticipant) return res.status(403).json({ error: "Not authorized" });

        // Notify the other person before deleting
        const otherId = connection.requesterId.toString() === userId ? connection.recipientId : connection.requesterId;
        const remover = await User.findById(userId).select("firstName lastName");

        await notificationService.createNotification({
            userId: otherId,
            type: "PEER_CONNECT_REMOVED",
            title: "Peer Connection Ended",
            message: `${remover.firstName} ${remover.lastName} has ended the connection.`,
            data: { groupId: connection.groupId }
        });

        await PeerConnect.findByIdAndDelete(connectionId);

        res.status(200).json({ message: "Connection removed successfully" });
    } catch (error) {
        console.error("Error removing connection:", error);
        res.status(500).json({ error: "Failed to remove connection" });
    }
};