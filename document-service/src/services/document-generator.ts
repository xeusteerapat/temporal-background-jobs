import { v4 as uuidv4 } from 'uuid';
import { DocumentRequest, DocumentResponse } from '../types';

export class DocumentGeneratorService {
  private processingDelay: number;

  constructor() {
    this.processingDelay = parseInt(process.env.DOCUMENT_GENERATION_DELAY_MS || '3000');
  }

  async generateDocument(request: DocumentRequest): Promise<DocumentResponse> {
    const startTime = Date.now();
    const documentId = `doc_${uuidv4()}`;
    const fileName = `${request.applicationId}_${request.templateType}_${Date.now()}.pdf`;

    console.log(`Generating document for application ${request.applicationId}`, {
      documentId,
      templateType: request.templateType,
      fileName
    });

    // Simulate document generation delay
    await this.delay(this.processingDelay);

    // Simulate success (95% success rate)
    const isSuccess = Math.random() < 0.95;
    const processingTime = Date.now() - startTime;

    if (isSuccess) {
      const downloadUrl = `${process.env.DOCUMENT_BASE_URL}/${documentId}/${fileName}`;

      console.log(`Document generated successfully for application ${request.applicationId}`, {
        documentId,
        fileName,
        processingTime
      });

      return {
        success: true,
        documentId,
        downloadUrl,
        fileName,
        processingTime
      };
    } else {
      const errorMessage = 'Document generation failed';
      console.log(`Document generation failed for application ${request.applicationId}`, {
        documentId,
        error: errorMessage,
        processingTime
      });

      return {
        success: false,
        documentId,
        error: errorMessage,
        processingTime
      };
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}