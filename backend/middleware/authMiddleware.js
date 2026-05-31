import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

export const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) {
            return res.status(401).json({ error: "No token provided" });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;

        // Check if user is disabled on every request
        const user = await User.findById(decoded.id);
        if (user && user.disabled) {
            return res.status(403).json({
                error: `Your account has been disabled. Please contact support at anuskagc100@gmail.com.`,
                reason: user.disabledReason || undefined
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: "Invalid token" });
    }
};

export const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: "Access denied. Insufficient permissions." 
            });
        }
        next();
    };
};