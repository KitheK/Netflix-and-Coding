'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { transactionAPI, refundAPI } from '@/lib/api';
import { Transaction, Refund } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency, formatPrice, convertPrice } from '@/contexts/CurrencyContext';

export default function TransactionsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currency, exchangeRate } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);

  // Refund modal state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [refundMessage, setRefundMessage] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [transactionsData, refundsData] = await Promise.all([
        transactionAPI.getMyTransactions(user.user_id),
        refundAPI.getMyRefunds(user.user_id),
      ]);
      setTransactions(transactionsData);
      setRefunds(refundsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRefundForTransaction = (transactionId: string) => {
    return refunds.find((r) => r.transaction_id === transactionId);
  };

  const handleOpenRefundModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRefundModal(true);
  };

  const handleCloseRefundModal = () => {
    setShowRefundModal(false);
    setSelectedTransaction(null);
    setRefundMessage('');
  };

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction || !user) return;
    setSubmittingRefund(true);
    try {
      await refundAPI.createRefund(user.user_id, {
        transaction_id: selectedTransaction.transaction_id,
        message: refundMessage,
      });
      alert('Refund request submitted successfully!');
      handleCloseRefundModal();
      fetchData(); // Refresh to show new refund
    } catch (error: any) {
      console.error('Failed to submit refund:', error);
      alert(error.response?.data?.detail || 'Failed to submit refund request');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Transactions</h1>

        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No transactions yet</p>
            <Link href="/products" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {transactions.map((transaction) => {
              const refund = getRefundForTransaction(transaction.transaction_id);
              return (
                <div key={transaction.transaction_id} className="card">
                  {/* Transaction Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{transaction.transaction_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {new Date(transaction.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>
                  </div>

                  {/* Transaction Items */}
                  <div className="space-y-3 mb-4">
                    {transaction.items.map((item) => (
                      <div key={item.product_id} className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.img_link ? (
                            <img
                              src={item.img_link}
                              alt={item.product_name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src =
                                  'https://via.placeholder.com/64?text=No+Image';
                              }}
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                              No Image
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <Link
                            href={`/products/${item.product_id}`}
                            className="font-medium text-gray-900 hover:text-primary-600"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-sm text-gray-600">
                            Quantity: {item.quantity} × {formatPrice(convertPrice(item.discounted_price, exchangeRate), currency)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Transaction Footer */}
                  <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatPrice(convertPrice(transaction.total_price, exchangeRate), currency)}
                      </p>
                    </div>
                    <div>
                      {refund ? (
                        <span
                          className={`inline-block px-4 py-2 rounded-lg text-sm font-medium ${getStatusBadgeColor(
                            refund.status
                          )}`}
                        >
                          Refund {refund.status}
                        </span>
                      ) : transaction.status !== 'refunded' ? (
                        <button
                          onClick={() => handleOpenRefundModal(transaction)}
                          className="btn-secondary"
                        >
                          Request Refund
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {/* Refund Details if exists */}
                  {refund && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900 mb-1">Refund Reason:</p>
                      <p className="text-sm text-gray-700">{refund.message}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Requested on {new Date(refund.created_at).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedTransaction && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Request Refund</h2>
              <form onSubmit={handleSubmitRefund}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Order #{selectedTransaction.transaction_id}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mb-4">
                    Total: {formatPrice(convertPrice(selectedTransaction.total_price, exchangeRate), currency)}
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for refund:
                  </label>
                  <textarea
                    value={refundMessage}
                    onChange={(e) => setRefundMessage(e.target.value)}
                    required
                    rows={4}
                    className="input"
                    placeholder="Please describe why you're requesting a refund..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submittingRefund} className="btn-primary flex-1">
                    {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseRefundModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
