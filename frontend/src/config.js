const config = {
    BACKEND_URL:
        process.env.REACT_APP_BACKEND_URL ||
        (process.env.NODE_ENV === "production"
            ? "https://soleviaaa.onrender.com"
            : "http://localhost:5000"),
};

export default config;
