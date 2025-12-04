'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { Product } from '@/types';
import { cartAPI, wishlistAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface ProductCardProps {
  product: Product;
  onWishlistChange?: () => void;
}

const ProductCard = ({ product, onWishlistChange }: ProductCardProps) => {
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [addingToWishlist, setAddingToWishlist] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    checkWishlistStatus();
  }, [user, product.product_id]);

  const checkWishlistStatus = async () => {
    if (!user) return;
    try {
      const wishlist = await wishlistAPI.getWishlist(user.user_id);
      setIsInWishlist(wishlist.includes(product.product_id));
    } catch (error) {
      console.error('Failed to check wishlist:', error);
    }
  };

  // Get currency symbol from product or default to ₹
  const getCurrencySymbol = () => {
    if ((product as any).currency) {
      const symbols: { [key: string]: string } = {
        'INR': '₹',
        'USD': '$',
        'CAD': 'C$',
        'EUR': '€',
        'GBP': '£',
      };
      return symbols[(product as any).currency] || (product as any).currency;
    }
    return '₹'; // Default to INR
  };

  const currencySymbol = getCurrencySymbol();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!user) return;

    setAdding(true);
    try {
      await cartAPI.addToCart(user.user_id, product.product_id, 1);
      // Trigger a custom event to update navbar cart count
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (error) {
      console.error('Failed to add to cart:', error);
      alert('Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation
    if (!user) return;

    setAddingToWishlist(true);
    try {
      if (isInWishlist) {
        await wishlistAPI.removeFromWishlist(user.user_id, product.product_id);
      } else {
        await wishlistAPI.addToWishlist(user.user_id, product.product_id);
      }
      setIsInWishlist(!isInWishlist);
      // Trigger a custom event to update navbar wishlist count
      window.dispatchEvent(new Event('wishlistUpdated'));
      if (onWishlistChange) onWishlistChange();
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      alert('Failed to update wishlist');
    } finally {
      setAddingToWishlist(false);
    }
  };

  return (
    <Link href={`/products/${product.product_id}`}>
      <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full flex flex-col">
        {/* Product Image */}
        <div className="relative w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
          {/* Wishlist Button */}
          {user && (
            <button
              onClick={handleToggleWishlist}
              disabled={addingToWishlist}
              className={`absolute top-2 right-2 p-2 rounded-full shadow-md transition-all z-10 ${
                isInWishlist 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
              title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
            </button>
          )}
          
          {product.img_link ? (
            <img
              src={product.img_link}
              alt={product.product_name}
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/200?text=No+Image';
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
            {product.product_name}
          </h3>

          {/* Rating */}
          <div className="flex items-center gap-1 mb-2">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-gray-500">({product.rating_count})</span>
          </div>

          {/* Price */}
          <div className="mt-auto">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl font-bold text-gray-900">
                {currencySymbol}{product.discounted_price}
              </span>
              {product.discount_percentage > 0 && (
                <>
                  <span className="text-sm text-gray-500 line-through">
                    {currencySymbol}{product.actual_price}
                  </span>
                  <span className="text-sm font-medium text-green-600">
                    {product.discount_percentage}% off
                  </span>
                </>
              )}
            </div>

            {/* Add to Cart Button */}
            {user && (
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="btn-primary w-full text-sm flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
