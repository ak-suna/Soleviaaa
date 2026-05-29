// services/tokenService.js
import { getToken, setToken, logout } from './auth';
import config from '../config';

let refreshPromise = null;

export async function refreshToken() {
    // Prevent multiple simultaneous refresh attempts
    if (refreshPromise) {
        return refreshPromise;
    }

    refreshPromise = new Promise(async (resolve, reject) => {
        try {
            const currentToken = getToken();
            if (!currentToken) {
                reject(new Error('No token to refresh'));
                logout();
                return;
            }

            const response = await fetch(`${config.BACKEND_URL}/api/users/refresh-token`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${currentToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            if (data.token) {
                setToken(data.token);
                // Also update role and isVerified if they changed
                if (data.role) localStorage.setItem("role", data.role);
                if (data.isVerified !== undefined) localStorage.setItem("isVerified", data.isVerified);

                // Decode and update username
                const { jwtDecode } = await import('jwt-decode');
                const decoded = jwtDecode(data.token);
                const username = `${decoded.firstName || ""} `.trim();
                localStorage.setItem("username", username);

                resolve(data.token);
            } else {
                reject(new Error('No token in response'));
            }
        } catch (error) {
            console.error('Token refresh error:', error);
            logout();
            reject(error);
        } finally {
            refreshPromise = null;
        }
    });

    return refreshPromise;
}

// Check if token is expired or about to expire
export function isTokenExpiringSoon() {
    const token = getToken();
    if (!token) return true;

    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = decoded.exp * 1000;
        const currentTime = Date.now();
        const timeUntilExpiry = expirationTime - currentTime;

        // Return true if token expires in less than 5 minutes
        return timeUntilExpiry < 5 * 60 * 1000;
    } catch (error) {
        return true;
    }
}

// Get token expiration time
export function getTokenExpiration() {
    const token = getToken();
    if (!token) return null;

    try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        return new Date(decoded.exp * 1000);
    } catch (error) {
        return null;
    }
}