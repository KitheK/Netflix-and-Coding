'use client';

import { Users, TrendingUp, DollarSign, Activity, Award, ShoppingBag } from 'lucide-react';

interface UserMetrics {
  summary: {
    total_users: number;
    admin_count: number;
    customer_count: number;
    active_users: number;
    inactive_users: number;
  };
  engagement: {
    users_with_multiple_transactions: number;
    average_transactions_per_user: number;
    average_spending_per_user: number;
    users_by_transaction_count: {
      '1_transaction': number;
      '2_5_transactions': number;
      '6_10_transactions': number;
      '10+_transactions': number;
    };
  };
  top_customers: Array<{
    user_id: string;
    name: string;
    email: string;
    total_spending: number;
    transaction_count: number;
  }>;
}

interface UserMetricsDashboardProps {
  metrics: UserMetrics | null;
  loading: boolean;
}

export default function UserMetricsDashboard({ metrics, loading }: UserMetricsDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No user metrics available</p>
      </div>
    );
  }

  const { summary, engagement, top_customers } = metrics;
  const activeUserPercentage = summary.total_users > 0 
    ? ((summary.active_users / summary.total_users) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.total_users}</p>
              <p className="text-xs text-gray-500 mt-1">
                {summary.customer_count} customers • {summary.admin_count} admins
              </p>
            </div>
            <Users className="h-12 w-12 text-blue-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Active Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{summary.active_users}</p>
              <p className="text-xs text-gray-500 mt-1">
                {activeUserPercentage}% of total users
              </p>
            </div>
            <Activity className="h-12 w-12 text-green-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Transactions</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {engagement.average_transactions_per_user.toFixed(1)}
              </p>
              <p className="text-xs text-gray-500 mt-1">per active user</p>
            </div>
            <TrendingUp className="h-12 w-12 text-purple-500 opacity-20" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Spending</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ₹{engagement.average_spending_per_user.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">per active user</p>
            </div>
            <DollarSign className="h-12 w-12 text-yellow-500 opacity-20" />
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary-600" />
            User Activity Breakdown
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">1 Transaction</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {engagement.users_by_transaction_count['1_transaction']}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">2-5 Transactions</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {engagement.users_by_transaction_count['2_5_transactions']}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">6-10 Transactions</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {engagement.users_by_transaction_count['6_10_transactions']}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">10+ Transactions</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {engagement.users_by_transaction_count['10+_transactions']}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-primary-600" />
            Engagement Statistics
          </h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Returning Customers</p>
              <p className="text-2xl font-bold text-primary-700">
                {engagement.users_with_multiple_transactions}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Users with multiple transactions
              </p>
            </div>
            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Inactive Users</p>
              <p className="text-2xl font-bold text-blue-700">
                {summary.inactive_users}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Users with no transactions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary-600" />
          Top Customers by Spending
        </h3>
        {top_customers.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No customer data available</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spending
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {top_customers.map((customer, index) => (
                  <tr key={customer.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                          index === 0 ? 'bg-yellow-100 text-yellow-800' :
                          index === 1 ? 'bg-gray-100 text-gray-800' :
                          index === 2 ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-50 text-gray-600'
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{customer.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        ₹{customer.total_spending.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {customer.transaction_count} {customer.transaction_count === 1 ? 'transaction' : 'transactions'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

