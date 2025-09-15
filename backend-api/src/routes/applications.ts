import { Router, Request, Response } from 'express';
import { Client, Connection } from '@temporalio/client';
import { applicationProcessingWorkflow } from '../temporal/workflows';
import { findApplicationById, createApplication } from '../db/mongodb';
import { faker } from '@faker-js/faker';
import { logger } from '../libs/logger';

const router: Router = Router();

let temporalClient: Client | null = null;

async function getTemporalClient(): Promise<Client> {
	if (!temporalClient) {
		try {
			logger.info(
				`Connecting to Temporal server at: ${process.env.TEMPORAL_ADDRESS || 'localhost:7233'}`
			);

			const connection = await Connection.connect({
				address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
			});

			temporalClient = new Client({
				connection,
			});

			logger.info('Temporal client connected successfully');
		} catch (error) {
			logger.error(error, 'Failed to connect to Temporal server:');

			throw new Error(
				'Temporal server unavailable. Please ensure Temporal is running.'
			);
		}
	}

	return temporalClient;
}

router.post('/submit', async (req: Request, res: Response) => {
	try {
		const { applicationType } = req.body;
		logger.info(`Starting submit application with: ${applicationType}`);

		// Default to 'loan' if not specified
		const type = applicationType || 'loan';

		// Generate fake application data
		const applicationId = `app-${faker.string.alphanumeric(8)}`;
		const firstName = faker.person.firstName();
		const lastName = faker.person.lastName();
		const email = faker.internet.email({ firstName, lastName });

		const applicationData = {
			applicationId,
			firstName,
			lastName,
			email,
			applicationData: {
				type,
				amount: faker.number.int({ min: 10000, max: 500000 }),
				documents: [
					'id',
					'income_proof',
					...(type === 'mortgage' ? ['property_docs'] : []),
				],
			},
			status: 'pending' as const,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		// Create application in database
		const application = await createApplication(applicationData);
		logger.info(`Success create application: ${application.applicationId}`);

		// Start workflow
		const client = await getTemporalClient();
		const handle = await client.workflow.start(applicationProcessingWorkflow, {
			args: [{ applicationId }],
			taskQueue: process.env.TEMPORAL_TASK_QUEUE || 'application-processing',
			workflowId: `application-${applicationId}-${Date.now()}`,
		});

		res.json({
			success: true,
			applicationId,
			workflowId: handle.workflowId,
			runId: handle.firstExecutionRunId,
			message: 'Application created and processing started',
			application: {
				applicationId: application.applicationId,
				firstName: application.firstName,
				lastName: application.lastName,
				email: application.email,
				type: application.applicationData.type,
				amount: application.applicationData.amount,
			},
		});

		// Don't close connection - reuse it
	} catch (error: any) {
		logger.error(error, 'Error starting workflow:');

		let errorMessage = 'Internal server error';
		if (error.message?.includes('Temporal server unavailable')) {
			errorMessage =
				'Temporal server is not available. Please check if Temporal is running.';
		} else if (error.message?.includes('gRPC')) {
			errorMessage = 'Connection error with Temporal server. Please try again.';
		}

		res.status(500).json({
			success: false,
			error: errorMessage,
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
				error: 'Application not found',
			});
		}

		res.json({
			success: true,
			application: {
				applicationId: application.applicationId,
				status: application.status,
				createdAt: application.createdAt,
				updatedAt: application.updatedAt,
			},
		});
	} catch (error) {
		logger.error(error, 'Error getting application status:');

		res.status(500).json({
			success: false,
			error: 'Internal server error',
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
				error: 'Application not found',
			});
		}

		res.json({
			success: true,
			application,
		});
	} catch (error) {
		logger.error(error, 'Error getting application:');

		res.status(500).json({
			success: false,
			error: 'Internal server error',
		});
	}
});

// Health check for Temporal connectivity
router.get('/health/temporal', async (req: Request, res: Response) => {
	try {
		const client = await getTemporalClient();
		// Try to get workflow service info to test connectivity
		const service = await client.workflowService.getSystemInfo({});
		logger.info({
			action: 'temporal-health-check-success',
			data: service.toJSON(),
		});

		res.json({
			success: true,
			temporal: 'connected',
			address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
		});
	} catch (error: any) {
		logger.error(error, 'Temporal health check failed:');

		res.status(503).json({
			success: false,
			temporal: 'disconnected',
			error: error.message || 'Temporal connection failed',
		});
	}
});

export default router;
