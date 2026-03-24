import apiClient from './apiClient';

export const applicationApi = {
    apply: (jobId: string) => apiClient.post(`/Application/${jobId}`),
    getMyApplications: () => apiClient.get('/Application/my-applications'),
    getJobApplications: (jobId: string) => apiClient.get(`/Application/job/${jobId}`),
    updateStatus: (id: string, status: string) => apiClient.put(`/Application/${id}/status`, { status }),
    getMyInvitations: () => apiClient.get('/Application/invitations'),
    viewApplicant: (applicantId: string) => apiClient.post(`/Application/view-applicant/${applicantId}`),
};

