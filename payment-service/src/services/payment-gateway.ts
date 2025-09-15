import { v4 as uuidv4 } from 'uuid';
import { PaymentRequest, PaymentResponse, PaymentStatus } from '../types';

// In-memory storage for demo purposes
const paymentStore = new Map<string, PaymentStatus>();

export class PaymentGatewayService {
  private successRate: number;
  private processingDelay: number;

  constructor() {
    this.successRate = parseFloat(process.env.PAYMENT_SUCCESS_RATE || '0.95');
    this.processingDelay = parseInt(process.env.PAYMENT_PROCESSING_DELAY_MS || '2000');
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const startTime = Date.now();
    const transactionId = `txn_${uuidv4()}`;

    console.log(`Processing payment for application ${request.applicationId}`, {
      transactionId,
      amount: request.amount,
      currency: request.currency || 'USD'
    });

    // Simulate processing delay
    await this.delay(this.processingDelay);

    // Simulate success/failure based on success rate
    const isSuccess = Math.random() < this.successRate;
    const processingTime = Date.now() - startTime;

    const paymentStatus: PaymentStatus = {
      transactionId,
      status: isSuccess ? 'completed' : 'failed',
      amount: request.amount,
      currency: request.currency || 'USD',
      applicationId: request.applicationId,
      customerEmail: request.customerEmail,
      createdAt: new Date(),
      updatedAt: new Date(),
      gatewayResponse: {
        gateway: 'mock-gateway',
        processingTime,
        timestamp: new Date().toISOString()
      }
    };

    // Store payment record
    paymentStore.set(transactionId, paymentStatus);

    if (isSuccess) {
      console.log(`Payment successful for application ${request.applicationId}`, {
        transactionId,
        processingTime
      });

      return {
        success: true,
        transactionId,
        amount: request.amount,
        currency: request.currency || 'USD',
        status: 'completed',
        processingTime
      };
    } else {
      const errorMessage = 'Payment declined by gateway';
      console.log(`Payment failed for application ${request.applicationId}`, {
        transactionId,
        error: errorMessage,
        processingTime
      });

      return {
        success: false,
        transactionId,
        error: errorMessage,
        processingTime
      };
    }
  }

  async getPaymentStatus(transactionId: string): Promise<PaymentStatus | null> {
    return paymentStore.get(transactionId) || null;
  }

  async refundPayment(transactionId: string): Promise<PaymentResponse> {
    const payment = paymentStore.get(transactionId);

    if (!payment) {
      return {
        success: false,
        error: 'Transaction not found'
      };
    }

    if (payment.status !== 'completed') {
      return {
        success: false,
        error: 'Can only refund completed payments'
      };
    }

    // Simulate refund processing
    await this.delay(1000);

    payment.status = 'refunded';
    payment.updatedAt = new Date();
    paymentStore.set(transactionId, payment);

    console.log(`Payment refunded`, { transactionId });

    return {
      success: true,
      transactionId,
      amount: payment.amount,
      currency: payment.currency,
      status: 'refunded'
    };
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to get all payments (for testing/debugging)
  getAllPayments(): PaymentStatus[] {
    return Array.from(paymentStore.values());
  }
}