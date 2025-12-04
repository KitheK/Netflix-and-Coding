'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { productsAPI, cartAPI, reviewsAPI, wishlistAPI, currencyAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Product, Review } from '@/types';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { Star, ShoppingCart, Heart, Plus, Minus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/currency';

export default function ProductDetailPage() {
  const params = useParams();
  const productId = params.id as string;
  const { user } = useAuth();
  const { currency, symbol } = useCurrency();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    loadProduct();
    loadReviews();
    if (user) {
      checkWishlist();
    }
  }, [productId, user, currency]);

  const loadProduct = async () => {
    try {
      let data: Product;
      if (currency === 'INR') {
        data = await productsAPI.getById(productId);
      } else {
        // Get converted products and find the one we need
        const converted = await currencyAPI.convert(currency);
        const found = converted.find(p => p.product_id === productId);
        data = found || await productsAPI.getById(productId);
      }
      setProduct(data);
    } catch (error: any) {
      console.error('Failed to load product:', error);
      if (error.message?.includes('Unable to connect')) {
        alert('Backend server is not running. Please start the backend server on http://localhost:8000');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReviews = async () => {
    try {
      const data = await reviewsAPI.getByProduct(productId);
      setReviews(data);
    } catch (error: any) {
      console.error('Failed to load reviews:', error);
      // Reviews are optional, so we don't show an alert for network errors
    }
  };

  const checkWishlist = async () => {
    try {
      const wishlist = await wishlistAPI.get(user!.user_id);
      setInWishlist(wishlist.includes(productId));
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      await cartAPI.add(productId, quantity, user.user_token);
      alert('Added to cart!');
    } catch (error) {
      alert('Failed to add to cart');
    }
  };

  const toggleWishlist = async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    try {
      if (inWishlist) {
        await wishlistAPI.remove(productId, user.user_id);
      } else {
        await wishlistAPI.add(productId, user.user_id);
      }
      setInWishlist(!inWishlist);
    } catch (error) {
      console.error('Failed to update wishlist:', error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      await reviewsAPI.add(productId, user.user_id, user.name, reviewTitle, reviewContent);
      setReviewTitle('');
      setReviewContent('');
      setShowReviewForm(false);
      loadReviews();
    } catch (error: any) {
      alert(error.response?.data?.detail || 'Failed to submit review. Make sure you have purchased this product.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Product not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-8">
            <div className="relative h-96 bg-gray-100 rounded-lg">
              {product.img_link ? (
                <Image
                  src={product.img_link}
                  alt={product.product_name}
                  fill
                  className="object-contain"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.product_name}</h1>
              <div className="flex items-center mb-4">
                <div className="flex items-center">
                  <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  <span className="ml-2 text-lg">{product.rating}</span>
                  <span className="ml-2 text-gray-600">({product.rating_count} reviews)</span>
                </div>
              </div>
              <div className="mb-6">
                <div className="flex items-center space-x-4">
                  <span className="text-4xl font-bold text-primary-600">
                    {formatPrice(product.discounted_price || 0, symbol)}
                  </span>
                  {product.discount_percentage > 0 && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        {formatPrice(product.actual_price || 0, symbol)}
                      </span>
                      <span className="text-lg text-green-600 font-semibold">
                        {product.discount_percentage}% off
                      </span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mb-6">{product.about_product}</p>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-lg font-semibold">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 border rounded-lg hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition flex items-center justify-center space-x-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Add to Cart</span>
                </button>
                <button
                  onClick={toggleWishlist}
                  className={`p-3 rounded-lg border-2 transition ${
                    inWishlist
                      ? 'border-red-500 text-red-500'
                      : 'border-gray-300 text-gray-600 hover:border-red-500'
                  }`}
                >
                  <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Reviews</h2>
          {user && !showReviewForm && (
            <button
              onClick={() => setShowReviewForm(true)}
              className="mb-6 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Write a Review
            </button>
          )}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-6 p-4 border rounded-lg">
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Review Title</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter a title for your review"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Review Content</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={4}
                  placeholder="Write your review here..."
                  required
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewTitle('');
                    setReviewContent('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-gray-500">No reviews yet</p>
            ) : (
              reviews.map((review) => (
                <div key={review.review_id} className="border-b pb-4">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold text-gray-900">{review.review_title}</h4>
                    <span className="ml-2 text-sm text-gray-600">by {review.user_name}</span>
                  </div>
                  <p className="text-gray-700">{review.review_content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

