import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { toast } from 'sonner';

export function useSettings(keyName) {
  const [value, setValue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSetting = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/settings/key/${keyName}`);
        if (response.data.success) {
          setValue(response.data.data.value);
        } else {
          setError('Failed to load setting');
          toast.error(`Failed to load ${keyName} setting`);
        }
      } catch (error) {
        console.error(`Error loading ${keyName} setting:`, error);
        setError(error.message);
        toast.error(`Failed to load ${keyName} setting`);
      } finally {
        setIsLoading(false);
      }
    };

    if (keyName) {
      fetchSetting();
    }
  }, [keyName]);

  return { value, isLoading, error };
}

// Hook for multiple settings
export function useMultipleSettings(keys = []) {
  const [values, setValues] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const promises = keys.map(key => 
          api.get(`/settings/key/${key}`)
            .then(response => ({
              key,
              value: response.data.success ? response.data.data.value : null
            }))
            .catch(error => ({
              key,
              value: null
            }))
        );

        const results = await Promise.all(promises);
        const settingsObject = results.reduce((acc, { key, value }) => {
          acc[key] = value;
          return acc;
        }, {});

        setValues(settingsObject);
      } catch (error) {
        console.error('Error loading settings:', error);
        setError(error.message);
        toast.error('Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    if (keys.length > 0) {
      fetchSettings();
    }
  }, [keys.join(',')]);

  return { values, isLoading, error };
} 