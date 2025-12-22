import type { AuthRule } from '@/shared/types';
import { useMemo } from 'react';

/**
 * Simple pattern matcher - mirrors the logic from Pattern Matcher Plugin
 * Converts Chrome urlFilter wildcards to regex
 */
function matchesPattern(pattern: string, url: string): boolean {
  if (!url) return false;

  // Escape special regex characters except *
  const regexPattern = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');

  const regex = new RegExp(`^${regexPattern}$`, 'i');
  return regex.test(url);
}

/**
 * Hook to filter rules that match the current URL
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
