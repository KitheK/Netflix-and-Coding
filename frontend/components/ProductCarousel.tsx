'use client';

import { useState, useEffect, useCallback } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/types';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useCurrency } from '@/contexts/CurrencyContext';
import { formatPrice } from '@/lib/currency';

interface ProductCarouselProps {
  products: Product[];
  title?: string;
}

export default function ProductCarousel({ products, title = 'Deals of the Day' }: ProductCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  const { symbol } = useCurrency();

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback((index: number) => {
    if (emblaApi) emblaApi.scrollTo(index);
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  // Auto-advance carousel
  useEffect(() => {
    if (!emblaApi || products.length <= 1) return;

    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [emblaApi, products.length]);

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-primary-50 rounded-xl shadow-lg border border-primary-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-primary-200 bg-white/80 backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-primary-600">🔥</span>
          {title}
        </h2>
        <p className="text-sm text-gray-600 mt-1">Best deals you don't want to miss</p>
      </div>

      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {products.map((product) => (
              <div key={product.product_id} className="flex-[0_0_100%] min-w-0">
                <div className="flex flex-col md:flex-row h-auto md:h-96">
                  {/* Product Image */}
                  <Link
                    href={`/products/${product.product_id}`}
                    className="w-full md:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4 md:p-8 h-64 md:h-auto"
                  >
                    {product.img_link && !imageErrors.has(product.product_id) ? (
                      <Image
                        src={product.img_link}
                        alt={product.product_name || 'Product image'}
                        width={400}
                        height={400}
                        className="object-contain w-full h-full hover:scale-105 transition-transform duration-300"
                        unoptimized
                        onError={() => {
                          setImageErrors((prev) => new Set(prev).add(product.product_id));
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-100 rounded-lg">
                        <div className="text-center">
                          <svg className="w-24 h-24 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="text-sm">No Image</p>
                        </div>
                      </div>
                    )}
                  </Link>

                  {/* Product Details */}
                  <div className="w-full md:w-1/2 bg-white p-4 md:p-8 flex flex-col justify-center overflow-hidden">
                    <div className="mb-4 flex-shrink-0">
                      <span className="inline-block px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full whitespace-nowrap">
                        {product.discount_percentage}% OFF
                      </span>
                    </div>
                    <h3 className="text-xl md:text-3xl font-bold text-gray-900 mb-4 break-words overflow-wrap-anywhere">
                      {product.product_name}
                    </h3>
                    <div className="flex items-center mb-4 flex-shrink-0">
                      <div className="flex items-center bg-yellow-50 px-3 py-1.5 rounded-lg whitespace-nowrap">
                        <Star className="h-5 w-5 text-yellow-400 fill-yellow-400 flex-shrink-0" />
                        <span className="ml-2 text-sm font-medium text-gray-700">
                          {product.rating || 0}
                        </span>
                        <span className="ml-1 text-sm text-gray-500">
                          ({(product.rating_count || 0).toLocaleString()})
                        </span>
                      </div>
                    </div>
                    <div className="mb-6 flex-shrink-0">
                      <div className="flex items-baseline flex-wrap gap-2 mb-2">
                        <span className="text-2xl md:text-4xl font-bold text-gray-900 whitespace-nowrap">
                          {formatPrice(product.discounted_price || 0, symbol)}
                        </span>
                        {product.discount_percentage > 0 && (
                          <span className="text-lg md:text-xl text-gray-500 line-through whitespace-nowrap">
                            {formatPrice(product.actual_price || 0, symbol)}
                          </span>
                        )}
                      </div>
                      {product.discount_percentage > 0 && (
                        <p className="text-sm text-green-600 font-medium whitespace-nowrap">
                          You save {formatPrice((product.actual_price || 0) - (product.discounted_price || 0), symbol)}
                        </p>
                      )}
                    </div>
                    <p className="text-gray-600 text-sm mb-6 line-clamp-3 break-words overflow-wrap-anywhere min-h-[3.75rem]">
                      {product.about_product}
                    </p>
                    <Link
                      href={`/products/${product.product_id}`}
                      className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-md hover:shadow-lg text-center block flex-shrink-0"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        {products.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-20 border border-gray-200 backdrop-blur-sm"
              aria-label="Previous product"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-700 p-3 rounded-full shadow-lg hover:shadow-xl transition-all z-20 border border-gray-200 backdrop-blur-sm"
              aria-label="Next product"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Dots Indicator */}
        {products.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {products.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  index === selectedIndex
                    ? 'w-8 bg-primary-600'
                    : 'w-2 bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
