import axios from 'axios';
import { storage } from '../utils';

const API_BASE_URL = 'https://dasteyaar.pk/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ Add auth token to every request
api.interceptors.request.use(
  async (config) => {
    const token = await storage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Handle token refresh logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If access token expired and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await storage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.data;
          await storage.setItem('accessToken', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest); // retry original request
        }
      } catch (refreshError) {
        // Token refresh failed — wipe tokens (force logout)
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
