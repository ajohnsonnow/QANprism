/**
 * Settings Screen
 */

import React, { useState, useEffect } from 'react';
import { panicService } from '../../utils/PanicService';
import { storageService, PREF_KEYS } from '../../utils/StorageService';
import { apiClient } from '../../api/client';
import { AdminApplicationModal } from './AdminApplicationModal';
import './SettingsScreen.css';

export const SettingsScreen: React.FC = () => {
  const [panicEnabled, setPanicEnabled] = useState(true);
  const [locationFuzzing, setLocationFuzzing] = useState(true);
  const [aidRadius, setAidRadius] = useState(10);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showAdminApp, setShowAdminApp] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const panic = await storageService.get(PREF_KEYS.PANIC_ENABLED, true);
    const fuzzing = await storageService.get(PREF_KEYS.LOCATION_FUZZING, true);
    const radius = await storageService.get<number>('aid_radius', 10000);
    setPanicEnabled(panic as boolean);
    setLocationFuzzing(fuzzing as boolean);
    setAidRadius((radius as number) / 1000); // Convert to km
  };

  const handleTogglePanic = async () => {
    const newValue = !panicEnabled;
    setPanicEnabled(newValue);
    await storageService.set(PREF_KEYS.PANIC_ENABLED, newValue);
    panicService.updateConfig({ enabled: newValue });
  };

  const handleToggleFuzzing = async () => {
    const newValue = !locationFuzzing;
    setLocationFuzzing(newValue);
    await storageService.set(PREF_KEYS.LOCATION_FUZZING, newValue);
  };

  const handleRadiusChange = async (value: number) => {
    setAidRadius(value);
    await storageService.set('aid_radius', value * 1000); // Store in meters
  };

  const handleClearData = async () => {
    if (confirm('Are you sure? This will delete all your data.')) {
      await storageService.clearAll();
      window.location.href = '/';
    }
  };

  return (
    <div className="settings-screen">
      <div className="settings-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-content">
        <section className="settings-section">
          <h2 className="section-title">Privacy</h2>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-icon">🚨</span>
              <div>
                <h3>Panic Mode</h3>
                <p>Shake device or press Esc 3x to activate</p>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={panicEnabled}
                onChange={handleTogglePanic}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-icon">📍</span>
              <div>
                <h3>Location Fuzzing</h3>
                <p>Randomize your location for privacy</p>
              </div>
            </div>
            <label className="toggle">
              <input
                type="checkbox"
                checked={locationFuzzing}
                onChange={handleToggleFuzzing}
              />
              <span className="toggle-slider" />
            </label>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Mutual Aid</h2>

          <div className="setting-row">
            <div className="setting-info">
              <span className="setting-icon">🤝</span>
              <div>
                <h3>Search Radius: {aidRadius}km</h3>
                <p>Distance to search for mutual aid listings</p>
              </div>
            </div>
          </div>
          <div style={{ padding: '0 16px' }}>
            <input
              type="range"
              min="1"
              max="50"
              value={aidRadius}
              onChange={(e) => handleRadiusChange(Number(e.target.value))}
              style={{ width: '100%' }}
              className="radius-slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#a0a0b8', marginTop: '8px' }}>
              <span>1km</span>
              <span>50km</span>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Feedback</h2>

          <div className="setting-row" onClick={() => setShowFeedback(true)}>
            <div className="setting-info">
              <span className="setting-icon">💡</span>
              <div>
                <h3>Feature Request</h3>
                <p>Suggest improvements or new features</p>
              </div>
            </div>
            <span className="setting-arrow">→</span>
          </div>

          <div className="setting-row" onClick={() => setShowFeedback(true)}>
            <div className="setting-info">
              <span className="setting-icon">🐛</span>
              <div>
                <h3>Report a Bug</h3>
                <p>Help us squash bugs and improve Prism</p>
              </div>
            </div>
            <span className="setting-arrow">→</span>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">About</h2>

          <div className="setting-row" onClick={() => setShowAbout(true)}>
            <div className="setting-info">
              <span className="setting-icon">💜</span>
              <div>
                <h3>Project Prism</h3>
                <p>Version 1.0.0</p>
              </div>
            </div>
            <span className="setting-arrow">→</span>
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">Community</h2>

          <button className="setting-button admin" onClick={() => setShowAdminApp(true)}>
            <span>🛡️</span>
            <span>Apply to be a Local Admin</span>
          </button>
        </section>

        <section className="settings-section">
          <h2 className="section-title danger">Danger Zone</h2>

          <button className="setting-button danger" onClick={handleClearData}>
            <span>🗑️</span>
            <span>Clear All Data</span>
          </button>
        </section>
      </div>

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}

      {/* Admin Application Modal */}
      {showAdminApp && (
        <AdminApplicationModal onClose={() => setShowAdminApp(false)} />
      )}

      {/* About Modal */}
      {showAbout && (
        <AboutModal onClose={() => setShowAbout(false)} />
      )}
    </div>
  );
};

