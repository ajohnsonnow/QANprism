/**
 * Add Organization Modal
 */

import React, { useState } from 'react';
import { locationService } from '../utils/LocationService';
import './AddOrgModal.css';

interface AddOrgModalProps {
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const AddOrgModal: React.FC<AddOrgModalProps> = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    org_type: 'community',
    address: '',
    phone: '',
    website: '',
    hours: '',
    is_safe_space: true,
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      alert('Please fill in name and description');
      return;
    }

    setSubmitting(true);
    try {
      const location = await locationService.getCurrentLocation();
      await onSubmit({
        ...formData,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      alert('Thank you! Your submission will be reviewed by the community.');
      onClose();
    } catch (error) {
      console.error('[AddOrg] Submit failed:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="add-org-modal-overlay" onClick={onClose}>
      <div className="add-org-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Add Queer Space</h2>
        <p className="modal-subtitle">Help the community by adding a safe space</p>

        <input
          type="text"
          placeholder="Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="modal-input"
        />

        <textarea
          placeholder="Description *"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="modal-textarea"
          rows={3}
        />

        <select
          value={formData.org_type}
          onChange={(e) => setFormData({ ...formData, org_type: e.target.value })}
          className="modal-select"
        >
          <option value="community">Community Center</option>
          <option value="healthcare">Healthcare</option>
          <option value="nonprofit">Nonprofit/Support</option>
          <option value="housing">Housing</option>
          <option value="business_food">Food/Restaurant</option>
          <option value="business_retail">Retail/Shop</option>
          <option value="legal">Legal Services</option>
          <option value="education">Education</option>
        </select>

        <input
          type="text"
          placeholder="Address (optional)"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="modal-input"
        />

        <input
          type="text"
          placeholder="Phone (optional)"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="modal-input"
        />

        <input
          type="text"
          placeholder="Website (optional)"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="modal-input"
        />

        <input
          type="text"
          placeholder="Hours (optional)"
          value={formData.hours}
          onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
          className="modal-input"
        />

        <label className="modal-checkbox">
          <input
            type="checkbox"
            checked={formData.is_safe_space}
            onChange={(e) => setFormData({ ...formData, is_safe_space: e.target.checked })}
          />
          <span>This is an LGBTQ+-friendly safe space</span>
        </label>

        <button
          className="modal-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit for Review'}
        </button>
      </div>
    </div>
  );
};
