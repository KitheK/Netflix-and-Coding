'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { transactionsAPI, refundsAPI } from '@/lib/api';
import type { Transaction, Refund } from '@/types';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { Package, DollarSign, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role === 'admin') {
      router.push('/admin');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [txns, refs] = await Promise.all([
        transactionsAPI.getAll(user.user_token),
        refundsAPI.getMyRequests(user.user_token).catch(() => []),
      ]);
      setTransactions(txns);
      setRefunds(refs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Dashboard</h1>
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
              </div>
              <Package className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{transactions.reduce((sum, t) => sum + (t.total_price || 0), 0).toLocaleString()}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Refund Requests</p>
                <p className="text-2xl font-bold text-gray-900">{refunds.length}</p>
              </div>
              <FileText className="h-8 w-8 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No orders yet</p>
          ) : (
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.transaction_id}
                  className="border-b pb-4 last:border-0 cursor-pointer hover:bg-gray-50 p-4 rounded-lg"
                  onClick={() => router.push(`/transactions/${transaction.transaction_id}`)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Order #{transaction.transaction_id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary-600">
                        ₹{((transaction.total_price || 0)).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">{transaction.items.length} items</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {refunds.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Refund Requests</h2>
            <div className="space-y-4">
              {refunds.map((refund) => (
                <div key={refund.refund_id} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Transaction #{refund.transaction_id.slice(0, 8)}
                      </p>
                      <p className="text-sm text-gray-600">{refund.message}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        refund.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : refund.status === 'denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {refund.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

