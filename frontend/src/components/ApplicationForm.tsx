import React, { useState } from 'react';
import { submitApplication } from '@/lib/api';

interface ApplicationFormProps {
  onSubmit: (workflowId: string, applicationId: string) => void;
}

export const ApplicationForm: React.FC<ApplicationFormProps> = ({ onSubmit }) => {
  const [applicationId, setApplicationId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!applicationId.trim()) {
      setError('Application ID is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await submitApplication(applicationId.trim());

      if (response.success && response.workflowId) {
        onSubmit(response.workflowId, applicationId.trim());
        setApplicationId('');
      } else {
        setError(response.error || 'Failed to submit application');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Network error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Submit Application for Processing</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="applicationId" className="block text-sm font-medium text-gray-700 mb-2">
            Application ID
          </label>
          <input
            type="text"
            id="applicationId"
            value={applicationId}
            onChange={(e) => setApplicationId(e.target.value)}
            placeholder="Enter application ID (e.g., app-001)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500 mt-1">
            Use "app-001" or "app-002" for demo data
          </p>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Processing...' : 'Submit Application'}
        </button>
      </form>
    </div>
  );
};