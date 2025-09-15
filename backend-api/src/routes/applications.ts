import { Router, Request, Response } from 'express';
import { Client, Connection } from '@temporalio/client';
import { applicationProcessingWorkflow } from '../temporal/workflows';
import { findApplicationById, createApplication } from '../db/mongodb';
import { faker } from '@faker-js/faker';

const router: Router = Router();

let temporalClient: Client | null = null;

async function getTemporalClient(): Promise<Client> {
	if (!temporalClient) {
		try {
			console.log('Connecting to Temporal server at:', process.env.TEMPORAL_ADDRESS || 'localhost:7233');

			const connection = await Connection.connect({
				address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
			});

			temporalClient = new Client({
				connection,
			});

			console.log('Temporal client connected successfully');
		} catch (error) {
			console.error('Failed to connect to Temporal server:', error);
			throw new Error('Temporal server unavailable. Please ensure Temporal is running.');
		}
	}

	return temporalClient;
}

router.post('/submit', async (req: Request, res: Response) => {
	try {
		const { applicationType } = req.body;

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
				documents: ['id', 'income_proof', ...(type === 'mortgage' ? ['property_docs'] : [])]
			},
			status: 'pending' as const,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		// Create application in database
		const application = await createApplication(applicationData);

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
				amount: application.applicationData.amount
			}
		});

		// Don't close connection - reuse it
	} catch (error: any) {
		console.error('Error starting workflow:', error);

		let errorMessage = 'Internal server error';
		if (error.message?.includes('Temporal server unavailable')) {
			errorMessage = 'Temporal server is not available. Please check if Temporal is running.';
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
		console.error('Error getting application status:', error);
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
		console.error('Error getting application:', error);
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
		await client.workflowService.getSystemInfo({});

		res.json({
			success: true,
			temporal: 'connected',
			address: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
		});
	} catch (error: any) {
		console.error('Temporal health check failed:', error);
		res.status(503).json({
			success: false,
			temporal: 'disconnected',
			error: error.message || 'Temporal connection failed',
		});
	}
});

export default router;
