'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { transactionAPI, currencyAPI } from '@/lib/api';
import { Transaction } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const transactionId = searchParams.get('transaction_id');

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [convertedPrices, setConvertedPrices] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!transactionId) {
      router.push('/cart');
      return;
    }
    fetchTransaction();
  }, [user, transactionId, currency]);

  const fetchTransaction = async () => {
    if (!transactionId) return;
    setLoading(true);
    try {
      const transactionData = await transactionAPI.getById(transactionId);
      setTransaction(transactionData);

      // Fetch converted prices if currency is not INR
      if (currency !== 'INR') {
        const allProducts = await currencyAPI.getProductsInCurrency(currency);
        const priceMap: { [key: string]: number } = {};
        allProducts.forEach((product: any) => {
          priceMap[product.product_id] = product.discounted_price;
        });
        setConvertedPrices(priceMap);
      } else {
        setConvertedPrices({});
      }
    } catch (error) {
      console.error('Failed to fetch transaction:', error);
      alert('Failed to load transaction details');
      router.push('/transactions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading receipt...</p>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Transaction not found</p>
          <Link href="/transactions" className="btn-primary">
            View Transactions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
          <p className="text-gray-600">Thank you for your purchase</p>
        </div>

        {/* Transaction Details Card */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Order Details</h2>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Order Number:</span>
              <span className="font-medium">{transaction.transaction_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Order Date:</span>
              <span className="font-medium">
                {new Date(transaction.timestamp).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Estimated Delivery:</span>
              <span className="font-medium">
                {new Date(transaction.estimated_delivery).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="font-medium capitalize">{transaction.status}</span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t border-gray-200 pt-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Shipping Information</h3>
            <p className="text-gray-700">{transaction.customer_name}</p>
            <p className="text-gray-700">{transaction.customer_email}</p>
          </div>

          {/* Items */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
            <div className="space-y-4">
              {transaction.items.map((item) => (
                <div key={item.product_id} className="flex gap-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {item.img_link ? (
                      <img
                        src={item.img_link}
                        alt={item.product_name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=No+Image';
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
                    <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{currencySymbol}{(convertedPrices[item.product_id] || item.discounted_price).toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {currencySymbol}{((convertedPrices[item.product_id] || Number(item.discounted_price)) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 mt-6 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total:</span>
              <span className="text-primary-600">{currencySymbol}{Object.keys(convertedPrices).length > 0 ? transaction.items.reduce((sum, item) => sum + (convertedPrices[item.product_id] || item.discounted_price) * item.quantity, 0).toFixed(2) : Number(transaction.total_price).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Link href="/products" className="btn-primary">
            Continue Shopping
          </Link>
          <Link href="/transactions" className="btn-secondary">
            View All Transactions
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading...</p></div>}>
      <CheckoutContent />
    </Suspense>
  );
}
