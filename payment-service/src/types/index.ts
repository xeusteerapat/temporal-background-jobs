export interface PaymentRequest {
  applicationId: string;
  amount: number;
  customerEmail: string;
  currency?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  amount?: number;
  currency?: string;
  status?: 'pending' | 'completed' | 'failed';
  error?: string;
  processingTime?: number;
}

export interface PaymentStatus {
  transactionId: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: number;
  currency: string;
  applicationId: string;
  customerEmail: string;
  createdAt: Date;
  updatedAt: Date;
  gatewayResponse?: any;
}