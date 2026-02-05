import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { storageService } from './utils/StorageService';
import { signalProtocol } from './crypto/SignalProtocol';
import './index.css';

// Initialize services
async function initializeApp() {
  try {
    await storageService.initialize();
    await signalProtocol.initialize();
    console.log('[App] Services initialized');
  } catch (error) {
    console.error('[App] Initialization failed:', error);
  }
}

initializeApp();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
