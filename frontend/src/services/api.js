import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Automatically inject Bearer access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('unisphere_access_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with concurrency-safe refresh token queue
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest?._retry) {
      // Avoid looping if login or refresh-token endpoint itself failed
      const isAuthEndpoint =
        originalRequest?.url?.includes('/auth/login') ||
        originalRequest?.url?.includes('/auth/refresh-token');

      if (isAuthEndpoint) {
        const errorData = error.response?.data?.error;
        const customError = new Error(errorData?.message || error.message || 'Authentication failed');
        customError.code = errorData?.code;
        customError.details = errorData?.details;
        return Promise.reject(customError);
      }

      const refreshToken = localStorage.getItem('unisphere_refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('unisphere_access_token');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }

      // If another refresh request is already underway, wait in the queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const newAccessToken = refreshResponse.data?.data?.accessToken;
        const newRefreshToken = refreshResponse.data?.data?.refreshToken;

        if (newAccessToken) {
          localStorage.setItem('unisphere_access_token', newAccessToken);
        }
        if (newRefreshToken) {
          localStorage.setItem('unisphere_refresh_token', newRefreshToken);
        }

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('unisphere_access_token');
        localStorage.removeItem('unisphere_refresh_token');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(new Error('Session expired. Please log in again.'));
      } finally {
        isRefreshing = false;
      }
    }

    // Preserve backend structured error codes and messages
    const errorData = error.response?.data?.error;
    const message = errorData?.message || error.response?.data?.message || error.message || 'Network request failed';
    const customError = new Error(message);
    customError.code = errorData?.code;
    customError.details = errorData?.details;
    customError.status = error.response?.status;
    return Promise.reject(customError);
  }
);

export default api;
