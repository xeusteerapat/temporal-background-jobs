import { Context } from '@temporalio/activity';
import axios from 'axios';
import nodemailer from 'nodemailer';
import {
  Application,
  PaymentRequest,
  PaymentResponse,
  DocumentRequest,
  DocumentResponse,
  EmailRequest
} from '../types';
import { findApplicationById, updateApplicationStatus } from '../db/mongodb';

const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '1025'),
  secure: false,
  auth: process.env.SMTP_USER ? {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  } : undefined
});

export async function queryApplicationData(applicationId: string): Promise<Application> {
  const logger = Context.current().logger;
  logger.info('Querying application data', { applicationId });

  const application = await findApplicationById(applicationId);

  if (!application) {
    throw new Error(`Application not found: ${applicationId}`);
  }

  return application;
}

export async function sendEmail(emailRequest: EmailRequest): Promise<void> {
  const logger = Context.current().logger;
  logger.info('Sending email', { to: emailRequest.to, subject: emailRequest.subject });

  await emailTransporter.sendMail({
    from: process.env.FROM_EMAIL,
    to: emailRequest.to,
    subject: emailRequest.subject,
    html: emailRequest.html,
    attachments: emailRequest.attachments
  });

  logger.info('Email sent successfully');
}

export async function callPaymentService(paymentRequest: PaymentRequest): Promise<PaymentResponse> {
  const logger = Context.current().logger;
  logger.info('Calling payment service', { applicationId: paymentRequest.applicationId });

  try {
    const response = await axios.post(
      `${process.env.PAYMENT_SERVICE_URL}/api/payment/process`,
      paymentRequest,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Payment service response received', { success: response.data.success });
    return response.data;
  } catch (error) {
    logger.error('Payment service call failed', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

export async function callDocumentService(documentRequest: DocumentRequest): Promise<DocumentResponse> {
  const logger = Context.current().logger;
  logger.info('Calling document service', { applicationId: documentRequest.applicationId });

  try {
    const response = await axios.post(
      `${process.env.DOCUMENT_SERVICE_URL}/api/document/generate`,
      documentRequest,
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    logger.info('Document service response received', { success: response.data.success });
    return response.data;
  } catch (error) {
    logger.error('Document service call failed', { error: error.message });
    return {
      success: false,
      error: error.message
    };
  }
}

export async function updateApplicationStatusActivity(
  applicationId: string,
  status: Application['status']
): Promise<void> {
  const logger = Context.current().logger;
  logger.info('Updating application status', { applicationId, status });

  await updateApplicationStatus(applicationId, status);

  logger.info('Application status updated successfully');
}