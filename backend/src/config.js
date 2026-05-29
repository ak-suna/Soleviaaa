// src/config.js
const config = {
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    BACKEND_URL: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`,
};

export default config;