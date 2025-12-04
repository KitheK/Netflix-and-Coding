'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { refundAPI, transactionAPI } from '@/lib/api';
import { Refund, Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency, formatPrice, convertPrice } from '@/contexts/CurrencyContext';

export default function AdminRefundsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const { currency, exchangeRate } = useCurrency();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [transactions, setTransactions] = useState<{ [key: string]: Transaction }>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        fetchRefunds();
      }
    }
  }, [user, isAdmin, loading]);

  const fetchRefunds = async () => {
    setLoadingData(true);
    try {
      const refundsData = await refundAPI.getAllRefunds();
      setRefunds(refundsData);

      // Fetch transaction details for each refund
      const transactionPromises = refundsData.map((refund: Refund) =>
        transactionAPI.getById(refund.transaction_id)
      );
      const transactionsData = await Promise.all(transactionPromises);

      // Create a map of transaction_id -> transaction
      const transactionMap: { [key: string]: Transaction } = {};
      transactionsData.forEach((transaction) => {
        transactionMap[transaction.transaction_id] = transaction;
      });
      setTransactions(transactionMap);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleApproveRefund = async (refundId: string) => {
    try {
      await refundAPI.approveRefund(refundId);
      alert('Refund approved successfully!');
      fetchRefunds(); // Refresh
    } catch (error: any) {
      console.error('Failed to approve refund:', error);
      alert(error.response?.data?.detail || 'Failed to approve refund');
    }
  };

  const handleDenyRefund = async (refundId: string) => {
    try {
      await refundAPI.denyRefund(refundId);
      alert('Refund denied successfully!');
      fetchRefunds(); // Refresh
    } catch (error: any) {
      console.error('Failed to deny refund:', error);
      alert(error.response?.data?.detail || 'Failed to deny refund');
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
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading refunds...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Refunds</h1>
          <p className="text-gray-600">Review and process customer refund requests</p>
        </div>

        {refunds.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No refund requests found</p>
          </div>
        ) : (
          <div className="space-y-6">
            {refunds.map((refund) => {
              const transaction = transactions[refund.transaction_id];
              const isProcessed = refund.status !== 'pending';

              return (
                <div
                  key={refund.refund_id}
                  className={`card ${isProcessed ? 'opacity-60' : ''}`}
                >
                  {/* Refund Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Refund Request #{refund.refund_id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Submitted: {new Date(refund.created_at).toLocaleString()}
                      </p>
                      {refund.updated_at && (
                        <p className="text-sm text-gray-600">
                          Updated: {new Date(refund.updated_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                        refund.status
                      )}`}
                    >
                      {refund.status}
                    </span>
                  </div>

                  {/* Customer & Transaction Info */}
                  {transaction && (
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Customer</p>
                          <p className="text-gray-900">{transaction.customer_name}</p>
                          <p className="text-sm text-gray-600">{transaction.customer_email}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Transaction</p>
                          <p className="text-gray-900">#{transaction.transaction_id}</p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(convertPrice(transaction.total_price, exchangeRate), currency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Refund Reason */}
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-1">Reason:</p>
                    <p className="text-gray-900">{refund.message}</p>
                  </div>

                  {/* Items in Transaction */}
                  {transaction && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
                      <div className="space-y-2">
                        {transaction.items.map((item) => (
                          <div key={item.product_id} className="flex gap-3 text-sm">
                            <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              {item.img_link && (
                                <img
                                  src={item.img_link}
                                  alt={item.product_name}
                                  className="w-full h-full object-contain"
                                />
                              )}
                            </div>
                            <div>
                              <p className="text-gray-900">{item.product_name}</p>
                              <p className="text-gray-600">
                                Qty: {item.quantity} × {formatPrice(convertPrice(item.discounted_price, exchangeRate), currency)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {!isProcessed ? (
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => handleApproveRefund(refund.refund_id)}
                        className="btn-primary flex-1"
                      >
                        Approve Refund
                      </button>
                      <button
                        onClick={() => handleDenyRefund(refund.refund_id)}
                        className="btn-secondary flex-1"
                      >
                        Deny Refund
                      </button>
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-center text-gray-500 italic">
                        This refund has been {refund.status}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
