'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { adminAPI, productsAPI, refundsAPI } from '@/lib/api';
import type { Product, Refund } from '@/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, Users, TrendingUp, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'refunds'>('overview');

  useEffect(() => {
    if (authLoading) {
      return; // Wait for auth to finish loading
    }
    if (!user) {
      router.push('/login');
      return;
    }
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    loadData();
  }, [user, isAdmin, authLoading]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [metricsData, productsData, refundsData] = await Promise.all([
        adminAPI.getMetrics(user.user_token).catch(() => null),
        productsAPI.getAll().catch(() => []),
        refundsAPI.getAll(user.user_token).catch(() => []),
      ]);
      setMetrics(metricsData);
      setProducts(productsData);
      setRefunds(refundsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!user || !confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(productId, user.user_token);
      loadData();
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    if (!user) return;
    try {
      await refundsAPI.approve(refundId, user.user_token);
      loadData();
    } catch (error) {
      alert('Failed to approve refund');
    }
  };

  const handleDenyRefund = async (refundId: string) => {
    if (!user) return;
    try {
      await refundsAPI.deny(refundId, user.user_token);
      loadData();
    } catch (error) {
      alert('Failed to deny refund');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        <div className="flex space-x-4 mb-8 border-b">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'overview'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'products'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Products
          </button>
          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-4 py-2 font-semibold ${
              activeTab === 'refunds'
                ? 'border-b-2 border-primary-600 text-primary-600'
                : 'text-gray-600'
            }`}
          >
            Refunds
          </button>
        </div>

        {activeTab === 'overview' && (
          <div>
            {metrics && (
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ₹{metrics.summary?.total_revenue?.toLocaleString() || 0}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Products</p>
                      <p className="text-2xl font-bold text-gray-900">{products.length}</p>
                    </div>
                    <Package className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.summary?.total_users || 0}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm">Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {metrics.summary?.total_transactions || 0}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-primary-600" />
                  </div>
                </div>
              </div>
            )}

            {metrics?.categories && (
              <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Category Breakdown</h2>
                <div className="space-y-4">
                  {Object.entries(metrics.categories).map(([category, data]: [string, any]) => (
                    <div key={category} className="border-b pb-4 last:border-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">{category}</h3>
                        <div className="text-right">
                          <p className="text-primary-600 font-bold">
                            ₹{data.revenue?.toLocaleString() || 0}
                          </p>
                          <p className="text-sm text-gray-600">{data.transaction_count || 0} transactions</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Products</h2>
              <Link
                href="/admin/products/new"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center space-x-2"
              >
                <Plus className="h-5 w-5" />
                <span>Add Product</span>
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {products.map((product) => (
                      <tr key={product.product_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{product.category}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">₹{((product.discounted_price || 0)).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            href={`/admin/products/${product.product_id}/edit`}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit className="h-5 w-5 inline" />
                          </Link>
                          <button
                            onClick={() => handleDeleteProduct(product.product_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-5 w-5 inline" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'refunds' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Refund Requests</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Transaction ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {refunds.map((refund) => (
                      <tr key={refund.refund_id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {refund.transaction_id.slice(0, 8)}...
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500">{refund.message}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              refund.status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : refund.status === 'denied'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {refund.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          {refund.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApproveRefund(refund.refund_id)}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Check className="h-5 w-5 inline" />
                              </button>
                              <button
                                onClick={() => handleDenyRefund(refund.refund_id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <X className="h-5 w-5 inline" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

