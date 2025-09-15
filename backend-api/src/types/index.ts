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
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkflowInput {
  applicationId: string;
}

export interface PaymentRequest {
  applicationId: string;
  amount: number;
  customerEmail: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface DocumentRequest {
  applicationId: string;
  templateType: string;
  data: Record<string, any>;
}

export interface DocumentResponse {
  success: boolean;
  documentId?: string;
  downloadUrl?: string;
  error?: string;
}

export interface EmailRequest {
  to: string;
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
  }>;
}