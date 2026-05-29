// src/config.js
const config = {
    FRONTEND_URL:
        process.env.FRONTEND_URL ||
        (process.env.NODE_ENV === "production"
            ? "https://soleviaaa-ebdj.vercel.app"
            : "http://localhost:3000"),
    BACKEND_URL:
        process.env.BACKEND_URL ||
        (process.env.NODE_ENV === "production"
            ? "https://soleviaaa.onrender.com"
            : `http://localhost:${process.env.PORT || 5000}`),
};

export default config;
