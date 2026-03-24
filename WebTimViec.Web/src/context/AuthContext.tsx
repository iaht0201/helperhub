import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api';

interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'Admin' | 'Employer' | 'Worker';
  workingRole?: 'Employer' | 'Worker';
  phone?: string;
  address?: string;
  skills?: string;
  age?: number;
  gender?: string;
  isSubscribed?: boolean;
  subscriptionTier?: string;
  subscriptionExpiredAt?: string;
  consumedViews?: number;
  consumedApplications?: number;
  maxViews?: number;
  maxApplications?: number;
  preferredCategories?: string;
  preferredLocation?: string;
  nextQuotaResetAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => Promise<void>;
  logout: () => void;
  toggleRole: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const response = await authApi.getMe();
      const userData = response.data;
      
      // Admin bypass: always Enterprise and Unlimited
      if (userData.role === 'Admin') {
        userData.subscriptionTier = 'ENTERPRISE';
        userData.isSubscribed = true;
        userData.maxViews = -1;
        userData.maxApplications = -1;
        userData.subscriptionExpiredAt = '2099-12-31'; // Far future
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    await fetchUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('job_preferences');
    localStorage.removeItem('job_location');
    sessionStorage.removeItem('pref_modal_dismissed');
    setToken(null);
    setUser(null);
  };

  const toggleRole = async () => {
    try {
      const response = await authApi.toggleRole();
      if (user) {
        setUser({ ...user, workingRole: response.data.role });
      }
    } catch (error) {
      console.error('Failed to toggle role', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, toggleRole, refreshUser: fetchUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
