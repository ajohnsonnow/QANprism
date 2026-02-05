/**
 * Project Prism - Storage Service (Web)
 * Uses IndexedDB for secure storage and localStorage for preferences
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

// =============================================================================
// DATABASE SCHEMA
// =============================================================================

interface PrismDB extends DBSchema {
  secure: {
    key: string;
    value: string;
  };
  preferences: {
    key: string;
    value: any;
  };
  messages: {
    key: string;
    value: {
      id: string;
      contactHash: string;
      content: string;
      timestamp: number;
      isMine: boolean;
    };
    indexes: { 'by-contact': string };
  };
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DB_NAME = 'prism-db';
const DB_VERSION = 1;

// Secure storage keys
const SECURE_KEYS = {
  USER_HASH: 'prism.user_hash',
  SESSION_TOKEN: 'prism.session',
  MNEMONIC: 'prism.recovery.mnemonic',
  IDENTITY_KEY: 'prism.identity_key',
} as const;

// Preference keys
const PREF_KEYS = {
  HAS_ONBOARDED: 'has_onboarded',
  PANIC_ENABLED: 'panic_enabled',
  LOCATION_FUZZING: 'location_fuzzing',
  MESSAGE_RETENTION: 'message_retention',
  VERIFIED_CONTACTS: 'verified_contacts',
  CACHED_ORGS: 'cached_orgs',
  LAST_SYNC: 'last_sync',
  THEME: 'theme',
  JOINED_TRIBES: 'joined_tribes',
  AID_RADIUS: 'aid_radius',
} as const;

type SecureKey = typeof SECURE_KEYS[keyof typeof SECURE_KEYS];
type PrefKey = typeof PREF_KEYS[keyof typeof PREF_KEYS];

// =============================================================================
// STORAGE SERVICE
// =============================================================================

class StorageService {
  private db: IDBPDatabase<PrismDB> | null = null;

  /**
   * Initialize database
   */
  async initialize(): Promise<void> {
    if (this.db) return;

    this.db = await openDB<PrismDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Secure storage
        if (!db.objectStoreNames.contains('secure')) {
          db.createObjectStore('secure');
        }

        // Preferences
        if (!db.objectStoreNames.contains('preferences')) {
          db.createObjectStore('preferences');
        }

        // Messages with index
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by-contact', 'contactHash');
        }
      },
    });

    console.log('[Storage] Initialized');
  }

  private async ensureDB(): Promise<IDBPDatabase<PrismDB>> {
    if (!this.db) {
      await this.initialize();
    }
    return this.db!;
  }

  // ===========================================================================
  // SECURE STORAGE (IndexedDB)
  // ===========================================================================

  /**
   * Store sensitive data securely
   */
  async setSecure(key: SecureKey, value: string): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.put('secure', value, key);
    } catch (error) {
      console.error('[Storage] Secure set failed:', key, error);
      throw error;
    }
  }

  /**
   * Retrieve sensitive data
   */
  async getSecure(key: SecureKey): Promise<string | null> {
    try {
      const db = await this.ensureDB();
      const value = await db.get('secure', key);
      return value || null;
    } catch (error) {
      console.error('[Storage] Secure get failed:', key, error);
      return null;
    }
  }

  /**
   * Remove sensitive data
   */
  async removeSecure(key: SecureKey): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.delete('secure', key);
    } catch (error) {
      console.error('[Storage] Secure remove failed:', key, error);
    }
  }

  /**
   * Clear all secure data
   */
  async clearSecure(): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.clear('secure');
    } catch (error) {
      console.error('[Storage] Secure clear failed:', error);
    }
  }

  // ===========================================================================
  // PREFERENCES (IndexedDB)
  // ===========================================================================

  /**
   * Store preference
   */
  async set<T>(key: PrefKey, value: T): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.put('preferences', value, key);
    } catch (error) {
      console.error('[Storage] Set failed:', key, error);
      throw error;
    }
  }

  /**
   * Retrieve preference
   */
  async get<T>(key: PrefKey, defaultValue?: T): Promise<T | null> {
    try {
      const db = await this.ensureDB();
      const value = await db.get('preferences', key);
      return value !== undefined ? value : (defaultValue ?? null);
    } catch (error) {
      console.error('[Storage] Get failed:', key, error);
      return defaultValue ?? null;
    }
  }

  /**
   * Remove preference
   */
  async remove(key: PrefKey): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.delete('preferences', key);
    } catch (error) {
      console.error('[Storage] Remove failed:', key, error);
    }
  }

  /**
   * Clear all preferences
   */
  async clearPreferences(): Promise<void> {
    try {
      const db = await this.ensureDB();
      await db.clear('preferences');
    } catch (error) {
      console.error('[Storage] Clear preferences failed:', error);
    }
  }

  // ===========================================================================
  // MESSAGES
  // ===========================================================================

  async storeMessage(message: {
    id: string;
    contactHash: string;
    content: string;
    timestamp: number;
    isMine: boolean;
  }): Promise<void> {
    const db = await this.ensureDB();
    await db.put('messages', message);
  }

  async getMessages(contactHash: string): Promise<any[]> {
    const db = await this.ensureDB();
    return db.getAllFromIndex('messages', 'by-contact', contactHash);
  }

  async clearMessages(): Promise<void> {
    const db = await this.ensureDB();
    await db.clear('messages');
  }

  // ===========================================================================
  // UTILITIES
  // ===========================================================================

  /**
   * Clear all data (for panic mode or logout)
   */
  async clearAll(): Promise<void> {
    try {
      await this.clearSecure();
      await this.clearPreferences();
      await this.clearMessages();
      console.log('[Storage] All data cleared');
    } catch (error) {
      console.error('[Storage] Clear all failed:', error);
    }
  }

  /**
   * Export data for backup
   */
  async exportData(): Promise<any> {
    const db = await this.ensureDB();
    
    const secure = await db.getAll('secure');
    const preferences = await db.getAll('preferences');
    
    return {
      secure,
      preferences,
      timestamp: Date.now(),
    };
  }
}

// Export singleton and constants
export const storageService = new StorageService();
export { SECURE_KEYS, PREF_KEYS };
export type { SecureKey, PrefKey };
