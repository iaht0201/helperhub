import apiClient from './apiClient';

export interface JobCategory {
    id: string;
    code: string;
    name: string;
    iconName?: string;
}

export const categoryApi = {
    getCategories: () => apiClient.get<JobCategory[]>('/categories'),
};
