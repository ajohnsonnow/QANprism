/**
 * Project Prism - Panic Mode Service (Web)
 * Uses devicemotion API and keyboard shortcuts
 */

import { PanicConfig, PanicEvent, PanicTrigger, DuressCode } from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_CONFIG: PanicConfig = {
  enabled: true,
  shakeThreshold: 2.5, // 2.5G - firm shake
  shakeDuration: 500, // 500ms sustained
  volumeButtonEnabled: false, // No volume buttons on web
  hapticFeedback: true,
};

// Duress PIN codes
const DURESS_CODES: Record<DuressCode, 'real' | 'decoy' | 'scorched_earth'> = {
  '1969': 'real', // Stonewall - real unlock
  '0000': 'decoy', // Shows calculator
  '9111': 'scorched_earth', // Wipes everything
};

type PanicCallback = (event: PanicEvent) => void;

// =============================================================================
// PANIC SERVICE
// =============================================================================

class PanicService {
  private config: PanicConfig = DEFAULT_CONFIG;
  private listeners: Set<PanicCallback> = new Set();
  private shakeBuffer: number[] = [];
  private lastShakeTime: number = 0;
  private isActive: boolean = false;
  private motionHandler: ((event: DeviceMotionEvent) => void) | null = null;
  private keySequence: string[] = [];
  private keySequenceTimeout: number | null = null;

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

    // Request device motion permission (iOS 13+)
    if (typeof DeviceMotionEvent !== 'undefined' && 
        typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission();
        if (permission !== 'granted') {
          console.warn('[Panic] Device motion permission denied');
        }
      } catch (error) {
        console.error('[Panic] Permission request failed:', error);
      }
    }

    // Start accelerometer monitoring
    this.startAccelerometer();

    // Set up keyboard shortcuts (Escape key 3x quickly)
    this.setupKeyboardShortcuts();

    this.isActive = true;
    console.log('[Panic] Service active');
  }

  /**
   * Stop panic detection
   */
  stop(): void {
    if (!this.isActive) return;

    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler);
      this.motionHandler = null;
    }

    document.removeEventListener('keydown', this.handleKeyPress);

    this.isActive = false;
    console.log('[Panic] Service stopped');
  }

  /**
   * Add panic event listener
   */
  addListener(callback: PanicCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Trigger panic manually
   */
  triggerPanic(trigger: PanicTrigger = 'manual'): void {
    const event: PanicEvent = {
      trigger,
      timestamp: Date.now(),
      action: 'decoy', // Default to decoy
    };

    if (this.config.hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }

    console.log('[Panic] Triggered:', event);
    this.notifyListeners(event);
  }

  /**
   * Check if duress code is entered
   */
  checkDuressCode(code: string): 'real' | 'decoy' | 'scorched_earth' | null {
    if (code in DURESS_CODES) {
      const action = DURESS_CODES[code as DuressCode];
      
      if (action !== 'real') {
        const trigger: PanicTrigger = 'duress_pin';
        this.triggerPanic(trigger);
      }
      
      return action;
    }
    return null;
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  private startAccelerometer(): void {
    if (typeof DeviceMotionEvent === 'undefined') {
      console.warn('[Panic] DeviceMotionEvent not supported');
      return;
    }

    this.motionHandler = (event: DeviceMotionEvent) => {
      const { acceleration } = event;
      if (!acceleration) return;

      const { x, y, z } = acceleration;
      if (x === null || y === null || z === null) return;

      // Calculate total acceleration
      const totalAcceleration = Math.sqrt(x * x + y * y + z * z);

      // Check if shake threshold exceeded
      if (totalAcceleration > this.config.shakeThreshold) {
        const now = Date.now();
        this.shakeBuffer.push(now);

        // Keep only recent shakes
        this.shakeBuffer = this.shakeBuffer.filter(
          time => now - time < this.config.shakeDuration
        );

        // If sustained shake detected
        if (this.shakeBuffer.length >= 3 && now - this.lastShakeTime > 1000) {
          this.lastShakeTime = now;
          this.triggerPanic('shake');
          this.shakeBuffer = [];
        }
      }
    };

    window.addEventListener('devicemotion', this.motionHandler);
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', this.handleKeyPress);
  }

  private handleKeyPress = (event: KeyboardEvent): void => {
    // Escape key sequence (3x within 2 seconds)
    if (event.key === 'Escape') {
      this.keySequence.push('Escape');

      if (this.keySequenceTimeout) {
        clearTimeout(this.keySequenceTimeout);
      }

      this.keySequenceTimeout = setTimeout(() => {
        this.keySequence = [];
      }, 2000);

      if (this.keySequence.length >= 3) {
        this.triggerPanic('manual');
        this.keySequence = [];
        if (this.keySequenceTimeout) {
          clearTimeout(this.keySequenceTimeout);
        }
      }
    }
  };

  private notifyListeners(event: PanicEvent): void {
    this.listeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('[Panic] Listener error:', error);
      }
    });
  }

  /**
   * Get current config
   */
  getConfig(): PanicConfig {
    return { ...this.config };
  }

  /**
   * Update config
   */
  updateConfig(updates: Partial<PanicConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (this.config.enabled && !this.isActive) {
      this.initialize();
    } else if (!this.config.enabled && this.isActive) {
      this.stop();
    }
  }
}

// Export singleton
export const panicService = new PanicService();
