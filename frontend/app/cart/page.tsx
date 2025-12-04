'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { cartAPI, productsAPI, currencyAPI } from '@/lib/api';
import type { Cart, Product } from '@/types';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPrice } from '@/lib/currency';

export default function CartPage() {
  const { user } = useAuth();
  const { currency, symbol } = useCurrency();
  const router = useRouter();
  const [cart, setCart] = useState<Cart | null>(null);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    loadCart();
  }, [user, currency]);

  const loadCart = async () => {
    if (!user) return;
    try {
      const cartData = await cartAPI.get(user.user_token);
      setCart(cartData);
      const productIds = cartData.items.map((item) => item.product_id);
      
      let productData: Product[];
      if (currency === 'INR') {
        productData = await Promise.all(productIds.map((id) => productsAPI.getById(id)));
      } else {
        // Get converted products
        const converted = await currencyAPI.convert(currency);
        productData = productIds.map((id) => {
          const found = converted.find(p => p.product_id === id);
          return found || { product_id: id } as Product;
        });
        // Fetch any missing products
        const missingIds = productData.filter(p => !p.product_name).map(p => p.product_id);
        if (missingIds.length > 0) {
          const missing = await Promise.all(missingIds.map((id) => productsAPI.getById(id)));
          missing.forEach((p, i) => {
            const idx = productData.findIndex(prod => prod.product_id === missingIds[i]);
            if (idx >= 0) productData[idx] = p;
          });
        }
      }
      
      const productMap: Record<string, Product> = {};
      productData.forEach((p) => {
        if (p.product_id) productMap[p.product_id] = p;
      });
      setProducts(productMap);
      
      // Recalculate cart total with converted prices if currency is not INR
      if (currency !== 'INR' && cartData) {
        const newTotal = cartData.items.reduce((sum, item) => {
          const product = productMap[item.product_id];
          if (product && product.discounted_price) {
            return sum + (product.discounted_price * item.quantity);
          }
          return sum;
        }, 0);
        setCart({ ...cartData, total_price: newTotal });
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    try {
      await cartAPI.update(productId, quantity, user.user_token);
      loadCart();
    } catch (error) {
      console.error('Failed to update cart:', error);
    }
  };

  const handleRemove = async (productId: string) => {
    if (!user) return;
    try {
      await cartAPI.remove(productId, user.user_token);
      loadCart();
    } catch (error) {
      console.error('Failed to remove item:', error);
    }
  };

  const handleCheckout = async () => {
    if (!user) return;
    setCheckingOut(true);
    try {
      const transaction = await cartAPI.checkout(user.user_token);
      alert('Order placed successfully!');
      router.push(`/transactions/${transaction.transaction_id}`);
    } catch (error) {
      alert('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
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

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.items.map((item) => {
              const product = products[item.product_id];
              if (!product) return null;
              return (
                <div key={item.product_id} className="bg-white rounded-lg shadow-md p-6 flex gap-6">
                  <div className="relative w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0">
                    {product.img_link ? (
                      <Image
                        src={product.img_link}
                        alt={product.product_name}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {product.product_name}
                    </h3>
                    <p className="text-primary-600 font-bold mb-4">
                      {formatPrice(product.discounted_price || 0, symbol)}
                    </p>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center border rounded-lg">
                        <button
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="px-4 py-2">{item.quantity}</span>
                        <button
                          onClick={() => handleUpdateQuantity(item.product_id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => handleRemove(item.product_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatPrice(((product.discounted_price || 0) * item.quantity), symbol)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Order Summary</h2>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatPrice(cart.total_price || 0, symbol)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between text-xl font-bold text-gray-900">
                    <span>Total</span>
                    <span>{formatPrice(cart.total_price || 0, symbol)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
              >
                {checkingOut ? 'Processing...' : 'Proceed to Checkout'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

