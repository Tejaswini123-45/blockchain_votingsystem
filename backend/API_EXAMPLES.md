# API Request/Response Examples

## Authentication API

### 1. Register Student

**Request:**
```http
POST /api/auth/register
Content-Type: application/json

{
  "studentId": "STU006",
  "name": "John Doe",
  "email": "john.doe@college.edu",
  "department": "CSE",
  "year": 2,
  "password": "password123"
}
```

**Success Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzEwMzE0MDAwLCJleHAiOjE3MTA5MTg4MDB9.abc123xyz",
  "student": {
    "id": "65f1234567890abcdef12345",
    "studentId": "STU006",
    "name": "John Doe",
    "email": "john.doe@college.edu",
    "department": "CSE",
    "year": 2,
    "role": "student",
    "hasVoted": false,
    "createdAt": "2024-03-13T10:00:00.000Z"
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Student with this email already exists",
  "field": "email"
}
```

**Validation Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Password must be at least 6 characters",
    "Year must be between 1 and 4"
  ]
}
```

---

### 2. Login Student

**Request (with email):**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john.doe@college.edu",
  "password": "password123"
}
```

**Request (with studentId):**
```http
POST /api/auth/login
Content-Type: application/json

{
  "studentId": "STU006",
  "password": "password123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1ZjEyMzQ1Njc4OTBhYmNkZWYxMjM0NSIsInJvbGUiOiJzdHVkZW50IiwiaWF0IjoxNzEwMzE0MDAwLCJleHAiOjE3MTA5MTg4MDB9.abc123xyz",
  "student": {
    "id": "65f1234567890abcdef12345",
    "studentId": "STU006",
    "name": "John Doe",
    "email": "john.doe@college.edu",
    "department": "CSE",
    "year": 2,
    "role": "student",
    "hasVoted": false,
    "createdAt": "2024-03-13T10:00:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

---

### 3. Get Current Student (Protected)

**Request:**
```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "student": {
    "id": "65f1234567890abcdef12345",
    "studentId": "STU006",
    "name": "John Doe",
    "email": "john.doe@college.edu",
    "department": "CSE",
    "year": 2,
    "role": "student",
    "hasVoted": false,
    "createdAt": "2024-03-13T10:00:00.000Z"
  }
}
```

**Error Response (401 Unauthorized - No Token):**
```json
{
  "success": false,
  "message": "Access denied. No token provided.",
  "code": "NO_TOKEN"
}
```

**Error Response (401 Unauthorized - Expired Token):**
```json
{
  "success": false,
  "message": "Token has expired. Please login again.",
  "code": "TOKEN_EXPIRED"
}
```

---

### 4. Logout Student (Protected)

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### 5. Update Password (Protected)

**Request:**
```http
PUT /api/auth/password
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newPassword456"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "student": {
    "id": "65f1234567890abcdef12345",
    "studentId": "STU006",
    "name": "John Doe",
    "email": "john.doe@college.edu",
    "department": "CSE",
    "year": 2,
    "role": "student",
    "hasVoted": false,
    "createdAt": "2024-03-13T10:00:00.000Z"
  }
}
```

**Error Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## Frontend Usage Example

### Using with Axios:

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Register
const register = async (studentData) => {
  const response = await api.post('/auth/register', studentData);
  localStorage.setItem('token', response.data.token);
  return response.data;
};

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  localStorage.setItem('token', response.data.token);
  return response.data;
};

// Get current user
const getMe = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Logout
const logout = () => {
  localStorage.removeItem('token');
};
```

---

## Error Codes Reference

| Code | Description |
|------|-------------|
| `NO_TOKEN` | No JWT token provided in request |
| `INVALID_TOKEN` | Token is malformed or invalid |
| `TOKEN_EXPIRED` | JWT token has expired |
| `ACCOUNT_DEACTIVATED` | Student account is deactivated |
| `NOT_AUTHENTICATED` | Not logged in |
| `FORBIDDEN` | Role not authorized for this resource |
| `ALREADY_VOTED` | Student has already cast a vote |
