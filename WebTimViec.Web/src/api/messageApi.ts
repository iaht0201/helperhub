import apiClient from './apiClient';

export const messageApi = {
    getInbox: () => apiClient.get('/message/inbox'),
    getConversation: (jobId: string, userId: string) => apiClient.get(`/message/conversation/${jobId}/${userId}`),
    sendMessage: (data: any) => apiClient.post('/message', data),
};
