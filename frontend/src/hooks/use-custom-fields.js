import { useState } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export function useCustomFields() {
  const [fields, setFields] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all custom fields
  const getAllFields = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/custom-fields');
      if (response.data.success) {
        setFields(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch custom fields';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get custom field by name
  const getFieldByName = async (name) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/custom-fields/name/${name}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch custom field';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Get custom field by ID
  const getFieldById = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`/custom-fields/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch custom field';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create custom field
  const createField = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.post('/custom-fields', data);
      if (response.data.success) {
        toast.success('Custom field created successfully');
        return response.data.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to create custom field';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update custom field
  const updateField = async (id, data) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.put(`/custom-fields/${id}`, data);
      if (response.data.success) {
        toast.success('Custom field updated successfully');
        return response.data.data;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to update custom field';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete custom field
  const deleteField = async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.delete(`/custom-fields/${id}`);
      if (response.data.success) {
        toast.success('Custom field deleted successfully');
        return true;
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to delete custom field';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    fields,
    isLoading,
    error,
    getAllFields,
    getFieldByName,
    getFieldById,
    createField,
    updateField,
    deleteField,
  };
} 