'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { Product } from '@/types';
import { Star } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatPrice } from '@/lib/currency';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { symbol } = useCurrency();

  return (
    <Link href={`/products/${product.product_id}`} className="block h-full">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-lg hover:border-primary-300 transition-all duration-300 overflow-hidden group h-full flex flex-col">
        <div className="relative h-64 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
          {product.img_link && !imageError ? (
            <Image
              src={product.img_link}
              alt={product.product_name || 'Product image'}
              width={200}
              height={200}
              className="object-contain w-full h-full group-hover:scale-110 transition-transform duration-300"
              unoptimized
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 rounded">
              <div className="text-center">
                <svg className="w-16 h-16 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No Image</p>
              </div>
            </div>
          )}
        </div>
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="text-base font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem] group-hover:text-primary-600 transition-colors">
            {product.product_name}
          </h3>
          <div className="flex items-center mb-3">
            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              <span className="ml-1 text-xs font-medium text-gray-700">
                {product.rating || 0}
              </span>
              <span className="ml-1 text-xs text-gray-500">
                ({(product.rating_count || 0).toLocaleString()})
              </span>
            </div>
          </div>
          <div className="mt-auto">
            <div className="flex items-baseline space-x-2 mb-1">
              <span className="text-xl font-bold text-gray-900">
                {formatPrice(product.discounted_price || 0, symbol)}
              </span>
              {product.discount_percentage > 0 && (
                <span className="text-xs text-gray-500 line-through">
                  {formatPrice(product.actual_price || 0, symbol)}
                </span>
              )}
            </div>
            {product.discount_percentage > 0 && (
              <span className="inline-block text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                Save {product.discount_percentage}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

