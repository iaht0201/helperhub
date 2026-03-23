import apiClient from './apiClient';

export const jobApi = {
    getAllJobs: (params?: any) => apiClient.get('/jobs', { params }),
    getJobById: (id: string) => apiClient.get(`/jobs/${id}`),
    createJob: (data: any) => apiClient.post('/jobs', data),
    getMyJobs: () => apiClient.get('/jobs/my'),
    deleteJob: (id: string) => apiClient.delete(`/jobs/${id}`),
    suggestWorkers: (jobId: string) => apiClient.get(`/jobs/${jobId}/suggest-workers`),
    viewJobInfo: (id: string) => apiClient.post(`/jobs/${id}/view-info`),
};
