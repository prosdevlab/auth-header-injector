import { chromeStoragePlugin } from '@/background/plugins/chromeStorage';
import { requestInterceptorPlugin } from '@/background/plugins/requestInterceptor';
import type { AuthRule } from '@/shared/types';
import { SDK } from '@lytics/sdk-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Request Interceptor Plugin', () => {
  let sdk: SDK;

  beforeEach(async () => {
    // Clear all mocks first INCLUDING storage state
    vi.clearAllMocks();
    vi.resetAllMocks();

    sdk = new SDK({ name: 'test-sdk' });
    sdk.use(chromeStoragePlugin); // Interceptor depends on storage
    sdk.use(requestInterceptorPlugin);
    await sdk.init();
  });

  describe('enable', () => {
    it('should enable interceptor with auth rules from storage', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.test.com',
          token: 'token456',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [],
        addRules: [
          {
            id: 1,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [
                {
                  header: 'Authorization',
                  operation: 'set',
                  value: 'Bearer token123',
                },
              ],
            },
            condition: {
              urlFilter: '*.example.com',
              resourceTypes: ['xmlhttprequest'],
            },
          },
          {
            id: 2,
            priority: 1,
            action: {
              type: 'modifyHeaders',
              requestHeaders: [
                {
                  header: 'Authorization',
                  operation: 'set',
                  value: 'Bearer token456',
                },
              ],
            },
            condition: {
              urlFilter: 'api.test.com',
              resourceTypes: ['xmlhttprequest'],
            },
          },
        ],
      });
    });

    it('should filter out disabled rules', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.test.com',
          token: 'token456',
          enabled: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }, // Disabled
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules).toHaveLength(1);
      expect(call?.addRules?.[0]?.id).toBe(1);
    });

    it('should emit interceptor:enabled event', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      const enabledSpy = vi.fn();
      sdk.on('interceptor:enabled', enabledSpy);

      await (sdk as any).interceptor.enable();

      expect(enabledSpy).toHaveBeenCalledWith({ ruleCount: 1 });
    });

    it('should handle empty rules', async () => {
      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: [] });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules).toHaveLength(0);
    });

    it('should reject when rule count exceeds 300', async () => {
      const mockRules: AuthRule[] = Array.from({ length: 301 }, (_, i) => ({
        id: `${i}`,
        pattern: `*.example${i}.com`,
        token: `token${i}`,
        enabled: true,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });

      await expect((sdk as any).interceptor.enable()).rejects.toThrow('Too many rules (301/300)');
    });

    it('should emit interceptor:error on failure', async () => {
      const error = new Error('Chrome API error');
      vi.mocked(chrome.storage.sync.get).mockRejectedValue(error);

      const errorSpy = vi.fn();
      sdk.on('interceptor:error', errorSpy);

      await expect((sdk as any).interceptor.enable()).rejects.toThrow('Chrome API error');
      expect(errorSpy).toHaveBeenCalledWith({
        operation: 'enable',
        error: 'Chrome API error',
      });
    });
  });

  describe('disable', () => {
    it('should remove all dynamic rules', async () => {
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([
        { id: 1 } as any,
        { id: 2 } as any,
      ]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.disable();

      expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledWith({
        removeRuleIds: [1, 2],
      });
    });

    it('should emit interceptor:disabled event', async () => {
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([
        { id: 1 } as any,
      ]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      const disabledSpy = vi.fn();
      sdk.on('interceptor:disabled', disabledSpy);

      await (sdk as any).interceptor.disable();

      expect(disabledSpy).toHaveBeenCalledWith({ removedCount: 1 });
    });
  });

  describe('updateRules', () => {
    it('should call disable then enable to update rules', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      // Clear the mock call history from init
      vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mockClear();

      await (sdk as any).interceptor.updateRules();

      // Should have called disable (1) then enable (1) = 2 calls
      expect(chrome.declarativeNetRequest.updateDynamicRules).toHaveBeenCalledTimes(2);
    });
  });

  describe('getRuleCount', () => {
    it('should return current rule count', async () => {
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([
        { id: 1 } as any,
        { id: 2 } as any,
        { id: 3 } as any,
      ]);

      const count = await (sdk as any).interceptor.getRuleCount();

      expect(count).toBe(3);
    });

    it('should return 0 on error', async () => {
      vi.mocked(chrome.declarativeNetRequest.getDynamicRules).mockRejectedValue(
        new Error('API error'),
      );

      const count = await (sdk as any).interceptor.getRuleCount();

      expect(count).toBe(0);
    });
  });

  describe('isAtLimit', () => {
    it('should return false when under limit', async () => {
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue(
        Array.from({ length: 250 }, (_, i) => ({ id: i }) as any),
      );

      const result = await (sdk as any).interceptor.isAtLimit();

      expect(result).toBe(false);
    });

    it('should return true when at or over limit', async () => {
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue(
        Array.from({ length: 300 }, (_, i) => ({ id: i }) as any),
      );

      const result = await (sdk as any).interceptor.isAtLimit();

      expect(result).toBe(true);
    });
  });
});
