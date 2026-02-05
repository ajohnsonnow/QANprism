/**
 * Project Prism - Storage Service
 * 
 * MERGED & IMPROVED: Secure storage with:
 * - Keychain for sensitive data
 * - AsyncStorage for preferences
 * - Type-safe API
 * - Migration support
 */

import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// CONSTANTS
// =============================================================================

// Keychain keys (sensitive data)
const KEYCHAIN_KEYS = {
  USER_HASH: 'prism.user_hash',
  SESSION_TOKEN: 'prism.session',
  MNEMONIC: 'prism.recovery.mnemonic',
} as const;

// AsyncStorage keys (preferences)
const STORAGE_KEYS = {
  HAS_ONBOARDED: '@prism/has_onboarded',
  PANIC_ENABLED: '@prism/panic_enabled',
  LOCATION_FUZZING: '@prism/location_fuzzing',
  MESSAGE_RETENTION: '@prism/message_retention',
  VERIFIED_CONTACTS: '@prism/verified_contacts',
  CACHED_ORGS: '@prism/cached_orgs',
  LAST_SYNC: '@prism/last_sync',
  THEME: '@prism/theme',
  JOINED_TRIBES: '@prism/joined_tribes',
} as const;

type KeychainKey = typeof KEYCHAIN_KEYS[keyof typeof KEYCHAIN_KEYS];
type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];

// =============================================================================
// STORAGE SERVICE
// =============================================================================

class StorageService {
  // ===========================================================================
  // KEYCHAIN (Secure Storage)
  // ===========================================================================

  /**
   * Store sensitive data in Keychain (Secure Enclave on iOS)
   */
  async setSecure(key: KeychainKey, value: string): Promise<void> {
    try {
      await Keychain.setGenericPassword(key, value, {
        service: key,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
      });
    } catch (error) {
      console.error('[Storage] Secure set failed:', key, error);
      throw error;
    }
  }

  /**
   * Retrieve sensitive data from Keychain
   */
  async getSecure(key: KeychainKey): Promise<string | null> {
    try {
      const result = await Keychain.getGenericPassword({ service: key });
      if (result && result.password) {
        return result.password;
      }
      return null;
    } catch (error) {
      console.error('[Storage] Secure get failed:', key, error);
      return null;
    }
  }

  /**
   * Remove sensitive data from Keychain
   */
  async removeSecure(key: KeychainKey): Promise<void> {
    try {
      await Keychain.resetGenericPassword({ service: key });
    } catch (error) {
      console.error('[Storage] Secure remove failed:', key, error);
    }
  }

  // ===========================================================================
  // ASYNC STORAGE (Regular Storage)
  // ===========================================================================

