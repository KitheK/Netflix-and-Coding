'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Heart, Search, User, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cartAPI, wishlistAPI } from '@/lib/api';

const Navbar = () => {
  const router = useRouter();
  const { user, isAdmin, logout } = useAuth();
  const { currency, setCurrency } = useCurrency();
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const fetchCartCount = async () => {
      if (user) {
        try {
          const cart = await cartAPI.getCart(user.user_id);
          const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
          setCartCount(count);
        } catch (error) {
          console.error('Failed to fetch cart:', error);
        }
      }
    };
    
    const fetchWishlistCount = async () => {
      if (user) {
        try {
          const wishlist = await wishlistAPI.getWishlist(user.user_id);
          setWishlistCount(wishlist.length);
        } catch (error) {
          console.error('Failed to fetch wishlist:', error);
        }
      }
    };
    
    fetchCartCount();
    fetchWishlistCount();

    // Listen for cart and wishlist updates
    const handleCartUpdate = () => fetchCartCount();
    const handleWishlistUpdate = () => fetchWishlistCount();
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [user]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand */}
          <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors flex items-center gap-2">
            <ShoppingCart className="w-7 h-7" />
            <span>Web Shopping Service</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands, and more..."
                className="w-full pl-4 pr-12 py-2.5 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              />
              <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-md transition-colors">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </form>

          {/* Right Side Icons & Actions */}
          <div className="flex items-center gap-6">
            {/* Currency Selector */}
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="px-3 py-1.5 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all bg-white text-sm font-medium"
              title="Select Currency"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="CAD">C$ CAD</option>
              <option value="EUR">€ EUR</option>
              <option value="GBP">£ GBP</option>
            </select>

            {user ? (
              <>
                {/* Wishlist */}
                <Link href="/wishlist" className="relative hover:text-primary-600 transition-colors p-2" title="Wishlist">
                  <Heart className="w-6 h-6" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                {/* Cart */}
                <Link href="/cart" className="relative hover:text-primary-600 transition-colors p-2" title="Shopping Cart">
                  <ShoppingCart className="w-6 h-6" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg">
                      {cartCount}
                    </span>
                  )}
                </Link>

                {/* Profile Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors"
                  >
                    <div className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-700">{user.name}</span>
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <Link
                        href={isAdmin ? "/admin" : "/dashboard"}
                        className="block px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition-colors"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        {isAdmin ? "Admin Dashboard" : "My Dashboard"}
                      </Link>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex items-center gap-2 text-red-600 border-t border-gray-100 mt-1"
                      >
                        <LogOut className="w-4 h-4" />
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="px-6 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors">
                  Login
                </Link>
                <Link href="/register" className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors shadow-sm">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

