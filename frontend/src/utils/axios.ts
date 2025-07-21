import axios from 'axios';

const API_URL = 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('vaanee_jwt');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear session and redirect to login
      localStorage.removeItem('vaanee_jwt');
      localStorage.removeItem('vaanee_user_name');
      localStorage.removeItem('vaanee_user_role');
      localStorage.removeItem('vaanee_first_login');
      
      window.location.href = '/auth?tab=signin';
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance; 