import express from "express";
import { authenticate } from "../middleware/authMiddleware.js";
import {
    sendConnectRequest,
    respondToRequest,
    getMyConnections,
    getPendingRequests,
    sendMessage,
    getMessages,
    saveCalendlyLink,
    deleteConnection
} from "../controllers/peerConnectController.js";
import {
    createSession,
    getGroupSessions,
    rsvpSession,
    deleteSession
} from "../controllers/groupSessionController.js";

const router = express.Router();

// ===== PEER CONNECT =====
router.post("/request", authenticate, sendConnectRequest);
router.put("/:connectionId/respond", authenticate, respondToRequest);
router.get("/mine", authenticate, getMyConnections);
router.get("/pending", authenticate, getPendingRequests);
router.get("/:connectionId/messages", authenticate, getMessages);
router.post("/:connectionId/messages", authenticate, sendMessage);
router.put("/:connectionId/calendly", authenticate, saveCalendlyLink);
router.delete("/:connectionId", authenticate, deleteConnection);

// ===== GROUP SESSIONS =====
router.post("/:groupId/sessions", authenticate, createSession);
router.get("/:groupId/sessions", authenticate, getGroupSessions);
router.post("/sessions/:sessionId/rsvp", authenticate, rsvpSession);
router.delete("/sessions/:sessionId", authenticate, deleteSession);

export default router;