'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trash2, ShoppingCart } from 'lucide-react';
import { wishlistAPI, cartAPI, productAPI } from '@/lib/api';
import { Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchWishlist();
  }, [user]);

  const fetchWishlist = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const wishlistData = await wishlistAPI.getWishlist(user.user_id);
      // Fetch full product details for each wishlist item
      const productPromises = wishlistData.map((id: string) =>
        productAPI.getById(id)
      );
      const productsData = await Promise.all(productPromises);
      setProducts(productsData);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: string) => {
    if (!user) return;
    try {
      await wishlistAPI.removeFromWishlist(user.user_id, productId);
      window.dispatchEvent(new Event('wishlistUpdated'));
      fetchWishlist(); // Refresh
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      alert('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!user) return;
    try {
      await cartAPI.addToCart(user.user_id, productId, 1);
      window.dispatchEvent(new Event('cartUpdated'));
      alert('Added to cart!');
      // Don't reload - just show success message
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading wishlist...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wishlist</h1>

        {products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Your wishlist is empty</p>
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-6">{products.length} items in your wishlist</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <div key={product.product_id} className="card hover:shadow-lg transition-shadow">
                  {/* Product Image */}
                  <Link href={`/products/${product.product_id}`}>
                    <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                      {product.img_link ? (
                        <img
                          src={product.img_link}
                          alt={product.product_name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://via.placeholder.com/200?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="p-4">
                    <Link href={`/products/${product.product_id}`}>
                      <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 hover:text-primary-600">
                        {product.product_name}
                      </h3>
                    </Link>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl font-bold text-gray-900">
                        ${product.discounted_price}
                      </span>
                      {product.discount_percentage > 0 && (
                        <span className="text-sm font-medium text-green-600">
                          {product.discount_percentage}% off
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product.product_id)}
                        className="btn-primary flex-1 text-sm flex items-center justify-center gap-1"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(product.product_id)}
                        className="btn-secondary px-3"
                        title="Remove from wishlist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
