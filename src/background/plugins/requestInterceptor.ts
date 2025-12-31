/**
 * Request Interceptor Plugin for SDK Kit
 *
 * Wraps Chrome's declarativeNetRequest API to inject Authorization headers
 * into HTTP requests based on URL patterns and auth rules.
 *
 * **Core functionality:**
 * - Reads auth rules from storage
 * - Creates dynamic Chrome rules for header injection
 * - Auto-updates when rules change
 * - Handles 300 rule limit
 *
 * @example
 * ```ts
 * sdk.use(chromeStoragePlugin);
 * sdk.use(patternMatcherPlugin);
 * sdk.use(requestInterceptorPlugin);
 * await sdk.init();
 *
 * // Interceptor auto-enables on init
 * // Updates automatically when storage changes
 * ```
 */

import type { Plugin } from '@lytics/sdk-kit';
import type { AuthRule, AuthScheme } from '../../shared/types';
import { calculateSpecificity } from '../utils/requestTracking';

/**
 * Build Authorization header value based on scheme
 *
 * @param scheme - Authentication scheme (defaults to 'Bearer')
 * @param token - The authentication token
 * @returns The Authorization header value
 *
 * @example
 * buildAuthHeaderValue('Bearer', 'abc123') // 'Bearer abc123'
 * buildAuthHeaderValue('Raw', 'abc123') // 'abc123'
 * buildAuthHeaderValue('Basic', 'dXNlcm5hbWU6cGFzc3dvcmQ=') // 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
 */
function buildAuthHeaderValue(scheme: AuthScheme | undefined, token: string): string {
  const authScheme = scheme || 'Bearer'; // Default to Bearer for backward compatibility

  switch (authScheme) {
    case 'Bearer':
      return `Bearer ${token}`;
    case 'Raw':
      return token;
    case 'Basic':
      return `Basic ${token}`;
    default:
      // Fallback to Bearer for unknown schemes
      return `Bearer ${token}`;
  }
}

/**
 * Public API exposed by the Request Interceptor plugin
 */
export interface RequestInterceptorPlugin {
  /**
   * Enable request interceptor (apply all auth rules)
   *
   * Reads auth rules from storage and creates Chrome declarativeNetRequest rules.
   *
   * @example
   * ```ts
   * await sdk.interceptor.enable();
   * ```
   */
  enable(): Promise<void>;

  /**
   * Disable request interceptor (remove all rules)
   *
   * @example
   * ```ts
   * await sdk.interceptor.disable();
   * ```
   */
  disable(): Promise<void>;

  /**
   * Update rules from storage
   *
   * Refreshes Chrome rules based on current storage state.
   * Called automatically when storage changes.
   *
   * @example
   * ```ts
   * await sdk.interceptor.updateRules();
   * ```
   */
  updateRules(): Promise<void>;

  /**
   * Get current rule count
   *
   * @returns Number of active Chrome rules
   *
   * @example
   * ```ts
   * const count = await sdk.interceptor.getRuleCount();
   * console.log(`Active rules: ${count}`);
   * ```
   */
  getRuleCount(): Promise<number>;

  /**
   * Check if at rule limit
   *
   * @returns True if at or over 300 rule limit
   *
   * @example
   * ```ts
   * if (await sdk.interceptor.isAtLimit()) {
   *   alert('Too many rules!');
   * }
   * ```
   */
  isAtLimit(): Promise<boolean>;
}

/**
 * Request Interceptor Plugin
 *
 * Injects Authorization headers into HTTP requests using Chrome's
 * declarativeNetRequest API.
 *
 * **Events emitted:**
 * - `interceptor:enabled` - When rules are applied
 * - `interceptor:disabled` - When rules are removed
 * - `interceptor:rules-updated` - When rules change
 * - `interceptor:error` - When operations fail
 * - `interceptor:limit-reached` - When hitting 300 rule limit
 *
 * **Dependencies:**
 * - Requires `storage` plugin (reads auth rules)
 * - Uses `matcher` plugin patterns (Chrome's urlFilter)
 *
 * **Design decisions:**
 * - `xmlhttprequest` resource type only (API calls)
 * - Rule IDs = array index + 1
 * - Auto-updates on storage changes
 * - Rejects >300 rules with error
 * - `set` operation (replaces existing auth header)
 * - Priority based on pattern specificity (more specific = higher priority)
 *   When multiple rules match, the most specific pattern wins
 *
 * @param plugin - SDK Kit plugin capabilities
 * @param instance - SDK instance
 * @param _config - SDK configuration (unused)
 */