// Feedback Modal Component
const FeedbackModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [type, setType] = useState<'feature' | 'bug'>('feature');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      alert('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.submitFeedback({
        type,
        content: `**${title}**\n\n${description}`,
      });
      alert('Thank you! Your feedback has been submitted.');
      onClose();
    } catch (error) {
      console.error('[Feedback] Submit failed:', error);
      alert('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        <h2>Submit Feedback</h2>

        <div className="feedback-type-buttons">
          <button
            className={`type-button ${type === 'feature' ? 'active' : ''}`}
            onClick={() => setType('feature')}
          >
            💡 Feature Request
          </button>
          <button
            className={`type-button ${type === 'bug' ? 'active' : ''}`}
            onClick={() => setType('bug')}
          >
            🐛 Bug Report
          </button>
        </div>

        <input
          type="text"
          className="feedback-input"
          placeholder="Brief title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          className="feedback-textarea"
          placeholder={
            type === 'feature'
              ? 'Describe the feature you\'d like to see...'
              : 'Describe the bug and steps to reproduce it...'
          }
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <button
          className="feedback-submit"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </div>
    </div>
  );
};

// About Modal Component
const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal about-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="about-header">
          <div className="about-icon">🏳️‍🌈</div>
          <h2>Project Prism</h2>
          <p className="about-version">Version 1.0.0</p>
        </div>

        <div className="about-content">
          <section className="about-section">
            <h3>💜 Our Mission</h3>
            <p>
              Project Prism is a privacy-first safety network for the LGBTQ+ community. 
              We provide anonymous communication, mutual aid coordination, safe space discovery, 
              and emergency features - all while protecting your identity.
            </p>
          </section>

          <section className="about-section">
            <h3>🔐 Privacy Features</h3>
            <ul className="about-list">
              <li><strong>Zero-Knowledge Architecture:</strong> We never store your real identity</li>
              <li><strong>End-to-End Encryption:</strong> Messages encrypted with Signal Protocol</li>
              <li><strong>Panic Mode:</strong> Quick data wipe with decoy calculator screen</li>
              <li><strong>Location Fuzzing:</strong> Randomized coordinates for privacy</li>
              <li><strong>Anonymous Beacons:</strong> Find community without revealing identity</li>
            </ul>
          </section>

          <section className="about-section">
            <h3>🌈 Core Features</h3>
            <ul className="about-list">
              <li><strong>Safe Spaces Map:</strong> Verified LGBTQ+ friendly organizations worldwide</li>
              <li><strong>Tribes:</strong> Anonymous topic-based communities (19 groups)</li>
              <li><strong>Mutual Aid:</strong> Community gifting economy for support</li>
              <li><strong>Community Bridge:</strong> Track feature requests and bug reports</li>
              <li><strong>Emergency Panic:</strong> Shake device or press Esc 3x to activate</li>
            </ul>
          </section>

          <section className="about-section">
            <h3>📊 Current Database</h3>
            <ul className="about-list">
              <li>19 verified LGBTQ+ organizations</li>
              <li>19 anonymous tribe communities</li>
              <li>Real-time mutual aid listings</li>
              <li>Global coverage (US, UK, Canada, Australia, Germany, France)</li>
            </ul>
          </section>

          <section className="about-section">
            <h3>🛠️ Technology Stack</h3>
            <ul className="about-list">
              <li><strong>Frontend:</strong> React + TypeScript + Vite PWA</li>
              <li><strong>Backend:</strong> Django + Django REST Framework</li>
              <li><strong>Encryption:</strong> Signal Protocol (TweetNaCl + Web Crypto)</li>
              <li><strong>Storage:</strong> IndexedDB for secure local storage</li>
              <li><strong>Maps:</strong> Leaflet with OpenStreetMap</li>
            </ul>
          </section>

          <section className="about-section">
            <h3>📬 Contact & Support</h3>
            <p>
              <strong>Developer:</strong> Anth @ Structured For Growth<br />
              <strong>Email:</strong> <a href="mailto:Anth@StructuredForGrowth.com">Anth@StructuredForGrowth.com</a><br />
              <strong>Community Bridge:</strong> Track all submissions in the Bridge tab
            </p>
          </section>

          <section className="about-section">
            <h3>⚖️ License & Transparency</h3>
            <p>
              Project Prism is built with love for the queer community. All bug reports, 
              feature requests, and organization submissions are tracked publicly in the 
              Community Bridge tab. We're committed to full transparency and accountability.
            </p>
          </section>

          <div className="about-footer">
            <p>Built with 💜 for the queer community</p>
            <p className="about-tagline">"Privacy is a right, not a privilege"</p>
          </div>
        </div>
      </div>
    </div>
  );
};
