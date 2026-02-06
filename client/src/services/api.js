import axios from 'axios';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Add token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Auth API
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);

// User API
export const getCurrentUser = () => API.get('/users/me');

// Candidate API
export const getCandidates = () => API.get('/candidates');
export const getCandidate = (id) => API.get(`/candidates/${id}`);

// Vote API
export const castVote = (voteData) => API.post('/votes', voteData);
export const getResults = () => API.get('/votes/results');

export default API;
