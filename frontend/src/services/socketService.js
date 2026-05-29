// services/socketService.js
import { io } from 'socket.io-client';
import { getToken } from './auth';
import { refreshToken, isTokenExpiringSoon } from './tokenService';
import config from '../config';

let socket = null;
let refreshInterval = null;

export const initializeSocket = () => {
    if (socket && socket.connected) {
        console.log('Socket already connected');
        return socket;
    }

    const token = getToken();
    if (!token) {
        console.log('No token, skipping socket initialization');
        return null;
    }
    console.log('Initializing socket connection...');
    console.log('Token exists, length:', token.length);

    socket = io(config.BACKEND_URL, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 20000, // Increase timeout
        forceNew: true
    });

    // Handle successful connection
    socket.on('connect', () => {
        console.log('✅ Socket connected');
        startTokenRefreshChecker();
    });

    // Handle token expiration from server
    socket.on('token-expired', async () => {
        console.log('⚠️ Token expired, refreshing...');
        await handleTokenRefresh();
    });

    // Handle token refresh acknowledgment
    socket.on('token-refreshed', (data) => {
        if (data.success) {
            console.log('✅ Socket token refreshed successfully');
        } else {
            console.error('❌ Socket token refresh failed:', data.error);
        }
    });

    // Handle connection errors
    socket.on('connect_error', async (error) => {
        console.log('Connection error:', error.message);
        if (error.message === 'Authentication error: Invalid token') {
            console.log('Authentication error, attempting token refresh...');
            await handleTokenRefresh();
        }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        if (refreshInterval) {
            clearInterval(refreshInterval);
            refreshInterval = null;
        }
    });

    return socket;
};

const handleTokenRefresh = async () => {
    try {
        const newToken = await refreshToken();
        if (newToken && socket) {
            // Update socket auth
            socket.auth = { token: newToken };
            // Reconnect with new token
            socket.disconnect();
            socket.connect();
            return true;
        }
    } catch (error) {
        console.error('Failed to refresh token for socket:', error);
        return false;
    }
};

const startTokenRefreshChecker = () => {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }

    // Check every minute if token needs refresh
    refreshInterval = setInterval(async () => {
        if (isTokenExpiringSoon() && socket && socket.connected) {
            console.log('Token expiring soon, refreshing proactively...');
            await handleTokenRefresh();
        }
    }, 60000); // Check every minute
};

export const getSocket = () => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
};

export const disconnectSocket = () => {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};