import { fetchWithAuth } from "./fetchWithAuth";
import config from "../config";

const API_BASE_URL = `${config.BACKEND_URL}/api`;

// // Check if user needs to log mood
export const shouldShowMoodCheck = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { show: false, period: null };
    }
    // Use fetchWithAuth so disabled users are logged out
    const response = await fetchWithAuth(`${API_BASE_URL}/mood/today`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch mood status");
    }
    const data = await response.json();
    const currentHour = new Date().getHours();
    // Morning check: 5 AM - 12 PM
    if (currentHour >= 5 && currentHour < 12 && !data.morning) {
      return { show: true, period: "morning" };
    }
    // Evening check: 5 PM - 11 PM
    if (currentHour >= 17 && currentHour < 24 && !data.evening) {
      return { show: true, period: "evening" };
    }
    return { show: false, period: null };
  } catch (error) {
    console.error("Error checking mood status:", error);
    return { show: false, period: null };
  }
};

// Save mood to backend
export const saveMood = async (mood, period) => {
  console.log("💾 Attempting to save mood:", { mood, period });

  try {
    const token = localStorage.getItem("token");
    console.log("Token exists:", !!token);

    if (!token) {
      throw new Error("No authentication token");
    }

    const payload = {
      mood: mood.value,
      emoji: mood.emoji,
      label: mood.label,
      color: mood.color,
      period: period
    };

    console.log("Sending payload:", payload);
    console.log("To URL:", `${API_BASE_URL}/mood`);

    const response = await fetch(`${API_BASE_URL}/mood`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    console.log("Response status:", response.status);

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to save mood");
    }

    console.log("✅ Mood saved successfully!");
    return data;

  } catch (error) {
    console.error("❌ Error saving mood:", error);
    console.error("Error details:", error.message);
    throw error;
  }
};

// Get mood history for calendar
export const getMoodHistory = async (startDate, endDate) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No authentication token");
    }
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const response = await fetchWithAuth(`${API_BASE_URL}/mood/history?${params}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch mood history");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching mood history:", error);
    return [];
  }
};
export const getStreaks = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return { moodStreak: { current: 0, best: 0 }, habitStreak: { current: 0, best: 0 } };
    }
    const response = await fetchWithAuth(`${API_BASE_URL}/mood/streaks`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    if (!response.ok) {
      throw new Error("Failed to fetch streaks");
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching streaks:", error);
    return { moodStreak: { current: 0, best: 0 }, habitStreak: { current: 0, best: 0 } };
  }
};
