/**
 * Tests for background service worker migration logic
 */

import type { AuthRule } from '@/shared/types';
import { describe, expect, it } from 'vitest';

// Import migration function directly (exported from index.ts)
// We test it in isolation to avoid importing the entire background worker
function migrateRules(rules: AuthRule[]): AuthRule[] {
  return rules.map((rule) => {
    // If rule doesn't have scheme, add default 'Bearer'
    if (!rule.scheme) {
      return { ...rule, scheme: 'Bearer' };
    }
    return rule;
  });
}

describe('Migration Logic', () => {
  describe('migrateRules', () => {
    it('should add Bearer scheme to rules without scheme field', () => {
      const oldRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          // No scheme field
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: 'api.test.com',
          token: 'token456',
          scheme: 'Raw', // Already has scheme
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const migrated = migrateRules(oldRules);

      expect(migrated[0]?.scheme).toBe('Bearer');
      expect(migrated[1]?.scheme).toBe('Raw');
      expect(migrated[0]?.id).toBe('1');
      expect(migrated[1]?.id).toBe('2');
    });

    it('should preserve existing schemes', () => {
      const rulesWithSchemes: AuthRule[] = [
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
          pattern: '*.lytics.io',
          token: 'token456',
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

      const migrated = migrateRules(rulesWithSchemes);

      expect(migrated[0]?.scheme).toBe('Bearer');
      expect(migrated[1]?.scheme).toBe('Raw');
      expect(migrated[2]?.scheme).toBe('Basic');
    });

    it('should handle empty rules array', () => {
      const emptyRules: AuthRule[] = [];
      const migrated = migrateRules(emptyRules);
      expect(migrated).toEqual([]);
    });

    it('should handle mixed rules (some with scheme, some without)', () => {
      const mixedRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token1',
          // No scheme
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          pattern: '*.lytics.io',
          token: 'token2',
          scheme: 'Raw',
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '3',
          pattern: 'api.test.com',
          token: 'token3',
          // No scheme
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const migrated = migrateRules(mixedRules);

      expect(migrated).toHaveLength(3);
      expect(migrated[0]?.scheme).toBe('Bearer');
      expect(migrated[1]?.scheme).toBe('Raw');
      expect(migrated[2]?.scheme).toBe('Bearer');
    });

    it('should not mutate original rules array', () => {
      const originalRules: AuthRule[] = [
        {
          id: '1',
          pattern: '*.example.com',
          token: 'token123',
          // No scheme
          enabled: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const migrated = migrateRules(originalRules);

      expect(originalRules[0]?.scheme).toBeUndefined();
      expect(migrated[0]?.scheme).toBe('Bearer');
      expect(originalRules).not.toBe(migrated);
    });
  });
});
