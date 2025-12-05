// API client for backend communication
import axios from 'axios';
import type { User, Product, Cart, Transaction, Review, Refund, Penalty } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authAPI = {
  register: async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/register', { name, email, password });
    return response.data;
  },
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  getAllUsers: async () => {
    const response = await api.get('/auth/users');
    return response.data;
  },
  promoteToAdmin: async (user_id: string) => {
    const response = await api.post(`/auth/users/${user_id}/promote-admin`);
    return response.data;
  },
  setUserRole: async (user_id: string, role: 'admin' | 'customer') => {
    const response = await api.post(`/auth/users/${user_id}/role`, { role });
    return response.data;
  },
};

// Products
export const productAPI = {
  getAll: async (sort?: string): Promise<Product[]> => {
    const response = await api.get('/products/', { params: { sort } });
    return response.data;
  },
  search: async (keyword: string, sort?: string): Promise<Product[]> => {
    const response = await api.get(`/products/search/${keyword}`, { params: { sort } });
    return response.data;
  },
  getById: async (id: string): Promise<Product> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },
  createProduct: async (productData: Omit<Product, 'product_id'>) => {
    const response = await api.post('/products/', productData);
    return response.data;
  },
  updateProduct: async (product_id: string, productData: Partial<Product>) => {
    const response = await api.put(`/products/${product_id}`, productData);
    return response.data;
  },
  deleteProduct: async (product_id: string) => {
    const response = await api.delete(`/products/${product_id}`);
    return response.data;
  },
};

// Cart
export const cartAPI = {
  getCart: async (user_id: string): Promise<Cart> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.get('/cart/', { params: { user_token: token } });
    return response.data;
  },
  addToCart: async (user_id: string, product_id: string, quantity: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.post('/cart/add', { user_token: token, product_id, quantity });
    return response.data;
  },
  updateCart: async (user_id: string, product_id: string, quantity: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.put(`/cart/update/${product_id}`, { user_token: token, quantity });
    return response.data;
  },
  removeFromCart: async (user_id: string, product_id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.delete(`/cart/remove/${product_id}`, { params: { user_token: token } });
    return response.data;
  },
  checkout: async (user_id: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.post('/cart/checkout', null, { params: { user_token: token } });
    return response.data;
  },
};

// Transactions
export const transactionAPI = {
  getMyTransactions: async (user_id: string): Promise<Transaction[]> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.get('/transactions/', { params: { user_token: token } });
    return response.data;
  },
  getById: async (transaction_id: string): Promise<Transaction> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
    const response = await api.get(`/transactions/${transaction_id}`, { params: { user_token: token } });
    return response.data;
  },
};

// Refunds (uses Bearer token auth)
export const refundAPI = {
  createRefund: async (user_id: string, refundRequest: { transaction_id: string; message: string }): Promise<Refund> => {
    const response = await api.post('/refunds', refundRequest);
    return response.data.refund;
  },
  getMyRefunds: async (user_id: string): Promise<Refund[]> => {
    const response = await api.get('/refunds/my-requests');
    return response.data;
  },
  getAllRefunds: async (): Promise<Refund[]> => {
    const response = await api.get('/refunds/all');
    return response.data;
  },
  approveRefund: async (refund_id: string): Promise<Refund> => {
    const response = await api.put(`/refunds/${refund_id}/approve`);
    return response.data.refund;
  },
  denyRefund: async (refund_id: string): Promise<Refund> => {
    const response = await api.put(`/refunds/${refund_id}/deny`);
    return response.data.refund;
  },
};

// Wishlist
export const wishlistAPI = {
  getWishlist: async (user_id: string): Promise<string[]> => {
    const response = await api.get(`/wishlist/${user_id}`);
    return response.data;
  },
  addToWishlist: async (user_id: string, product_id: string) => {
    const response = await api.post('/wishlist/add', { user_id, product_id });
    return response.data;
  },
  removeFromWishlist: async (user_id: string, product_id: string) => {
    const response = await api.delete(`/wishlist/${user_id}/${product_id}`);
    return response.data;
  },
};

// Reviews
export const reviewAPI = {
  getReviews: async (product_id: string): Promise<Review[]> => {
    const response = await api.get(`/reviews/${product_id}`);
    return response.data;
  },
  addReview: async (product_id: string, user_id: string, user_name: string, review_title: string, review_content: string) => {
    const response = await api.post(`/reviews/${product_id}`, { 
      user_id, 
      user_name,
      review_title, 
      review_content
    });
    return response.data;
  },
  deleteReview: async (product_id: string, review_id: string) => {
    const response = await api.delete(`/reviews/${product_id}/${review_id}`);
    return response.data;
  },
};

// Admin - Penalties
export const penaltyAPI = {
  applyPenalty: async (user_id: string, reason: string): Promise<Penalty> => {
    const response = await api.post('/penalties/apply', { user_id, reason });
    return response.data.penalty;
  },
  getUserPenalties: async (user_id: string): Promise<Penalty[]> => {
    const response = await api.get(`/penalties/${user_id}`);
    return response.data;
  },
  getMyPenalties: async (): Promise<Penalty[]> => {
    const response = await api.get('/penalties/my-penalties');
    return response.data;
  },
  resolvePenalty: async (penalty_id: string) => {
    const response = await api.post(`/penalties/${penalty_id}/resolve`);
    return response.data;
  },
};

// Admin - Export
export const exportAPI = {
  getAvailableFiles: async (): Promise<{ available_files: string[] }> => {
    const response = await api.get('/export/available');
    return response.data;
  },
  exportFile: async (filename: string) => {
    // Extract file key from filename (e.g., "users.json" -> "users")
    const fileKey = filename.replace('.json', '');
    const response = await api.get(`/export?file=${fileKey}`);
    return response.data;
  },
};

// Admin - Metrics
export const metricsAPI = {
  getProductsByCategory: async () => {
    const response = await api.get('/admin/metrics/product/category');
    return response.data;
  },
  getProductCharts: async () => {
    const response = await api.get('/admin/metrics/product/charts');
    return response.data;
  },
  getAnomalies: async () => {
    const response = await api.get('/admin/metrics/anomalies');
    return response.data;
  },
  getUserMetrics: async () => {
    const response = await api.get('/admin/metrics/users');
    return response.data;
  },
};

// Currency
export const currencyAPI = {
  getProductsInCurrency: async (currency: string) => {
    const response = await api.get('/external/currency', { params: { to: currency } });
    return response.data;
  },
};

export default api;

