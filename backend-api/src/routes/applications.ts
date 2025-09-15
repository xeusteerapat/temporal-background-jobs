import { Router, Request, Response } from 'express';
import { Client } from '@temporalio/client';
import { applicationProcessingWorkflow } from '../temporal/workflows';
import { findApplicationById } from '../db/mongodb';

const router = Router();

let temporalClient: Client;

async function getTemporalClient(): Promise<Client> {
  if (!temporalClient) {
    temporalClient = new Client({
      connection: {
        address: process.env.TEMPORAL_ADDRESS || 'localhost:7233'
      }
    });
  }
  return temporalClient;
}

router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.body;

    if (!applicationId) {
      return res.status(400).json({
        success: false,
        error: 'applicationId is required'
      });
    }

    // Verify application exists
    const application = await findApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Application is already ${application.status}`
      });
    }

    // Start workflow
    const client = await getTemporalClient();
    const handle = await client.workflow.start(applicationProcessingWorkflow, {
      args: [{ applicationId }],
      taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'application-processing',
      workflowId: `application-${applicationId}-${Date.now()}`
    });

    res.json({
      success: true,
      workflowId: handle.workflowId,
      runId: handle.firstExecutionRunId,
      message: 'Application processing started'
    });

  } catch (error) {
    console.error('Error starting workflow:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/status/:applicationId', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const application = await findApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      application: {
        applicationId: application.applicationId,
        status: application.status,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting application status:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

router.get('/:applicationId', async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;

    const application = await findApplicationById(applicationId);
    if (!application) {
      return res.status(404).json({
        success: false,
        error: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });

  } catch (error) {
    console.error('Error getting application:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;