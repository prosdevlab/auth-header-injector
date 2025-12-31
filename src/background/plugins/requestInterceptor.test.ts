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
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.test.com',
          token: 'token456',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.removeRuleIds).toEqual([]);
      expect(call?.addRules).toHaveLength(2);

      // Rules are sorted by specificity (most specific first)
      // api.test.com (30) should come before *.example.com (19)
      const apiTestRule = call?.addRules?.find((r) => r.condition.urlFilter === 'api.test.com');
      const wildcardRule = call?.addRules?.find((r) => r.condition.urlFilter === '*.example.com');

      expect(apiTestRule?.action.requestHeaders?.[0]?.value).toBe('Bearer token456');
      expect(apiTestRule?.priority).toBeGreaterThan(wildcardRule?.priority ?? 0);
      expect(wildcardRule?.action.requestHeaders?.[0]?.value).toBe('Bearer token123');
    });

    it('should use Bearer scheme by default when scheme is not specified', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          // No scheme field - should default to Bearer
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules?.[0]?.action.requestHeaders?.[0]?.value).toBe('Bearer token123');
    });

    it('should use Raw scheme when specified', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.lytics.io',
          token: 'lytics_token_123',
          scheme: 'Raw',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules?.[0]?.action.requestHeaders?.[0]?.value).toBe('lytics_token_123');
    });

    it('should use Basic scheme when specified', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: 'api.example.com',
          token: 'dXNlcm5hbWU6cGFzc3dvcmQ=',
          scheme: 'Basic',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules?.[0]?.action.requestHeaders?.[0]?.value).toBe(
        'Basic dXNlcm5hbWU6cGFzc3dvcmQ=',
      );
    });

    it('should handle multiple rules with different schemes', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'bearer_token',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: '*.lytics.io',
          token: 'raw_token',
          scheme: 'Raw',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          pattern: 'api.basic.com',
          token: 'base64token',
          scheme: 'Basic',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules).toHaveLength(3);

      // Rules are sorted by specificity (most specific first)
      // api.basic.com (30) > *.example.com (19) = *.lytics.io (19)
      const basicRule = call?.addRules?.find((r) => r.condition.urlFilter === 'api.basic.com');
      const exampleRule = call?.addRules?.find((r) => r.condition.urlFilter === '*.example.com');
      const lyticsRule = call?.addRules?.find((r) => r.condition.urlFilter === '*.lytics.io');

      expect(basicRule?.action.requestHeaders?.[0]?.value).toBe('Basic base64token');
      expect(exampleRule?.action.requestHeaders?.[0]?.value).toBe('Bearer bearer_token');
      expect(lyticsRule?.action.requestHeaders?.[0]?.value).toBe('raw_token');

      // Most specific should have highest priority
      expect(basicRule?.priority).toBeGreaterThan(exampleRule?.priority ?? 0);
      expect(basicRule?.priority).toBeGreaterThan(lyticsRule?.priority ?? 0);
    });

    it('should assign priorities based on pattern specificity', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com', // Less specific
          token: 'token1',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.staging.example.com', // More specific
          token: 'token2',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules).toHaveLength(2);

      // More specific pattern should have higher priority
      const specificPatternRule = call?.addRules?.find(
        (r) => r.condition.urlFilter === 'api.staging.example.com',
      );
      const lessSpecificPatternRule = call?.addRules?.find(
        (r) => r.condition.urlFilter === '*.example.com',
      );

      expect(specificPatternRule?.priority).toBeDefined();
      expect(lessSpecificPatternRule?.priority).toBeDefined();
      expect(specificPatternRule?.priority ?? 0).toBeGreaterThan(
        lessSpecificPatternRule?.priority ?? 0,
      );
    });

    it('should sort rules by specificity before assigning priorities', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.com', // Least specific
          token: 'token1',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.example.com', // Most specific
          token: 'token2',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          pattern: '*.example.com', // Medium specific
          token: 'token3',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ auth_rules: mockRules });
      (vi.mocked(chrome.declarativeNetRequest.getDynamicRules) as any).mockResolvedValue([]);
      (vi.mocked(chrome.declarativeNetRequest.updateDynamicRules) as any).mockResolvedValue();

      await (sdk as any).interceptor.enable();

      const call = vi.mocked(chrome.declarativeNetRequest.updateDynamicRules).mock.calls[0]?.[0];
      expect(call).toBeDefined();
      expect(call?.addRules).toHaveLength(3);

      // Rules should be ordered by specificity (most specific first)
      const priorities = call?.addRules?.map((r) => r.priority ?? 0) ?? [];
      expect(priorities.length).toBe(3);
      if (priorities[0] !== undefined && priorities[1] !== undefined) {
        expect(priorities[0]).toBeGreaterThan(priorities[1]);
      }
      if (priorities[1] !== undefined && priorities[2] !== undefined) {
        expect(priorities[1]).toBeGreaterThan(priorities[2]);
      }
    });

    it('should filter out disabled rules', async () => {
      const mockRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          scheme: 'Bearer',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.test.com',
          token: 'token456',
          scheme: 'Bearer',
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
          scheme: 'Bearer',
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
        scheme: 'Bearer',
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
          scheme: 'Bearer',
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