export function requestInterceptorPlugin(plugin: Plugin, instance: any, _config: any): void {
  // Set plugin namespace
  plugin.ns('interceptor');

  // Note: plugin.require() is not yet implemented in SDK Kit
  // Will be added when needed for plugin dependencies

  // Expose public API under 'interceptor' namespace
  plugin.expose({
    interceptor: {
      /**
       * Enable interceptor (apply rules)
       */
      async enable(): Promise<void> {
        try {
          // Get auth rules from storage
          const authRules: AuthRule[] = (await instance.storage.get('auth_rules')) || [];

          // Filter to only enabled rules
          const enabledRules = authRules.filter((rule) => rule.enabled);

          // Check rule limit
          if (enabledRules.length > 300) {
            plugin.emit('interceptor:limit-reached', {
              count: enabledRules.length,
              limit: 300,
            });
            throw new Error(
              `Too many rules (${enabledRules.length}/300). Chrome's declarativeNetRequest has a 300 rule limit.`,
            );
          }

          // Convert auth rules to Chrome rules
          // Sort by specificity (most specific first) for consistent ordering
          // This ensures Chrome uses the most specific matching rule when multiple match
          const sortedRules = [...enabledRules].sort((a, b) => {
            const specificityA = calculateSpecificity(a.pattern);
            const specificityB = calculateSpecificity(b.pattern);
            return specificityB - specificityA; // Higher specificity first
          });

          // Chrome priorities: higher number = higher priority (executed first)
          // Assign priorities based on specificity so more specific rules win
          // Use range 1-1000+ to ensure positive priorities
          // More specific patterns get higher priority (win when multiple match)
          const chromeRules = sortedRules.map((authRule, index) => {
            const specificity = calculateSpecificity(authRule.pattern);
            // Convert specificity to priority (higher specificity = higher priority)
            // Specificity can be negative for very broad patterns, so add 1000
            const priority = 1000 + specificity;

            return {
              id: index + 1, // Chrome IDs are 1-based
              priority,
              action: {
                type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                requestHeaders: [
                  {
                    header: 'Authorization',
                    operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                    value: buildAuthHeaderValue(authRule.scheme, authRule.token),
                  },
                ],
              },
              condition: {
                urlFilter: authRule.pattern,
                resourceTypes: [
                  chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST,
                  chrome.declarativeNetRequest.ResourceType.OTHER,
                ],
              },
            };
          });

          // Get existing rule IDs to remove
          const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
          const existingRuleIds = existingRules.map((rule) => rule.id);

          // Update Chrome rules (atomic operation)
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: existingRuleIds, // Remove all old rules
            addRules: chromeRules, // Add new rules
          });

          // Emit success event
          plugin.emit('interceptor:enabled', {
            ruleCount: chromeRules.length,
          });

          console.log(`[Request Interceptor] Enabled with ${chromeRules.length} rule(s)`);
        } catch (error) {
          // Emit error event
          plugin.emit('interceptor:error', {
            operation: 'enable',
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error('[Request Interceptor] Failed to enable:', error);

          // Re-throw so caller can handle
          throw error;
        }
      },

      /**
       * Disable interceptor (remove all rules)
       */
      async disable(): Promise<void> {
        try {
          // Get all current rules
          const rules = await chrome.declarativeNetRequest.getDynamicRules();
          const ruleIds = rules.map((rule) => rule.id);

          // Remove all rules (call even if empty for consistency)
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds,
          });

          // Emit success event
          plugin.emit('interceptor:disabled', {
            removedCount: ruleIds.length,
          });

          console.log(`[Request Interceptor] Disabled (removed ${ruleIds.length} rule(s))`);
        } catch (error) {
          // Emit error event
          plugin.emit('interceptor:error', {
            operation: 'disable',
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error('[Request Interceptor] Failed to disable:', error);

          // Re-throw so caller can handle
          throw error;
        }
      },

      /**
       * Update rules from storage
       */
      async updateRules(): Promise<void> {
        try {
          // Disable first (clears all rules)
          await this.disable();

          // Re-enable (applies current rules from storage)
          await this.enable();

          // Emit update event
          plugin.emit('interceptor:rules-updated', {});

          console.log('[Request Interceptor] Rules updated');
        } catch (error) {
          // Emit error event
          plugin.emit('interceptor:error', {
            operation: 'updateRules',
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error('[Request Interceptor] Failed to update rules:', error);

          // Re-throw so caller can handle
          throw error;
        }
      },

      /**
       * Get current rule count
       */
      async getRuleCount(): Promise<number> {
        try {
          const rules = await chrome.declarativeNetRequest.getDynamicRules();
          return rules.length;
        } catch (error) {
          console.error('[Request Interceptor] Failed to get rule count:', error);
          return 0;
        }
      },

      /**
       * Check if at rule limit
       */
      async isAtLimit(): Promise<boolean> {
        const count = await this.getRuleCount();
        return count >= 300;
      },
    },
  });

  // Auto-enable on SDK ready
  instance.on('sdk:ready', async () => {
    console.log('[Request Interceptor] Ready');
    try {
      await instance.interceptor.enable();
    } catch (error) {
      console.error('[Request Interceptor] Failed to auto-enable:', error);
    }
  });

  // Auto-update when storage changes
  instance.on('storage:set', async (data: { key: string }) => {
    if (data.key === 'auth_rules') {
      console.log('[Request Interceptor] Auth rules changed, updating...');
      try {
        await instance.interceptor.updateRules();
      } catch (error) {
        console.error('[Request Interceptor] Failed to auto-update:', error);
      }
    }
  });
}
