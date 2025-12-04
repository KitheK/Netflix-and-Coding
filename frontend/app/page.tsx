'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.push('/products');
    }
  }, [loading, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Web Shopping Service</h1>
        <p className="text-gray-600 mb-8">Loading...</p>
        <Link href="/products" className="btn-primary">
          View Products
        </Link>
      </div>
    </div>
  );
}
