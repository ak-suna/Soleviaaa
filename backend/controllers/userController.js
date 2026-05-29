import { addUsers, verifyUser, requestPasswordReset, resetPassword } from "../services/userService.js";
import { generateToken } from "../utils/generateToken.js";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/sendEmail.js";
import { User } from "../models/User.js";
import jwt from "jsonwebtoken";

export const refreshToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        // Decode the expired token to get user ID
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                // Token is expired, decode it to get user info
                decoded = jwt.decode(token);
                if (!decoded || !decoded.userId) {
                    return res.status(401).json({ error: 'Invalid token' });
                }
            } else {
                return res.status(401).json({ error: 'Invalid token' });
            }
        }

        const userId = decoded.userId || decoded.id;

        // Verify user still exists in database
        const user = await User.findById(userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Generate new token
        const newToken = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                role: user.role
            },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '7d' }
        );

        res.json({
            token: newToken,
            role: user.role,
            isVerified: user.isVerified
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
};

export const registerUser = async (req, res) => {
    try {
        const registeredUser = await addUsers(req.body);
        console.log(registeredUser);

        // Send verification email (don't fail registration if email delivery fails)
        let emailSent = true;
        try {
            await sendVerificationEmail(registeredUser);
        } catch (emailErr) {
            emailSent = false;
            console.error("❌ User registered but verification email failed:", emailErr.message);
        }

        const token = generateToken({
            id: registeredUser._id,
            email: registeredUser.email,
            firstName: registeredUser.firstName,
            lastName: registeredUser.lastName,
            role: registeredUser.role,
            isVerified: registeredUser.isVerified
        });
        res.status(200).json({
            message: emailSent
                ? "Registration Successfull. Please check your email to verify your account."
                : "Registration successful, but we could not send the verification email. Please use resend verification on the login page.",
            token: token,
            emailSent,
        });
    } catch (err) {
        let status = 400;
        if (err.message === "Missing required fields") {
            status = 404;
        }
        console.error("❌ Error registering user: ", err);
        res.status(status).json({ error: err.message });
    }
};

export const loginUser = async (req, res) => {
    try {
        const loginUser = await verifyUser(req.body);


        // ✅ CHECK IF USER IS DISABLED
        if (loginUser.disabled) {
            return res.status(403).json({
                error: `Your account has been disabled. Please contact support at anuskagc100@gmail.com.`,
                reason: loginUser.disabledReason || undefined
            });
        }

        // ✅ LIFECYCLE INTERCEPTION
        if (loginUser.accountStatus === 'deactivated') {
            return res.status(403).json({
                status: "deactivated_hold",
                error: "Your account is deactivated. Please restore to continue."
            });
        }

        if (loginUser.accountStatus === 'pending_deletion') {
            return res.status(403).json({
                status: "deletion_hold",
                expiresAt: loginUser.deletionGracePeriodExpiresAt,
                error: "Your account is scheduled for permanent deletion. Please cancel the request to continue."
            });
        }

        const token = generateToken({
            id: loginUser._id,
            email: loginUser.email,
            firstName: loginUser.firstName,
            lastName: loginUser.lastName,
            role: loginUser.role,
            isVerified: loginUser.isVerified
        });

        res.status(200).json({
            message: "Login Successful",
            token: token,
            role: loginUser.role,
            isVerified: loginUser.isVerified
        });
    } catch (err) {
        let status = 400;
        console.error("❌ Error on login: ", err);
        res.status(status).json({ error: err.message });
    }
};

export const verifyEmail = async (req, res) => {
    try {
        const { code } = req.params;

        // Find user by code, even if already verified
        const user = await User.findOne({ verificationCode: code });

        if (!user) {
            // Check if code was already used (user is verified)
            const alreadyVerifiedUser = await User.findOne({ isVerified: true });
            if (alreadyVerifiedUser) {
                return res.status(200).json({
                    success: true,
                    message: "Email already verified."
                });
            }

            return res.status(400).json({ error: "Invalid or expired verification code" });
        }

        if (user.isVerified) {
            // Already verified → return 200 with proper message
            return res.status(200).json({
                success: true,
                message: "Email already verified. You can log in."
            });
        }

        // Verify the user
        user.isVerified = true;
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Email verified successfully! You can now log in."
        });
    } catch (err) {
        console.error("❌ Error verifying email: ", err);
        res.status(500).json({ error: "Email verification failed" });
    }
};

export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await User.findOne({ email: email.trim() });
        if (!user) {
            return res.status(404).json({ error: "No account found with this email" });
        }
        if (user.isVerified) {
            return res.status(200).json({ message: "Email is already verified. You can log in." });
        }

        await sendVerificationEmail(user);
        res.status(200).json({ message: "Verification email sent. Please check your inbox." });
    } catch (err) {
        console.error("❌ Error resending verification email:", err);
        res.status(500).json({ error: err.message || "Failed to send verification email" });
    }
};

// 🆕 Forgot password - send reset email
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const result = await requestPasswordReset(email);

        // If user exists, send email
        if (result.user) {
            await sendPasswordResetEmail(result.user, result.resetToken);
        }

        // Always return success (security best practice)
        res.status(200).json({
            message: "If an account with that email exists, a password reset link has been sent."
        });
    } catch (err) {
        console.error("❌ Error in forgot password: ", err);
        res.status(500).json({ error: "Failed to process password reset request" });
    }
};

// 🆕 Reset password with token
export const resetPasswordController = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                error: "Password must be at least 6 characters long"
            });
        }

        await resetPassword(token, password);

        res.status(200).json({
            success: true,
            message: "Password reset successful! You can now log in with your new password."
        });
    } catch (err) {
        console.error("❌ Error resetting password: ", err);
        res.status(400).json({ error: err.message });
    }
};