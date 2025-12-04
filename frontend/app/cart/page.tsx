'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Plus, Minus } from 'lucide-react';
import { cartAPI, currencyAPI } from '@/lib/api';
import { Cart, CartItem, Product } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import Link from 'next/link';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { currency, currencySymbol } = useCurrency();
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [convertedPrices, setConvertedPrices] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchCart();
  }, [user, currency]);

  const fetchCart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const cartData = await cartAPI.getCart(user.user_id);
      setCart(cartData);
      
      // Fetch converted prices if currency is not INR
      if (currency !== 'INR' && cartData.items.length > 0) {
        const allProducts = await currencyAPI.getProductsInCurrency(currency);
        const priceMap: { [key: string]: number } = {};
        cartData.items.forEach((item: CartItem) => {
          const converted = allProducts.find((p: Product) => p.product_id === item.product_id);
          if (converted) {
            priceMap[item.product_id] = converted.discounted_price;
          }
        });
        setConvertedPrices(priceMap);
      } else {
        setConvertedPrices({});
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    if (!user || newQuantity < 1) return;
    try {
      await cartAPI.updateCart(user.user_id, productId, newQuantity);
      fetchCart();
    } catch (error) {
      console.error('Failed to update quantity:', error);
      alert('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (productId: string) => {
    if (!user) return;
    try {
      await cartAPI.removeFromCart(user.user_id, productId);
      fetchCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item');
    }
  };

  const handleCheckout = async () => {
    if (!user || !cart || cart.items.length === 0) return;
    setCheckingOut(true);
    try {
      const response = await cartAPI.checkout(user.user_id);
      // Dispatch cart update event to update navbar badge
      window.dispatchEvent(new Event('cartUpdated'));
      router.push(`/checkout?transaction_id=${response.transaction.transaction_id}`);
    } catch (error: any) {
      console.error('Failed to checkout:', error);
      alert(error.response?.data?.detail || 'Failed to complete checkout');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading cart...</p>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8">Add some products to get started!</p>
            <Link href="/products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item: CartItem) => (
              <div key={item.product_id} className="card">
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link href={`/products/${item.product_id}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                      {item.img_link ? (
                        <img
                          src={item.img_link}
                          alt={item.product_name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Details */}
                  <div className="flex-1">
                    <Link
                      href={`/products/${item.product_id}`}
                      className="font-semibold text-gray-900 hover:text-primary-600 block mb-2"
                    >
                      {item.product_name}
                    </Link>
                    <p className="text-lg font-bold text-gray-900 mb-4">
                      {currencySymbol}{convertedPrices[item.product_id] || item.discounted_price}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-12 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                          className="p-1 rounded-lg border border-gray-300 hover:bg-gray-100"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.product_id)}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {currencySymbol}{((convertedPrices[item.product_id] || Number(item.discounted_price)) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)}):</span>
                  <span>{currencySymbol}{Object.keys(convertedPrices).length > 0 ? cart.items.reduce((sum, item) => sum + (convertedPrices[item.product_id] || item.discounted_price) * item.quantity, 0).toFixed(2) : cart.total_price}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping:</span>
                  <span>FREE</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 mb-6">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total:</span>
                  <span className="text-primary-600">{currencySymbol}{Object.keys(convertedPrices).length > 0 ? cart.items.reduce((sum, item) => sum + (convertedPrices[item.product_id] || item.discounted_price) * item.quantity, 0).toFixed(2) : cart.total_price}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="btn-primary w-full"
              >
                {checkingOut ? 'Processing...' : 'Checkout'}
              </button>

              <Link href="/products" className="block text-center text-primary-600 hover:text-primary-700 mt-4">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
