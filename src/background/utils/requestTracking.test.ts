import { describe, expect, it } from 'vitest';
import {
  calculateSpecificity,
  domainMatchesRulePattern,
  extractDomainPattern,
  matchesHostname,
} from './requestTracking';

describe('calculateSpecificity', () => {
  it('should return higher specificity for more specific patterns', () => {
    const specific = calculateSpecificity('api.staging.example.com');
    const lessSpecific = calculateSpecificity('*.example.com');
    const leastSpecific = calculateSpecificity('*.com');

    expect(specific).toBeGreaterThan(lessSpecific);
    expect(lessSpecific).toBeGreaterThan(leastSpecific);
  });

  it('should handle patterns with protocols', () => {
    const withProtocol = calculateSpecificity('https://api.example.com');
    const withoutProtocol = calculateSpecificity('api.example.com');

    expect(withProtocol).toBe(withoutProtocol);
  });

  it('should handle patterns with paths', () => {
    const withPath = calculateSpecificity('api.example.com/*');
    const withoutPath = calculateSpecificity('api.example.com');

    expect(withPath).toBe(withoutPath);
  });

  it('should penalize wildcards', () => {
    const noWildcard = calculateSpecificity('api.example.com');
    const oneWildcard = calculateSpecificity('*.example.com');
    const twoWildcards = calculateSpecificity('*.*.com');

    expect(noWildcard).toBeGreaterThan(oneWildcard);
    expect(oneWildcard).toBeGreaterThan(twoWildcards);
  });

  it('should reward more specific parts', () => {
    const threeParts = calculateSpecificity('api.staging.example.com');
    const twoParts = calculateSpecificity('api.example.com');
    const onePart = calculateSpecificity('example.com');

    expect(threeParts).toBeGreaterThan(twoParts);
    expect(twoParts).toBeGreaterThan(onePart);
  });

  it('should handle edge cases', () => {
    expect(calculateSpecificity('*')).toBeLessThan(0);
    expect(calculateSpecificity('com')).toBeGreaterThan(0);
    expect(calculateSpecificity('')).toBe(0);
  });

  it('should produce deterministic results', () => {
    const pattern = '*.api.example.com';
    const result1 = calculateSpecificity(pattern);
    const result2 = calculateSpecificity(pattern);

    expect(result1).toBe(result2);
  });

  it('should correctly order real-world examples', () => {
    const examples = [
      'api.staging.example.com', // 3 parts, 0 wildcards = 30
      'api.example.com', // 2 parts, 0 wildcards = 20
      '*.staging.example.com', // 2 parts, 1 wildcard = 19
      'example.com', // 1 part, 0 wildcards = 10
      '*.example.com', // 1 part, 1 wildcard = 9
      '*.com', // 0 parts, 1 wildcard = -1
    ];

    const specificities = examples.map((p) => ({
      pattern: p,
      specificity: calculateSpecificity(p),
    }));

    // Verify descending order (most specific first)
    for (let i = 0; i < specificities.length - 1; i++) {
      const current = specificities[i];
      const next = specificities[i + 1];
      if (current && next) {
        expect(current.specificity).toBeGreaterThanOrEqual(next.specificity);
      }
    }
  });
});

describe('extractDomainPattern', () => {
  it('should return pattern as-is when no protocol', () => {
    expect(extractDomainPattern('*.lytics.io')).toBe('*.lytics.io');
    expect(extractDomainPattern('api.example.com')).toBe('api.example.com');
  });

  it('should extract domain from full URL pattern', () => {
    expect(extractDomainPattern('*://*.lytics.io/*')).toBe('*.lytics.io');
    expect(extractDomainPattern('https://api.example.com/*')).toBe('api.example.com');
    expect(extractDomainPattern('http://*.test.com/path')).toBe('*.test.com');
  });

  it('should handle patterns with wildcard protocol', () => {
    expect(extractDomainPattern('*://api.example.com/*')).toBe('api.example.com');
  });
});

describe('matchesHostname', () => {
  it('should match exact hostname', () => {
    expect(matchesHostname('api.lytics.io', 'api.lytics.io')).toBe(true);
    expect(matchesHostname('api.lytics.io', 'c.lytics.io')).toBe(false);
  });

  it('should match wildcard patterns', () => {
    expect(matchesHostname('api.lytics.io', '*.lytics.io')).toBe(true);
    expect(matchesHostname('c.lytics.io', '*.lytics.io')).toBe(true);
    expect(matchesHostname('lytics.io', '*.lytics.io')).toBe(false); // Wildcard doesn't match base domain
  });

  it('should be case-insensitive', () => {
    expect(matchesHostname('API.LYTICS.IO', 'api.lytics.io')).toBe(true);
    expect(matchesHostname('api.lytics.io', '*.LYTICS.IO')).toBe(true);
  });

  it('should handle multiple wildcards', () => {
    expect(matchesHostname('api.staging.example.com', '*.*.example.com')).toBe(true);
  });

  it('should return false for invalid patterns', () => {
    expect(matchesHostname('api.example.com', '[')).toBe(false); // Invalid regex
  });
});

describe('domainMatchesRulePattern', () => {
  it('should match simple domain patterns', () => {
    expect(domainMatchesRulePattern('api.lytics.io', '*.lytics.io')).toBe(true);
    expect(domainMatchesRulePattern('c.lytics.io', '*.lytics.io')).toBe(true);
    expect(domainMatchesRulePattern('api.example.com', '*.lytics.io')).toBe(false);
  });

  it('should match patterns with protocol', () => {
    expect(domainMatchesRulePattern('api.lytics.io', '*://*.lytics.io/*')).toBe(true);
    expect(domainMatchesRulePattern('api.example.com', 'https://api.example.com/*')).toBe(true);
    expect(domainMatchesRulePattern('api.lytics.io', 'https://api.example.com/*')).toBe(false);
  });

  it('should match exact domain patterns', () => {
    expect(domainMatchesRulePattern('api.example.com', 'api.example.com')).toBe(true);
    expect(domainMatchesRulePattern('api.example.com', 'c.example.com')).toBe(false);
  });

  it('should handle wildcard patterns', () => {
    expect(domainMatchesRulePattern('api.staging.example.com', '*.*.example.com')).toBe(true);
    expect(domainMatchesRulePattern('api.example.com', '*.*.example.com')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(domainMatchesRulePattern('API.LYTICS.IO', '*.lytics.io')).toBe(true);
    expect(domainMatchesRulePattern('api.lytics.io', '*://*.LYTICS.IO/*')).toBe(true);
  });

  it('should extract domain from full URL patterns correctly', () => {
    // Pattern with protocol and path should still match domain
    expect(domainMatchesRulePattern('api.example.com', 'https://api.example.com/v1/users')).toBe(
      true,
    );
    expect(domainMatchesRulePattern('api.example.com', '*://api.example.com/*')).toBe(true);
  });

  it('should not match base domain when pattern uses subdomain wildcard', () => {
    // *.lytics.io should NOT match lytics.io (only subdomains)
    expect(domainMatchesRulePattern('lytics.io', '*.lytics.io')).toBe(false);
    expect(domainMatchesRulePattern('api.lytics.io', '*.lytics.io')).toBe(true);
  });
});
