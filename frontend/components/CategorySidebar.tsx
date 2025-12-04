'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { Product } from '@/types';
import { ChevronRight } from 'lucide-react';

interface CategorySidebarProps {
  products: Product[];
}

export default function CategorySidebar({ products }: CategorySidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [categories, setCategories] = useState<Array<{ value: string; label: string; count: number }>>([]);

  useEffect(() => {
    // Extract unique categories from products
    const categoryMap = new Map<string, number>();
    
    products.forEach((product) => {
      const category = product.category?.split('|')[0] || product.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });

    // Convert to array and sort
    const categoryArray = Array.from(categoryMap.entries())
      .map(([value, count]) => ({
        value,
        label: value.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase()).trim(),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    // Add "All Categories" at the top
    setCategories([
      { value: 'All Categories', label: 'All Categories', count: products.length },
      ...categoryArray,
    ]);
  }, [products]);

  const currentCategory = searchParams?.get('category') || 'All Categories';

  const handleCategoryClick = (category: string) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (category === 'All Categories') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    const query = params.toString();
    return query ? `?${query}` : '';
  };

  return (
    <aside className="w-64 bg-white rounded-lg shadow-sm border border-gray-200 p-4 h-fit sticky top-20">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-3 border-b border-gray-200">
        Categories
      </h2>
      <nav className="space-y-1">
        {categories.map((category) => {
          const isActive = currentCategory === category.value;
          let href: string;
          if (pathname === '/') {
            const query = handleCategoryClick(category.value);
            href = query || '/';
          } else {
            const params = new URLSearchParams();
            if (category.value !== 'All Categories') {
              params.set('category', category.value);
            }
            const query = params.toString();
            href = `/products${query ? `?${query}` : ''}`;
          }
          
          return (
            <Link
              key={category.value}
              href={href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                isActive
                  ? 'bg-primary-50 text-primary-700 font-medium border border-primary-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="flex-1">{category.label}</span>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {category.count}
                </span>
                {isActive && (
                  <ChevronRight className="h-4 w-4 text-primary-600" />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

