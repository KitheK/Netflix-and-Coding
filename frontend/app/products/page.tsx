'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { productAPI, currencyAPI } from '@/lib/api';
import { Product } from '@/types';
import ProductCard from '@/components/ProductCard';
import { useCurrency } from '@/contexts/CurrencyContext';

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get('search');
  const { currency, setCurrency } = useCurrency();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState(''); // Default to no sorting (natural order)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    fetchProducts();
  }, [searchQuery, sortBy, currency]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setCurrentPage(1);
  }, [searchQuery, sortBy, currency]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let result;
      
      // STEP 1: Get products (with or without currency conversion)
      if (currency !== 'INR') {
        // Get all products with currency conversion
        result = await currencyAPI.getProductsInCurrency(currency);
      } else {
        // Get products in INR (base currency)
        result = await productAPI.getAll(); // Get ALL products, don't sort yet
      }
      
      // STEP 2: Apply search filter if there's a search query
      if (searchQuery && searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase().trim();
        result = result.filter((product: Product) => 
          product.product_name.toLowerCase().includes(searchLower)
        );
      }
      
      // STEP 3: Apply sorting if sort option is selected
      if (sortBy) {
        result = sortProducts(result, sortBy);
      }
      
      setProducts(result);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Client-side sorting function (mirrors backend logic)
  const sortProducts = (products: Product[], sortOption: string): Product[] => {
    const sorted = [...products]; // Create copy to avoid mutating state
    
    switch (sortOption) {
      case 'name_asc':
        return sorted.sort((a, b) => a.product_name.localeCompare(b.product_name));
      case 'name_desc':
        return sorted.sort((a, b) => b.product_name.localeCompare(a.product_name));
      case 'price_asc':
        return sorted.sort((a, b) => a.discounted_price - b.discounted_price);
      case 'price_desc':
        return sorted.sort((a, b) => b.discounted_price - a.discounted_price);
      case 'rating_asc':
        return sorted.sort((a, b) => a.rating - b.rating);
      case 'rating_desc':
        return sorted.sort((a, b) => b.rating - a.rating);
      case 'discount_asc':
        return sorted.sort((a, b) => a.discount_percentage - b.discount_percentage);
      case 'discount_desc':
        return sorted.sort((a, b) => b.discount_percentage - a.discount_percentage);
      default:
        return sorted; // Return as-is for default/invalid options
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency as 'INR' | 'USD' | 'CAD' | 'EUR' | 'GBP');
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value);
  };

  // Calculate pagination
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {searchQuery ? `Search: "${searchQuery}"` : 'Browse Products'}
          </h1>
          <p className="text-gray-600">
            {products.length} {products.length === 1 ? 'product' : 'products'} available
            {products.length > itemsPerPage && ` · Showing ${startIndex + 1}-${Math.min(endIndex, products.length)}`}
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-6">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-3">
                <label htmlFor="sort" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Sort By
                </label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all bg-white"
                >
                  <option value="">Relevance</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Top Rated</option>
                  <option value="discount_desc">Best Deals</option>
                </select>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center gap-3">
                <label htmlFor="currency" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  Currency
                </label>
                <select
                  id="currency"
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all bg-white"
                >
                  <option value="INR">₹ INR</option>
                  <option value="USD">$ USD</option>
                  <option value="CAD">$ CAD</option>
                  <option value="EUR">€ EUR</option>
                  <option value="GBP">£ GBP</option>
                </select>
              </div>
            </div>

            {/* Results count badge */}
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-full">
              <span className="font-semibold">{currentProducts.length}</span> items on this page
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading products...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No products found.</p>
            {searchQuery && (
              <button
                onClick={() => router.push('/products')}
                className="btn-primary mt-4"
              >
                View all products
              </button>
            )}
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {currentProducts.map((product) => (
                <ProductCard key={product.product_id} product={product} />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="px-2 py-2">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading products...</p></div>}>
      <ProductsContent />
    </Suspense>
  );
}
