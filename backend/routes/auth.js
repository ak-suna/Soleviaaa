
import express from "express";
import {
    loginUser,
    registerUser,
    verifyEmail,
    resendVerificationEmail,
    forgotPassword,
    resetPasswordController,
    refreshToken
} from "../controllers/userController.js";

import {
    deactivateAccount,
    reactivateAccount,
    requestAccountDeletion,
    cancelAccountDeletion
} from "../controllers/userLifecycleController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { registerSchema, loginSchema } from "../validations/schemas.js";

const router = express.Router();

router.post("/signup", validateRequest(registerSchema), registerUser);
router.post("/login", validateRequest(loginSchema), loginUser);
router.get("/verify-email/:code", verifyEmail);
router.post("/resend-verification", resendVerificationEmail);

// 🆕 NEW: Password reset routes
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPasswordController);

router.post("/refresh-token", refreshToken);

// 🆕 NEW: Account Lifecycle routes
router.post("/deactivate", authenticate, deactivateAccount);
router.post("/reactivate", reactivateAccount);
router.post("/request-deletion", authenticate, requestAccountDeletion);
router.post("/cancel-deletion", cancelAccountDeletion);

export default router;