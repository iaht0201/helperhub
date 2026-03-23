import apiClient from './apiClient';

export const notificationApi = {
    getNotifications: () => apiClient.get('/notification'),
    markAsRead: (id: string) => apiClient.post(`/notification/${id}/read`),
    markAllAsRead: () => apiClient.post('/notification/read-all'),
};
