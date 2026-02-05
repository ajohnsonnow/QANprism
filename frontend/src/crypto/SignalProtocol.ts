/**
 * Project Prism - Signal Protocol Implementation (Web)
 * Uses Web Crypto API and tweetnacl
 */

import nacl from 'tweetnacl';
import { storageService, SECURE_KEYS } from '../utils/StorageService';

// =============================================================================
// TYPES
// =============================================================================

export interface IdentityKeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface PreKeyPair {
  keyId: number;
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

export interface SignedPreKeyPair extends PreKeyPair {
  signature: Uint8Array;
  timestamp: number;
}

export interface PreKeyBundle {
  registrationId: number;
  deviceId: number;
  identityKey: Uint8Array;
  signedPreKey: {
    keyId: number;
    publicKey: Uint8Array;
    signature: Uint8Array;
  };
  preKey?: {
    keyId: number;
    publicKey: Uint8Array;
  };
}

export interface EncryptedMessage {
  type: 'prekey' | 'message';
  registrationId: number;
  deviceId: number;
  ciphertext: Uint8Array;
}

export interface SessionState {
  remoteIdentityKey: Uint8Array;
  localIdentityKeyPair: IdentityKeyPair;
  rootKey: Uint8Array;
  chainKey: Uint8Array;
  messageNumber: number;
  previousCounter: number;
}

// =============================================================================
// SIGNAL PROTOCOL
// =============================================================================

class SignalProtocol {
  private identityKeyPair: IdentityKeyPair | null = null;
  private registrationId: number = 0;
  private sessions: Map<string, SessionState> = new Map();

  /**
   * Initialize the protocol
   */
  async initialize(): Promise<void> {
    // Try to load existing identity
    const storedIdentity = await storageService.getSecure(SECURE_KEYS.IDENTITY_KEY);
    const storedRegId = await storageService.getSecure(SECURE_KEYS.USER_HASH);

    if (storedIdentity && storedRegId) {
      const data = JSON.parse(storedIdentity);
      this.identityKeyPair = {
        publicKey: new Uint8Array(data.publicKey),
        privateKey: new Uint8Array(data.privateKey),
      };
      this.registrationId = parseInt(storedRegId, 10);
      console.log('[Signal] Loaded existing identity');
    } else {
      // Generate new identity
      await this.generateIdentity();
    }
  }

  /**
   * Generate new identity key pair
   */
  async generateIdentity(): Promise<void> {
    // Generate Ed25519 key pair for identity
    const keyPair = nacl.sign.keyPair();
    
    this.identityKeyPair = {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
    };

    // Generate random registration ID
    this.registrationId = Math.floor(Math.random() * 16384);

    // Store securely
    await storageService.setSecure(
      SECURE_KEYS.IDENTITY_KEY,
      JSON.stringify({
        publicKey: Array.from(this.identityKeyPair.publicKey),
        privateKey: Array.from(this.identityKeyPair.privateKey),
      })
    );
    await storageService.setSecure(
      SECURE_KEYS.USER_HASH,
      this.registrationId.toString()
    );

    console.log('[Signal] Generated new identity');
  }

  /**
   * Generate a pre-key pair
   */
  generatePreKey(keyId: number): PreKeyPair {
    const keyPair = nacl.box.keyPair();
    return {
      keyId,
      publicKey: keyPair.publicKey,
      privateKey: keyPair.secretKey,
    };
  }

  /**
   * Generate a signed pre-key
   */
  generateSignedPreKey(keyId: number): SignedPreKeyPair {
    if (!this.identityKeyPair) {
      throw new Error('Identity not initialized');
    }

    const preKey = this.generatePreKey(keyId);
    const signature = nacl.sign.detached(preKey.publicKey, this.identityKeyPair.privateKey);

    return {
      ...preKey,
      signature,
      timestamp: Date.now(),
    };
  }

  /**
   * Create pre-key bundle for server upload
   */
  async createPreKeyBundle(): Promise<PreKeyBundle> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not initialized');
    }

    const signedPreKey = this.generateSignedPreKey(1);
    const preKey = this.generatePreKey(1);

