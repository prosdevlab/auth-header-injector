import type { AuthRule } from '@/shared/types';
import { useMemo } from 'react';

/**
 * Pattern matcher - mirrors the logic from Pattern Matcher Plugin
 * Chrome's urlFilter matches substrings within URLs, not exact matches
 */
function matchesPattern(pattern: string, url: string): boolean {
  if (!url) return false;

  // Normalize to lowercase (Chrome is case-insensitive)
  const normalizedUrl = url.toLowerCase();
  const normalizedPattern = pattern.toLowerCase();

  // Chrome's urlFilter uses substring matching with wildcard support
  if (normalizedPattern.includes('*')) {
    // Convert wildcard pattern to regex (substring match, not exact)
    // Escape special regex characters except *
    const regexPattern = normalizedPattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
      .replace(/\*/g, '.*'); // Convert * to .*

    // No anchors - substring match like Chrome's urlFilter
    const regex = new RegExp(regexPattern, 'i');
    return regex.test(normalizedUrl);
  }
  // Simple substring match (Chrome's default behavior)
  return normalizedUrl.includes(normalizedPattern);
}

/**
 * Hook to filter rules that match the current URL
 * Used for page-specific UI (e.g., "Active on This Page" section)
 */
export function useMatchedRules(rules: AuthRule[], currentUrl: string | null) {
  const matchedRules = useMemo(() => {
    if (!currentUrl) return [];

    return rules.filter((rule) => {
      // Only match enabled rules
      if (!rule.enabled) return false;
      return matchesPattern(rule.pattern, currentUrl);
    });
  }, [rules, currentUrl]);

  return matchedRules;
}
