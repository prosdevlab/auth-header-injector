import { chromeStoragePlugin } from '@/background/plugins/chromeStorage';
import { SDK } from '@lytics/sdk-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Chrome Storage Plugin', () => {
  let sdk: SDK;

  beforeEach(async () => {
    sdk = new SDK({ name: 'test-sdk' });
    sdk.use(chromeStoragePlugin);
    await sdk.init();
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('should get value from chrome.storage.sync', async () => {
      const mockValue = { test: 'value' };
      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({ testKey: mockValue });

      const result = await (sdk as any).storage.get('testKey');

      expect(chrome.storage.sync.get).toHaveBeenCalledWith('testKey');
      expect(result).toEqual(mockValue);
    });

    it('should return null if key does not exist', async () => {
      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue({});

      const result = await (sdk as any).storage.get('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle errors and emit storage:error', async () => {
      const error = new Error('Storage error');
      vi.mocked(chrome.storage.sync.get).mockRejectedValue(error);

      const errorSpy = vi.fn();
      sdk.on('storage:error', errorSpy);

      await expect((sdk as any).storage.get('testKey')).rejects.toThrow('Storage error');
      expect(errorSpy).toHaveBeenCalledWith({
        operation: 'get',
        key: 'testKey',
        error: 'Storage error',
      });
    });
  });

  describe('set', () => {
    it('should set value in chrome.storage.sync', async () => {
      (vi.mocked(chrome.storage.sync.set) as any).mockResolvedValue();

      await (sdk as any).storage.set('testKey', { data: 'test' });

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({ testKey: { data: 'test' } });
    });

    it('should emit storage:set event', async () => {
      (vi.mocked(chrome.storage.sync.set) as any).mockResolvedValue();

      const setSpy = vi.fn();
      sdk.on('storage:set', setSpy);

      await (sdk as any).storage.set('testKey', 'value');

      expect(setSpy).toHaveBeenCalledWith({ key: 'testKey' });
    });

    it('should handle errors and emit storage:error', async () => {
      const error = new Error('Set error');
      vi.mocked(chrome.storage.sync.set).mockRejectedValue(error);

      const errorSpy = vi.fn();
      sdk.on('storage:error', errorSpy);

      await expect((sdk as any).storage.set('testKey', 'value')).rejects.toThrow('Set error');
      expect(errorSpy).toHaveBeenCalledWith({
        operation: 'set',
        key: 'testKey',
        error: 'Set error',
      });
    });
  });

  describe('remove', () => {
    it('should remove key from chrome.storage.sync', async () => {
      (vi.mocked(chrome.storage.sync.remove) as any).mockResolvedValue();

      await (sdk as any).storage.remove('testKey');

      expect(chrome.storage.sync.remove).toHaveBeenCalledWith('testKey');
    });

    it('should emit storage:remove event', async () => {
      (vi.mocked(chrome.storage.sync.remove) as any).mockResolvedValue();

      const removeSpy = vi.fn();
      sdk.on('storage:remove', removeSpy);

      await (sdk as any).storage.remove('testKey');

      expect(removeSpy).toHaveBeenCalledWith({ key: 'testKey' });
    });
  });

  describe('clear', () => {
    it('should clear all data from chrome.storage.sync', async () => {
      (vi.mocked(chrome.storage.sync.clear) as any).mockResolvedValue();

      await (sdk as any).storage.clear();

      expect(chrome.storage.sync.clear).toHaveBeenCalled();
    });

    it('should emit storage:clear event', async () => {
      (vi.mocked(chrome.storage.sync.clear) as any).mockResolvedValue();

      const clearSpy = vi.fn();
      sdk.on('storage:clear', clearSpy);

      await (sdk as any).storage.clear();

      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    it('should get all items from chrome.storage.sync', async () => {
      const mockData = { key1: 'value1', key2: 'value2' };
      (vi.mocked(chrome.storage.sync.get) as any).mockResolvedValue(mockData);

      const result = await (sdk as any).storage.getAll();

      expect(chrome.storage.sync.get).toHaveBeenCalledWith(null);
      expect(result).toEqual(mockData);
    });
  });
});
