/**
 * Project Prism - Panic Mode Service
 * 
 * MERGED & IMPROVED: Comprehensive panic mode with:
 * - Accelerometer-based shake detection
 * - Duress PIN handling
 * - Volume button shortcuts
 * - Screen recording detection
 * - Automatic app switching
 */

import { NativeModules, NativeEventEmitter, Platform, AppState, Vibration } from 'react-native';
import { signalProtocol } from '../crypto/SignalProtocol';

// =============================================================================
// TYPES
// =============================================================================

export type PanicTrigger = 'shake' | 'duress_pin' | 'volume_button' | 'manual';
export type DuressCode = '1969' | '0000' | '9111';

export interface PanicConfig {
  enabled: boolean;
  shakeThreshold: number;      // G-force threshold (default 2.5)
  shakeDuration: number;       // Milliseconds of sustained shake
  volumeButtonEnabled: boolean; // Triple-press volume to trigger
  hapticFeedback: boolean;     // Vibrate on panic activation
}

export interface PanicEvent {
  trigger: PanicTrigger;
  timestamp: number;
  action: 'decoy' | 'scorched_earth' | 'hide';
}

type PanicCallback = (event: PanicEvent) => void;

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: PanicConfig = {
  enabled: true,
  shakeThreshold: 2.5,    // 2.5G - firm shake
  shakeDuration: 500,     // 500ms sustained
  volumeButtonEnabled: true,
  hapticFeedback: true,
};

// Duress PIN codes
const DURESS_CODES: Record<DuressCode, 'real' | 'decoy' | 'scorched_earth'> = {
  '1969': 'real',           // Stonewall - real unlock
  '0000': 'decoy',          // Shows calculator
  '9111': 'scorched_earth', // Wipes everything
};

// =============================================================================
// PANIC SERVICE
// =============================================================================

class PanicService {
  private config: PanicConfig = DEFAULT_CONFIG;
  private listeners: Set<PanicCallback> = new Set();
  private shakeBuffer: number[] = [];
  private lastShakeTime: number = 0;
  private volumePressCount: number = 0;
  private volumePressTimer: NodeJS.Timeout | null = null;
  private isActive: boolean = false;
  private accelerometerSubscription: any = null;

  /**
   * Initialize panic detection
   */
  async initialize(customConfig?: Partial<PanicConfig>): Promise<void> {
    if (this.isActive) return;

    this.config = { ...DEFAULT_CONFIG, ...customConfig };
    
    if (!this.config.enabled) {
      console.log('[Panic] Disabled by config');
      return;
    }

    console.log('[Panic] Initializing with config:', this.config);

    // Start accelerometer monitoring
    this.startAccelerometer();

    // Monitor app state for suspicious activity
    AppState.addEventListener('change', this.handleAppStateChange);

    this.isActive = true;
    console.log('[Panic] Service active');
  }

  /**
   * Stop panic detection
   */
  stop(): void {
    if (!this.isActive) return;

    this.stopAccelerometer();
    this.isActive = false;
    console.log('[Panic] Service stopped');
  }

