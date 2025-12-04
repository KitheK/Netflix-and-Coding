'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Edit, Trash2, Package, MessageSquare, X } from 'lucide-react';
import { productAPI, reviewAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Product, Review } from '@/types';

type FormMode = 'add' | 'edit' | null;

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewProduct, setReviewProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    product_id: '',
    product_name: '',
    category: '',
    discounted_price: 0,
    actual_price: 0,
    discount_percentage: 0,
    rating: 0,
    rating_count: 0,
    about_product: '',
    img_link: '',
    product_link: '',
  });

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        fetchProducts();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, loading]);

  const fetchProducts = async () => {
    setLoadingData(true);
    try {
      const data = await productAPI.getAll();
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormMode('add');
    setSelectedProduct(null);
    setFormData({
      product_id: '',
      product_name: '',
      category: '',
      discounted_price: 0,
      actual_price: 0,
      discount_percentage: 0,
      rating: 0,
      rating_count: 0,
      about_product: '',
      img_link: '',
      product_link: '',
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setFormMode('edit');
    setSelectedProduct(product);
    setFormData({
      product_id: product.product_id,
      product_name: product.product_name,
      category: product.category,
      discounted_price: product.discounted_price,
      actual_price: product.actual_price,
      discount_percentage: product.discount_percentage,
      rating: product.rating,
      rating_count: product.rating_count,
      about_product: product.about_product,
      img_link: product.img_link,
      product_link: product.product_link,
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormMode(null);
    setSelectedProduct(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (formMode === 'add') {
        await productAPI.createProduct(formData);
        alert('Product added successfully!');
      } else if (formMode === 'edit' && selectedProduct) {
        await productAPI.updateProduct(selectedProduct.product_id, formData);
        alert('Product updated successfully!');
      }
      handleCloseModal();
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to save product:', error);
      alert(error.response?.data?.detail || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.product_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await productAPI.deleteProduct(product.product_id);
      alert('Product deleted successfully!');
      fetchProducts();
    } catch (error: any) {
      console.error('Failed to delete product:', error);
      alert(error.response?.data?.detail || 'Failed to delete product');
    }
  };

  // Review management functions
  const handleOpenReviewModal = async (product: Product) => {
    setReviewProduct(product);
    setShowReviewModal(true);
    setLoadingReviews(true);
    try {
      const reviewData = await reviewAPI.getReviews(product.product_id);
      setReviews(reviewData);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!reviewProduct) return;
    
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      await reviewAPI.deleteReview(reviewProduct.product_id, reviewId);
      alert('Review deleted successfully!');
      // Refresh reviews
      const reviewData = await reviewAPI.getReviews(reviewProduct.product_id);
      setReviews(reviewData);
    } catch (error: any) {
      console.error('Failed to delete review:', error);
      alert(error.response?.data?.detail || 'Failed to delete review');
    }
  };

  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setReviewProduct(null);
    setReviews([]);
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading products...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Products</h1>
            <p className="text-gray-600">Add, edit, or delete products from your catalog</p>
          </div>
          <button onClick={handleOpenAddModal} className="btn-primary flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-2 text-gray-700">
            <Package className="w-5 h-5" />
            <span className="font-medium">{products.length} total products</span>
          </div>
        </div>

        {/* Products Table */}
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.product_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <img
                        src={product.img_link || 'https://via.placeholder.com/50'}
                        alt={product.product_name}
                        className="w-12 h-12 object-contain rounded mr-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/50';
                        }}
                      />
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                        <div className="text-xs text-gray-500">{product.product_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {product.category.split('|').slice(-1)[0]}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">₹{product.discounted_price}</div>
                    <div className="text-xs text-gray-500 line-through">₹{product.actual_price}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    ⭐ {product.rating} ({product.rating_count})
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleOpenReviewModal(product)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Manage Reviews"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Product"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-8">
            <div className="bg-white rounded-lg max-w-7xl w-full max-h-[85vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">
                  {formMode === 'add' ? 'Add New Product' : 'Edit Product'}
                </h2>
              </div>
              <div className="overflow-y-auto flex-1 p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-4">
                    {formMode === 'add' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Product ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.product_id}
                          onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
                          className="input"
                          placeholder="e.g., B098NS6PVG"
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.product_name}
                        onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category * (pipe-separated)
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input"
                        placeholder="e.g., Electronics|Computers|Accessories"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Actual Price *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.actual_price}
                          onChange={(e) => setFormData({ ...formData, actual_price: parseFloat(e.target.value) })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Discounted Price *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={formData.discounted_price}
                          onChange={(e) => setFormData({ ...formData, discounted_price: parseFloat(e.target.value) })}
                          className="input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Discount Percentage *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => setFormData({ ...formData, discount_percentage: parseFloat(e.target.value) })}
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          max="5"
                          step="0.1"
                          value={formData.rating}
                          onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) })}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rating Count *
                        </label>
                        <input
                          type="number"
                          required
                          min="0"
                          value={formData.rating_count}
                          onChange={(e) => setFormData({ ...formData, rating_count: parseInt(e.target.value) })}
                          className="input"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        About Product *
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={formData.about_product}
                        onChange={(e) => setFormData({ ...formData, about_product: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Image Link *
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.img_link}
                        onChange={(e) => setFormData({ ...formData, img_link: e.target.value })}
                        className="input"
                        placeholder="https://..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Link *
                      </label>
                      <input
                        type="url"
                        required
                        value={formData.product_link}
                        onChange={(e) => setFormData({ ...formData, product_link: e.target.value })}
                        className="input"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Saving...' : formMode === 'add' ? 'Add Product' : 'Update Product'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              </div>
            </div>
          </div>
        )}

        {/* Review Management Modal */}
        {showReviewModal && reviewProduct && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-3xl w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Manage Reviews</h2>
                  <p className="text-sm text-gray-600 mt-1">{reviewProduct.product_name}</p>
                </div>
                <button
                  onClick={handleCloseReviewModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loadingReviews ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No reviews yet for this product</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.review_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.review_title}</h3>
                          <p className="text-sm text-gray-600">by {review.user_name}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteReview(review.review_id)}
                          className="text-red-600 hover:text-red-900 flex items-center gap-1 text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                      <p className="text-gray-700 mt-2">{review.review_content}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleCloseReviewModal}
                  className="btn-secondary w-full"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
