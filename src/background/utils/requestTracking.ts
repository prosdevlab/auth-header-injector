/**
 * Pure utility functions for request tracking
 * These are extracted for testability
 */

import type { AuthRule } from '@/shared/types';

export interface DomainStats {
  count: number;
  lastSeen: number;
  ruleIds: string[];
}

export interface RequestStatsMap {
  [domain: string]: DomainStats;
}

/**
 * Extract hostname from a URL string
 * @param url - Full URL string
 * @returns Hostname or null if invalid
 */
export function extractHostname(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

/**
 * Extract domain pattern from a rule pattern
 * Handles both simple wildcards and full URL patterns
 *
 * @param pattern - Rule pattern (e.g., "*.lytics.io" or "*://*.lytics.io/*")
 * @returns Domain pattern (e.g., "*.lytics.io")
 *
 * @example
 * extractDomainPattern("*.lytics.io") // "*.lytics.io"
 * extractDomainPattern("*://*.lytics.io/*") // "*.lytics.io"
 * extractDomainPattern("https://api.example.com/*") // "api.example.com"
 */
export function extractDomainPattern(pattern: string): string {
  // If pattern includes protocol, extract just the domain part
  if (pattern.includes('://')) {
    const match = pattern.match(/^[^:]+:\/\/([^\/]+)/);
    if (match?.[1]) {
      return match[1]; // e.g., "*.lytics.io"
    }
  }
  return pattern;
}

/**
 * Check if a hostname matches a domain pattern
 *
 * @param hostname - The hostname to test (e.g., "api.lytics.io")
 * @param domainPattern - The pattern to match against (e.g., "*.lytics.io")
 * @returns True if hostname matches the pattern
 *
 * @example
 * matchesHostname("api.lytics.io", "*.lytics.io") // true
 * matchesHostname("api.lytics.io", "*.example.com") // false
 * matchesHostname("app.lytics.io", "api.lytics.io") // false
 */
export function matchesHostname(hostname: string, domainPattern: string): boolean {
  try {
    // Convert wildcard pattern to regex
    const pattern = domainPattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    const regex = new RegExp(`^${pattern}$`, 'i');
    return regex.test(hostname);
  } catch {
    return false;
  }
}

/**
 * Find the first rule that matches a given URL
 *
 * @param url - The URL to match against
 * @param rules - Array of auth rules to check
 * @returns The matched rule or null
 */
export function findMatchingRule(url: string, rules: AuthRule[]): AuthRule | null {
  const hostname = extractHostname(url);
  if (!hostname) return null;

  return (
    rules.find((rule) => {
      const domainPattern = extractDomainPattern(rule.pattern);
      return matchesHostname(hostname, domainPattern);
    }) || null
  );
}

/**
 * Update request statistics for a domain
 * Pure function - returns new stats object without mutating input
 *
 * @param currentStats - Current statistics map
 * @param domain - Domain to update stats for
 * @param ruleId - ID of the rule that matched
 * @returns New statistics map with updated values
 */
export function updateStats(
  currentStats: RequestStatsMap,
  domain: string,
  ruleId: string,
): RequestStatsMap {
  const newStats = { ...currentStats };

  // Update or create entry
  if (!newStats[domain]) {
    newStats[domain] = { count: 0, lastSeen: Date.now(), ruleIds: [] };
  } else {
    // Create a new object to avoid mutation
    newStats[domain] = { ...newStats[domain] };
  }

  newStats[domain].count += 1;
  newStats[domain].lastSeen = Date.now();

  // Add rule ID if not already tracked
  if (!newStats[domain].ruleIds.includes(ruleId)) {
    newStats[domain].ruleIds = [...newStats[domain].ruleIds, ruleId];
  }

  return newStats;
}
