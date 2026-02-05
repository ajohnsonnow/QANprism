/**
 * Project Prism - Location Service (Web)
 * Uses browser Geolocation API
 */

import { Location, FuzzyLocation } from '../types';

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_FUZZY_RADIUS = 200; // meters
const GEOHASH_CHARS = '0123456789bcdefghjkmnpqrstuvwxyz';

// =============================================================================
// LOCATION SERVICE
// =============================================================================

class LocationService {
  private watchId: number | null = null;
  private currentLocation: Location | null = null;

  /**
   * Request location permissions
   */
  async requestPermissions(): Promise<boolean> {
    if (!('geolocation' in navigator)) {
      console.error('[Location] Geolocation not supported');
      return false;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state === 'granted' || result.state === 'prompt';
    } catch (error) {
      console.error('[Location] Permission check failed:', error);
      return true; // Assume we can try
    }
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(): Promise<Location> {
    if (!('geolocation' in navigator)) {
      throw new Error('Geolocation not supported');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: Location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || 0,
            timestamp: position.timestamp,
          };
          this.currentLocation = location;
          resolve(location);
        },
        (error) => {
          console.error('[Location] Get current failed:', error);
          reject(new Error(error.message || 'Location unavailable'));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * Watch location changes
   */
  watchLocation(callback: (location: Location) => void): void {
    if (!('geolocation' in navigator)) {
      console.error('[Location] Geolocation not supported');
      return;
    }

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp,
        };
        this.currentLocation = location;
        callback(location);
      },
      (error) => {
        console.error('[Location] Watch failed:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 10000,
      }
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get last known location (cached)
   */
  getLastKnownLocation(): Location | null {
    return this.currentLocation;
  }

  /**
   * Fuzz location for privacy
   */
  fuzzLocation(location: Location, radius: number = DEFAULT_FUZZY_RADIUS): FuzzyLocation {
    const radiusInDegrees = radius / 111000; // Rough conversion
    
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomRadius = Math.random() * radiusInDegrees;
    
    const deltaLat = randomRadius * Math.cos(randomAngle);
    const deltaLng = randomRadius * Math.sin(randomAngle) / Math.cos(location.latitude * Math.PI / 180);
    
    return {
      ...location,
      originalLatitude: location.latitude,
      originalLongitude: location.longitude,
      latitude: location.latitude + deltaLat,
      longitude: location.longitude + deltaLng,
      fuzzyRadius: radius,
    };
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Encode location as geohash (for beacon privacy)
   */
  encodeGeohash(latitude: number, longitude: number, precision: number = 6): string {
    let idx = 0;
    let bit = 0;
    let evenBit = true;
    let geohash = '';

    let latMin = -90;
    let latMax = 90;
    let lonMin = -180;
    let lonMax = 180;

    while (geohash.length < precision) {
      if (evenBit) {
        const lonMid = (lonMin + lonMax) / 2;
        if (longitude > lonMid) {
          idx = (idx << 1) + 1;
          lonMin = lonMid;
        } else {
          idx = idx << 1;
          lonMax = lonMid;
        }
      } else {
        const latMid = (latMin + latMax) / 2;
        if (latitude > latMid) {
          idx = (idx << 1) + 1;
          latMin = latMid;
        } else {
          idx = idx << 1;
          latMax = latMid;
        }
      }
      evenBit = !evenBit;

      if (++bit === 5) {
        geohash += GEOHASH_CHARS[idx];
        bit = 0;
        idx = 0;
      }
    }

    return geohash;
  }

  /**
   * Decode geohash to approximate location
   */
  decodeGeohash(geohash: string): { latitude: number; longitude: number } {
    let evenBit = true;
    let latMin = -90;
    let latMax = 90;
    let lonMin = -180;
    let lonMax = 180;

    for (let i = 0; i < geohash.length; i++) {
      const chr = geohash[i];
      const idx = GEOHASH_CHARS.indexOf(chr);

      for (let j = 4; j >= 0; j--) {
        const bit = (idx >> j) & 1;

        if (evenBit) {
          const lonMid = (lonMin + lonMax) / 2;
          if (bit === 1) {
            lonMin = lonMid;
          } else {
            lonMax = lonMid;
          }
        } else {
          const latMid = (latMin + latMax) / 2;
          if (bit === 1) {
            latMin = latMid;
          } else {
            latMax = latMid;
          }
        }
        evenBit = !evenBit;
      }
    }

    return {
      latitude: (latMin + latMax) / 2,
      longitude: (lonMin + lonMax) / 2,
    };
  }

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  }
}

// Export singleton
export const locationService = new LocationService();
