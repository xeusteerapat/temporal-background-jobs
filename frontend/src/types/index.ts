export interface Application {
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  applicationData: {
    type: string;
    amount: number;
    documents: string[];
  };
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface SubmitResponse {
  success: boolean;
  applicationId?: string;
  workflowId?: string;
  runId?: string;
  message?: string;
  application?: {
    applicationId: string;
    firstName: string;
    lastName: string;
    email: string;
    type: string;
    amount: number;
  };
  error?: string;
}

export interface StatusResponse {
  success: boolean;
  application?: {
    applicationId: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  error?: string;
}