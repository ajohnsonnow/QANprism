/**
 * Admin Application Modal
 * Form to apply to become a local community admin
 */

import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import './AdminApplicationModal.css';

interface AdminApplicationModalProps {
  onClose: () => void;
}

export const AdminApplicationModal: React.FC<AdminApplicationModalProps> = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    experience: '',
    motivation: '',
    availability: '',
    references: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.email || !formData.location || !formData.experience || !formData.motivation || !formData.availability) {
      alert('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.submitAdminApplication(formData);
      setSubmitted(true);
    } catch (error) {
      console.error('[AdminApplication] Failed to submit:', error);
      alert('Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="admin-app-modal-overlay" onClick={onClose}>
        <div className="admin-app-modal" onClick={(e) => e.stopPropagation()}>
          <div className="admin-app-success">
            <div className="success-icon">✅</div>
            <h2>Application Submitted!</h2>
            <p>
              Thank you for applying to become a local admin. Your application has been sent
              for review.
            </p>
            <p>
              We'll contact you at <strong>{formData.email}</strong> within 5-7 business days.
            </p>
            <button className="success-button" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-app-modal-overlay" onClick={onClose}>
      <div className="admin-app-modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin-app-header">
          <h2>🛡️ Apply to be a Local Admin</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="admin-app-intro">
          <p>
            Local admins help maintain safe, supportive tribe communities by moderating posts
            and ensuring community guidelines are followed.
          </p>
          <div className="responsibilities">
            <h4>Responsibilities:</h4>
            <ul>
              <li>Review and moderate tribe posts</li>
              <li>Remove content that violates community standards</li>
              <li>Support community members in need</li>
              <li>Monitor 1-3 local tribes</li>
            </ul>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="admin-app-form">
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Your name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              required
              placeholder="City, State/Province, Country"
            />
          </div>

          <div className="form-group">
            <label htmlFor="experience">LGBTQ+ Community Experience *</label>
            <textarea
              id="experience"
              name="experience"
              value={formData.experience}
              onChange={handleChange}
              required
              rows={4}
              placeholder="Tell us about your experience with LGBTQ+ community work, volunteering, organizing, etc."
            />
          </div>

          <div className="form-group">
            <label htmlFor="motivation">Why do you want to be an admin? *</label>
            <textarea
              id="motivation"
              name="motivation"
              value={formData.motivation}
              onChange={handleChange}
              required
              rows={4}
              placeholder="What motivates you to help moderate these communities?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="availability">Time Commitment *</label>
            <textarea
              id="availability"
              name="availability"
              value={formData.availability}
              onChange={handleChange}
              required
              rows={3}
              placeholder="How much time can you dedicate per week? Which hours/days are you typically available?"
            />
          </div>

          <div className="form-group">
            <label htmlFor="references">References (Optional)</label>
            <textarea
              id="references"
              name="references"
              value={formData.references}
              onChange={handleChange}
              rows={3}
              placeholder="Any community connections, organizations you've worked with, or references we can contact"
            />
          </div>

          <div className="form-footer">
            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
