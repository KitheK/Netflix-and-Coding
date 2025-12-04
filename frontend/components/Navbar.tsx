'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { ShoppingCart, User, LogOut, Search, Heart } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { currency, setCurrency, symbol } = useCurrency();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2 group">
            <span className="text-2xl font-bold text-primary-600">
              flores
            </span>
          </Link>

          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..."
                className="w-full px-4 py-2.5 pl-11 pr-4 text-gray-700 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-5 w-5 text-gray-400" />
            </div>
          </form>

          <div className="flex items-center space-x-3">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'INR' | 'USD' | 'CAD' | 'EUR')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              title="Select Currency"
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
              <option value="CAD">C$ CAD</option>
              <option value="EUR">€ EUR</option>
            </select>
            {user ? (
              <>
                <Link
                  href="/wishlist"
                  className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all relative"
                  title="Wishlist"
                >
                  <Heart className="h-5 w-5" />
                </Link>
                <Link
                  href="/cart"
                  className="p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all relative"
                  title="Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                </Link>
                <Link
                  href={isAdmin ? '/admin' : '/dashboard'}
                  className="p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-all"
                  title="Account"
                >
                  <User className="h-5 w-5" />
                </Link>
                <button
                  onClick={logout}
                  className="p-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-700 hover:text-primary-600 font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-sm hover:shadow-md font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

