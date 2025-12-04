'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { currencyAPI } from '@/lib/api';

type Currency = 'INR' | 'USD' | 'CAD' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: Currency;
  exchangeRate: number | null;
  setCurrency: (currency: Currency) => void;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  CAD: '$',
  EUR: '€',
  GBP: '£',
};

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('INR');
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load currency from localStorage on mount
  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency;
    if (savedCurrency && ['INR', 'USD', 'CAD', 'EUR', 'GBP'].includes(savedCurrency)) {
      setCurrencyState(savedCurrency);
    }
  }, []);

  // Fetch exchange rate when currency changes (except for INR)
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (currency === 'INR') {
        setExchangeRate(1.0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Fetch products in the selected currency to get the exchange rate
        // The API returns products with exchange_rate field
        const products = await currencyAPI.getProductsInCurrency(currency);
        if (products && products.length > 0) {
          // Use the exchange_rate from the first product if available
          if ((products[0] as any).exchange_rate) {
            setExchangeRate((products[0] as any).exchange_rate);
          } else {
            // Fallback: calculate from price ratio
            // Get one product in base currency (INR) using regular product API
            const { productAPI } = await import('@/lib/api');
            const inrProducts = await productAPI.getAll();
            if (inrProducts.length > 0 && products.length > 0) {
              // Find matching product by ID
              const matchingProduct = inrProducts.find(
                (p: any) => p.product_id === (products[0] as any).product_id
              );
              if (matchingProduct) {
                const rate = (products[0] as any).discounted_price / matchingProduct.discounted_price;
                setExchangeRate(rate);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        setExchangeRate(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExchangeRate();
  }, [currency]);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        exchangeRate,
        setCurrency,
        isLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}

// Utility function to get currency symbol
export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency] || currency;
}

// Utility function to convert price from INR to target currency
export function convertPrice(priceInINR: number, exchangeRate: number | null): number {
  if (!exchangeRate || exchangeRate === 1.0) {
    return priceInINR;
  }
  return roundToTwoDecimals(priceInINR * exchangeRate);
}

// Utility function to format price with currency symbol
export function formatPrice(price: number, currency: Currency): string {
  const symbol = getCurrencySymbol(currency);
  return `${symbol}${roundToTwoDecimals(price).toFixed(2)}`;
}

// Helper to round to 2 decimal places
function roundToTwoDecimals(num: number): number {
  return Math.round(num * 100) / 100;
}

