/**
 * Chrome Storage Plugin for SDK Kit
 *
 * Wraps chrome.storage.sync API in SDK Kit plugin pattern.
 * Provides type-safe storage with automatic serialization and event emission.
 *
 * @example
 * ```ts
 * sdk.use(chromeStoragePlugin);
 * await sdk.init();
 *
 * // Store data
 * await sdk.storage.set('user', { id: 123, name: 'Alice' });
 *
 * // Retrieve data
 * const user = await sdk.storage.get<User>('user');
 *
 * // Remove data
 * await sdk.storage.remove('user');
 * ```
 */

import type { Plugin } from '@lytics/sdk-kit';

/**
 * Public API exposed by the Chrome Storage plugin
 */
export interface ChromeStoragePlugin {
  /**
   * Get a value from chrome.storage.sync
   *
   * @param key - Storage key
   * @returns The stored value, or null if not found
   *
   * @example
   * ```ts
   * const token = await sdk.storage.get<string>('auth_token');
   * ```
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in chrome.storage.sync
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   *
   * @example
   * ```ts
   * await sdk.storage.set('settings', { theme: 'dark' });
   * ```
   */
  set<T>(key: string, value: T): Promise<void>;

  /**
   * Remove a value from chrome.storage.sync
   *
   * @param key - Storage key to remove
   *
   * @example
   * ```ts
   * await sdk.storage.remove('temp_data');
   * ```
   */
  remove(key: string): Promise<void>;

  /**
   * Clear all values from chrome.storage.sync
   *
   * @example
   * ```ts
   * await sdk.storage.clear();
   * ```
   */
  clear(): Promise<void>;

  /**
   * Get all values from chrome.storage.sync
   *
   * @returns All stored key-value pairs
   *
   * @example
   * ```ts
   * const allData = await sdk.storage.getAll();
   * console.log('Stored keys:', Object.keys(allData));
   * ```
   */
  getAll(): Promise<Record<string, unknown>>;
}

/**
 * Chrome Storage Plugin
 *
 * Provides type-safe access to chrome.storage.sync with event emission
 * for observability.
 *
 * **Events emitted:**
 * - `storage:get` - When reading a value
 * - `storage:set` - When writing a value
 * - `storage:remove` - When removing a value
 * - `storage:clear` - When clearing all values
 * - `storage:error` - When an operation fails
 *
 * **Design decisions:**
 * - Uses chrome.storage.sync only (syncs across devices)
 * - No runtime validation (trusts TypeScript types)
 * - Emits events for all operations
 * - Throws errors (caller decides how to handle)
 *
 * @param plugin - SDK Kit plugin capabilities
 * @param instance - SDK instance
 * @param _config - SDK configuration (unused)
 */
export function chromeStoragePlugin(plugin: Plugin, instance: any, _config: any): void {
  // Set plugin namespace
  plugin.ns('storage');

  // Expose public API under 'storage' namespace
  plugin.expose({
    storage: {
      /**
       * Get a value from storage
       */
      async get<T>(key: string): Promise<T | null> {
        try {
          const result = await chrome.storage.sync.get(key);
          const value = result[key] ?? null;

          // Emit event for observability
          plugin.emit('storage:get', { key, found: value !== null });

          return value as T | null;
        } catch (error) {
          // Emit error event
          plugin.emit('storage:error', {
            operation: 'get',
            key,
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error(`[Storage Plugin] Failed to get "${key}":`, error);

          // Throw so caller can handle
          throw error;
        }
      },

      /**
       * Set a value in storage
       */
      async set<T>(key: string, value: T): Promise<void> {
        try {
          await chrome.storage.sync.set({ [key]: value });

          // Emit event for observability
          plugin.emit('storage:set', { key });
        } catch (error) {
          // Emit error event
          plugin.emit('storage:error', {
            operation: 'set',
            key,
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error(`[Storage Plugin] Failed to set "${key}":`, error);

          // Throw so caller can handle
          throw error;
        }
      },

      /**
       * Remove a value from storage
       */
      async remove(key: string): Promise<void> {
        try {
          await chrome.storage.sync.remove(key);

          // Emit event for observability
          plugin.emit('storage:remove', { key });
        } catch (error) {
          // Emit error event
          plugin.emit('storage:error', {
            operation: 'remove',
            key,
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error(`[Storage Plugin] Failed to remove "${key}":`, error);

          // Throw so caller can handle
          throw error;
        }
      },

      /**
       * Clear all storage
       */
      async clear(): Promise<void> {
        try {
          await chrome.storage.sync.clear();

          // Emit event for observability
          plugin.emit('storage:clear', {});
        } catch (error) {
          // Emit error event
          plugin.emit('storage:error', {
            operation: 'clear',
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error('[Storage Plugin] Failed to clear storage:', error);

          // Throw so caller can handle
          throw error;
        }
      },

      /**
       * Get all values from storage
       */
      async getAll(): Promise<Record<string, unknown>> {
        try {
          // Passing null gets all values
          const result = await chrome.storage.sync.get(null);

          // Emit event for observability
          plugin.emit('storage:get', {
            key: '*',
            found: true,
            count: Object.keys(result).length,
          });

          return result;
        } catch (error) {
          // Emit error event
          plugin.emit('storage:error', {
            operation: 'getAll',
            error: error instanceof Error ? error.message : String(error),
          });

          // Log for debugging
          console.error('[Storage Plugin] Failed to get all values:', error);

          // Throw so caller can handle
          throw error;
        }
      },
    },
  });

  // Listen to SDK lifecycle
  instance.on('sdk:ready', () => {
    console.log('[Storage Plugin] Ready (using chrome.storage.sync)');
  });
}
