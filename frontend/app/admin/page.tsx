'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, TrendingUp, Download, AlertTriangle, UserPlus, Package, BarChart3, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      }
    }
  }, [user, isAdmin, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your e-commerce platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* My Orders */}
          <Link href="/transactions">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <Package className="w-8 h-8 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
              </div>
              <p className="text-gray-600">
                View your personal purchase history and order status as an admin user.
              </p>
            </div>
          </Link>

          {/* Manage Refunds */}
          <Link href="/admin/refunds">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Manage Refunds</h2>
              </div>
              <p className="text-gray-600">
                Review and process customer refund requests. Approve or deny refunds based on policies.
              </p>
            </div>
          </Link>

          {/* Manage Products */}
          <Link href="/admin/products">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-teal-100 rounded-lg">
                  <Package className="w-8 h-8 text-teal-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Manage Products</h2>
              </div>
              <p className="text-gray-600">
                Add new products, update existing listings, or remove products from the catalog.
              </p>
            </div>
          </Link>

          {/* View Metrics */}
          <Link href="/admin/metrics">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">View Metrics</h2>
              </div>
              <p className="text-gray-600">
                Analyze sales data, product performance, and customer behavior with detailed charts and reports.
              </p>
            </div>
          </Link>

          {/* Export Data */}
          <Link href="/admin/export">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Download className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Export Data</h2>
              </div>
              <p className="text-gray-600">
                Download system data including users, products, transactions, and more in JSON format.
              </p>
            </div>
          </Link>

          {/* Apply Penalties */}
          <Link href="/admin/penalties">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-red-100 rounded-lg">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Apply Penalties</h2>
              </div>
              <p className="text-gray-600">
                Manage user penalties for policy violations. Apply fines or sanctions as needed.
              </p>
            </div>
          </Link>

          {/* Promote Users */}
          <Link href="/admin/promote">
            <div className="card hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <UserPlus className="w-8 h-8 text-yellow-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Promote Users</h2>
              </div>
              <p className="text-gray-600">
                Upgrade customer accounts to admin status. Grant administrative privileges to trusted users.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
