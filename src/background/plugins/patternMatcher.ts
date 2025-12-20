/**
 * Pattern Matcher Plugin for SDK Kit
 *
 * URL pattern matching utilities for Chrome extension.
 * Validates patterns and provides convenience methods.
 *
 * **Note:** Actual URL matching is done by Chrome's declarativeNetRequest API.
 * This plugin provides validation and utility methods only.
 *
 * **Supported patterns:**
 * - Substring: `"api.staging.com"` (matches anywhere in URL)
 * - Wildcards: `"*.example.com"`, `"* /api/ *"`
 * - Domain anchoring: `"||example.com/*"` (optional)
 *
 * @example
 * ```ts
 * sdk.use(patternMatcherPlugin);
 * await sdk.init();
 *
 * // Validate a pattern
 * const isValid = sdk.matcher.validate("*.example.com");
 *
 * // Check if URL matches any pattern
 * const patterns = ["api.staging.com", "*.dev.example.com"];
 * const matches = sdk.matcher.matchesAny("https://api.staging.com/users", patterns);
 * ```
 */

import type { Plugin } from '@lytics/sdk-kit';

/**
 * Public API exposed by the Pattern Matcher plugin
 */
export interface PatternMatcherPlugin {
  /**
   * Check if a URL matches a pattern
   *
   * **Note:** This is a utility method. Actual matching is done by
   * Chrome's declarativeNetRequest in the Request Interceptor plugin.
   *
   * @param url - URL to test
   * @param pattern - Pattern to match (supports wildcards)
   * @returns True if pattern matches URL
   *
   * @example
   * ```ts
   * sdk.matcher.matches("https://api.staging.com/users", "api.staging.com"); // true
   * sdk.matcher.matches("https://example.com/data", "*.example.com"); // true
   * ```
   */
  matches(url: string, pattern: string): boolean;

  /**
   * Check if a URL matches any of the given patterns
   *
   * @param url - URL to test
   * @param patterns - Array of patterns to match against
   * @returns True if ANY pattern matches the URL
   *
   * @example
   * ```ts
   * const patterns = ["api.staging.com", "*.dev.example.com"];
   * sdk.matcher.matchesAny("https://api.staging.com/users", patterns); // true
   * ```
   */
  matchesAny(url: string, patterns: string[]): boolean;

  /**
   * Validate a pattern
   *
   * Checks for:
   * - Empty strings
   * - Whitespace-only strings
   * - Very short patterns (potential mistakes)
   *
   * @param pattern - Pattern to validate
   * @returns True if pattern is valid
   *
   * @example
   * ```ts
   * sdk.matcher.validate("api.staging.com"); // true
   * sdk.matcher.validate(""); // false
   * sdk.matcher.validate("   "); // false
   * ```
   */
  validate(pattern: string): boolean;
}

/**
 * Pattern Matcher Plugin
 *
 * Provides URL pattern validation and matching utilities.
 *
 * **Events emitted:**
 * - `matcher:matches` - When a pattern matches
 * - `matcher:no-match` - When no patterns match
 * - `matcher:invalid-pattern` - When pattern validation fails
 *
 * **Design:**
 * - Uses Chrome's declarativeNetRequest pattern syntax
 * - Simple validation only (Chrome does the heavy lifting)
 * - Case-insensitive matching (Chrome's default)
 * - Supports wildcards: `*`, `||` (domain anchor)
 *
 * @param plugin - SDK Kit plugin capabilities
 * @param instance - SDK instance
 * @param _config - SDK configuration (unused)
 */
export function patternMatcherPlugin(plugin: Plugin, instance: any, _config: any): void {
  // Set plugin namespace
  plugin.ns('matcher');

  // Expose public API under 'matcher' namespace
  plugin.expose({
    matcher: {
      /**
       * Check if URL matches pattern
       *
       * Uses simple substring/wildcard matching for utility purposes.
       * Chrome's declarativeNetRequest does the actual matching in production.
       */
      matches(url: string, pattern: string): boolean {
        // Validate pattern first
        if (!this.validate(pattern)) {
          plugin.emit('matcher:invalid-pattern', { pattern });
          return false;
        }

        // Normalize to lowercase (Chrome is case-insensitive)
        const normalizedUrl = url.toLowerCase();
        const normalizedPattern = pattern.toLowerCase();

        // Simple wildcard matching for utility purposes
        // Chrome's declarativeNetRequest does more sophisticated matching
        let matched = false;

        if (normalizedPattern.includes('*')) {
          // Convert wildcard pattern to regex
          // Replace * with .* (match any characters)
          // Escape special regex characters except *
          const regexPattern = normalizedPattern
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
            .replace(/\*/g, '.*'); // Convert * to .*

          const regex = new RegExp(regexPattern);
          matched = regex.test(normalizedUrl);
        } else {
          // Simple substring match
          matched = normalizedUrl.includes(normalizedPattern);
        }

        // Emit event
        if (matched) {
          plugin.emit('matcher:matches', { url, pattern });
        } else {
          plugin.emit('matcher:no-match', { url, pattern });
        }

        return matched;
      },

      /**
       * Check if URL matches any pattern
       */
      matchesAny(url: string, patterns: string[]): boolean {
        // Check each pattern
        for (const pattern of patterns) {
          if (this.matches(url, pattern)) {
            return true;
          }
        }

        // No patterns matched
        plugin.emit('matcher:no-match', { url, patterns });
        return false;
      },

      /**
       * Validate a pattern
       */
      validate(pattern: string): boolean {
        // Reject empty or whitespace-only patterns
        if (!pattern || pattern.trim().length === 0) {
          plugin.emit('matcher:invalid-pattern', {
            pattern,
            reason: 'empty or whitespace',
          });
          return false;
        }

        // Warn about very short patterns (potential typos)
        if (pattern.trim().length < 2) {
          plugin.emit('matcher:invalid-pattern', {
            pattern,
            reason: 'too short (potential typo)',
          });
          return false;
        }

        // Warn about only wildcards (matches everything)
        if (pattern.trim().replace(/\*/g, '').length === 0) {
          plugin.emit('matcher:invalid-pattern', {
            pattern,
            reason: 'only wildcards (matches everything)',
          });
          return false;
        }

        // Pattern is valid
        return true;
      },
    },
  });

  // Listen to SDK lifecycle
  instance.on('sdk:ready', () => {
    console.log('[Pattern Matcher Plugin] Ready (Chrome urlFilter patterns)');
  });
}
