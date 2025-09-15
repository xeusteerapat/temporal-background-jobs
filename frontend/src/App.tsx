import React, { useState } from 'react';
import { ApplicationForm } from '@/components/ApplicationForm';
import { StatusTracker } from '@/components/StatusTracker';

function App() {
  const [activeWorkflow, setActiveWorkflow] = useState<{
    workflowId: string;
    applicationId: string;
  } | null>(null);

  const handleSubmit = (workflowId: string, applicationId: string) => {
    setActiveWorkflow({ workflowId, applicationId });
  };

  const handleReset = () => {
    setActiveWorkflow(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Temporal Application Processing System
          </h1>
          <p className="text-gray-600 mt-2">
            Submit applications for automated processing with payment and document generation
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          {!activeWorkflow ? (
            <ApplicationForm onSubmit={handleSubmit} />
          ) : (
            <div className="space-y-6">
              <StatusTracker
                applicationId={activeWorkflow.applicationId}
                workflowId={activeWorkflow.workflowId}
              />

              <div className="flex justify-center">
                <button
                  onClick={handleReset}
                  className="bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700"
                >
                  Submit Another Application
                </button>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-bold mb-3">System Information</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>• <strong>Temporal UI:</strong> <a href="http://localhost:8080" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:8080</a></p>
              <p>• <strong>MailHog (Email Testing):</strong> <a href="http://localhost:8025" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:8025</a></p>
              <p>• <strong>Backend API Health:</strong> <a href="/api/applications/status/app-001" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Test API</a></p>
              <p>• <strong>Demo Applications:</strong> app-001, app-002</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;