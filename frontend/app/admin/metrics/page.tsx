'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, TrendingUp, Users, DollarSign, Package, AlertTriangle, ShoppingBag } from 'lucide-react';
import { metricsAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

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

export default function AdminMetricsPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [categoryMetrics, setCategoryMetrics] = useState<CategoryMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [anomalies, setAnomalies] = useState<Anomalies | null>(null);
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
  }, [user, isAdmin, loading]);

  const fetchMetrics = async () => {
    setLoadingData(true);
    try {
      const [category, charts, anomalyData] = await Promise.all([
        metricsAPI.getProductsByCategory(),
        metricsAPI.getProductCharts(),
        metricsAPI.getAnomalies(),
      ]);
      
      setCategoryMetrics(category);
      setChartData(charts);
      setAnomalies(anomalyData);
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
                  ₹{categoryMetrics.summary.total_revenue.toLocaleString()}
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
                {chartData.category_distribution.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-900">{category.category}</span>
                      <span className="text-sm text-gray-600">₹{category.revenue.toLocaleString()} ({category.percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${category.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* New vs Returning Users */}
        {chartData && chartData.new_vs_returning_users.length > 0 && (
          <div className="card mb-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Customer Retention</h3>
            <div className="grid grid-cols-2 gap-6">
              {chartData.new_vs_returning_users.map((userType, index) => (
                <div key={index} className="text-center">
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-3">
                    <div className="text-3xl font-bold text-gray-900">{userType.percentage}%</div>
                  </div>
                  <p className="text-sm font-medium text-gray-900">{userType.user_type}</p>
                  <p className="text-xs text-gray-500">{userType.count} users</p>
                </div>
              ))}
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
                        ₹{data.total_revenue.toLocaleString()}
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

        {/* Note about unimplemented feature */}
        <div className="mt-8 card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <BarChart3 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Note:</span> User engagement metrics (average transactions per user, 
                average spending, top customers by spending) are not yet available. The backend endpoint 
                <code className="mx-1 px-1 bg-blue-100 rounded">GET /admin/metrics/users</code> needs to be implemented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
