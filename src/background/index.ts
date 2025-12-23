/**
 * Auth Header Injector - Background Service Worker
 *
 * Initializes SDK Kit with all plugins and manages header injection.
 */

import type { AuthRule } from '@/shared/types';
import { SDK } from '@lytics/sdk-kit';
import { chromeStoragePlugin } from './plugins/chromeStorage';
import { patternMatcherPlugin } from './plugins/patternMatcher';
import { requestInterceptorPlugin } from './plugins/requestInterceptor';
import {
  type RequestStatsMap,
  extractHostname,
  findMatchingRule,
  updateStats,
} from './utils/requestTracking';

console.log('[Auth Header Injector] Initializing...');

// Create SDK instance
const sdk = new SDK({
  name: 'auth-header-injector',
  version: '0.1.0',
});

// Register plugins
sdk.use(chromeStoragePlugin).use(patternMatcherPlugin).use(requestInterceptorPlugin);

// Listen to SDK events for debugging
sdk.on('sdk:ready', () => {
  console.log('[Auth Header Injector] Ready!');
});

sdk.on('interceptor:enabled', (data) => {
  console.log(`[Auth Header Injector] Interceptor enabled with ${data.ruleCount} rule(s)`);
});

sdk.on('interceptor:disabled', () => {
  console.log('[Auth Header Injector] Interceptor disabled');
});

sdk.on('interceptor:error', (error) => {
  console.error('[Auth Header Injector] Interceptor error:', error);
});

// ============================================================================
// OPTIMIZED REQUEST TRACKING
// ============================================================================

/**
 * Performance optimizations:
 * 1. Cache rules in memory (avoid storage reads on every request)
 * 2. Batch storage writes (reduce I/O by ~90%)
 * 3. Debounce duplicate requests (avoid redundant processing)
 */

// Cache rules in memory to avoid repeated storage reads
let cachedRules: AuthRule[] = [];

// Pending stats to batch write
let pendingStats: RequestStatsMap | null = null;
let writeTimeout: ReturnType<typeof setTimeout> | null = null;

// Recent request URLs to debounce duplicates (cleared after 1s)
const recentRequests = new Set<string>();

// Initialize SDK
(async () => {
  await sdk.init();

  // Initialize rule cache after SDK is ready
  const sdkInstance = sdk as any;
  cachedRules = (await sdkInstance.storage.get('auth_rules')) || [];
})();

/**
 * Update the rule cache when storage changes
 */
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.auth_rules) {
    cachedRules = changes.auth_rules.newValue || [];
    console.log('[Request Tracker] Rule cache updated:', cachedRules.length, 'rules');
  }
});

/**
 * Schedule a batched write to storage (debounced by 3 seconds)
 */
function scheduleBatchWrite(stats: RequestStatsMap) {
  pendingStats = stats;

  if (writeTimeout) return; // Already scheduled

  writeTimeout = setTimeout(async () => {
    if (pendingStats) {
      try {
        await chrome.storage.local.set({ request_stats: pendingStats });
        console.log('[Request Tracker] ✓ Batch write completed');
      } catch (error) {
        console.error('[Request Tracker] Batch write error:', error);
      }
    }
    pendingStats = null;
    writeTimeout = null;
  }, 3000); // Batch writes every 3 seconds
}

/**
 * Track matched requests (optimized with caching and batching)
 */
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    // Debounce: ignore duplicate requests within 1 second
    if (recentRequests.has(details.url)) return;
    recentRequests.add(details.url);
    setTimeout(() => recentRequests.delete(details.url), 1000);

    // Run async tracking in background (non-blocking)
    (async () => {
      try {
        // Use cached rules instead of storage read (HUGE perf win!)
        const enabledRules = cachedRules.filter((rule) => rule.enabled);
        if (enabledRules.length === 0) return;

        // Find matching rule using pure function
        const matchedRule = findMatchingRule(details.url, enabledRules);
        if (!matchedRule) return;

        const hostname = extractHostname(details.url);
        if (!hostname) return;

        // Get current stats (only read once, then use pendingStats)
        let currentStats: RequestStatsMap;
        if (pendingStats) {
          currentStats = pendingStats; // Use pending changes
        } else {
          const result = await chrome.storage.local.get('request_stats');
          currentStats = result.request_stats || {};
        }

        // Update stats using pure function
        const newStats = updateStats(currentStats, hostname, matchedRule.id);

        // Schedule batched write (reduces I/O by ~90%)
        scheduleBatchWrite(newStats);
      } catch (error) {
        console.error('[Request Tracker] Error tracking request:', error);
      }
    })();
  },
  {
    urls: ['<all_urls>'],
    types: [
      'xmlhttprequest', // Old-school XMLHttpRequest
      'other', // Modern fetch() API calls
    ],
  },
);

// Handle extension icon click → Open side panel
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// Message handlers for Panel UI
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      const sdkInstance = sdk as any; // Access SDK instance with dynamic methods

      switch (message.type) {
        case 'GET_RULES': {
          const rules: AuthRule[] | null = await sdkInstance.storage.get('auth_rules');
          sendResponse({ success: true, data: rules || [] });
          break;
        }

        case 'SET_RULES': {
          const rules = message.data as AuthRule[];
          await sdkInstance.storage.set('auth_rules', rules);
          sendResponse({ success: true });
          break;
        }

        case 'GET_ENABLED': {
          const enabled: boolean | null = await sdkInstance.storage.get('extension_enabled');
          sendResponse({ success: true, data: enabled ?? true }); // Default to enabled
          break;
        }

        case 'SET_ENABLED': {
          const enabled = message.data as boolean;
          await sdkInstance.storage.set('extension_enabled', enabled);

          // Enable/disable interceptor based on setting
          if (enabled) {
            await sdkInstance.interceptor.enable();
          } else {
            await sdkInstance.interceptor.disable();
          }

          sendResponse({ success: true });
          break;
        }

        case 'GET_STATUS': {
          const enabled: boolean | null = await sdkInstance.storage.get('extension_enabled');
          const rules: AuthRule[] | null = await sdkInstance.storage.get('auth_rules');
          const activeRules = rules?.filter((r: AuthRule) => r.enabled).length || 0;

          sendResponse({
            success: true,
            data: {
              enabled: enabled ?? true,
              ruleCount: activeRules,
            },
          });
          break;
        }

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('[Auth Header Injector] Message handler error:', error);
      sendResponse({ success: false, error: String(error) });
    }
  })();

  // Return true to indicate async response
  return true;
});
