import express from "express";
import {
    getModeratorCandidates,
    promoteToModerator,
    respondToModeratorInvitation,
    removeModerator,
    getModeratedGroups,
    getReportedPostsForGroup,
    moderatorRemovePost,
    moderatorDismissReport
} from "../controllers/moderatorController.js";

import { authenticate, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Moderator - reported posts moderation
router.get("/group/:groupId/reported-posts", authenticate, getReportedPostsForGroup);
router.delete("/post/:postId", authenticate, moderatorRemovePost);
router.put("/report/:reportId/dismiss", authenticate, moderatorDismissReport);
// Admin only - view candidates and promote/remove
router.get("/candidates/:groupId", authenticate, authorizeRole("admin"), getModeratorCandidates);
router.post("/promote", authenticate, authorizeRole("admin"), promoteToModerator);
router.post("/respond", authenticate, respondToModeratorInvitation);
router.delete("/:groupId/:userId", authenticate, authorizeRole("admin"), removeModerator);

// Moderator - view their groups
router.get("/my-groups", authenticate, getModeratedGroups);

export default router;