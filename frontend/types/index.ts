// Type definitions for the application

export interface User {
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  user_token: string;
  role: 'customer' | 'admin';
}

export interface Product {
  product_id: string;
  product_name: string;
  category: string;
  discounted_price: number;
  actual_price: number;
  discount_percentage: number;
  about_product: string;
  img_link: string;
  product_link: string;
  rating: number;
  rating_count: number;
}

export interface CartItem {
  product_id: string;
  product_name: string;
  img_link: string;
  product_link: string;
  discounted_price: number;
  quantity: number;
}

export interface Cart {
  user_id: string;
  items: CartItem[];
  total_price: number;
}

export interface TransactionItem {
  product_id: string;
  product_name: string;
  img_link: string;
  product_link: string;
  discounted_price: number;
  quantity: number;
}

export interface Transaction {
  transaction_id: string;
  user_id: string;
  customer_name: string;
  customer_email: string;
  items: TransactionItem[];
  total_price: number;
  timestamp: string;
  estimated_delivery: string;
  status: string;
}

export interface Review {
  review_id: string;
  user_id: string;
  user_name: string;
  review_title: string;
  review_content: string;
}

export interface Refund {
  refund_id: string;
  transaction_id: string;
  user_id: string;
  message: string;
  status: 'pending' | 'approved' | 'denied';
  created_at: string;
  updated_at: string | null;
}

export interface Penalty {
  penalty_id: string;
  user_id: string;
  reason: string;
  timestamp: string;
  status: string;
}

