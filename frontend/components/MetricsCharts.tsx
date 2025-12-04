'use client';

import { BarChart3, TrendingUp } from 'lucide-react';

interface ChartData {
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
}

interface MetricsChartsProps {
  chartData: ChartData | null;
  loading: boolean;
}

export default function MetricsCharts({ chartData, loading }: MetricsChartsProps) {
  if (loading) {
    return (
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No chart data available</p>
      </div>
    );
  }

  const { top_products_by_sales, category_distribution, new_vs_returning_users } = chartData;

  // Calculate max sales for bar chart scaling
  const maxSales = Math.max(...top_products_by_sales.map(p => p.sales), 1);

  return (
    <div className="space-y-6">
      {/* Top Products by Sales - Bar Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary-600" />
          Top Products by Sales
        </h3>
        <div className="space-y-3">
          {top_products_by_sales.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No product sales data available</p>
          ) : (
            top_products_by_sales.map((product, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {product.product_name}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 ml-2">
                      {product.sales}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${(product.sales / maxSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* User Engagement Chart */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary-600" />
          User Engagement
        </h3>
        {new_vs_returning_users.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No user data available</p>
        ) : (
          <div className="space-y-4">
            {new_vs_returning_users.map((userType, index) => {
              const isNew = userType.user_type === 'New Users';
              const color = isNew ? 'bg-blue-500' : 'bg-green-500';
              
              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {userType.user_type}
                      </span>
                      <span className="text-sm font-semibold text-gray-700">
                        {userType.percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`${color} h-3 rounded-full transition-all duration-500`}
                        style={{ width: `${userType.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {userType.count} {userType.count === 1 ? 'user' : 'users'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

