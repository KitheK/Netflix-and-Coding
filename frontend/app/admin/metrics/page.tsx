'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Users, DollarSign, Package, AlertTriangle, ShoppingBag } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { metricsAPI, currencyAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency, formatPrice, convertPrice } from '@/contexts/CurrencyContext';

type CategoryMetrics = {
  summary: {
    total_revenue: number;
    total_transactions: number;
    total_users_with_transactions: number;
    returning_users: number;
  };
  categories: {
    [key: string]: {
      total_revenue: number;
      transaction_count: number;
      most_purchased_products: Array<{
        product_id: string;
        product_name: string;
        purchase_count: number;
      }>;
    };
  };
  most_purchased_products: Array<{
    product_id: string;
    product_name: string;
    purchase_count: number;
  }>;
};

type ChartData = {
  top_products_by_sales: Array<{
    product_name: string;
    sales: number;
  }>;
  category_distribution: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
  new_vs_returning_users: Array<{
    user_type: string;
    count: number;
    percentage: number;
  }>;
};

type Anomalies = {
  penalty_spike: {
    message: string;
    recent_count: number;
    historical_average_per_day: number;
    threshold: number;
  } | null;
  review_anomalies: Array<{
    product_id: string;
    product_name: string;
    review_count: number;
    average_reviews: number;
    threshold: number;
    message: string;
  }>;
};

type UserMetrics = {
  summary: {
    total_users: number;
    admin_count: number;
    customer_count: number;
    active_users: number;
    inactive_users: number;
  };
  engagement: {
    average_transactions_per_user: number;
    average_spending_per_user: number;
    total_spending: number;
  };
  top_customers: Array<{
    user_id: string;
    user_name: string;
    user_email: string;
    total_spending: number;
    transaction_count: number;
  }>;
  user_activity_breakdown: Array<{
    transaction_count_range: string;
    user_count: number;
    percentage: number;
  }>;
};

// Color palette for pie charts
const COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', 
  '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'
];

