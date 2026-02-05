/**
 * Map Screen - Using Leaflet for web maps
 */

import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Organization } from '../../types';
import { apiClient } from '../../api/client';
import { locationService } from '../../utils/LocationService';
import { AddOrgModal } from '../../components/AddOrgModal';
import 'leaflet/dist/leaflet.css';
import './MapScreen.css';

const DEFAULT_CENTER: [number, number] = [45.5152, -122.6784]; // Portland, OR

export const MapScreen: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    try {
      // Get user location
      const location = await locationService.getCurrentLocation();
      setUserLocation([location.latitude, location.longitude]);

      // Fetch nearby organizations
      try {
        const orgs = await apiClient.getOrganizations({
          latitude: location.latitude,
          longitude: location.longitude,
          radius: 10000, // 10km
        });
        setOrganizations(orgs);
      } catch (error) {
        console.error('[Map] Failed to fetch organizations:', error);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('[Map] Initialization failed:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrg = async (data: any) => {
    try {
      // In production, this would submit to backend
      console.log('[Map] New org submission:', data);
      await apiClient.submitFeedback({
        type: 'feature',
        content: `New organization submission:\n${JSON.stringify(data, null, 2)}`,
      });
    } catch (error) {
      throw error;
    }
  };

  const center = userLocation || DEFAULT_CENTER;

  return (
    <div className="map-screen">
      {loading ? (
        <div className="map-loading">
          <div className="loading-spinner" />
          <p>Loading map...</p>
        </div>
      ) : (
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {/* User location */}
          {userLocation && (
            <Marker position={userLocation}>
              <Popup>Your Location</Popup>
            </Marker>
          )}

          {/* Organizations */}
          {organizations.map((org) => (
            <Marker
              key={org.id}
              position={[org.latitude, org.longitude]}
              eventHandlers={{
                click: () => setSelectedOrg(org),
              }}
            >
              <Popup>
                <div className="org-popup">
                  <h3>{org.name}</h3>
                  <p>{org.description}</p>
                  {org.address && <p>📍 {org.address}</p>}
                  {org.phone && <p>📞 {org.phone}</p>}
                  {org.website && (
                    <a href={org.website} target="_blank" rel="noopener noreferrer">
                      Visit Website
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}

      {/* Bottom sheet for selected org */}
      {selectedOrg && (
        <div className="org-bottom-sheet">
          <button className="close-button" onClick={() => setSelectedOrg(null)}>
            ×
          </button>
          <h2>{selectedOrg.name}</h2>
          <p className="org-type">{selectedOrg.org_type.replace('_', ' ')}</p>
          <p className="org-description">{selectedOrg.description}</p>
          {selectedOrg.address && <p>📍 {selectedOrg.address}</p>}
          {selectedOrg.phone && <p>📞 {selectedOrg.phone}</p>}
          {selectedOrg.hours && <p>🕐 {selectedOrg.hours}</p>}
        </div>
      )}

      {/* Add Organization FAB */}
      <button className="map-fab" onClick={() => setShowAddModal(true)}>
        + Add Space
      </button>

      {/* Add Organization Modal */}
      {showAddModal && (
        <AddOrgModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddOrg}
        />
      )}
    </div>
  );
};
