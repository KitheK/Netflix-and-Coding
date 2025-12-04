import { currencyAPI } from './api';
import type { Product } from '@/types';

type Currency = 'INR' | 'USD' | 'CAD' | 'EUR';

// Cache for converted products
let currencyCache: {
  currency: Currency;
  products: Product[];
} | null = null;

export async function getProductsInCurrency(
  products: Product[],
  currency: Currency
): Promise<Product[]> {
  // If already in INR, return as-is
  if (currency === 'INR') {
    return products;
  }

  // Check cache
  if (currencyCache && currencyCache.currency === currency) {
    // Map cached products to current products by ID
    const productMap = new Map(currencyCache.products.map(p => [p.product_id, p]));
    return products.map(p => productMap.get(p.product_id) || p);
  }

  try {
    // Fetch converted products from backend
    const converted = await currencyAPI.convert(currency);
    currencyCache = { currency, products: converted };
    
    // Map to current products
    const productMap = new Map(converted.map(p => [p.product_id, p]));
    return products.map(p => productMap.get(p.product_id) || p);
  } catch (error) {
    console.error('Currency conversion failed:', error);
    return products; // Fallback to original
  }
}

export function formatPrice(price: number, symbol: string): string {
  return `${symbol}${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