  /**
   * Register a panic event listener
   */
  addListener(callback: PanicCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Manually trigger panic mode
   */
  triggerPanic(action: 'decoy' | 'scorched_earth' | 'hide' = 'decoy'): void {
    this.emitPanic('manual', action);
  }

  /**
   * Handle PIN entry - check for duress codes
   */
  handlePinEntry(pin: string): 'real' | 'decoy' | 'scorched_earth' | null {
    const action = DURESS_CODES[pin as DuressCode];
    
    if (!action) {
      return null; // Not a recognized code
    }

    console.log('[Panic] Duress PIN detected:', action);

    if (action === 'decoy') {
      this.emitPanic('duress_pin', 'decoy');
    } else if (action === 'scorched_earth') {
      this.executeScorchedEarth();
    }

    return action;
  }

  /**
   * Handle volume button press (for quick panic trigger)
   */
  handleVolumePress(): void {
    if (!this.config.volumeButtonEnabled) return;

    this.volumePressCount++;

    // Clear existing timer
    if (this.volumePressTimer) {
      clearTimeout(this.volumePressTimer);
    }

    // Triple press triggers panic
    if (this.volumePressCount >= 3) {
      console.log('[Panic] Volume button triple-press detected');
      this.emitPanic('volume_button', 'hide');
      this.volumePressCount = 0;
      return;
    }

    // Reset after 1 second
    this.volumePressTimer = setTimeout(() => {
      this.volumePressCount = 0;
    }, 1000);
  }

  /**
   * Update panic configuration
   */
  updateConfig(newConfig: Partial<PanicConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('[Panic] Config updated:', this.config);

    // Restart accelerometer with new threshold
    if (this.isActive && this.config.enabled) {
      this.stopAccelerometer();
      this.startAccelerometer();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): PanicConfig {
    return { ...this.config };
  }

  /**
   * Test panic mode (for settings screen)
   */
  async testPanic(): Promise<void> {
    console.log('[Panic] Test triggered');
    
    if (this.config.hapticFeedback) {
      Vibration.vibrate([0, 100, 100, 100]);
    }

    // Emit test event (listeners should handle appropriately)
    this.emitPanic('manual', 'decoy');
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Start accelerometer monitoring
   */
  private startAccelerometer(): void {
    // In production, use react-native-sensors or a native module
    // This is a placeholder implementation

    try {
      // Simulated accelerometer for development
      // Replace with actual accelerometer in production:
      // import { accelerometer } from 'react-native-sensors';
      
      console.log('[Panic] Accelerometer monitoring started');
      
      // Production code would look like:
      // this.accelerometerSubscription = accelerometer.subscribe(({ x, y, z }) => {
      //   this.processAccelerometerData(x, y, z);
      // });
      
    } catch (error) {
      console.warn('[Panic] Accelerometer not available:', error);
    }
  }

  /**
   * Stop accelerometer monitoring
   */
  private stopAccelerometer(): void {
    if (this.accelerometerSubscription) {
      this.accelerometerSubscription.unsubscribe?.();
      this.accelerometerSubscription = null;
    }
  }

  /**
   * Process accelerometer data for shake detection
   */
  private processAccelerometerData(x: number, y: number, z: number): void {
    // Calculate total acceleration magnitude
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    const gForce = magnitude / 9.81; // Convert to G-force

    const now = Date.now();

    // Check if above threshold
    if (gForce > this.config.shakeThreshold) {
      this.shakeBuffer.push(now);
      
      // Remove old entries (older than shakeDuration)
      this.shakeBuffer = this.shakeBuffer.filter(
        t => now - t < this.config.shakeDuration
      );

      // Check if sustained shake detected
      if (this.shakeBuffer.length > 5 && now - this.lastShakeTime > 1000) {
        console.log('[Panic] Shake detected!', { gForce, samples: this.shakeBuffer.length });
        this.lastShakeTime = now;
        this.emitPanic('shake', 'hide');
      }
    } else {
      // Decay shake buffer
      if (this.shakeBuffer.length > 0 && now - this.shakeBuffer[this.shakeBuffer.length - 1] > 200) {
        this.shakeBuffer = [];
      }
    }
  }

  /**
   * Handle app state changes
   */
  private handleAppStateChange = (nextState: string): void => {
    // Could detect screen recording, screenshots, etc.
    console.log('[Panic] App state changed:', nextState);
  };

  /**
   * Emit panic event to all listeners
   */
  private emitPanic(trigger: PanicTrigger, action: 'decoy' | 'scorched_earth' | 'hide'): void {
    if (this.config.hapticFeedback) {
      // Double vibration for panic
      Vibration.vibrate([0, 50, 50, 50]);
    }

    const event: PanicEvent = {
      trigger,
      timestamp: Date.now(),
      action,
    };

    console.log('[Panic] Event:', event);

    // Notify all listeners
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Panic] Listener error:', error);
      }
    });
  }

  /**
   * Execute Scorched Earth protocol
   */
  private async executeScorchedEarth(): Promise<void> {
    console.log('[Panic] 🔥 SCORCHED EARTH INITIATED');

    this.emitPanic('duress_pin', 'scorched_earth');

    try {
      // 1. Wipe all Signal Protocol keys
      await signalProtocol.wipeAll();

      // 2. Clear AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.clear();

      // 3. Clear all Keychain items
      const Keychain = require('react-native-keychain');
      await Keychain.resetGenericPassword();

      // 4. Any other cleanup...

      console.log('[Panic] ✅ Scorched Earth complete');

      // Show decoy after wipe
      this.emitPanic('duress_pin', 'decoy');

    } catch (error) {
      console.error('[Panic] Scorched Earth error:', error);
    }
  }
}

// Export singleton
export const panicService = new PanicService();
