'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ShoppingCart, Heart, Star, ExternalLink } from 'lucide-react';
import { productAPI, reviewAPI, cartAPI, wishlistAPI, currencyAPI } from '@/lib/api';
import { Product, Review } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);

  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProductAndReviews();
  }, [productId, currency]);

  const fetchProductAndReviews = async () => {
    setLoading(true);
    try {
      let productData;
      
      // Fetch product with currency conversion if not INR
      if (currency !== 'INR') {
        const allProducts = await currencyAPI.getProductsInCurrency(currency);
        productData = allProducts.find((p: Product) => p.product_id === productId);
        if (!productData) {
          // Fallback to regular API if not found
          productData = await productAPI.getById(productId);
        }
      } else {
        productData = await productAPI.getById(productId);
      }
      
      const reviewsData = await reviewAPI.getReviews(productId);
      
      setProduct(productData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!user || !product) return;
    setAddingToCart(true);
    try {
      await cartAPI.addToCart(user.user_id, product.product_id, quantity);
      alert('Added to cart!');
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!user || !product) return;
    setAddingToWishlist(true);
    try {
      await wishlistAPI.addToWishlist(user.user_id, product.product_id);
      alert('Added to wishlist!');
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error: any) {
      console.error('Failed to add to wishlist:', error);
      alert(error.response?.data?.detail || 'Failed to add to wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product) return;
    setSubmittingReview(true);
    try {
      await reviewAPI.addReview(
        product.product_id, 
        user.user_id, 
        user.name,  // Send user_name
        reviewTitle, 
        reviewContent
      );
      alert('Review submitted!');
      setShowReviewForm(false);
      setReviewTitle('');
      setReviewContent('');
      fetchProductAndReviews(); // Refresh reviews
    } catch (error: any) {
      console.error('Failed to submit review:', error);
      alert(error.response?.data?.detail || 'Failed to submit review. You may need to purchase this product first.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Product not found</p>
          <button onClick={() => router.push('/products')} className="btn-primary">
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <button
          onClick={() => router.back()}
          className="text-primary-600 hover:text-primary-700 mb-4"
        >
          ← Back to Products
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Product Image */}
          <div className="bg-white rounded-lg p-8">
            <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {product.img_link ? (
                <img
                  src={product.img_link}
                  alt={product.product_name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
                  }}
                />
              ) : (
                <span className="text-gray-400">No Image Available</span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="bg-white rounded-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.product_name}</h1>

            {/* Category */}
            <p className="text-sm text-gray-500 mb-4">Category: {product.category}</p>

            {/* Rating */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-medium">{product.rating}</span>
              <span className="text-gray-500">({product.rating_count} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-bold text-gray-900">{currencySymbol}{product.discounted_price}</span>
              {product.discount_percentage > 0 && (
                <>
                  <span className="text-xl text-gray-500 line-through">{currencySymbol}{product.actual_price}</span>
                  <span className="text-lg font-semibold text-green-600">
                    {product.discount_percentage}% off
                  </span>
                </>
              )}
            </div>

            {/* About Product */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">About this product:</h3>
              <p className="text-gray-700">{product.about_product}</p>
            </div>

            {/* Product Link */}
            {product.product_link && (
              <a
                href={product.product_link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 flex items-center gap-1 mb-6"
              >
                View on external site <ExternalLink className="w-4 h-4" />
              </a>
            )}

            {user && (
              <>
                {/* Quantity Selector */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="input w-24"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4">
                  <button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {addingToCart ? 'Adding...' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={handleAddToWishlist}
                    disabled={addingToWishlist}
                    className="btn-secondary flex items-center justify-center gap-2 px-6"
                  >
                    <Heart className="w-5 h-5" />
                    {addingToWishlist ? 'Adding...' : 'Wishlist'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white rounded-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Customer Reviews</h2>
            {user && !showReviewForm && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn-primary"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review Form */}
          {showReviewForm && (
            <form onSubmit={handleSubmitReview} className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Write Your Review</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Review Title:</label>
                <input
                  type="text"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                  className="input"
                  placeholder="Summary of your review"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Review:</label>
                <textarea
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  required
                  rows={4}
                  className="input"
                  placeholder="Share your thoughts about this product..."
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={submittingReview} className="btn-primary">
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowReviewForm(false);
                    setReviewTitle('');
                    setReviewContent('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.review_id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="mb-2">
                    <p className="font-semibold text-gray-900">{review.user_name}</p>
                  </div>
                  <h4 className="font-semibold text-gray-900 mt-2">{review.review_title}</h4>
                  <p className="text-gray-700 mt-1">{review.review_content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
