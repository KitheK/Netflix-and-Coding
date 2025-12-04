'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { productsAPI, currencyAPI } from '@/lib/api';
import type { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import { useCurrency } from '@/contexts/CurrencyContext';

const CATEGORIES = [
  { value: 'All Categories', label: 'All Categories' },
  { value: 'Electronics', label: 'Electronics' },
  { value: 'Computers&Accessories', label: 'Computers & Accessories' },
  { value: 'Accessories', label: 'Accessories' },
  { value: 'OfficeProducts', label: 'Office Products' },
  { value: 'Home&Kitchen', label: 'Home & Kitchen' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const { currency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');

  useEffect(() => {
    loadProducts();
  }, [searchQuery, sortBy, currency]);

  useEffect(() => {
    filterProducts();
  }, [selectedCategory, allProducts]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      let data: Product[];
      if (searchQuery) {
        data = await productsAPI.search(searchQuery, sortBy || undefined);
      } else if (currency === 'INR') {
        data = await productsAPI.getAll(sortBy || undefined);
      } else {
        // Fetch converted products
        const converted = await currencyAPI.convert(currency);
        // Apply sorting if needed
        if (sortBy) {
          data = converted.sort((a, b) => {
            switch (sortBy) {
              case 'price_asc':
                return a.discounted_price - b.discounted_price;
              case 'price_desc':
                return b.discounted_price - a.discounted_price;
              case 'rating_desc':
                return (b.rating || 0) - (a.rating || 0);
              case 'name_asc':
                return a.product_name.localeCompare(b.product_name);
              default:
                return 0;
            }
          });
        } else {
          data = converted;
        }
      }
      setAllProducts(data);
      filterProductsByCategory(data);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterProductsByCategory = (data: Product[]) => {
    if (selectedCategory === 'All Categories') {
      setProducts(data);
    } else {
      const filtered = data.filter((product) => {
        const category = product.category?.split('|')[0] || product.category || '';
        return category === selectedCategory;
      });
      setProducts(filtered);
    }
  };

  const filterProducts = () => {
    filterProductsByCategory(allProducts);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
        </h1>
        <div className="flex gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm hover:shadow-md transition-shadow"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm hover:shadow-md transition-shadow"
          >
            <option value="">Sort by</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating_desc">Rating: High to Low</option>
            <option value="name_asc">Name: A to Z</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md h-96 animate-pulse" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.product_id} product={product} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md h-96 animate-pulse" />
            ))}
          </div>
        </main>
      }>
        <ProductsContent />
      </Suspense>
    </div>
  );
}

