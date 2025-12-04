'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { transactionsAPI, refundsAPI, productsAPI } from '@/lib/api';
import type { Transaction, Product } from '@/types';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { ArrowLeft, FileText } from 'lucide-react';

export default function TransactionDetailPage() {
  const params = useParams();
  const transactionId = params.id as string;
  const { user } = useAuth();
  const router = useRouter();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [refundReason, setRefundReason] = useState('');
  const [showRefundForm, setShowRefundForm] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadTransaction();
  }, [transactionId, user]);

  const loadTransaction = async () => {
    if (!user) return;
    try {
      const txn = await transactionsAPI.getById(transactionId, user.user_token);
      setTransaction(txn);
      const productIds = txn.items.map((item) => item.product_id);
      const productPromises = productIds.map((id) => productsAPI.getById(id));
      const productData = await Promise.all(productPromises);
      const productMap: Record<string, Product> = {};
      productData.forEach((p) => {
        productMap[p.product_id] = p;
      });
      setProducts(productMap);
    } catch (error) {
      console.error('Failed to load transaction:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefundRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !refundReason.trim()) return;
    try {
      await refundsAPI.create(transactionId, refundReason, user.user_token);
      alert('Refund request submitted successfully');
      setShowRefundForm(false);
      setRefundReason('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || 'Failed to submit refund request';
      alert(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
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

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p>Transaction not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600 mt-2">
                Order #{transaction.transaction_id.slice(0, 8)} •{' '}
                {new Date(transaction.timestamp).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary-600">
                ₹{((transaction.total_price || 0)).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Items</h2>
            <div className="space-y-4">
              {transaction.items.map((item) => {
                const product = products[item.product_id];
                if (!product) return null;
                return (
                  <div key={item.product_id} className="flex gap-4 border-b pb-4 last:border-0">
                    <div className="relative w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0">
                      {product.img_link ? (
                        <Image
                          src={product.img_link}
                          alt={product.product_name}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.product_name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-primary-600 font-bold mt-2">
                        ₹{(((product.discounted_price || 0) * item.quantity)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {transaction.receipt && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <FileText className="h-5 w-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Receipt</h3>
              </div>
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">{transaction.receipt}</pre>
            </div>
          )}

          {!showRefundForm && (
            <div className="mt-6">
              <button
                onClick={() => setShowRefundForm(true)}
                className="px-6 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition"
              >
                Request Refund
              </button>
            </div>
          )}

          {showRefundForm && (
            <form onSubmit={handleRefundRequest} className="mt-6 p-4 border rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-4">Refund Request</h3>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Please provide a reason for the refund..."
                className="w-full px-3 py-2 border rounded-lg mb-4"
                rows={4}
                required
              />
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Submit Request
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundForm(false);
                    setRefundReason('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

