'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authAPI, penaltyAPI } from '@/lib/api';
import { User, Penalty } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminPenaltiesPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [userPenalties, setUserPenalties] = useState<{ [key: string]: Penalty[] }>({});
  const [loadingData, setLoadingData] = useState(true);

  // Apply penalty modal state
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        fetchUsers();
      }
    }
  }, [user, isAdmin, loading]);

  const fetchUsers = async () => {
    setLoadingData(true);
    try {
      const usersData = await authAPI.getAllUsers();
      setUsers(usersData);

      // Fetch penalties for each user
      const penaltyPromises = usersData.map((u: User) =>
        penaltyAPI.getUserPenalties(u.user_id).catch(() => [])
      );
      const penaltiesData = await Promise.all(penaltyPromises);

      // Create a map of user_id -> penalties
      const penaltyMap: { [key: string]: Penalty[] } = {};
      usersData.forEach((u: User, index: number) => {
        penaltyMap[u.user_id] = penaltiesData[index];
      });
      setUserPenalties(penaltyMap);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleOpenPenaltyModal = (user: User) => {
    setSelectedUser(user);
    setShowPenaltyModal(true);
  };

  const handleClosePenaltyModal = () => {
    setShowPenaltyModal(false);
    setSelectedUser(null);
    setPenaltyReason('');
  };

  const handleSubmitPenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await penaltyAPI.applyPenalty(selectedUser.user_id, penaltyReason);
      alert('Penalty applied successfully!');
      handleClosePenaltyModal();
      fetchUsers(); // Refresh
    } catch (error: any) {
      console.error('Failed to apply penalty:', error);
      alert(error.response?.data?.detail || 'Failed to apply penalty');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolvePenalty = async (penaltyId: string) => {
    try {
      await penaltyAPI.resolvePenalty(penaltyId);
      alert('Penalty resolved!');
      fetchUsers(); // Refresh
    } catch (error: any) {
      console.error('Failed to resolve penalty:', error);
      alert(error.response?.data?.detail || 'Failed to resolve penalty');
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading users...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Penalties</h1>
          <p className="text-gray-600">Apply and resolve user penalties</p>
        </div>

        <div className="space-y-4">
          {users.map((u) => {
            const penalties = userPenalties[u.user_id] || [];
            const activePenalties = penalties.filter((p) => p.status === 'active');

            return (
              <div key={u.user_id} className="card">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{u.name}</h3>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleOpenPenaltyModal(u)}
                    className="btn-secondary"
                  >
                    Apply Penalty
                  </button>
                </div>

                {/* Active Penalties */}
                {activePenalties.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="font-medium text-gray-900 mb-3">Active Penalties:</h4>
                    <div className="space-y-2">
                      {activePenalties.map((penalty) => (
                        <div
                          key={penalty.penalty_id}
                          className="flex justify-between items-center p-3 bg-red-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">{penalty.reason}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(penalty.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <button
                            onClick={() => handleResolvePenalty(penalty.penalty_id)}
                            className="btn-primary text-sm"
                          >
                            Resolve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Apply Penalty Modal */}
        {showPenaltyModal && selectedUser && (
          <div className="fixed inset-0 bg-gray-100 bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Apply Penalty</h2>
              <form onSubmit={handleSubmitPenalty}>
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-4">
                    Applying penalty to: <strong>{selectedUser.name}</strong> ({selectedUser.email})
                  </p>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason:
                  </label>
                  <textarea
                    value={penaltyReason}
                    onChange={(e) => setPenaltyReason(e.target.value)}
                    required
                    rows={4}
                    className="input"
                    placeholder="Describe the violation or reason for penalty..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" disabled={submitting} className="btn-primary flex-1">
                    {submitting ? 'Applying...' : 'Apply Penalty'}
                  </button>
                  <button
                    type="button"
                    onClick={handleClosePenaltyModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
