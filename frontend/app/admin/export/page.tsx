'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Download } from 'lucide-react';
import { exportAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminExportPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (!isAdmin) {
        router.push('/dashboard');
      } else {
        fetchAvailableFiles();
      }
    }
  }, [user, isAdmin, loading]);

  const fetchAvailableFiles = async () => {
    setLoadingData(true);
    try {
      const response = await exportAPI.getAvailableFiles();
      // Backend returns { available_files: [...] }
      setAvailableFiles(response.available_files || response);
    } catch (error) {
      console.error('Failed to fetch available files:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleDownload = async (filename: string) => {
    setDownloading(filename);
    try {
      const data = await exportAPI.exportFile(filename);
      
      // The backend returns an object with { file_key, filename, data, exported_at, record_count }
      // We want to download just the actual data
      const jsonData = data.data || data;
      
      // Create a blob and download
      const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error: any) {
      console.error('Failed to download file:', error);
      alert(error.response?.data?.detail || 'Failed to download file');
    } finally {
      setDownloading(null);
    }
  };

  const getFileDescription = (filename: string) => {
    const descriptions: { [key: string]: string } = {
      'users.json': 'User accounts and profiles',
      'products.json': 'Product catalog with details',
      'cart.json': 'Shopping cart data',
      'transactions.json': 'Purchase history and orders',
      'reviews.json': 'Product reviews and ratings',
      'penalties.json': 'User penalties and violations',
      'refunds.json': 'Refund requests and status',
      'wishlist.json': 'Customer wishlist data',
    };
    return descriptions[filename] || 'System data file';
  };

  const getFileIcon = (filename: string) => {
    // Icons removed for professional appearance
    return null;
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading export options...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Export Data</h1>
          <p className="text-gray-600">Download system data in JSON format</p>
        </div>

        {availableFiles.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No files available for export</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {availableFiles.map((filename) => (
              <div key={filename} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">{filename}</h3>
                    <p className="text-sm text-gray-600 mb-4">{getFileDescription(filename)}</p>
                    <button
                      onClick={() => handleDownload(filename)}
                      disabled={downloading === filename}
                      className="btn-primary w-full flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {downloading === filename ? 'Downloading...' : 'Download'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 card bg-blue-50 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Export Information</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Files are exported in JSON format for easy processing</li>
            <li>• Data reflects the current state of the system</li>
            <li>• Use exported data for backups, analysis, or migration</li>
            <li>• Ensure proper handling of sensitive user information</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
