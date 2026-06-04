import React, { createContext, useState, useContext, useEffect } from 'react';
import { storage } from '../utils';
import api from '../services/api';

interface Doctor {
  id: string;
  email: string;
  name: string;
  phone: string;
  district_id: string;
  specialty: string;
  profile_photo?: string;
}

interface AuthContextType {
  doctor: Doctor | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshDoctor: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getItem('accessToken');
      if (token) {
        const response = await api.get('/doctors/me');
        setDoctor(response.data.data);
      }
    } catch (error) {
      // Clear potentially corrupted tokens
      try {
        await storage.deleteItem('accessToken');
        await storage.deleteItem('refreshToken');
      } catch (deleteError) {
      }
      setDoctor(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/doctor/login', { email, password });
      const { accessToken, refreshToken, doctor: doctorData } = response.data.data;

      await storage.setItem('accessToken', accessToken);
      await storage.setItem('refreshToken', refreshToken);

      setDoctor(doctorData);
    } catch (error: any) {
      throw error.response?.data?.error || { message: 'Login failed' };
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
    } finally {
      await storage.deleteItem('accessToken');
      await storage.deleteItem('refreshToken');
      setDoctor(null);
    }
  };

  const refreshDoctor = async () => {
    try {
      const response = await api.get('/doctors/me');
      setDoctor(response.data.data);
    } catch (error) {
    }
  };

  return (
    <AuthContext.Provider value={{ doctor, isLoading, login, logout, refreshDoctor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
