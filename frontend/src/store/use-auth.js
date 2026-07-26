import { create } from 'zustand';
import api from '@/lib/axios';
import Cookies from 'js-cookie';

// Helper functions for localStorage
const setLocalStorage = (key, value) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

const removeLocalStorage = (key) => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(key);
  }
};

const getLocalStorage = (key) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }
  return null;
};

export const useAuth = create((set) => ({
  user: getLocalStorage('user'),
  isLoading: false,
  error: null,

  register: async (userData) => {
    try {
      set({ isLoading: true, error: null });
      const response = await api.post('/auth/register', userData);
      const { success, message, data } = response.data;
      
      if (!success) {
        throw new Error(message || 'Registration failed');
      }
      
      // Set auth token in cookie
      Cookies.set('auth-token', data.token, { path: '/' });
      
      // Store user data in localStorage
      setLocalStorage('user', data.user);
      
      set({ user: data.user, isLoading: false });

      // Return the role for redirection
      return data.user.role;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  login: async (data) => {
    try {
      set({ isLoading: true, error: null });
      
      // If token and user are provided directly, use them
      if (data.token && data.user) {
        // Set auth token in cookie
        Cookies.set('auth-token', data.token, { path: '/' });
        
        // Store user data in localStorage
        setLocalStorage('user', data.user);
        
        set({ user: data.user, isLoading: false });
        return data.user.role;
      }
      
      // Otherwise, make a login request
      const response = await api.post('/auth/login', data);
      const { success, message, data: responseData } = response.data;
      
      if (!success) {
        throw new Error(message || 'Login failed');
      }
      
      // Set auth token in cookie
      Cookies.set('auth-token', responseData.token, { path: '/' });
      
      // Store user data in localStorage
      setLocalStorage('user', responseData.user);
      
      set({ user: responseData.user, isLoading: false });
      return responseData.user.role;
    } catch (error) {
      set({ 
        error: error.response?.data?.message || error.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: () => {
    // Remove auth token from cookie
    Cookies.remove('auth-token', { path: '/' });
    
    // Remove user data from localStorage
    removeLocalStorage('user');
    
    set({ user: null });
    window.location.href = '/auth/login';
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/profile');
      const { success, data } = response.data;
      
      if (!success) {
        throw new Error('Failed to get profile');
      }
      
      // Update user data in localStorage
      setLocalStorage('user', data.user);
      
      set({ user: data.user });
      return data.user;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message });
      throw error;
    }
  },

  // Check if user is authenticated and get their role
  checkAuth: async () => {
    try {
      const token = Cookies.get('auth-token');
      if (!token) {
        removeLocalStorage('user');
        set({ user: null });
        return null;
      }

      const response = await api.get('/auth/profile');
      const { success, data } = response.data;
      
      if (!success) {
        throw new Error('Authentication failed');
      }
      
      // Update user data in localStorage
      setLocalStorage('user', data.user);
      
      set({ user: data.user });
      return data.user.role;
    } catch (error) {
      Cookies.remove('auth-token', { path: '/' });
      removeLocalStorage('user');
      set({ user: null });
      return null;
    }
  },
})); 