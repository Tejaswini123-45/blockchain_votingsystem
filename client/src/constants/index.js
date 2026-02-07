// Application Constants

export const DEPARTMENTS = [
    'CSE',
    'IT',
    'ECE',
    'EEE',
    'MECH',
    'CIVIL',
    'AIDS',
    'AIML',
    'CSM'
];

export const YEARS = [
    '1',
    '2',
    '3',
    '4'
];

export const POSITIONS = [
    'Student President',
    'Vice President',
    'General Secretary',
    'Cultural Secretary',
    'Sports Secretary',
    'Technical Secretary'
];

export const ELECTION_CONFIG = {
    name: 'Campus Elections 2026',
    startDate: '2026-02-01',
    endDate: '2026-02-10',
    resultsDate: '2026-02-11'
};

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        LOGOUT: '/auth/logout'
    },
    USERS: {
        ME: '/users/me',
        ALL: '/users'
    },
    CANDIDATES: {
        ALL: '/candidates',
        SINGLE: (id) => `/candidates/${id}`
    },
    VOTES: {
        CAST: '/votes',
        RESULTS: '/votes/results'
    }
};
