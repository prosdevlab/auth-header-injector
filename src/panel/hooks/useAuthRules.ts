import type { AuthRule } from '@/shared/types';
import { useCallback, useEffect, useState } from 'react';

interface UseAuthRulesReturn {
  rules: AuthRule[];
  loading: boolean;
  error: string | null;
  addRule: (rule: Omit<AuthRule, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateRule: (id: string, updates: Partial<AuthRule>) => Promise<void>;
  deleteRule: (id: string) => Promise<void>;
  refreshRules: () => Promise<void>;
}

export function useAuthRules(): UseAuthRulesReturn {
  const [rules, setRules] = useState<AuthRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await chrome.runtime.sendMessage({ type: 'GET_RULES' });

      if (response.success) {
        setRules(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch rules');
      }
    } catch (err) {
      setError(String(err));
      console.error('[useAuthRules] Error fetching rules:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const saveRules = useCallback(async (newRules: AuthRule[]) => {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SET_RULES',
        data: newRules,
      });

      if (response.success) {
        setRules(newRules);
      } else {
        throw new Error(response.error || 'Failed to save rules');
      }
    } catch (err) {
      setError(String(err));
      console.error('[useAuthRules] Error saving rules:', err);
      throw err;
    }
  }, []);

  const addRule = useCallback(
    async (rule: Omit<AuthRule, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newRule: AuthRule = {
        ...rule,
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const newRules = [...rules, newRule];
      await saveRules(newRules);
    },
    [rules, saveRules],
  );

  const updateRule = useCallback(
    async (id: string, updates: Partial<AuthRule>) => {
      const newRules = rules.map((rule) =>
        rule.id === id ? { ...rule, ...updates, updatedAt: Date.now() } : rule,
      );
      await saveRules(newRules);
    },
    [rules, saveRules],
  );

  const deleteRule = useCallback(
    async (id: string) => {
      const newRules = rules.filter((rule) => rule.id !== id);
      await saveRules(newRules);
    },
    [rules, saveRules],
  );

  // Initial fetch
  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return {
    rules,
    loading,
    error,
    addRule,
    updateRule,
    deleteRule,
    refreshRules: fetchRules,
  };
}
