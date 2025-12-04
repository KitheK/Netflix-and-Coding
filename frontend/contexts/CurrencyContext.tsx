'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { currencyAPI } from '@/lib/api';

interface CurrencyContextType {
  currency: string;
  currencySymbol: string;
  exchangeRate: number;
  setCurrency: (currency: string) => void;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState('INR');
  const [currencySymbol, setCurrencySymbol] = useState('₹');
  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    // Load saved currency from localStorage
    const savedCurrency = localStorage.getItem('currency');
    if (savedCurrency) {
      setCurrencyState(savedCurrency);
      updateCurrencySymbol(savedCurrency);
      fetchExchangeRate(savedCurrency);
    }
  }, []);

  const fetchExchangeRate = async (curr: string) => {
    if (curr === 'INR') {
      setExchangeRate(1);
      return;
    }

    try {
      const products = await currencyAPI.getProductsInCurrency(curr);
      if (products && products.length > 0) {
        const product = products[0] as any;
        if (product.exchange_rate) {
          setExchangeRate(product.exchange_rate);
        }
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error);
      setExchangeRate(1);
    }
  };

  const updateCurrencySymbol = (curr: string) => {
    const symbols: { [key: string]: string } = {
      'INR': '₹',
      'USD': '$',
      'CAD': 'C$',
      'EUR': '€',
      'GBP': '£',
    };
    setCurrencySymbol(symbols[curr] || curr);
  };

  const setCurrency = (newCurrency: string) => {
    setCurrencyState(newCurrency);
    localStorage.setItem('currency', newCurrency);
    updateCurrencySymbol(newCurrency);
    fetchExchangeRate(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, currencySymbol, exchangeRate, setCurrency }}>
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

// Helper function to convert price from INR using exchange rate
export function convertPrice(priceInINR: number, exchangeRate: number): number {
  return priceInINR * exchangeRate;
}

// Helper function to format price with currency symbol
export function formatPrice(price: number, currencySymbol: string): string {
  return `${currencySymbol}${price.toFixed(2)}`;
}

