'use client';

import { AlertTriangle, Shield, MessageSquare } from 'lucide-react';

interface Anomalies {
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
}

interface AnomaliesAlertProps {
  anomalies: Anomalies | null;
  loading: boolean;
}

export default function AnomaliesAlert({ anomalies, loading }: AnomaliesAlertProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!anomalies) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-500">No anomaly data available</p>
      </div>
    );
  }

  const hasAnomalies = anomalies.penalty_spike || anomalies.review_anomalies.length > 0;

  if (!hasAnomalies) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-full">
            <Shield className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">All Systems Normal</h3>
            <p className="text-sm text-gray-600">No anomalies detected in the system</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Penalty Spike Alert */}
      {anomalies.penalty_spike && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Penalty Spike Detected</h3>
              <p className="text-sm text-gray-700 mb-3">{anomalies.penalty_spike.message}</p>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Recent Count</p>
                  <p className="text-lg font-bold text-red-700">
                    {anomalies.penalty_spike.recent_count}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Historical Avg/Day</p>
                  <p className="text-lg font-bold text-gray-700">
                    {anomalies.penalty_spike.historical_average_per_day.toFixed(2)}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 mb-1">Threshold</p>
                  <p className="text-lg font-bold text-yellow-700">
                    {anomalies.penalty_spike.threshold.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Review Anomalies */}
      {anomalies.review_anomalies.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-full">
              <MessageSquare className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Review Anomalies Detected
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Products with unusually high number of reviews
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {anomalies.review_anomalies.map((anomaly, index) => (
              <div key={index} className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{anomaly.product_name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{anomaly.message}</p>
                    <div className="flex gap-4 text-xs">
                      <span className="text-gray-600">
                        Reviews: <span className="font-semibold text-yellow-700">
                          {anomaly.review_count}
                        </span>
                      </span>
                      <span className="text-gray-600">
                        Average: <span className="font-semibold">{anomaly.average_reviews.toFixed(1)}</span>
                      </span>
                      <span className="text-gray-600">
                        Threshold: <span className="font-semibold">{anomaly.threshold.toFixed(1)}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

