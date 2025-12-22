/**
 * Shared types for Auth Header Injector
 */

/**
 * Configuration for a single auth rule
 */
export interface AuthRule {
  id: string;
  pattern: string;
  token: string;
  label?: string; // Optional friendly name like "Staging API" or "GitHub Dev"
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Storage keys used by the extension
 */
export const STORAGE_KEYS = {
  RULES: 'auth_rules',
  ENABLED: 'extension_enabled',
} as const;

/**
 * Message types for communication between extension parts
 */
export enum MessageType {
  UPDATE_RULES = 'UPDATE_RULES',
  GET_RULES = 'GET_RULES',
  TOGGLE_ENABLED = 'TOGGLE_ENABLED',
  GET_STATUS = 'GET_STATUS',
}

/**
 * Message structure
 */
export interface Message {
  type: MessageType;
  payload?: unknown;
}

/**
 * Response structure
 */
export interface Response<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
