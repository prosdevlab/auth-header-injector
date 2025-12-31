import { domainMatchesRulePattern } from '@/background/utils/requestTracking';
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

    // Sum counts for all tracked domains that match any of the rule patterns
    return Object.entries(stats).reduce((sum, [domain, stat]) => {
      const matchesAnyRule = rulePatterns.some((pattern) =>
        domainMatchesRulePattern(domain, pattern),
      );
      return matchesAnyRule ? sum + stat.count : sum;
    }, 0);
  };

  /**
   * Get the most recent lastSeen timestamp for domains matching the given rule patterns
   * Used to show "last seen" time in the context bar
   */
  const getLastSeenForRules = (rulePatterns: string[]): number | null => {
    if (rulePatterns.length === 0) return null;

    // Find the most recent lastSeen timestamp
    let mostRecent: number | null = null;
    for (const [domain, stat] of Object.entries(stats)) {
      const matchesAnyRule = rulePatterns.some((pattern) =>
        domainMatchesRulePattern(domain, pattern),
      );
      if (matchesAnyRule && (mostRecent === null || stat.lastSeen > mostRecent)) {
        mostRecent = stat.lastSeen;
      }
    }
    return mostRecent;
  };

  /**
   * Get request count for a specific rule ID
   * Sums up all requests from domains where this rule has intercepted requests
   */
  const getCountForRule = (ruleId: string): number => {
    let total = 0;
    for (const stat of Object.values(stats)) {
      if (stat.ruleIds.includes(ruleId)) {
        total += stat.count;
      }
    }
    return total;
  };

  /**
   * Get domain-level stats for domains matching the given rule patterns
   * Returns array of domains with their stats, sorted by most recent
   */
  const getDomainsForRules = (
    rulePatterns: string[],
  ): Array<{ domain: string; stat: DomainStats }> => {
    if (rulePatterns.length === 0) return [];

    // Get domains that match any of the patterns
    const matchingDomains = Object.entries(stats)
      .filter(([domain]) =>
        rulePatterns.some((pattern) => domainMatchesRulePattern(domain, pattern)),
      )
      .map(([domain, stat]) => ({ domain, stat }))
      .sort((a, b) => b.stat.lastSeen - a.stat.lastSeen); // Most recent first

    return matchingDomains;
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
    getLastSeenForRules,
    getCountForRule,
    getDomainsForRules,
    clearStats,
  };
}
