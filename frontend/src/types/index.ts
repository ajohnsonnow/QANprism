/**
 * Project Prism - TypeScript Type Definitions
 * Converted from React Native to Web PWA
 */

// =============================================================================
// USER & AUTH
// =============================================================================

export interface KeyBundle {
  identityKey: Uint8Array;
  registrationId: number;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  preKeys?: Array<{
    keyId: number;
    publicKey: Uint8Array;
  }>;
}

// =============================================================================
// ORGANIZATIONS
// =============================================================================

export type OrgType = 
  | 'nonprofit'
  | 'healthcare'
  | 'community'
  | 'housing'
  | 'business_food'
  | 'business_retail'
  | 'business_service'
  | 'legal'
  | 'education'
  | 'religious';

export interface Organization {
  id: string;
  name: string;
  description: string;
  org_type: OrgType;
  latitude: number;
  longitude: number;
  address?: string;
  phone?: string;
  website?: string;
  hours?: string;
  tags: string[];
  is_safe_space: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  distance?: number;
}

// =============================================================================
// MESSAGING
// =============================================================================

export interface EncryptedMessage {
  id: string;
  sender_hash: string;
  recipient_hash: string;
  ciphertext: string;
  timestamp: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isMine: boolean;
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  isDecrypted: boolean;
}

export interface Conversation {
  contactHash: string;
  displayName?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isVerified: boolean;
}

// =============================================================================
// BEACONS (Tribes)
// =============================================================================

export type BeaconTopic =
  | 'trans_fem'
  | 'trans_masc'
  | 'nonbinary'
  | 'bipoc_queer'
  | 'queer_parents'
  | 'newly_out'
  | 'queer_gamers'
  | 'queer_artists'
  | 'queer_faith'
  | 'queer_sober'
  | 'ace_aro'
  | 'elder_queer'
  | 'youth_queer'
  | 'intersex'
  | 'polyam_queer'
  | 'neurodivergent_queer'
  | 'disabled_queer'
  | 'rural_queer'
  | 'immigrant_queer'
  | 'general';

export interface Beacon {
  id: string;
  topic: BeaconTopic;
  broadcast_hash: string;
  geohash?: string;
  created_at: string;
  expires_at: string;
}

export interface Tribe {
  id: string;
  topic: BeaconTopic;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isJoined: boolean;
}

// =============================================================================
// QUEER CACHE
// =============================================================================

export type CacheIconType = 'heart' | 'coffee' | 'history' | 'warning' | 'star';

export interface QueerCache {
  id: string;
  latitude: number;
  longitude: number;
  ciphertext: string;
  icon_type: CacheIconType;
  created_at: string;
  expires_at: string;
}

// =============================================================================
// MUTUAL AID
// =============================================================================

export type ListingType = 'offer' | 'request';

export type ListingCategory =
  | 'food'
  | 'clothing'
  | 'housing'
  | 'transport'
  | 'emotional'
  | 'medical'
  | 'tech'
  | 'other';

export interface MutualAidListing {
  id: string;
  listing_type: ListingType;
  category: ListingCategory;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  distance?: number;
  contact_cipher?: string;
  is_fulfilled: boolean;
  created_at: string;
  expires_at: string;
}

// =============================================================================
// LOCATION
// =============================================================================

export interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface FuzzyLocation extends Location {
  originalLatitude: number;
  originalLongitude: number;
  fuzzyRadius: number;
}

// =============================================================================
// PANIC MODE
// =============================================================================

export type PanicTrigger = 'shake' | 'duress_pin' | 'volume_button' | 'manual';
export type DuressCode = '1969' | '0000' | '9111';

export interface PanicConfig {
  enabled: boolean;
  shakeThreshold: number;
  shakeDuration: number;
  volumeButtonEnabled: boolean;
  hapticFeedback: boolean;
}

export interface PanicEvent {
  trigger: PanicTrigger;
  timestamp: number;
  action: 'decoy' | 'scorched_earth' | 'hide';
}

// =============================================================================
// STORAGE
// =============================================================================

export interface StoredUser {
  hash: string;
  publicKey: string;
  registrationId: number;
}
