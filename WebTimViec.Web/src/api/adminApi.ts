import apiClient from './apiClient';

export const adminApi = {
    getStats: () => apiClient.get('/admin/stats'),
    getUsers: () => apiClient.get('/admin/users'),
    getJobs: () => apiClient.get('/admin/jobs'),
    getPackages: () => apiClient.get('/admin/packages'),
    toggleUserStatus: (id: string) => apiClient.post(`/admin/toggle-user/${id}`),
    deleteUser: (id: string) => apiClient.delete(`/admin/users/${id}`),
    updateUser: (id: string, data: any) => apiClient.put(`/admin/users/${id}`, data),
    approveJob: (id: string) => apiClient.post(`/admin/jobs/${id}/approve`),
    rejectJob: (id: string) => apiClient.post(`/admin/jobs/${id}/reject`),
    deleteJob: (id: string) => apiClient.delete(`/admin/jobs/${id}`),
    createPackage: (data: any) => apiClient.post('/admin/packages', data),
    updatePackage: (id: string, data: any) => apiClient.put(`/admin/packages/${id}`, data),
    deletePackage: (id: string) => apiClient.delete(`/admin/packages/${id}`),
    togglePackageStatus: (id: string) => apiClient.post(`/admin/packages/${id}/toggle-active`),
    assignPackage: (userId: string, packageCode: string) => apiClient.post(`/admin/users/${userId}/assign-package`, { packageCode }),
    getSubscriptions: () => apiClient.get('/admin/subscriptions'),
};
