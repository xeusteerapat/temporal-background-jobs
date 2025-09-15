import React, { useState, useEffect } from 'react';
import { getApplicationStatus } from '@/lib/api';

interface StatusTrackerProps {
  applicationId: string;
  workflowId: string;
}

const statusColors = {
  pending: 'bg-gray-100 text-gray-800',
  processing: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

export const StatusTracker: React.FC<StatusTrackerProps> = ({ applicationId, workflowId }) => {
  const [status, setStatus] = useState('pending');
  const [lastUpdated, setLastUpdated] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await getApplicationStatus(applicationId);

        if (response.success && response.application) {
          setStatus(response.application.status);
          setLastUpdated(new Date(response.application.updatedAt).toLocaleString());
          setError('');

          // Stop polling if completed or failed
          if (response.application.status === 'completed' || response.application.status === 'failed') {
            setIsLoading(false);
            return;
          }
        } else {
          setError(response.error || 'Failed to get status');
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Network error occurred');
      }
    };

    // Initial poll
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 3000);

    // Cleanup
    return () => clearInterval(interval);
  }, [applicationId]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4">Application Status</h3>

      <div className="space-y-3">
        <div>
          <span className="font-medium">Application ID:</span> {applicationId}
        </div>
        <div>
          <span className="font-medium">Workflow ID:</span> {workflowId}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-medium">Status:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
            {status.toUpperCase()}
          </span>
          {isLoading && status !== 'completed' && status !== 'failed' && (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          )}
        </div>
        {lastUpdated && (
          <div>
            <span className="font-medium">Last Updated:</span> {lastUpdated}
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {status === 'processing' && (
          <div className="bg-blue-50 p-3 rounded-md">
            <p className="text-blue-800 text-sm">
              Your application is being processed. This includes payment processing, document generation, and email notifications.
            </p>
          </div>
        )}

        {status === 'completed' && (
          <div className="bg-green-50 p-3 rounded-md">
            <p className="text-green-800 text-sm">
              ✅ Application processing completed successfully! Check your email for documents and confirmation.
            </p>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-red-50 p-3 rounded-md">
            <p className="text-red-800 text-sm">
              ❌ Application processing failed. Please contact support or try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};