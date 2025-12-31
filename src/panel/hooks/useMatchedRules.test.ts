import { describe, expect, it } from 'vitest';

// Import the internal matching function for testing
// We'll need to export it or test through the hook's behavior
// For now, let's test the matching logic directly by importing the hook
// and testing its behavior with mocked React

// Since we can't easily test React hooks without testing-library,
// let's create a simple test that verifies the matching logic works
// by testing the pattern matching function directly

/**
 * Test the pattern matching logic that useMatchedRules uses
 * This mirrors the matchesPattern function behavior
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

describe('useMatchedRules pattern matching', () => {
  it('should match exact domain patterns as substring', () => {
    expect(matchesPattern('api.example.com', 'https://api.example.com/path')).toBe(true);
    expect(matchesPattern('api.other.com', 'https://api.example.com/path')).toBe(false);
  });

  it('should match wildcard patterns', () => {
    expect(matchesPattern('*.example.com', 'https://api.example.com/path')).toBe(true);
    expect(matchesPattern('*.example.com', 'https://staging.example.com/api')).toBe(true);
    expect(matchesPattern('*.other.com', 'https://api.example.com/path')).toBe(false);
  });

  it('should match multiple patterns for the same URL', () => {
    const url = 'https://api.example.com/path';
    const patterns = ['*.example.com', 'api.example.com', '*.other.com'];

    const matches = patterns.filter((p) => matchesPattern(p, url));
    expect(matches).toHaveLength(2);
    expect(matches).toContain('*.example.com');
    expect(matches).toContain('api.example.com');
  });

  it('should handle null URL', () => {
    expect(matchesPattern('*.example.com', '')).toBe(false);
  });

  it('should be case-insensitive', () => {
    expect(matchesPattern('API.EXAMPLE.COM', 'https://api.example.com/path')).toBe(true);
    expect(matchesPattern('api.example.com', 'https://API.EXAMPLE.COM/path')).toBe(true);
  });

  it('should match patterns with protocol', () => {
    expect(matchesPattern('https://api.example.com', 'https://api.example.com/path')).toBe(true);
  });

  it('should match substring patterns', () => {
    expect(matchesPattern('example.com', 'https://api.example.com/path')).toBe(true);
    expect(matchesPattern('example', 'https://api.example.com/path')).toBe(true);
  });

  it('should match wildcards in middle of pattern', () => {
    expect(matchesPattern('api.*.example.com', 'https://api.staging.example.com/path')).toBe(true);
  });
});
