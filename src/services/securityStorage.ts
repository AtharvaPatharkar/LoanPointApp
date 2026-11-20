import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Storage Keys for Secure Client Storage
 */
const SECURE_KEYS = {
  AUTH_TOKEN: 'lp_secure_auth_token',
  REFRESH_TOKEN: 'lp_secure_refresh_token',
  USER_SESSION: 'lp_secure_user_session',
} as const;

// Web memory fallback because SecureStore is native-only (iOS Keychain / Android Keystore)
const webMemoryStorage = new Map<string, string>();

/**
 * Save sensitive value in Hardware-Backed Keystore / Keychain
 */
export async function saveSecureItem(key: string, value: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
      } else {
        webMemoryStorage.set(key, value);
      }
      return;
    }

    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  } catch (err: any) {
    console.warn(`[SecureStore Write Warning for ${key}]:`, err.message);
  }
}

/**
 * Get sensitive value from Hardware-Backed Keystore / Keychain
 */
export async function getSecureItem(key: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
      return webMemoryStorage.get(key) || null;
    }

    return await SecureStore.getItemAsync(key);
  } catch (err: any) {
    console.warn(`[SecureStore Read Warning for ${key}]:`, err.message);
    return null;
  }
}

/**
 * Delete sensitive value upon logout
 */
export async function deleteSecureItem(key: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
      webMemoryStorage.delete(key);
      return;
    }

    await SecureStore.deleteItemAsync(key);
  } catch (err: any) {
    console.warn(`[SecureStore Delete Warning for ${key}]:`, err.message);
  }
}

export { SECURE_KEYS };
