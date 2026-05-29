
// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import { createServer } from "http"; // ← ADD THIS
// import connectDB from "./config/db.js";
// import moderatorRoutes from "./routes/moderatorRoutes.js";

// // Existing routes
// import userRoutes from "./routes/auth.js";
// import adminRoutes from "./routes/admin.js";
// import moodRoutes from "./routes/moodRoutes.js";
// import journalRoutes from "./routes/journalRoutes.js";
// import profileRoutes from "./routes/profile.js";
// import habitRoutes from './routes/habitRoutes.js';
// import goalRoutes from './routes/goalRoutes.js';

// // ============ NEW IMPORTS ============
// import notificationRoutes from "./routes/notificationRoutes.js";
// import { initializeSocket } from "./sockets/notificationSocket.js";
// import { startNotificationJobs, stopNotificationJobs } from "./jobs/notificationJobs.js";

// import postRoutes from "./routes/postRoutes.js";
// import groupRoutes from "./routes/groupRoutes.js";
// import challengeRoutes from "./routes/challengeRoutes.js";
// import reportRoutes from "./routes/reportRoutes.js";
// import capsuleRoutes from './routes/capsuleRoutes.js';
// import commentRoutes from "./routes/commentRoutes.js";
// import reactionRoutes from "./routes/reactionRoutes.js";
// import analyticsRoutes from './routes/analyticsRoutes.js';


// dotenv.config();

// const app = express();
// const port = process.env.PORT || 3000;

// // ============ CREATE HTTP SERVER (REQUIRED FOR SOCKET.IO) ============
// const server = createServer(app);

// // MIDDLEWARE (ORDER MATTERS!)
// app.use(cors());
// app.use(express.json());

// // Connect DB
// connectDB();

// // EXISTING ROUTES
// app.use("/api/users", userRoutes);
// app.use("/api/admin", adminRoutes);
// app.use("/api/mood", moodRoutes);
// app.use("/api/journal", journalRoutes);
// app.use("/api/profile", profileRoutes);
// app.use('/api/habits', habitRoutes);
// app.use('/api/goals', goalRoutes);
// app.use('/api/capsules', capsuleRoutes);

// // ============ NEW NOTIFICATION ROUTE ============
// app.use("/api/notifications", notificationRoutes);

// // Community routes
// app.use("/api/posts", postRoutes);
// app.use("/api/groups", groupRoutes);
// app.use("/api/challenges", challengeRoutes);
// app.use("/api/reports", reportRoutes);
// app.use("/api/comments", commentRoutes);
// app.use("/api/reactions", reactionRoutes);

// app.use("/api/moderators", moderatorRoutes);

// // Test route
// app.get("/", (req, res) => {
//     res.json({
//         message: "API is running",
//         socketEnabled: true,
//         agendaEnabled: true
//     });
// });

// // ============ INITIALIZE SOCKET.IO ============
// initializeSocket(server);

// // ============ START AGENDA JOBS ============
// startNotificationJobs()
//     .then(() => console.log("✅ Notification system initialized"))
//     .catch(err => console.error("❌ Error starting Agenda:", err));

// // Start server (use 'server' instead of 'app')
// server.listen(port, () => {
//     console.log(`✅ Server is running on port ${port}`);
// });

// // ============ GRACEFUL SHUTDOWN ============
// process.on("SIGTERM", async () => {
//     console.log("⚠️ SIGTERM received: shutting down gracefully");
//     await stopNotificationJobs();
//     server.close(() => {
//         console.log("✅ Server closed");
//         process.exit(0);
//     });
// });

// process.on("SIGINT", async () => {
//     console.log("⚠️ SIGINT received: shutting down gracefully");
//     await stopNotificationJobs();
//     server.close(() => {
//         console.log("✅ Server closed");
//         process.exit(0);
//     });
// });
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import connectDB from "./config/db.js";

import moderatorRoutes from "./routes/moderatorRoutes.js";
import moderatorToolsRoutes from "./routes/moderatorToolsRoutes.js";

// Existing routes
import userRoutes from "./routes/auth.js";
import adminRoutes from "./routes/admin.js";
import moodRoutes from "./routes/moodRoutes.js";
import journalRoutes from "./routes/journalRoutes.js";
import profileRoutes from "./routes/profile.js";
import habitRoutes from './routes/habitRoutes.js';
import goalRoutes from './routes/goalRoutes.js';

// ============ NEW IMPORTS ============
import notificationRoutes from "./routes/notificationRoutes.js";
import { initializeSocket } from "./sockets/notificationSocket.js";
import { startNotificationJobs, stopNotificationJobs } from "./jobs/notificationJobs.js";
import "./jobs/accountLifecycleJobs.js"; // Import to register jobs

import postRoutes from "./routes/postRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import challengeRoutes from "./routes/challengeRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import capsuleRoutes from './routes/capsuleRoutes.js';
import commentRoutes from "./routes/commentRoutes.js";
import reactionRoutes from "./routes/reactionRoutes.js";
import analyticsRoutes from './routes/analyticsRoutes.js'; // ← ANALYTICS IMPORT
// ADD this import:
import peerConnectRoutes from "./routes/peerConnectRoutes.js";
import { verifyEmailTransport } from "./utils/sendEmail.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// ============ CREATE HTTP SERVER (REQUIRED FOR SOCKET.IO) ============
const server = createServer(app);

// MIDDLEWARE (ORDER MATTERS!)
app.use(cors());
app.use(express.json());

// Connect DB (will be awaited at the bottom)

// EXISTING ROUTES
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mood", moodRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/profile", profileRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/capsules', capsuleRoutes);

// ============ NEW NOTIFICATION ROUTE ============
app.use("/api/notifications", notificationRoutes);

// ============ ANALYTICS ROUTE ============
app.use('/api/analytics', analyticsRoutes); // ← ANALYTICS ROUTE ADDED HERE


// Community routes

app.use("/api/groups/connect", peerConnectRoutes); // <-- MUST be before /api/groups
app.use("/api/posts", postRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/reactions", reactionRoutes);

app.use("/api/moderators", moderatorRoutes);
app.use("/api/moderator-tools", moderatorToolsRoutes);

// Test route
app.get("/", (req, res) => {
    res.json({
        message: "API is running",
        socketEnabled: true,
        agendaEnabled: true,
        analyticsEnabled: true // ← Added for confirmation
    });
});

// ============ INITIALIZE SOCKET.IO ============
initializeSocket(server);

// ============ START AGENDA JOBS AND SERVER ============
connectDB().then(async () => {
    await verifyEmailTransport();
    startNotificationJobs()
        .then(() => {
            console.log("✅ Notification system initialized");
            // Start server
            server.listen(port, () => {
                console.log(`✅ Server is running on port ${port}`);
            });
        })
        .catch(err => console.error("❌ Error starting Agenda:", err));
});

// ============ GRACEFUL SHUTDOWN ============
process.on("SIGTERM", async () => {
    console.log("⚠️ SIGTERM received: shutting down gracefully");
    await stopNotificationJobs();
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});

process.on("SIGINT", async () => {
    console.log("⚠️ SIGINT received: shutting down gracefully");
    await stopNotificationJobs();
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});