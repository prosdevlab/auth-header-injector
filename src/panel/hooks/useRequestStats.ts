import { useEffect, useState } from 'react';

export interface DomainStats {
  count: number;
  lastSeen: number;
  ruleIds: string[];
}

export interface RequestStats {
  [domain: string]: DomainStats;
}

/**
 * Hook to read request statistics from storage
 */
export function useRequestStats() {
  const [stats, setStats] = useState<RequestStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await chrome.storage.local.get('request_stats');
        setStats(result.request_stats || {});
      } catch (error) {
        console.error('[useRequestStats] Failed to load stats:', error);
        setStats({});
      } finally {
        setLoading(false);
      }
    };

    loadStats();

    // Listen for storage changes
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local' && changes.request_stats) {
        setStats(changes.request_stats.newValue || {});
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  /**
   * Get request count for a specific domain
   */
  const getCountForDomain = (domain: string): number => {
    return stats[domain]?.count || 0;
  };

  /**
   * Get total request count across all tracked domains
   * (shows all matched requests regardless of current page)
   */
  const getTotalCount = (): number => {
    return Object.values(stats).reduce((sum, stat) => sum + stat.count, 0);
  };

  /**
   * Get all rule IDs that have intercepted at least one request
   * Used to determine which rules are "active" globally
   */
  const getActiveRuleIds = (): Set<string> => {
    const activeIds = new Set<string>();

    for (const stat of Object.values(stats)) {
      for (const id of stat.ruleIds) {
        activeIds.add(id);
      }
    }

    return activeIds;
  };

  /**
   * Get request count for tracked domains that match the given rule patterns
   * Used to show page-specific stats in the context bar
   */
  const getCountForRules = (rulePatterns: string[]): number => {
    if (rulePatterns.length === 0) return 0;

    // Helper to check if a domain matches a rule pattern
    const domainMatchesPattern = (domain: string, pattern: string): boolean => {
      // Convert Chrome urlFilter pattern to regex for matching
      // e.g., "*.lytics.io" → matches "api.lytics.io", "c.lytics.io"
      // e.g., "*://api.example.com/*" → matches "api.example.com"

      // Extract domain part from pattern
      let domainPattern = pattern;

      // Handle full URL patterns: *://domain/* or https://domain/*
      const urlMatch = pattern.match(/^(?:\*|https?):\/\/([^/]+)/);
      if (urlMatch?.[1]) {
        domainPattern = urlMatch[1];
      }

      // Convert wildcard pattern to regex
      // "*.lytics.io" → /^.*\.lytics\.io$/
      const regexPattern = domainPattern
        .replace(/\./g, '\\.') // Escape dots
        .replace(/\*/g, '.*'); // Convert * to .*

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(domain);
    };

    // Sum counts for all tracked domains that match any of the rule patterns
    return Object.entries(stats).reduce((sum, [domain, stat]) => {
      const matchesAnyRule = rulePatterns.some((pattern) => domainMatchesPattern(domain, pattern));
      return matchesAnyRule ? sum + stat.count : sum;
    }, 0);
  };

  /**
   * Clear all request statistics
   */
  const clearStats = async (): Promise<void> => {
    try {
      await chrome.storage.local.remove('request_stats');
      setStats({});
    } catch (error) {
      console.error('[useRequestStats] Failed to clear stats:', error);
      throw error;
    }
  };

  return {
    stats,
    loading,
    getCountForDomain,
    getTotalCount,
    getActiveRuleIds,
    getCountForRules,
    clearStats,
  };
}
