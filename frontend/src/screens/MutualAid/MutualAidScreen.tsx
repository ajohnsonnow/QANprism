/**
 * Mutual Aid Screen
 */

import React, { useState, useEffect } from 'react';
import { MutualAidListing } from '../../types';
import { apiClient } from '../../api/client';
import { locationService } from '../../utils/LocationService';
import { storageService } from '../../utils/StorageService';
import './MutualAidScreen.css';

export const MutualAidScreen: React.FC = () => {
  const [tab, setTab] = useState<'offers' | 'requests'>('offers');
  const [listings, setListings] = useState<MutualAidListing[]>([]);
  const [loading, setLoading] = useState(true);

  const [radius, setRadius] = useState(10000); // 10km default

  useEffect(() => {
    loadSettings();
    fetchListings();
  }, [tab]);

  const loadSettings = async () => {
    const savedRadius = await storageService.get<number>('aid_radius', 10000);
    setRadius(savedRadius as number);
  };

  const fetchListings = async () => {
    setLoading(true);
    try {
      const location = await locationService.getCurrentLocation();
      const data = await apiClient.getMutualAidListings({
        latitude: location.latitude,
        longitude: location.longitude,
        radius,
        listing_type: tab === 'offers' ? 'offer' : 'request',
      });
      setListings(data);
    } catch (error) {
      console.error('[MutualAid] Failed to fetch listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      food: '🍽️',
      clothing: '👕',
      housing: '🏠',
      transport: '🚗',
      emotional: '💜',
      medical: '⚕️',
      tech: '💻',
      other: '🤝',
    };
    return icons[category] || '🤝';
  };

  return (
    <div className="mutual-aid-screen">
      <div className="aid-header">
        <h1>Mutual Aid</h1>
        <p>Community gifting network · {locationService.formatDistance(radius)} radius</p>
      </div>

      <div className="aid-tabs">
        <button
          className={`aid-tab ${tab === 'offers' ? 'aid-tab-active' : ''}`}
          onClick={() => setTab('offers')}
        >
          Offers
        </button>
        <button
          className={`aid-tab ${tab === 'requests' ? 'aid-tab-active' : ''}`}
          onClick={() => setTab('requests')}
        >
          Requests
        </button>
      </div>

      <div className="aid-content">
        {loading ? (
          <div className="aid-loading">
            <div className="loading-spinner" />
            <p>Loading listings...</p>
          </div>
        ) : listings.length === 0 ? (
          <div className="aid-placeholder">
            <span className="aid-placeholder-icon">🤝</span>
            <h3>No {tab} nearby</h3>
            <p>
              {tab === 'offers'
                ? 'No community offerings in your area yet. Be the first to share!'
                : 'No requests in your area. Check back soon or create one.'}
            </p>
          </div>
        ) : (
          <div className="aid-list">
            {listings.map((listing) => (
              <div key={listing.id} className="aid-card">
                <div className="aid-card-icon">
                  {getCategoryIcon(listing.category)}
                </div>
                <div className="aid-card-content">
                  <div className="aid-card-header">
                    <h3>{listing.title}</h3>
                    <span className="aid-card-category">{listing.category}</span>
                  </div>
                  <p className="aid-card-description">{listing.description}</p>
                  {listing.distance && (
                    <p className="aid-card-distance">
                      📍 {locationService.formatDistance(listing.distance)} away
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
