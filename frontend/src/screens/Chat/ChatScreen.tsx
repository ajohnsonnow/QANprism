/**
 * Chat Screen
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ChatScreen.css';

export const ChatScreen: React.FC = () => {
  const { contactHash } = useParams<{ contactHash: string }>();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Send encrypted message
      setMessage('');
    }
  };

  return (
    <div className="chat-screen">
      <div className="chat-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          ←
        </button>
        <div className="chat-header-info">
          <h2>{contactHash?.substring(0, 8)}...</h2>
          <p>🔒 End-to-end encrypted</p>
        </div>
      </div>

      <div className="chat-messages">
        <div className="chat-empty">
          <span>🔐</span>
          <p>Messages are end-to-end encrypted</p>
          <p>Start a secure conversation</p>
        </div>
      </div>

      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          placeholder="Type a message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button className="send-button" onClick={handleSend}>
          →
        </button>
      </div>
    </div>
  );
};
