'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { penaltyAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import type { Penalty } from '@/types';

export default function PenaltiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchPenalties();
      }
    }
  }, [user, authLoading]);

  const fetchPenalties = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await penaltyAPI.getMyPenalties();
      setPenalties(data);
    } catch (error) {
      console.error('Failed to fetch penalties:', error);
      setPenalties([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPenalties = penalties.filter((p) => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  const activePenalties = penalties.filter((p) => p.status === 'active');
  const resolvedPenalties = penalties.filter((p) => p.status === 'resolved');

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading penalties...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Penalties</h1>
          <p className="text-gray-600">View all penalties applied to your account</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gray-50">
            <p className="text-3xl font-bold text-gray-900">{penalties.length}</p>
            <p className="text-gray-600 mt-1">Total Penalties</p>
          </div>
          <div className="card bg-red-50">
            <p className="text-3xl font-bold text-red-600">{activePenalties.length}</p>
            <p className="text-gray-600 mt-1">Active</p>
          </div>
          <div className="card bg-green-50">
            <p className="text-3xl font-bold text-green-600">{resolvedPenalties.length}</p>
            <p className="text-gray-600 mt-1">Resolved</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="card mb-6">
          <div className="flex gap-3">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({penalties.length})
            </button>
            <button
              onClick={() => setFilter('active')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'active'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active ({activePenalties.length})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === 'resolved'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Resolved ({resolvedPenalties.length})
            </button>
          </div>
        </div>

        {/* Penalties List */}
        {filteredPenalties.length === 0 ? (
          <div className="card text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all'
                ? 'No penalties on your account'
                : filter === 'active'
                ? 'No active penalties'
                : 'No resolved penalties'}
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'Your account is in good standing!'
                : filter === 'active'
                ? 'You have no active penalties at this time.'
                : 'No penalties have been resolved yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPenalties.map((penalty) => (
              <div
                key={penalty.penalty_id}
                className={`card ${
                  penalty.status === 'active'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {penalty.status === 'active' ? (
                      <AlertTriangle className="w-6 h-6 text-red-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{penalty.reason}</h3>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-medium ${
                          penalty.status === 'active'
                            ? 'bg-red-200 text-red-900'
                            : 'bg-green-200 text-green-900'
                        }`}
                      >
                        {penalty.status === 'active' ? 'Active' : 'Resolved'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Applied on: {new Date(penalty.timestamp).toLocaleString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Penalty ID: {penalty.penalty_id}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Text */}
        {activePenalties.length > 0 && (
          <div className="mt-8 card bg-blue-50 border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">About Penalties</h3>
            <p className="text-sm text-blue-800">
              Active penalties indicate violations of our terms of service. If you believe a
              penalty was applied in error, please dispute it with an administrator. Penalties may be
              resolved by administrators once the issue is addressed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
