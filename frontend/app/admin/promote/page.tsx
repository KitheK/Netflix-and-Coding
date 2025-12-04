'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserCog } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminManageUsersPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, loading]);

  const fetchUsers = async () => {
    setLoadingData(true);
    try {
      const usersData = await authAPI.getAllUsers();
      console.log('Fetched users:', usersData);
      setUsers(usersData);
    } catch (error: any) {
      console.error('Failed to fetch users:', error);
      if (error.response?.status === 403) {
        alert('Access denied. This page requires admin privileges.');
        router.push('/dashboard');
      } else {
        alert(`Failed to fetch users: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setLoadingData(false);
    }
  };

  const handleToggleRole = async (userId: string, userName: string, currentRole: string) => {
    // Prevent admin from demoting themselves
    if (userId === user?.user_id && currentRole === 'admin') {
      alert('You cannot demote yourself. Please ask another admin to change your role.');
      return;
    }

    const newRole = currentRole === 'customer' ? 'admin' : 'customer';
    const action = newRole === 'admin' ? 'promote to admin' : 'demote to customer';
    
    if (!confirm(`Are you sure you want to ${action} "${userName}"?`)) {
      return;
    }

    try {
      await authAPI.setUserRole(userId, newRole);
      alert(`${userName} has been ${newRole === 'admin' ? 'promoted to admin' : 'demoted to customer'}!`);
      fetchUsers(); // Refresh
    } catch (error: any) {
      console.error('Failed to change role:', error);
      alert(error.response?.data?.detail || 'Failed to change user role');
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage User Roles</h1>
          <p className="text-gray-600">Toggle user roles between customer and admin</p>
        </div>

        {users.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No user accounts found</p>
          </div>
        ) : (
          <>
            <div className="mb-6 card bg-yellow-50 border-yellow-200">
              <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Important</h3>
              <p className="text-sm text-yellow-800">
                Promoting a user to admin grants them full access to all administrative features.
                Demoting an admin back to customer removes all admin privileges. Only modify roles for trusted users.
              </p>
            </div>

            <div className="space-y-4">
              {users.map((u) => (
                <div key={u.user_id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{u.name}</h3>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <span
                        className={`inline-block mt-2 text-xs px-2 py-1 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role === 'admin' ? 'Admin' : 'Customer'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleToggleRole(u.user_id, u.name, u.role)}
                      disabled={u.user_id === user?.user_id && u.role === 'admin'}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                        u.user_id === user?.user_id && u.role === 'admin'
                          ? 'bg-gray-400 cursor-not-allowed text-white'
                          : u.role === 'customer'
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-orange-600 hover:bg-orange-700 text-white'
                      }`}
                      title={u.user_id === user?.user_id && u.role === 'admin' ? 'You cannot demote yourself' : ''}
                    >
                      <UserCog className="w-4 h-4" />
                      {u.role === 'customer' ? 'Promote to Admin' : 'Demote to Customer'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
