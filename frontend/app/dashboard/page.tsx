'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Package, RefreshCw, AlertTriangle, Heart, Star } from 'lucide-react';
import { transactionAPI, cartAPI, refundAPI, penaltyAPI, wishlistAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Penalty } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stats, setStats] = useState({
    transactionCount: 0,
    cartItemCount: 0,
    pendingRefunds: 0,
    wishlistCount: 0,
  });
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [transactions, cart, refunds, userPenalties, wishlist] = await Promise.all([
        transactionAPI.getMyTransactions(user.user_id),
        cartAPI.getCart(user.user_id),
        refundAPI.getMyRefunds(user.user_id),
        penaltyAPI.getMyPenalties().catch(() => []),
        wishlistAPI.getWishlist(user.user_id).catch(() => []),
      ]);

      const cartItemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
      const pendingRefunds = refunds.filter((r) => r.status === 'pending').length;

      setStats({
        transactionCount: transactions.length,
        cartItemCount,
        pendingRefunds,
        wishlistCount: wishlist.length,
      });

      // Filter to only active penalties
      const activePenalties = userPenalties.filter((p) => p.status === 'active');
      setPenalties(activePenalties);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Here's what's happening with your account</p>
        </div>

        {/* Penalties Alert (if any) */}
        {penalties.length > 0 && (
          <div className="mb-8 card bg-red-50 border-red-200">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 mb-2">⚠️ Active Penalties</h3>
                <p className="text-sm text-red-800 mb-4">
                  You have {penalties.length} active {penalties.length === 1 ? 'penalty' : 'penalties'} on your account:
                </p>
                <div className="space-y-3">
                  {penalties.map((penalty) => (
                    <div key={penalty.penalty_id} className="p-3 bg-red-100 rounded-lg">
                      <p className="font-medium text-red-900">{penalty.reason}</p>
                      <p className="text-xs text-red-700 mt-1">
                        Applied on: {new Date(penalty.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Browse Products */}
          <Link href="/products">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Package className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Browse Products</h2>
              </div>
              <p className="text-gray-600">
                Explore our catalog of products and find what you need.
              </p>
            </div>
          </Link>

          {/* Shopping Cart */}
          <Link href="/cart">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <ShoppingCart className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Shopping Cart</h2>
              </div>
              <p className="text-gray-600 mb-2">
                {stats.cartItemCount} {stats.cartItemCount === 1 ? 'item' : 'items'} in your cart
              </p>
              <p className="text-sm text-gray-500">Review and checkout your items.</p>
            </div>
          </Link>

          {/* Wishlist */}
          <Link href="/wishlist">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-pink-100 rounded-lg">
                  <Heart className="w-8 h-8 text-pink-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">My Wishlist</h2>
              </div>
              <p className="text-gray-600 mb-2">
                {stats.wishlistCount} {stats.wishlistCount === 1 ? 'item' : 'items'} saved
              </p>
              <p className="text-sm text-gray-500">View your saved products.</p>
            </div>
          </Link>

          {/* Order History */}
          <Link href="/transactions">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Package className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Order History</h2>
              </div>
              <p className="text-gray-600 mb-2">
                {stats.transactionCount} total {stats.transactionCount === 1 ? 'order' : 'orders'}
              </p>
              <p className="text-sm text-gray-500">Track your purchases and deliveries.</p>
            </div>
          </Link>

          {/* Refund Requests */}
          <Link href="/transactions">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <RefreshCw className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Refund Requests</h2>
              </div>
              <p className="text-gray-600 mb-2">
                {stats.pendingRefunds} pending {stats.pendingRefunds === 1 ? 'request' : 'requests'}
              </p>
              <p className="text-sm text-gray-500">Manage your refund requests.</p>
            </div>
          </Link>

          {/* Penalties */}
          <Link href="/dashboard/penalties">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Account Penalties</h2>
              </div>
              <p className="text-gray-600 mb-2">
                {penalties.length} active {penalties.length === 1 ? 'penalty' : 'penalties'}
              </p>
              <p className="text-sm text-gray-500">View and track penalties on your account.</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
