export interface DocumentRequest {
  applicationId: string;
  templateType: string;
  data: Record<string, any>;
}

export interface DocumentResponse {
  success: boolean;
  documentId?: string;
  downloadUrl?: string;
  fileName?: string;
  error?: string;
  processingTime?: number;
}