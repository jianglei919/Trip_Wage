import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5050/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth services
export const authService = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  getProfile: () => api.get('/users/profile')
};

// Order services
export const orderService = {
  getOrders: () => api.get('/orders'),
  getOrdersByDate: (date) => api.get(`/orders/date/${date}`),
  getOrdersByDateRange: (startDate, endDate) => api.get(`/orders/range?startDate=${startDate}&endDate=${endDate}`),
  getOrder: (id) => api.get(`/orders/${id}`),
  createOrder: (orderData) => api.post('/orders', orderData),
  updateOrder: (id, orderData) => api.put(`/orders/${id}`, orderData),
  deleteOrder: (id) => api.delete(`/orders/${id}`),
  getDailyStats: (date) => api.get(`/orders/stats/${date}`),
  saveWorkTime: (data) => api.post('/orders/worktime', data),
  getWorkTime: (date) => api.get(`/orders/worktime/${date}`),
  getHistoricalStats: (startDate, endDate) => api.get(`/orders/historical-stats?startDate=${startDate}&endDate=${endDate}`)
};

export default api;