    return {
      registrationId: this.registrationId,
      deviceId: 1,
      identityKey: this.identityKeyPair.publicKey,
      signedPreKey: {
        keyId: signedPreKey.keyId,
        publicKey: signedPreKey.publicKey,
        signature: signedPreKey.signature,
      },
      preKey: {
        keyId: preKey.keyId,
        publicKey: preKey.publicKey,
      },
    };
  }

  /**
   * Encrypt a message
   */
  async encryptMessage(recipientHash: string, plaintext: string): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not initialized');
    }

    // For simplicity, using NaCl box (Curve25519 + XSalsa20 + Poly1305)
    // In production, implement full Double Ratchet
    const session = this.sessions.get(recipientHash);
    
    if (!session) {
      throw new Error('No session established');
    }

    const nonce = nacl.randomBytes(24);
    const messageBytes = new TextEncoder().encode(plaintext);
    
    // Derive encryption key from chain key
    const encryptionKey = await this.deriveKey(session.chainKey, new Uint8Array([0x01]));
    
    // Encrypt using XSalsa20-Poly1305
    const ciphertext = nacl.secretbox(messageBytes, nonce, encryptionKey.slice(0, 32));

    // Update chain key (ratchet forward)
    session.chainKey = await this.deriveKey(session.chainKey, new Uint8Array([0x02]));
    session.messageNumber++;

    // Encode as base64
    const encrypted = {
      nonce: Array.from(nonce),
      ciphertext: Array.from(ciphertext),
      messageNumber: session.messageNumber,
    };

    return btoa(new TextDecoder().decode(new TextEncoder().encode(JSON.stringify(encrypted))));
  }

  /**
   * Decrypt a message
   */
  async decryptMessage(senderHash: string, ciphertext: string): Promise<string> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not initialized');
    }

    const session = this.sessions.get(senderHash);
    
    if (!session) {
      throw new Error('No session established');
    }

    try {
      const encrypted = JSON.parse(atob(ciphertext));
      const nonce = new Uint8Array(encrypted.nonce);
      const ciphertextBytes = new Uint8Array(encrypted.ciphertext);

      // Derive decryption key from chain key
      const decryptionKey = await this.deriveKey(session.chainKey, new Uint8Array([0x01]));

      // Decrypt
      const plaintext = nacl.secretbox.open(ciphertextBytes, nonce, decryptionKey.slice(0, 32));

      if (!plaintext) {
        throw new Error('Decryption failed');
      }

      // Update chain key (ratchet forward)
      session.chainKey = await this.deriveKey(session.chainKey, new Uint8Array([0x02]));

      return new TextDecoder().decode(plaintext);
    } catch (error) {
      console.error('[Signal] Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  }

  /**
   * Establish a session with a remote user
   */
  async establishSession(remoteHash: string, remoteBundle: PreKeyBundle): Promise<void> {
    if (!this.identityKeyPair) {
      throw new Error('Identity not initialized');
    }

    // Verify signature on signed pre-key
    const signatureValid = nacl.sign.detached.verify(
      remoteBundle.signedPreKey.publicKey,
      remoteBundle.signedPreKey.signature,
      remoteBundle.identityKey
    );

    if (!signatureValid) {
      throw new Error('Invalid pre-key signature');
    }

    // Generate ephemeral key
    const ephemeralKey = nacl.box.keyPair();

    // Perform X3DH key agreement
    const sharedSecret = this.performX3DH(
      this.identityKeyPair,
      ephemeralKey,
      remoteBundle.identityKey,
      remoteBundle.signedPreKey.publicKey
    );

    // Derive root and chain keys using HKDF
    const rootKey = await this.deriveKey(sharedSecret, new TextEncoder().encode('RootKey'));
    const chainKey = await this.deriveKey(sharedSecret, new TextEncoder().encode('ChainKey'));

    // Store session
    this.sessions.set(remoteHash, {
      remoteIdentityKey: remoteBundle.identityKey,
      localIdentityKeyPair: this.identityKeyPair,
      rootKey,
      chainKey,
      messageNumber: 0,
      previousCounter: 0,
    });

    console.log('[Signal] Session established with', remoteHash);
  }

  /**
   * Get identity key pair
   */
  getIdentityKeyPair(): IdentityKeyPair | null {
    return this.identityKeyPair;
  }

  /**
   * Get registration ID
   */
  getRegistrationId(): number {
    return this.registrationId;
  }

  /**
   * Generate user hash from public key
   */
  async generateUserHash(publicKey: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', new Uint8Array(publicKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Perform X3DH key agreement (simplified)
   */
  private performX3DH(
    identityKey: IdentityKeyPair,
    ephemeralKey: nacl.BoxKeyPair,
    remoteIdentityKey: Uint8Array,
    remotePreKey: Uint8Array
  ): Uint8Array {
    // DH1: Identity x Remote PreKey
    const dh1 = nacl.box.before(remotePreKey, identityKey.privateKey.slice(0, 32));
    
    // DH2: Ephemeral x Remote Identity
    const dh2 = nacl.box.before(remoteIdentityKey.slice(0, 32), ephemeralKey.secretKey);
    
    // DH3: Ephemeral x Remote PreKey
    const dh3 = nacl.box.before(remotePreKey, ephemeralKey.secretKey);
    
    // Concatenate all DH outputs
    const sharedSecret = new Uint8Array(dh1.length + dh2.length + dh3.length);
    sharedSecret.set(dh1, 0);
    sharedSecret.set(dh2, dh1.length);
    sharedSecret.set(dh3, dh1.length + dh2.length);
    
    return sharedSecret;
  }

  /**
   * Derive key using HKDF (simplified with SHA-256)
   */
  private async deriveKey(inputKey: Uint8Array, info: Uint8Array): Promise<Uint8Array> {
    // Import key
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(inputKey),
      { name: 'HKDF' },
      false,
      ['deriveBits']
    );

    // Derive bits
    const derivedBits = await crypto.subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        salt: new Uint8Array(32), // Zero salt
        info: new Uint8Array(info),
      },
      key,
      256
    );

    return new Uint8Array(derivedBits);
  }

  /**
   * Clear all sessions and identity (for panic mode)
   */
  async clearAll(): Promise<void> {
    this.sessions.clear();
    this.identityKeyPair = null;
    this.registrationId = 0;
    await storageService.removeSecure(SECURE_KEYS.IDENTITY_KEY);
    await storageService.removeSecure(SECURE_KEYS.USER_HASH);
    console.log('[Signal] All crypto data cleared');
  }
}

// Export singleton
export const signalProtocol = new SignalProtocol();
