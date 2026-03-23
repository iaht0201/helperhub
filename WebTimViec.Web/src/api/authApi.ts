import apiClient from './apiClient';

export const authApi = {
    getMe: () => apiClient.get('/auth/me'),
    login: (data: any) => apiClient.post('/auth/login', data),
    register: (data: any) => apiClient.post('/auth/register', data),
    googleLogin: (data: any) => apiClient.post('/auth/google-login', data),
    verifyEmail: (email: string, token: string) => 
        apiClient.post(`/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`),
    updateProfile: (data: any) => apiClient.put('/auth/profile', data),
    toggleRole: () => apiClient.post('/auth/toggle-role'),
};
