// import axios from 'axios';
// import { getToken } from './auth';

// const API_URL = 'http://localhost:5000/api/analytics';

// const getAuthHeader = () => ({
//     headers: { Authorization: `Bearer ${getToken()}` }
// });

// // export const getAnalyticsSummary = async () => {
// //     const response = await axios.get(`${API_URL}/summary`, getAuthHeader());
// //     return response.data;
// // };

// // Inside your analyticsService.js file:
// export const getAnalyticsSummary = async (range = 30) => {
//     // Appends ?range=7, ?range=30, etc., to your endpoint route
//     const response = await axios.get(`/api/analytics?range=${range}`, {
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
//     });
//     return response.data;
// };
import axios from 'axios';
import { getToken } from './auth';
import config from '../config';

const API_URL = `${config.BACKEND_URL}/api/analytics`;

const getAuthHeader = () => ({
    headers: { Authorization: `Bearer ${getToken()}` }
});

// ===== FETCH ANALYTICS SUMMARY WITH FILTER =====
export const getAnalyticsSummary = async (range = 30) => {
    // Correctly targets http://localhost:5000/api/analytics/summary?range=X
    // and safely preserves your original getToken() authentication helper!
    const response = await axios.get(`${API_URL}/summary?range=${range}`, getAuthHeader());
    return response.data;
};