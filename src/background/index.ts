/**
 * Auth Header Injector - Background Service Worker
 *
 * Initializes SDK Kit with all plugins and manages header injection.
 */

import { SDK } from '@lytics/sdk-kit';
import { chromeStoragePlugin } from './plugins/chromeStorage';
import { patternMatcherPlugin } from './plugins/patternMatcher';
import { requestInterceptorPlugin } from './plugins/requestInterceptor';

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

// Initialize SDK
(async () => {
  await sdk.init();
})();
