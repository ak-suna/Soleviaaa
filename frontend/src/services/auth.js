import { jwtDecode } from "jwt-decode"; // ✅ correct for v3+
import config from "../config";

const API_URL = `${config.BACKEND_URL}/api/users`;
export const signup = async (userData) => {
    try {
        const response = await fetch(`${API_URL}/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
        });

        const data = await response.json();

        console.log("Backend response:", data); // ← This shows the exact backend error

        if (!response.ok) {
            throw new Error(data.error || "Signup failed");
        }

        // Store token (user can browse but should verify email)
        localStorage.setItem("token", data.token);

        return data;
    } catch (err) {
        console.error("Signup error:", err.message);
        throw err; // rethrow so frontend form can handle it
    }
};

export const resendVerification = async (email) => {
    const response = await fetch(`${API_URL}/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.error || "Failed to resend verification email");
    }
    return data;
};
export const setToken = (token) => {
    localStorage.setItem("token", token);
};

// export const signup = async (userData) => {
//     const response = await fetch(`${API_URL}/signup`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(userData),
//     });

//     const data = await response.json();

//     if (!response.ok) {
//         throw new Error(data.error || "Signup failed");
//     }
//     // Store token (user can browse but should verify email)
//     localStorage.setItem("token", data.token);

//     return data;
// };

export const login = async (credentials) => {
    const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        // Check for lifecycle hold status
        if (data.status === "deactivated_hold" || data.status === "deletion_hold") {
            const error = new Error(data.error);
            error.status = data.status;
            error.expiresAt = data.expiresAt;
            throw error;
        }
        throw new Error(data.error || "Login failed");
    }

    // ✅ Only store token on login
    localStorage.setItem("token", data.token);
    localStorage.setItem("role", data.role); // NEW
    localStorage.setItem("isVerified", data.isVerified);

    const decoded = jwtDecode(data.token);
    const username = `${decoded.firstName || ""} `.trim();
    localStorage.setItem("username", username);
    return data;
};
//Verify Email Function
export const verifyEmail = async (code) => {
    const response = await fetch(`${API_URL}/verify-email/${code}`, {
        method: "GET",
    });

    const data = await response.json();

    if (response.ok || data.success || data.message?.toLowerCase().includes("already verified")) {
        return data;
    } else {
        throw new Error(data.error || "Email verification failed");
    }

    // if (!response.ok) {
    //     throw new Error(data.error || "Email verification failed");
    // }

    // return data;
};
// 🆕 NEW: Request password reset
export const forgotPassword = async (email) => {
    const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email");
    }

    return data;
};

// 🆕 NEW: Reset password with token
export const resetPassword = async (token, password) => {
    const response = await fetch(`${API_URL}/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Password reset failed");
    }

    return data;
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("isVerified");
    localStorage.removeItem("username");
    // Optional: redirect to login
    window.location.href = "/login";
};

// 🆕 NEW: Reactivate Account
export const reactivateAccount = async (credentials) => {
    const response = await fetch(`${API_URL}/reactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to reactivate account");
    }

    return data;
};

// 🆕 NEW: Deactivate Account
export const deactivateAccount = async () => {
    const response = await fetch(`${API_URL}/deactivate`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to deactivate account");
    }
    return data;
};

// 🆕 NEW: Request Account Deletion
export const requestAccountDeletion = async () => {
    const response = await fetch(`${API_URL}/request-deletion`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${getToken()}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to request account deletion");
    }
    return data;
};

// 🆕 NEW: Cancel Account Deletion
export const cancelAccountDeletion = async (credentials) => {
    const response = await fetch(`${API_URL}/cancel-deletion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Failed to cancel deletion");
    }

    return data;
};

export const getToken = () => {
    return localStorage.getItem("token");
};

export const getRole = () => {
    return localStorage.getItem("role");
};

export const isVerified = () => {
    return localStorage.getItem("isVerified") === "true";
};

export const isAuthenticated = () => {
    return !!localStorage.getItem("token");
    // const token = localStorage.getItem("token"); 
    // const verified = localStorage.getItem("verified"); // set this after email verification
    // return !!token && verified === "true";
};

export const isAdmin = () => {
    return localStorage.getItem("role") === "admin";
};

export const getUsername = () => {
    return localStorage.getItem("username");
};



