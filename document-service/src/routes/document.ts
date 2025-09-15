import type { Request, Response, Router } from 'express';
import express from 'express';
import { DocumentGeneratorService } from '../services/document-generator';
import { DocumentRequest } from '../types';

const router: Router = express.Router();
const documentGenerator = new DocumentGeneratorService();

router.post('/submit', async (req: Request, res: Response) => {
	try {
		const documentRequest: DocumentRequest = req.body;

		// Validate required fields
		if (
			!documentRequest.applicationId ||
			!documentRequest.templateType ||
			!documentRequest.data
		) {
			return res.status(400).json({
				success: false,
				error: 'Missing required fields: applicationId, templateType, data',
			});
		}

		console.log(`Received document generation request`, {
			applicationId: documentRequest.applicationId,
			templateType: documentRequest.templateType,
		});

		const result = await documentGenerator.generateDocument(documentRequest);

		// Return appropriate status code based on result
		const statusCode = result.success ? 200 : 400;
		res.status(statusCode).json(result);
	} catch (error) {
		console.error('Error generating document:', error);
		res.status(500).json({
			success: false,
			error: 'Internal server error',
		});
	}
});

export default router;
