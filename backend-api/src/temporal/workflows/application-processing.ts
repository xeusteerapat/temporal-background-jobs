import { proxyActivities, log } from '@temporalio/workflow';
import type * as activities from '../activities';
import { WorkflowInput } from '../../types';

const {
  queryApplicationData,
  sendEmail,
  callPaymentService,
  callDocumentService,
  updateApplicationStatusActivity
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
  retry: {
    initialInterval: '1s',
    maximumInterval: '30s',
    backoffCoefficient: 2,
    maximumAttempts: 3
  }
});

export async function applicationProcessingWorkflow(input: WorkflowInput): Promise<string> {
  const { applicationId } = input;

  log.info('Starting application processing workflow', { applicationId });

  try {
    // Step 1: Update status to processing
    await updateApplicationStatusActivity(applicationId, 'processing');

    // Step 2: Query application data
    const applicationData = await queryApplicationData(applicationId);

    // Step 3: Send confirmation email
    await sendEmail({
      to: applicationData.email,
      subject: 'Application Received - Processing Started',
      html: `
        <h2>Application Processing Started</h2>
        <p>Dear ${applicationData.firstName} ${applicationData.lastName},</p>
        <p>We have received your ${applicationData.applicationData.type} application (ID: ${applicationId}) and processing has begun.</p>
        <p>You will receive updates as we progress through the approval process.</p>
        <p>Best regards,<br>Application Processing Team</p>
      `
    });

    // Step 4: Process payment
    const paymentResult = await callPaymentService({
      applicationId,
      amount: applicationData.applicationData.amount,
      customerEmail: applicationData.email
    });

    if (!paymentResult.success) {
      throw new Error(`Payment processing failed: ${paymentResult.error}`);
    }

    log.info('Payment processed successfully', {
      applicationId,
      transactionId: paymentResult.transactionId
    });

    // Step 5: Generate documents
    const documentResult = await callDocumentService({
      applicationId,
      templateType: applicationData.applicationData.type,
      data: {
        ...applicationData,
        transactionId: paymentResult.transactionId
      }
    });

    if (!documentResult.success) {
      throw new Error(`Document generation failed: ${documentResult.error}`);
    }

    log.info('Documents generated successfully', {
      applicationId,
      documentId: documentResult.documentId
    });

    // Step 6: Send completion email
    await sendEmail({
      to: applicationData.email,
      subject: 'Application Approved - Documents Ready',
      html: `
        <h2>Application Approved!</h2>
        <p>Dear ${applicationData.firstName} ${applicationData.lastName},</p>
        <p>Great news! Your ${applicationData.applicationData.type} application (ID: ${applicationId}) has been approved.</p>
        <p>Your documents have been generated and are ready for download.</p>
        <p><strong>Transaction ID:</strong> ${paymentResult.transactionId}</p>
        <p><strong>Document ID:</strong> ${documentResult.documentId}</p>
        ${documentResult.downloadUrl ? `<p><a href="${documentResult.downloadUrl}">Download Documents</a></p>` : ''}
        <p>Best regards,<br>Application Processing Team</p>
      `
    });

    // Step 7: Update final status
    await updateApplicationStatusActivity(applicationId, 'completed');

    log.info('Application processing workflow completed successfully', { applicationId });

    return `Application ${applicationId} processed successfully`;

  } catch (error) {
    log.error('Application processing workflow failed', { applicationId, error: error.message });

    // Update status to failed
    await updateApplicationStatusActivity(applicationId, 'failed');

    // Send failure notification
    try {
      const applicationData = await queryApplicationData(applicationId);
      await sendEmail({
        to: applicationData.email,
        subject: 'Application Processing Failed',
        html: `
          <h2>Application Processing Failed</h2>
          <p>Dear ${applicationData.firstName} ${applicationData.lastName},</p>
          <p>We encountered an issue while processing your application (ID: ${applicationId}).</p>
          <p>Please contact our support team for assistance.</p>
          <p>Error: ${error.message}</p>
          <p>Best regards,<br>Application Processing Team</p>
        `
      });
    } catch (emailError) {
      log.error('Failed to send failure notification email', {
        applicationId,
        emailError: emailError.message
      });
    }

    throw error;
  }
}