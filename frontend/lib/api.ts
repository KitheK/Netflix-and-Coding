import axios from 'axios';
import type { User, Product, Cart, Transaction, Review, Refund, Penalty, Metrics, CreateProductRequest, UpdateProductRequest } from '@/types';

// Use environment variable if set, otherwise default to localhost for client-side
// In Docker, NEXT_PUBLIC_API_URL will be set to http://backend:8000
// For local development, it will use http://localhost:8000
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout - Backend may be slow or unavailable');
    } else if (error.message === 'Network Error') {
      console.error('[API] Network Error - Backend is not reachable. Please ensure the backend is running on', API_BASE_URL);
    } else if (error.response) {
      console.error('[API] Response error:', error.response.status, error.response.data);
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getCurrentUser: async (token: string) => {
    const response = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getAll: async (sort?: string): Promise<Product[]> => {
    try {
      const response = await api.get('/products', { params: { sort } });
      return response.data;
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        throw new Error('Unable to connect to the server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
  },
  getById: async (productId: string): Promise<Product> => {
    try {
      const response = await api.get(`/products/${productId}`);
      return response.data;
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        throw new Error('Unable to connect to the server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
  },
  search: async (keyword: string, sort?: string): Promise<Product[]> => {
    const response = await api.get(`/products/search/${keyword}`, { params: { sort } });
    return response.data;
  },
  create: async (product: CreateProductRequest, token: string): Promise<Product> => {
    const response = await api.post('/products', product, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  update: async (productId: string, product: UpdateProductRequest, token: string): Promise<Product> => {
    const response = await api.put(`/products/${productId}`, product, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  delete: async (productId: string, token: string): Promise<Product> => {
    const response = await api.delete(`/products/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  fetchImage: async (productId: string, token: string): Promise<Product> => {
    const response = await api.get(`/products/${productId}/fetch-image`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// Cart API
export const cartAPI = {
  get: async (token: string): Promise<Cart> => {
    const response = await api.get('/cart', { params: { user_token: token } });
    return response.data;
  },
  add: async (productId: string, quantity: number, token: string) => {
    const response = await api.post('/cart/add', { user_token: token, product_id: productId, quantity });
    return response.data;
  },
  update: async (productId: string, quantity: number, token: string) => {
    const response = await api.put(`/cart/update/${productId}`, { user_token: token, quantity });
    return response.data;
  },
  remove: async (productId: string, token: string) => {
    const response = await api.delete(`/cart/remove/${productId}`, { params: { user_token: token } });
    return response.data;
  },
  checkout: async (token: string): Promise<Transaction> => {
    const response = await api.post('/cart/checkout', null, { params: { user_token: token } });
    return response.data;
  },
};

// Transactions API
export const transactionsAPI = {
  getAll: async (token: string): Promise<Transaction[]> => {
    const response = await api.get('/transactions', { params: { user_token: token } });
    return response.data;
  },
  getById: async (transactionId: string, token: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${transactionId}`, { params: { user_token: token } });
    return response.data;
  },
};

// Reviews API
export const reviewsAPI = {
  getByProduct: async (productId: string): Promise<Review[]> => {
    try {
      const response = await api.get(`/reviews/${productId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return [];
      }
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        console.warn('Unable to load reviews - backend may be unavailable');
        return []; // Return empty array instead of throwing for reviews
      }
      throw error;
    }
  },
  getAll: async (token: string): Promise<(Review & { product_id: string })[]> => {
    const response = await api.get('/reviews/admin/all', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  add: async (productId: string, userId: string, userName: string, reviewTitle: string, reviewContent: string) => {
    const response = await api.post(`/reviews/${productId}`, {
      user_id: userId,
      user_name: userName,
      review_title: reviewTitle,
      review_content: reviewContent
    });
    return response.data;
  },
  delete: async (productId: string, reviewId: string, token: string) => {
    const response = await api.delete(`/reviews/${productId}/${reviewId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
};

// Wishlist API
export const wishlistAPI = {
  get: async (userId: string): Promise<string[]> => {
    const response = await api.get(`/wishlist/${userId}`);
    return response.data;
  },
  add: async (productId: string, userId: string) => {
    const response = await api.post('/wishlist/add', { user_id: userId, product_id: productId });
    return response.data;
  },
  remove: async (productId: string, userId: string) => {
    const response = await api.delete(`/wishlist/${userId}/${productId}`);
    return response.data;
  },
};

// Refunds API
export const refundsAPI = {
  create: async (transactionId: string, reason: string, token: string): Promise<Refund> => {
    const response = await api.post('/refunds', { transaction_id: transactionId, message: reason }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.refund;
  },
  getMyRequests: async (token: string): Promise<Refund[]> => {
    const response = await api.get('/refunds/my-requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  getAll: async (token: string): Promise<Refund[]> => {
    const response = await api.get('/refunds/all', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  approve: async (refundId: string, token: string): Promise<Refund> => {
    const response = await api.put(`/refunds/${refundId}/approve`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.refund;
  },
  deny: async (refundId: string, token: string): Promise<Refund> => {
    const response = await api.put(`/refunds/${refundId}/deny`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.refund;
  },
};

// Admin API
export const adminAPI = {
  getMetrics: async (token: string) => {
    const response = await api.get('/admin/metrics/product/category', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  getChartData: async (token: string) => {
    const response = await api.get('/admin/metrics/product/charts', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  getAnomalies: async (token: string) => {
    const response = await api.get('/admin/metrics/anomalies', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  exportData: async (file: string, token: string) => {
    const response = await api.get(`/export?file=${file}`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: 'blob',
    });
    return response.data;
  },
  getPenalties: async (token: string): Promise<Penalty[]> => {
    const response = await api.get('/penalties', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  },
  applyPenalty: async (userId: string, reason: string, token: string): Promise<Penalty> => {
    const response = await api.post('/penalties/apply', { user_id: userId, reason }, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.penalty;
  },
};

// Currency API
export const currencyAPI = {
  convert: async (to: string): Promise<Product[]> => {
    try {
      const response = await api.get('/external/currency', { params: { to } });
      return response.data;
    } catch (error: any) {
      if (error.message === 'Network Error' || error.code === 'ECONNABORTED') {
        throw new Error('Unable to connect to the server. Please ensure the backend is running on http://localhost:8000');
      }
      throw error;
    }
  },
};

