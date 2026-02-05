/**
 * Community Bridge Screen - Track community submissions
 * Shows bug reports, feature requests, and org submissions with status
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import './CommunityBridgeScreen.css';

interface CommunitySubmission {
  id: string;
  feedback_type: 'bug' | 'feature' | 'org_submission';
  content: string;
  status: 'pending' | 'in_progress' | 'completed' | 'rejected';
  org_name?: string;
  org_description?: string;
  admin_response?: string;
  created_at: string;
  updated_at: string;
}

export const CommunityBridgeScreen: React.FC = () => {
  const [submissions, setSubmissions] = useState<CommunitySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSubmissions, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchSubmissions = async () => {
    try {
      const data = await apiClient.getCommunitySubmissions();
      setSubmissions(data);
    } catch (error) {
      console.error('[CommunityBridge] Fetch failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string): string => {
    switch (type) {
      case 'bug': return '🐛 Bug Report';
      case 'feature': return '💡 Feature Request';
      case 'org_submission': return '🏳️‍🌈 Organization';
      default: return type;
    }
  };

  const getStatusEmoji = (status: string): string => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '⚙️';
      case 'completed': return '✅';
      case 'rejected': return '❌';
      default: return '📝';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending': return 'Pending Review';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'rejected': return 'Declined';
      default: return status;
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filter === 'all') return true;
    return sub.feedback_type === filter;
  });

  if (loading) {
    return (
      <div className="bridge-container">
        <div className="bridge-header">
          <h1>Community Bridge</h1>
          <p>Transparency in action</p>
        </div>
        <div className="bridge-loading">Loading submissions...</div>
      </div>
    );
  }

  return (
    <div className="bridge-container">
      <div className="bridge-header">
        <h1>Community Bridge</h1>
        <p>Your voice matters. See how we're responding to every submission.</p>
      </div>

      <div className="bridge-stats">
        <div className="stat">
          <span className="stat-number">{submissions.filter(s => s.status === 'completed').length}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat">
          <span className="stat-number">{submissions.filter(s => s.status === 'in_progress').length}</span>
          <span className="stat-label">In Progress</span>
        </div>
        <div className="stat">
          <span className="stat-number">{submissions.filter(s => s.status === 'pending').length}</span>
          <span className="stat-label">Pending</span>
        </div>
        <div className="stat">
          <span className="stat-number">{submissions.length}</span>
          <span className="stat-label">Total</span>
        </div>
      </div>

      <div className="bridge-filters">
        <button 
          className={filter === 'all' ? 'active' : ''} 
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button 
          className={filter === 'bug' ? 'active' : ''} 
          onClick={() => setFilter('bug')}
        >
          🐛 Bugs
        </button>
        <button 
          className={filter === 'feature' ? 'active' : ''} 
          onClick={() => setFilter('feature')}
        >
          💡 Features
        </button>
        <button 
          className={filter === 'org_submission' ? 'active' : ''} 
          onClick={() => setFilter('org_submission')}
        >
          🏳️‍🌈 Organizations
        </button>
      </div>

      {filteredSubmissions.length === 0 ? (
        <div className="bridge-empty">
          <p>No submissions yet. Be the first to contribute!</p>
        </div>
      ) : (
        <div className="bridge-list">
          {filteredSubmissions.map((submission) => (
            <div key={submission.id} className="submission-card">
              <div className="submission-header">
                <span className="submission-type">{getTypeLabel(submission.feedback_type)}</span>
                <span className={`submission-status status-${submission.status}`}>
                  {getStatusEmoji(submission.status)} {getStatusLabel(submission.status)}
                </span>
              </div>

              {submission.org_name ? (
                <div className="submission-org">
                  <h3>{submission.org_name}</h3>
                  <p>{submission.org_description}</p>
                </div>
              ) : (
                <div className="submission-content">
                  <p>{submission.content}</p>
                </div>
              )}

              {submission.admin_response && (
                <div className="submission-response">
                  <strong>Response from Anth:</strong>
                  <p>{submission.admin_response}</p>
                </div>
              )}

              <div className="submission-footer">
                <span className="submission-date">
                  Submitted: {new Date(submission.created_at).toLocaleDateString()}
                </span>
                {submission.updated_at !== submission.created_at && (
                  <span className="submission-updated">
                    Updated: {new Date(submission.updated_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bridge-footer">
        <p>
          💌 All submissions are emailed to <a href="mailto:Anth@StructuredForGrowth.com">Anth@StructuredForGrowth.com</a>
        </p>
        <p>
          We're committed to transparency. Every submission gets reviewed and tracked publicly.
        </p>
      </div>
    </div>
  );
};
