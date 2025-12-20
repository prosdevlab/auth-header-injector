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
import type { AuthRule } from '../../shared/types';

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
 * - All rules priority 1
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

  // Expose public API
  plugin.expose({
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
        const chromeRules = enabledRules.map((authRule, index) => ({
          id: index + 1, // Chrome IDs are 1-based
          priority: 1, // All rules same priority
          action: {
            type: 'modifyHeaders' as chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
            requestHeaders: [
              {
                header: 'Authorization',
                operation: chrome.declarativeNetRequest.HeaderOperation.SET,
                value: `Bearer ${authRule.token}`,
              },
            ],
          },
          condition: {
            urlFilter: authRule.pattern,
            resourceTypes: [chrome.declarativeNetRequest.ResourceType.XMLHTTPREQUEST],
          },
        }));

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

        // Remove all rules
        if (ruleIds.length > 0) {
          await chrome.declarativeNetRequest.updateDynamicRules({
            removeRuleIds: ruleIds,
          });
        }

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
