/**
 * Project Prism - API Client
 * 
 * MERGED & IMPROVED: Full API client with:
 * - Type-safe methods
 * - Error handling
 * - Timeout support
 * - User hash header for auth
 */

import { 
  Organization, 
  Beacon, 
  QueerCache, 
  MutualAidListing,
  EncryptedMessage,
  KeyBundle,
  FeedbackType,
} from '../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:8000/api'
  : 'https://api.prism.network/api';

const API_TIMEOUT = 30000;

// =============================================================================
// ERROR CLASS
// =============================================================================

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === 0;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isServerError(): boolean {
    return this.status >= 500;
  }
}

// =============================================================================
// API CLIENT
// =============================================================================

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private userHash: string | null = null;

  constructor(baseUrl: string = API_BASE_URL, timeout: number = API_TIMEOUT) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Set user hash for authenticated requests
   */
  setUserHash(hash: string | null): void {
    this.userHash = hash;
  }

  /**
   * Make HTTP request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.userHash) {
      headers['X-User-Hash'] = this.userHash;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status, 
          error.detail || error.message || 'Request failed',
          error.code
        );
      }

      if (response.status === 204) {
        return {} as T;
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if ((error as Error).name === 'AbortError') {
        throw new ApiError(408, 'Request timeout');
      }
      
      throw new ApiError(0, 'Network error - please check your connection');
    }
  }

  // ===========================================================================
  // AUTHENTICATION
  // ===========================================================================

  /**
   * Register new user (upload key bundle)
   */
  async registerUser(keyBundle: KeyBundle): Promise<{ user_hash: string }> {
    return this.request('/users/', {
      method: 'POST',
      body: JSON.stringify({
        identity_key: Buffer.from(keyBundle.identityKey).toString('base64'),
        registration_id: keyBundle.registrationId,
        signed_pre_key: {
          key_id: keyBundle.signedPreKey.keyId,
          public_key: Buffer.from(keyBundle.signedPreKey.publicKey).toString('base64'),
          signature: Buffer.from(keyBundle.signedPreKey.signature).toString('base64'),
        },
        pre_keys: keyBundle.preKeys?.map(pk => ({
          key_id: pk.keyId,
          public_key: Buffer.from(pk.publicKey).toString('base64'),
        })),
      }),
    });
  }

  /**
   * Get pre-key bundle for a user
   */
  async getPreKeyBundle(userHash: string): Promise<any> {
    return this.request(`/users/${userHash}/prekey/`);
  }

  /**
   * Upload new pre-keys
   * @param preKeys - Array of pre-keys to upload
   * @param signature - Signature proving ownership of the identity key
   */
  async uploadPreKeys(
    preKeys: Array<{ keyId: number; publicKey: Uint8Array }>,
    signature: string
  ): Promise<{ uploaded: number }> {
    const timestamp = Math.floor(Date.now() / 1000);
    return this.request('/users/prekeys/', {
      method: 'POST',
      body: JSON.stringify({
        pre_keys: preKeys.map(pk => ({
          key_id: pk.keyId,
          public_key: Buffer.from(pk.publicKey).toString('base64'),
        })),
        signature,
        timestamp,
      }),
    });
  }

  // ===========================================================================
  // ORGANIZATIONS
  // ===========================================================================

  /**
   * Get nearby organizations
   */
  async getNearbyOrgs(lat: number, lng: number, radiusKm: number = 10): Promise<Organization[]> {
    return this.request(`/orgs/?lat=${lat}&lng=${lng}&radius=${radiusKm}`);
  }

  /**
   * Get organization by ID
   */
  async getOrg(id: string): Promise<Organization> {
    return this.request(`/orgs/${id}/`);
  }

  /**
   * Search organizations
   */
  async searchOrgs(query: string): Promise<Organization[]> {
    return this.request(`/orgs/?search=${encodeURIComponent(query)}`);
  }

  // ===========================================================================
  // MESSAGING
  // ===========================================================================

  /**
   * Send encrypted message
   */
  async sendMessage(recipientHash: string, ciphertext: string): Promise<{ id: string }> {
    return this.request('/messages/', {
      method: 'POST',
      body: JSON.stringify({
        recipient_hash: recipientHash,
        ciphertext,
      }),
    });
  }

  /**
   * Fetch pending messages
   */
  async fetchMessages(): Promise<EncryptedMessage[]> {
    return this.request('/messages/');
  }

  /**
   * Acknowledge message receipt
   */
  async ackMessage(messageId: string): Promise<void> {
    return this.request(`/messages/${messageId}/ack/`, { method: 'POST' });
  }

  // ===========================================================================
  // BEACONS (Tribes)
  // ===========================================================================

  /**
   * Create a beacon
   */
  async createBeacon(topic: string, broadcastHash: string, geohash?: string): Promise<Beacon> {
    return this.request('/beacons/', {
      method: 'POST',
      body: JSON.stringify({
        topic,
        broadcast_hash: broadcastHash,
        geohash,
      }),
    });
  }

  /**
   * Get beacons for a topic
   */
  async getBeacons(topic: string, geohash?: string): Promise<Beacon[]> {
    let url = `/beacons/?topic=${topic}`;
    if (geohash) url += `&geohash=${geohash}`;
    return this.request(url);
  }

  // ===========================================================================
  // QUEER CACHE
  // ===========================================================================

  /**
   * Get nearby caches
   */
  async getNearbyCaches(lat: number, lng: number): Promise<QueerCache[]> {
    return this.request(`/caches/?lat=${lat}&lng=${lng}`);
  }

  /**
   * Create a cache
   */
  async createCache(cache: Partial<QueerCache>): Promise<QueerCache> {
    return this.request('/caches/', {
      method: 'POST',
      body: JSON.stringify(cache),
    });
  }

  // ===========================================================================
  // MUTUAL AID
  // ===========================================================================

  /**
   * Get mutual aid listings
   */
  async getMutualAidListings(
    lat: number, 
    lng: number, 
    type?: 'offer' | 'request',
    category?: string
  ): Promise<MutualAidListing[]> {
    let url = `/mutual-aid/?lat=${lat}&lng=${lng}`;
    if (type) url += `&type=${type}`;
    if (category) url += `&category=${category}`;
    return this.request(url);
  }

  /**
   * Create a listing
   */
  async createListing(listing: Partial<MutualAidListing>): Promise<MutualAidListing> {
    return this.request('/mutual-aid/', {
      method: 'POST',
      body: JSON.stringify(listing),
    });
  }

  /**
   * Mark listing as fulfilled
   */
  async fulfillListing(id: string): Promise<void> {
    return this.request(`/mutual-aid/${id}/fulfill/`, { method: 'POST' });
  }

  // ===========================================================================
  // FEEDBACK
  // ===========================================================================

  /**
   * Submit feedback
   */
  async submitFeedback(type: FeedbackType, ciphertext: string): Promise<void> {
    return this.request('/feedback/', {
      method: 'POST',
      body: JSON.stringify({
        feedback_type: type,
        ciphertext,
      }),
    });
  }
}

// Export singleton
export const apiClient = new ApiClient();
