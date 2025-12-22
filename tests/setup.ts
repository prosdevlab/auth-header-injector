/**
 * Test setup file
 * Mocks Chrome APIs for testing
 */

import { vi } from 'vitest';

// Suppress console output in tests to reduce noise from expected errors
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Mock chrome.storage.sync with proper types
// Note: We cast to `any` to override @types/chrome's strict callback signatures
// In tests, we use promise-based mocks for simplicity
global.chrome = {
  storage: {
    sync: {
      get: vi.fn().mockResolvedValue({}) as any,
      set: vi.fn().mockResolvedValue(undefined) as any,
      remove: vi.fn().mockResolvedValue(undefined) as any,
      clear: vi.fn().mockResolvedValue(undefined) as any,
    },
    local: {
      get: vi.fn().mockResolvedValue({}) as any,
      set: vi.fn().mockResolvedValue(undefined) as any,
      remove: vi.fn().mockResolvedValue(undefined) as any,
      clear: vi.fn().mockResolvedValue(undefined) as any,
    },
    onChanged: {
      addListener: vi.fn() as any,
      removeListener: vi.fn() as any,
      hasListener: vi.fn().mockReturnValue(false) as any,
    },
  },
  declarativeNetRequest: {
    updateDynamicRules: vi.fn().mockResolvedValue(undefined) as any,
    getDynamicRules: vi.fn().mockResolvedValue([]) as any,
    RuleActionType: {
      MODIFY_HEADERS: 'modifyHeaders',
    },
    HeaderOperation: {
      SET: 'set',
      APPEND: 'append',
      REMOVE: 'remove',
    },
    ResourceType: {
      XMLHTTPREQUEST: 'xmlhttprequest',
    },
  },
} as any;

/**
 * Type helper for mocking Chrome APIs in tests
 * Chrome APIs use callbacks, but we mock them as promises for easier testing
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Chrome {
    interface StorageMock {
      get: ReturnType<typeof vi.fn<any, Promise<any>>>;
      set: ReturnType<typeof vi.fn<any, Promise<void>>>;
      remove: ReturnType<typeof vi.fn<any, Promise<void>>>;
      clear: ReturnType<typeof vi.fn<any, Promise<void>>>;
    }
  }
}
