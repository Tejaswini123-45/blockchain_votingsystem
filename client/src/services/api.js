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

// Handle response errors globally
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// =============================================================================
// AUTH API
// =============================================================================
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const getCurrentUser = () => API.get('/auth/me');
export const updatePassword = (data) => API.put('/auth/password', data);

// OTP API
export const sendOTP = (data) => API.post('/auth/otp/send', data);
export const verifyOTP = (data) => API.post('/auth/otp/verify', data);
export const resendOTP = (data) => API.post('/auth/otp/resend', data);

// =============================================================================
// KYC API
// =============================================================================
export const uploadIdCard = (formData) => API.post('/kyc/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
});
export const getKYCStatus = () => API.get('/kyc/status');

// =============================================================================
// CANDIDATE API
// =============================================================================
export const getCandidates = (position) => {
    const params = position ? { position } : {};
    return API.get('/candidates', { params });
};
export const getCandidate = (id) => API.get(`/candidates/${id}`);
export const getPositions = () => API.get('/candidates/positions');

// =============================================================================
// VOTE API
// =============================================================================
export const castVote = (data) => API.post('/votes', data);
export const getMyVotes = () => API.get('/votes/my-votes');
export const getVotingStatus = () => API.get('/votes/status');
export const getResults = () => API.get('/votes/results');

// =============================================================================
// BLOCKCHAIN API
// =============================================================================
export const getVotingToken = () => API.get('/blockchain/token');
export const issueVotingToken = (userId) => API.post('/blockchain/token/issue', { userId });

// =============================================================================
// ADMIN API
// =============================================================================
export const getAdminStats = () => API.get('/votes/admin/stats');
export const getAllUsers = (role) => API.get('/auth/admin/users', { params: { role } });
export const getPendingKYC = () => API.get('/kyc/pending');
export const approveKYC = (userId) => API.post(`/kyc/approve/${userId}`);
export const rejectKYC = (userId, reason) => API.post(`/kyc/reject/${userId}`, { reason });

export default API;
