import axios from 'axios';
import { getToken } from './auth';
import config from '../config';

const API_URL = `${config.BACKEND_URL}/api/habits`;

const getAuthHeader = () => ({
  headers: { Authorization: `Bearer ${getToken()}` }
});

export const getHabits = async () => {
  const response = await axios.get(API_URL, getAuthHeader());
  return response.data;
};

export const getTodayHabits = async () => {
  const response = await axios.get(`${API_URL}/today`, getAuthHeader());
  return response.data;
};

export const getPastHabits = async () => {
  const response = await axios.get(`${API_URL}/past`, getAuthHeader());
  return response.data;
};

export const createHabit = async (habitData) => {
  const response = await axios.post(API_URL, habitData, getAuthHeader());
  return response.data;
};

export const updateHabit = async (id, habitData) => {
  const response = await axios.put(`${API_URL}/${id}`, habitData, getAuthHeader());
  return response.data;
};

export const toggleHabit = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/toggle`, {}, getAuthHeader());
  return response.data;
};

export const deleteHabit = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
  return response.data;
};

export const checkNewDay = async () => {
  const localDate = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" in local TZ
  const response = await axios.post(
    `${API_URL}/check-day`,
    { localDate },
    getAuthHeader()
  );
  return response.data;
};

// Updated: supports page + limit for pagination (default 7 days per page)
export const getHabitHistory = async (page = 1, limit = 7) => {
  const response = await axios.get(`${API_URL}/history?page=${page}&limit=${limit}`, getAuthHeader());
  return response.data; // { data, page, totalPages, hasMore }
};

export const getLinkedGoals = async (habitId) => {
  const response = await axios.get(`${API_URL}/${habitId}/linked-goals`, getAuthHeader());
  return response.data;
};