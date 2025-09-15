import { Router, Request, Response } from 'express';
import { PaymentGatewayService } from '../services/payment-gateway';
import { PaymentRequest } from '../types';

const router = Router();
const paymentGateway = new PaymentGatewayService();

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const paymentRequest: PaymentRequest = req.body;

    // Validate required fields
    if (!paymentRequest.applicationId || !paymentRequest.amount || !paymentRequest.customerEmail) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: applicationId, amount, customerEmail'
      });
    }

    // Validate amount
    if (paymentRequest.amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Amount must be greater than 0'
      });
    }

    console.log(`Received payment request`, {
      applicationId: paymentRequest.applicationId,
      amount: paymentRequest.amount,
      customerEmail: paymentRequest.customerEmail
    });

    const result = await paymentGateway.processPayment(paymentRequest);

    // Return appropriate status code based on result
    const statusCode = result.success ? 200 : 400;
    res.status(statusCode).json(result);

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;