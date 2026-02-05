/**
 * Project Prism - API Client (Web)
 * Converted from React Native to fetch API
 */

import { 
  Organization, 
  Beacon, 
  QueerCache, 
  MutualAidListing,
  EncryptedMessage,
  KeyBundle,
} from '../types';

// =============================================================================
// CONFIGURATION
// =============================================================================

const API_BASE_URL = import.meta.env.MODE === 'production'
  ? 'https://api.prism.network/api'
  : 'http://localhost:8000/api';

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
   * Make HTTP request with timeout
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
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new ApiError(response.status, error.message || 'Request failed', error.code);
      }

      return await response.json();
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new ApiError(0, 'Request timeout', 'TIMEOUT');
      }
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      throw new ApiError(0, 'Network error', 'NETWORK_ERROR');
    }
  }

  // ===========================================================================
  // ORGANIZATIONS
  // ===========================================================================

  async getOrganizations(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    org_type?: string;
  }): Promise<Organization[]> {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<Organization[]>(`/organizations/?${query}`);
  }

  async getOrganization(id: string): Promise<Organization> {
    return this.request<Organization>(`/organizations/${id}/`);
  }

  // ===========================================================================
  // BEACONS (Tribes)
  // ===========================================================================

  async getBeacons(params?: {
    topic?: string;
    geohash?: string;
  }): Promise<Beacon[]> {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<Beacon[]>(`/beacons/?${query}`);
  }

  async createBeacon(data: {
    topic: string;
    geohash?: string;
  }): Promise<Beacon> {
    return this.request<Beacon>('/beacons/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deleteBeacon(id: string): Promise<void> {
    await this.request<void>(`/beacons/${id}/`, {
      method: 'DELETE',
    });
  }

  // ===========================================================================
  // MESSAGING
  // ===========================================================================

  async getMessages(contactHash: string): Promise<EncryptedMessage[]> {
    return this.request<EncryptedMessage[]>(`/messages/?contact=${contactHash}`);
  }

  async sendMessage(data: {
    recipient_hash: string;
    ciphertext: string;
  }): Promise<EncryptedMessage> {
    return this.request<EncryptedMessage>('/messages/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getKeyBundle(userHash: string): Promise<KeyBundle> {
    return this.request<KeyBundle>(`/keys/${userHash}/`);
  }

  async uploadKeyBundle(bundle: KeyBundle): Promise<void> {
    await this.request<void>('/keys/', {
      method: 'POST',
      body: JSON.stringify(bundle),
    });
  }

  // ===========================================================================
  // QUEER CACHE
  // ===========================================================================

  async getCaches(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<QueerCache[]> {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<QueerCache[]>(`/caches/?${query}`);
  }

  async createCache(data: {
    latitude: number;
    longitude: number;
    ciphertext: string;
    icon_type: string;
  }): Promise<QueerCache> {
    return this.request<QueerCache>('/caches/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ===========================================================================
  // MUTUAL AID
  // ===========================================================================

  async getMutualAidListings(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    listing_type?: string;
    category?: string;
  }): Promise<MutualAidListing[]> {
    const query = new URLSearchParams(
      params as Record<string, string>
    ).toString();
    return this.request<MutualAidListing[]>(`/mutual-aid/?${query}`);
  }

  async createMutualAidListing(data: {
    listing_type: string;
    category: string;
    title: string;
    description: string;
    latitude: number;
    longitude: number;
    contact_cipher?: string;
  }): Promise<MutualAidListing> {
    return this.request<MutualAidListing>('/mutual-aid/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMutualAidListing(
    id: string,
    data: { is_fulfilled: boolean }
  ): Promise<MutualAidListing> {
    return this.request<MutualAidListing>(`/mutual-aid/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // ===========================================================================
  // FEEDBACK
  // ===========================================================================

  async submitFeedback(data: {
    type: string;
    content: string;
  }): Promise<void> {
    await this.request<void>('/feedback/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCommunitySubmissions(): Promise<any[]> {
    return this.request<any[]>('/community-bridge/');
  }

  async submitAdminApplication(data: any): Promise<any> {
    return this.request<any>('/admin-applications/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTribePosts(tribeId: string): Promise<any[]> {
    return this.request<any[]>(`/tribes/${tribeId}/posts/`);
  }

  async createTribePost(tribeId: string, content: string): Promise<any> {
    return this.request<any>(`/tribes/${tribeId}/posts/`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteTribePost(postId: number, adminKey: string, reason: string, adminEmail: string): Promise<any> {
    return this.request<any>(`/posts/${postId}/delete/`, {
      method: 'DELETE',
      headers: {
        'X-Admin-Key': adminKey,
      },
      body: JSON.stringify({ reason, admin_email: adminEmail }),
    });
  }

  async reactToPost(postId: number, reactionType: string): Promise<any> {
    return this.request<any>(`/posts/${postId}/react/`, {
      method: 'POST',
      body: JSON.stringify({ reaction_type: reactionType }),
    });
  }
}

// Export singleton
export const apiClient = new ApiClient();