export default function AdminMetricsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const { currency, currencySymbol, exchangeRate } = useCurrency();
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomalies | null>(null);
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null);
  const [convertedPrices, setConvertedPrices] = useState<{ [key: string]: number }>({});
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        fetchMetrics();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin, loading, currency]);

  const fetchMetrics = async () => {
    setLoadingData(true);
    try {
      const [category, charts, anomalyData, userMetricsData] = await Promise.all([
        metricsAPI.getProductsByCategory(),
        metricsAPI.getProductCharts(),
        metricsAPI.getAnomalies(),
        metricsAPI.getUserMetrics().catch((err) => {
          console.warn('User metrics not available:', err);
          return null;
        }),
      ]);
      
      setCategoryMetrics(category);
      setChartData(charts);
      setAnomalies(anomalyData);
      setUserMetrics(userMetricsData);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoadingData(false);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading metrics...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Metrics</h1>
          <p className="text-gray-600">Analytics and insights for your e-commerce platform</p>
        </div>

        {/* Anomaly Alerts */}
        {anomalies && (anomalies.penalty_spike || anomalies.review_anomalies.length > 0) && (
          <div className="mb-8 space-y-4">
            {anomalies.penalty_spike && (
              <div className="card bg-red-50 border-red-200">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-1">⚠️ Penalty Spike Detected</h3>
                    <p className="text-sm text-red-800">{anomalies.penalty_spike.message}</p>
                    <div className="mt-2 text-xs text-red-700">
                      Recent: {anomalies.penalty_spike.recent_count} | 
                      Historical Avg: {anomalies.penalty_spike.historical_average_per_day}/day | 
                      Threshold: {anomalies.penalty_spike.threshold}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {anomalies.review_anomalies.length > 0 && (
              <div className="card bg-yellow-50 border-yellow-200">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-yellow-900 mb-2">Review Anomalies Detected</h3>
                    <div className="space-y-2">
                      {anomalies.review_anomalies.map((anomaly) => (
                        <div key={anomaly.product_id} className="text-sm text-yellow-800">
                          <span className="font-medium">{anomaly.product_name}</span>: {anomaly.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary Cards */}
        {categoryMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {currencySymbol}{(categoryMetrics.summary.total_revenue * exchangeRate).toFixed(2)}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Total Revenue</h3>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {categoryMetrics.summary.total_transactions}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Total Transactions</h3>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {categoryMetrics.summary.total_users_with_transactions}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Active Customers</h3>
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-2xl font-bold text-gray-900">
                  {categoryMetrics.summary.returning_users}
                </span>
              </div>
              <h3 className="text-gray-600 font-medium">Returning Customers</h3>
            </div>
          </div>
        )}

        {/* Charts Section */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Products */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Products by Sales</h3>
              <div className="space-y-3">
                {chartData.top_products_by_sales.map((product, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-blue-100 rounded-full text-blue-800 font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{product.product_name}</p>
                      <p className="text-xs text-gray-500">{product.sales} units sold</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(product.sales / chartData.top_products_by_sales[0].sales) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Distribution */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Revenue by Category</h3>
              <div className="space-y-3">
                {chartData.category_distribution.map((category, index) => {
                  const maxRevenue = chartData.category_distribution[0]?.revenue || 1;
                  
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-green-100 rounded-full text-green-800 font-bold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{category.category}</p>
                        <p className="text-xs text-gray-500">
                          {formatPrice(convertPrice(category.revenue, exchangeRate), currencySymbol)} ({category.percentage.toFixed(1)}%)
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(category.revenue / maxRevenue) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* New vs Returning Users - Pie Chart */}
        {chartData && chartData.new_vs_returning_users.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Retention</h3>
            <div className="flex flex-col lg:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <ResponsiveContainer width={300} height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.new_vs_returning_users.map((userType) => ({
                        name: userType.user_type,
                        value: userType.count,
                        percentage: userType.percentage,
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry: any) => {
                        const percentage = entry.payload?.percentage ?? ((entry.percent ?? 0) * 100);
                        const name = entry.name ?? '';
                        return `${name}: ${percentage.toFixed(1)}%`;
                      }}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.new_vs_returning_users.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} users (${props.payload.percentage.toFixed(1)}%)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-4">
                {chartData.new_vs_returning_users.map((userType, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{userType.user_type}</p>
                        <p className="text-sm text-gray-500">{userType.count} users</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{userType.percentage.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {categoryMetrics && Object.keys(categoryMetrics.categories).length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Category Performance</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Top Products
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(categoryMetrics.categories).map(([category, data]) => (
                    <tr key={category}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {currencySymbol}{(data.total_revenue * exchangeRate).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {data.transaction_count}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="space-y-1">
                          {data.most_purchased_products.slice(0, 3).map((product) => (
                            <div key={product.product_id} className="flex justify-between">
                              <span className="truncate mr-2">{product.product_name}</span>
                              <span className="text-gray-400">×{product.purchase_count}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Overall Top Products */}
        {categoryMetrics && categoryMetrics.most_purchased_products.length > 0 && (
          <div className="card">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Most Purchased Products (All Categories)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purchase Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categoryMetrics.most_purchased_products.map((product, index) => (
                    <tr key={product.product_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{index + 1}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {product.product_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.purchase_count} units
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Metrics Section */}
        {userMetrics && (
          <div className="space-y-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-900">User Engagement Metrics</h2>

            {/* User Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {userMetrics.summary.total_users}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Total Users</h3>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {userMetrics.summary.admin_count}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Admins</h3>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {userMetrics.summary.customer_count}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Customers</h3>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {userMetrics.summary.active_users}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Active Users</h3>
              </div>

              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <Users className="w-6 h-6 text-gray-600" />
                  </div>
                  <span className="text-2xl font-bold text-gray-900">
                    {userMetrics.summary.inactive_users}
                  </span>
                </div>
                <h3 className="text-gray-600 font-medium">Inactive Users</h3>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Engagement Overview</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Transactions per User</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {userMetrics.engagement.average_transactions_per_user.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Average Spending per User</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPrice(convertPrice(userMetrics.engagement.average_spending_per_user, exchangeRate), currencySymbol)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total User Spending</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {currencySymbol}{(userMetrics.engagement.total_spending * exchangeRate).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top Customers */}
              <div className="card md:col-span-2">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top 10 Customers by Spending</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rank
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Spending
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transactions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userMetrics.top_customers.map((customer, index) => (
                        <tr key={customer.user_id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{index + 1}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {customer.user_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {customer.user_email}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                            {currencySymbol}{(customer.total_spending * exchangeRate).toFixed(2)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {customer.transaction_count}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* User Activity Breakdown */}
            {userMetrics.user_activity_breakdown.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-bold text-gray-900 mb-4">User Activity Breakdown</h3>
                <div className="space-y-3">
                  {userMetrics.user_activity_breakdown.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-24 text-sm font-medium text-gray-900">
                        {activity.transaction_count_range}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-gray-600">{activity.user_count} users</span>
                          <span className="text-sm font-medium text-gray-900">{activity.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full" 
                            style={{ width: `${activity.percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
