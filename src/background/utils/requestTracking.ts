/**
 * Pure utility functions for request tracking and rule matching
 * These are extracted for testability
 */

import type { AuthRule } from '@/shared/types';

/**
 * Calculate pattern specificity (higher = more specific)
 * More specific patterns have fewer wildcards and more specific parts
 *
 * This is a pure function used to determine rule priority when multiple rules match.
 * Higher specificity = higher priority = rule wins when multiple match.
 *
 * @param pattern - URL pattern (e.g., "*.api.com", "api.staging.com")
 * @returns Specificity score (higher = more specific)
 *
 * @example
 * calculateSpecificity("api.staging.com") // Higher (more specific)
 * calculateSpecificity("*.api.com") // Lower (less specific)
 * calculateSpecificity("*.com") // Lowest (least specific)
 */
export function calculateSpecificity(pattern: string): number {
  // Remove protocol if present (e.g., "https://" or "*://")
  const cleanPattern = pattern.replace(/^[^:]+:\/\//, '').replace(/\/.*$/, '');

  // Count wildcards (fewer = more specific)
  const wildcardCount = (cleanPattern.match(/\*/g) || []).length;

  // Count specific parts (more = more specific)
  const parts = cleanPattern.split('.');
  const specificParts = parts.filter((p) => p !== '*' && p.length > 0).length;

  // More specific = more parts, fewer wildcards
  // Weight: parts * 10 - wildcards
  // This ensures patterns with more specific parts rank higher
  return specificParts * 10 - wildcardCount;
}

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
 * Check if a domain matches a rule pattern
 * Handles both simple domain patterns and full URL patterns with protocol
 *
 * @param domain - The domain to test (e.g., "api.lytics.io")
 * @param rulePattern - The rule pattern (e.g., "*.lytics.io" or "*://*.lytics.io/*")
 * @returns True if domain matches the pattern
 *
 * @example
 * domainMatchesRulePattern("api.lytics.io", "*.lytics.io") // true
 * domainMatchesRulePattern("api.lytics.io", "*://*.lytics.io/*") // true
 * domainMatchesRulePattern("api.lytics.io", "https://api.example.com/*") // false
 */
export function domainMatchesRulePattern(domain: string, rulePattern: string): boolean {
  const domainPattern = extractDomainPattern(rulePattern);
  return matchesHostname(domain, domainPattern);
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
