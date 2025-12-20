import { patternMatcherPlugin } from '@/background/plugins/patternMatcher';
import { SDK } from '@lytics/sdk-kit';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Pattern Matcher Plugin', () => {
  let sdk: SDK;

  beforeEach(async () => {
    sdk = new SDK({ name: 'test-sdk' });
    sdk.use(patternMatcherPlugin);
    await sdk.init();
    vi.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate non-empty pattern', () => {
      const result = (sdk as any).matcher.validate('*.example.com');

      expect(result).toBe(true);
    });

    it('should reject empty pattern', () => {
      const result = (sdk as any).matcher.validate('');

      expect(result).toBe(false);
    });

    it('should reject null pattern', () => {
      const result = (sdk as any).matcher.validate(null as any);

      expect(result).toBe(false);
    });

    it('should reject whitespace-only pattern', () => {
      const result = (sdk as any).matcher.validate('   ');

      expect(result).toBe(false);
    });

    it('should emit invalid-pattern event for invalid patterns', () => {
      const invalidSpy = vi.fn();
      sdk.on('matcher:invalid-pattern', invalidSpy);

      (sdk as any).matcher.validate('');

      expect(invalidSpy).toHaveBeenCalledWith({
        pattern: '',
        reason: 'empty or whitespace',
      });
    });
  });

  describe('matches', () => {
    it('should match URL with pattern substring', () => {
      const result = (sdk as any).matcher.matches('https://api.example.com/data', 'example.com');

      expect(result).toBe(true);
    });

    it('should not match URL without pattern substring', () => {
      const result = (sdk as any).matcher.matches('https://api.other.com/data', 'example.com');

      expect(result).toBe(false);
    });

    it('should emit matches event on match', () => {
      const matchedSpy = vi.fn();
      sdk.on('matcher:matches', matchedSpy);

      (sdk as any).matcher.matches('https://api.example.com', 'example.com');

      expect(matchedSpy).toHaveBeenCalledWith({
        url: 'https://api.example.com',
        pattern: 'example.com',
      });
    });
  });

  describe('matchesAny', () => {
    it('should return true if URL matches any pattern', () => {
      const patterns = ['example.com', 'api.test.com', 'localhost'];
      const result = (sdk as any).matcher.matchesAny('https://api.example.com', patterns);

      expect(result).toBe(true);
    });

    it('should return false if URL matches no patterns', () => {
      const patterns = ['example.com', 'api.test.com'];
      const result = (sdk as any).matcher.matchesAny('https://api.other.com', patterns);

      expect(result).toBe(false);
    });

    it('should handle empty pattern array', () => {
      const result = (sdk as any).matcher.matchesAny('https://api.example.com', []);

      expect(result).toBe(false);
    });
  });
});