  /**
   * Store data in AsyncStorage
   */
  async set<T>(key: StorageKey, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error('[Storage] Set failed:', key, error);
      throw error;
    }
  }

  /**
   * Retrieve data from AsyncStorage
   */
  async get<T>(key: StorageKey): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue !== null) {
        return JSON.parse(jsonValue) as T;
      }
      return null;
    } catch (error) {
      console.error('[Storage] Get failed:', key, error);
      return null;
    }
  }

  /**
   * Remove data from AsyncStorage
   */
  async remove(key: StorageKey): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('[Storage] Remove failed:', key, error);
    }
  }

  /**
   * Get multiple values at once
   */
  async multiGet<T extends Record<string, any>>(keys: StorageKey[]): Promise<T> {
    try {
      const pairs = await AsyncStorage.multiGet(keys);
      const result: Record<string, any> = {};
      
      for (const [key, value] of pairs) {
        if (value !== null) {
          result[key] = JSON.parse(value);
        }
      }
      
      return result as T;
    } catch (error) {
      console.error('[Storage] MultiGet failed:', error);
      return {} as T;
    }
  }

  // ===========================================================================
  // APP-SPECIFIC HELPERS
  // ===========================================================================

  /**
   * Check if user has completed onboarding
   */
  async hasOnboarded(): Promise<boolean> {
    const value = await this.get<boolean>(STORAGE_KEYS.HAS_ONBOARDED);
    return value === true;
  }

  /**
   * Mark onboarding as complete
   */
  async setOnboarded(): Promise<void> {
    await this.set(STORAGE_KEYS.HAS_ONBOARDED, true);
  }

  /**
   * Get user hash
   */
  async getUserHash(): Promise<string | null> {
    return this.getSecure(KEYCHAIN_KEYS.USER_HASH);
  }

  /**
   * Store user hash
   */
  async setUserHash(hash: string): Promise<void> {
    await this.setSecure(KEYCHAIN_KEYS.USER_HASH, hash);
  }

  /**
   * Get panic mode enabled state
   */
  async isPanicEnabled(): Promise<boolean> {
    const value = await this.get<boolean>(STORAGE_KEYS.PANIC_ENABLED);
    return value !== false; // Default true
  }

  /**
   * Set panic mode state
   */
  async setPanicEnabled(enabled: boolean): Promise<void> {
    await this.set(STORAGE_KEYS.PANIC_ENABLED, enabled);
  }

  /**
   * Get message retention period (days)
   */
  async getMessageRetention(): Promise<number> {
    const value = await this.get<number>(STORAGE_KEYS.MESSAGE_RETENTION);
    return value || 30; // Default 30 days
  }

  /**
   * Set message retention period
   */
  async setMessageRetention(days: number): Promise<void> {
    await this.set(STORAGE_KEYS.MESSAGE_RETENTION, days);
  }

  /**
   * Get verified contact IDs
   */
  async getVerifiedContacts(): Promise<string[]> {
    const value = await this.get<string[]>(STORAGE_KEYS.VERIFIED_CONTACTS);
    return value || [];
  }

  /**
   * Add a verified contact
   */
  async addVerifiedContact(contactId: string): Promise<void> {
    const contacts = await this.getVerifiedContacts();
    if (!contacts.includes(contactId)) {
      contacts.push(contactId);
      await this.set(STORAGE_KEYS.VERIFIED_CONTACTS, contacts);
    }
  }

  /**
   * Get joined tribe IDs
   */
  async getJoinedTribes(): Promise<string[]> {
    const value = await this.get<string[]>(STORAGE_KEYS.JOINED_TRIBES);
    return value || [];
  }

  /**
   * Set joined tribes
   */
  async setJoinedTribes(tribes: string[]): Promise<void> {
    await this.set(STORAGE_KEYS.JOINED_TRIBES, tribes);
  }

  /**
   * Cache organizations for offline use
   */
  async cacheOrganizations(orgs: any[]): Promise<void> {
    await this.set(STORAGE_KEYS.CACHED_ORGS, orgs);
    await this.set(STORAGE_KEYS.LAST_SYNC, Date.now());
  }

  /**
   * Get cached organizations
   */
  async getCachedOrganizations(): Promise<any[]> {
    return (await this.get<any[]>(STORAGE_KEYS.CACHED_ORGS)) || [];
  }

  // ===========================================================================
  // SCORCHED EARTH
  // ===========================================================================

  /**
   * Wipe ALL storage (for Scorched Earth protocol)
   */
  async wipeAll(): Promise<void> {
    console.log('[Storage] 🔥 Wiping all storage...');

    try {
      // Clear AsyncStorage
      await AsyncStorage.clear();

      // Clear all Keychain items
      for (const key of Object.values(KEYCHAIN_KEYS)) {
        await this.removeSecure(key);
      }

      console.log('[Storage] ✅ All storage wiped');
    } catch (error) {
      console.error('[Storage] Wipe failed:', error);
      throw error;
    }
  }
}

// Export singleton
export const storageService = new StorageService();
export { KEYCHAIN_KEYS, STORAGE_KEYS };
