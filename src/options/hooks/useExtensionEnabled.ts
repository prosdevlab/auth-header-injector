import { useCallback, useEffect, useState } from 'react';

interface UseExtensionEnabledReturn {
  isEnabled: boolean;
  loading: boolean;
  error: string | null;
  toggle: () => Promise<void>;
  setEnabled: (enabled: boolean) => Promise<void>;
}

export function useExtensionEnabled(): UseExtensionEnabledReturn {
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEnabled = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({ type: 'GET_ENABLED' });

      if (response.success) {
        setIsEnabled(response.data ?? true);
      } else {
        setError(response.error || 'Failed to fetch enabled state');
      }
    } catch (err) {
      setError(String(err));
      console.error('[useExtensionEnabled] Error fetching enabled state:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setEnabled = useCallback(async (enabled: boolean) => {
    try {
      setError(null);

      const response = await chrome.runtime.sendMessage({
        type: 'SET_ENABLED',
        data: enabled,
      });

      if (response.success) {
        setIsEnabled(enabled);
      } else {
        throw new Error(response.error || 'Failed to set enabled state');
      }
    } catch (err) {
      setError(String(err));
      console.error('[useExtensionEnabled] Error setting enabled state:', err);
      throw err;
    }
  }, []);

  const toggle = useCallback(async () => {
    await setEnabled(!isEnabled);
  }, [isEnabled, setEnabled]);

  // Initial fetch
  useEffect(() => {
    fetchEnabled();
  }, [fetchEnabled]);

  return {
    isEnabled,
    loading,
    error,
    toggle,
    setEnabled,
  };
}
