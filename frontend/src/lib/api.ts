import axios from 'axios';
import { SubmitResponse, StatusResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const submitApplication = async (applicationType: string): Promise<SubmitResponse> => {
  const response = await api.post('/applications/submit', { applicationType });
  return response.data;
};

export const getApplicationStatus = async (applicationId: string): Promise<StatusResponse> => {
  const response = await api.get(`/applications/status/${applicationId}`);
  return response.data;
};