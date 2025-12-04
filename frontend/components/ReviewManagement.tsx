'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, Trash2, Search, Package } from 'lucide-react';
import { reviewsAPI, productsAPI } from '@/lib/api';
import type { Review, Product } from '@/types';

interface ReviewManagementProps {
  token: string;
}

export default function ReviewManagement({ token }: ReviewManagementProps) {
  const [reviews, setReviews] = useState<Array<Review & { product_id: string; product_name: string }>>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const productsData = await productsAPI.getAll();
      setProducts(productsData);

      // Fetch reviews for all products
      const allReviews: Array<Review & { product_id: string; product_name: string }> = [];
      
      for (const product of productsData) {
        try {
          const productReviews = await reviewsAPI.getByProduct(product.product_id);
          productReviews.forEach((review: Review) => {
            allReviews.push({
              ...review,
              product_id: product.product_id,
              product_name: product.product_name,
            });
          });
        } catch (error) {
          // Product has no reviews, skip
        }
      }

      setReviews(allReviews);
    } catch (error) {
      console.error('Failed to load reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (productId: string, reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    
    try {
      await reviewsAPI.delete(productId, reviewId, token);
      // Remove from local state
      setReviews(reviews.filter(r => !(r.product_id === productId && r.review_id === reviewId)));
    } catch (error) {
      alert('Failed to delete review');
      console.error('Failed to delete review:', error);
    }
  };

  // Filter reviews
  const filteredReviews = reviews.filter(review => {
    const matchesSearch = 
      review.review_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.review_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProduct = selectedProduct === 'all' || review.product_id === selectedProduct;
    
    return matchesSearch && matchesProduct;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-6 w-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Review Management</h2>
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
              {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search reviews by title, content, user, or product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Product Filter */}
          <div className="relative">
            <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white"
            >
              <option value="all">All Products</option>
              {products.map((product) => (
                <option key={product.product_id} value={product.product_id}>
                  {product.product_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {filteredReviews.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">
            {reviews.length === 0 ? 'No reviews found' : 'No reviews match your filters'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div key={`${review.product_id}-${review.review_id}`} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{review.review_title}</h3>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                      {review.product_name}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3 whitespace-pre-wrap">{review.review_content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="font-medium">By: {review.user_name}</span>
                    <span>•</span>
                    <span>Product ID: {review.product_id}</span>
                    <span>•</span>
                    <span>Review ID: {review.review_id}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteReview(review.product_id, review.review_id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete review"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

