// frontend/src/hooks/useNotifications.jsx
// Place this in your React frontend

import { useState, useEffect, useCallback } from "react";
import { io } from "socket.io-client";
import config from "../config";

const BACKEND_URL = config.BACKEND_URL;


let socket = null;

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem("token"); // Or however you store JWT

    if (!token) {
      console.warn("⚠️ No auth token found, skipping socket connection");
      return;
    }

    // Create socket connection
    socket = io(BACKEND_URL, {
      auth: { token },
      transports: ["websocket", "polling"]
    });

    // Connection handlers
    socket.on("connect", () => {
      console.log("✅ Socket connected:", socket.id);
      setConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket disconnected");
      setConnected(false);
    });

    socket.on("connect_error", (error) => {
      console.error("❌ Socket connection error:", error.message);
      setConnected(false);
    });

    // Notification handlers
    socket.on("notification", (notification) => {
      console.log("📬 New notification received:", notification);
      
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      
      // Increment unread count
      setUnreadCount((prev) => prev + 1);
      
      // Show browser notification (if permitted)
      showBrowserNotification(notification);
      
      // Show toast notification (implement your own toast)
      // toast.success(notification.title);
    });

    socket.on("unread-count", (count) => {
      console.log("📊 Unread count updated:", count);
      setUnreadCount(count);
    });

    // Cleanup on unmount
    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  // Fetch initial notifications
  const fetchNotifications = useCallback(async (page = 1, limit = 20) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/api/notifications?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("❌ Error fetching notifications:", error);
    }
  }, []);

  // Mark as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/api/notifications/${notificationId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notificationId ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));

        // Emit to socket (optional, for real-time sync)
        if (socket) {
          socket.emit("mark-as-read", notificationId);
        }
      }
    } catch (error) {
      console.error("❌ Error marking as read:", error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/api/notifications/mark-all-read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, read: true }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.filter((n) => n._id !== notificationId)
        );
      }
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    connected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}

// Helper: Show browser notification
function showBrowserNotification(notification) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.message,
      icon: "/logo.png", // Your app logo
      badge: "/badge.png"
    });
  }
}

// Helper: Request notification permission (call this on user action)
export function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission().then((permission) => {
      console.log("Notification permission:", permission);
    });
  }
}