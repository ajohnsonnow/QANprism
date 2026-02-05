/**
 * Project Prism - Location Service
 * 
 * MERGED & IMPROVED: Privacy-first location with:
 * - Permission handling
 * - Location fuzzing for privacy
 * - Distance calculations
 * - Geohash support for beacons
 */

import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

// =============================================================================
// TYPES
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
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Prism needs your location to find nearby resources and enable location-based features.',
            buttonPositive: 'Allow',
            buttonNegative: 'Deny',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.error('[Location] Permission error:', err);
        return false;
      }
    }
    
    // iOS handles via Info.plist
    return true;
  }

  /**
   * Get current location (one-time)
   */
  async getCurrentLocation(): Promise<Location> {
    const hasPermission = await this.requestPermissions();
    
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
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
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );
    });
  }

  /**
   * Start watching location updates
   */
  startWatching(onUpdate: (location: Location) => void): void {
    if (this.watchId !== null) {
      this.stopWatching();
    }

    this.watchId = Geolocation.watchPosition(
      (position) => {
        const location: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp,
        };
        this.currentLocation = location;
        onUpdate(location);
      },
      (error) => {
        console.error('[Location] Watch error:', error);
      },
      {
        enableHighAccuracy: true,
        distanceFilter: 10,
      }
    );
  }

  /**
   * Stop watching location
   */
  stopWatching(): void {
    if (this.watchId !== null) {
      Geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  /**
   * Get last known location (without new request)
   */
  getLastKnownLocation(): Location | null {
    return this.currentLocation;
  }

  /**
   * Fuzzy location - randomize within radius for privacy
   * Used when sharing location publicly (mutual aid, caches)
   */
  fuzzyLocation(location: Location, radiusMeters: number = DEFAULT_FUZZY_RADIUS): FuzzyLocation {
    // Random angle
    const angle = Math.random() * 2 * Math.PI;
    
    // Random distance (sqrt for uniform distribution within circle)
    const distance = Math.sqrt(Math.random()) * radiusMeters;
    
    // Earth's radius in meters
    const earthRadius = 6371000;
    
    // Calculate offset
    const latOffset = (distance * Math.cos(angle)) / earthRadius * (180 / Math.PI);
    const lonOffset = (distance * Math.sin(angle)) / 
                      (earthRadius * Math.cos(location.latitude * Math.PI / 180)) * 
                      (180 / Math.PI);
    
    return {
      latitude: location.latitude + latOffset,
      longitude: location.longitude + lonOffset,
      accuracy: radiusMeters,
      timestamp: location.timestamp,
      originalLatitude: location.latitude,
      originalLongitude: location.longitude,
      fuzzyRadius: radiusMeters,
    };
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in meters
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Check if point is within radius
   */
  isWithinRadius(
    lat1: number, lon1: number, 
    lat2: number, lon2: number, 
    radiusMeters: number
  ): boolean {
    return this.calculateDistance(lat1, lon1, lat2, lon2) <= radiusMeters;
  }

  /**
   * Format distance for display (metric)
   */
  formatDistance(meters: number): string {
    if (meters < 100) {
      return `${Math.round(meters)}m`;
    } else if (meters < 1000) {
      return `${Math.round(meters / 10) * 10}m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)}km`;
    } else {
      return `${Math.round(meters / 1000)}km`;
    }
  }

  /**
   * Format distance for display (imperial)
   */
  formatDistanceMiles(meters: number): string {
    const miles = meters / 1609.344;
    if (miles < 0.1) {
      const feet = Math.round(meters * 3.281);
      return `${feet}ft`;
    } else if (miles < 10) {
      return `${miles.toFixed(1)}mi`;
    } else {
      return `${Math.round(miles)}mi`;
    }
  }

  /**
   * Generate geohash for location (for beacon discovery)
   * Precision 4 = ~20km cells, 5 = ~5km, 6 = ~1km
   */
  toGeohash(lat: number, lon: number, precision: number = 5): string {
    let latRange = { min: -90, max: 90 };
    let lonRange = { min: -180, max: 180 };
    let hash = '';
    let bit = 0;
    let ch = 0;
    let isLon = true;

    while (hash.length < precision) {
      if (isLon) {
        const mid = (lonRange.min + lonRange.max) / 2;
        if (lon >= mid) {
          ch |= (1 << (4 - bit));
          lonRange.min = mid;
        } else {
          lonRange.max = mid;
        }
      } else {
        const mid = (latRange.min + latRange.max) / 2;
        if (lat >= mid) {
          ch |= (1 << (4 - bit));
          latRange.min = mid;
        } else {
          latRange.max = mid;
        }
      }
      isLon = !isLon;

      if (bit < 4) {
        bit++;
      } else {
        hash += GEOHASH_CHARS[ch];
        bit = 0;
        ch = 0;
      }
    }

    return hash;
  }

  /**
   * Decode geohash to lat/lon bounds
   */
  fromGeohash(hash: string): { lat: number; lon: number; error: { lat: number; lon: number } } {
    let latRange = { min: -90, max: 90 };
    let lonRange = { min: -180, max: 180 };
    let isLon = true;

    for (const char of hash.toLowerCase()) {
      const idx = GEOHASH_CHARS.indexOf(char);
      if (idx === -1) continue;

      for (let i = 4; i >= 0; i--) {
        const bit = (idx >> i) & 1;
        if (isLon) {
          const mid = (lonRange.min + lonRange.max) / 2;
          if (bit) {
            lonRange.min = mid;
          } else {
            lonRange.max = mid;
          }
        } else {
          const mid = (latRange.min + latRange.max) / 2;
          if (bit) {
            latRange.min = mid;
          } else {
            latRange.max = mid;
          }
        }
        isLon = !isLon;
      }
    }

    return {
      lat: (latRange.min + latRange.max) / 2,
      lon: (lonRange.min + lonRange.max) / 2,
      error: {
        lat: (latRange.max - latRange.min) / 2,
        lon: (lonRange.max - lonRange.min) / 2,
      },
    };
  }
}

// Export singleton
export const locationService = new LocationService();
