/**
 * Project Prism - Main App Component
 * PWA with bottom navigation
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MapScreen } from './screens/Map/MapScreen';
import { TribesScreen } from './screens/Tribes/TribesScreen';
import { TribeCommunityScreen } from './screens/Tribes/TribeCommunityScreen';
import { MutualAidScreen } from './screens/MutualAid/MutualAidScreen';
import { SettingsScreen } from './screens/Settings/SettingsScreen';
import { ChatScreen } from './screens/Chat/ChatScreen';
import { OnboardingScreen } from './screens/Onboarding/OnboardingScreen';
import { CommunityBridgeScreen } from './screens/CommunityBridge/CommunityBridgeScreen';
import { DecoyCalculator } from './components/DecoyCalculator';
import { BottomNav } from './components/BottomNav';
import { panicService } from './utils/PanicService';
import { storageService, PREF_KEYS } from './utils/StorageService';
import { PanicEvent } from './types';
import './App.css';

const App: React.FC = () => {
  const [hasOnboarded, setHasOnboarded] = useState<boolean | null>(null);
  const [panicMode, setPanicMode] = useState(false);

  useEffect(() => {
    checkOnboarding();
    initializePanicMode();
  }, []);

  const checkOnboarding = async () => {
    const onboarded = await storageService.get(PREF_KEYS.HAS_ONBOARDED, false);
    setHasOnboarded(onboarded as boolean);
  };

  const initializePanicMode = async () => {
    await panicService.initialize();
    
    panicService.addListener((event: PanicEvent) => {
      console.log('[App] Panic triggered:', event);
      
      if (event.action === 'decoy') {
        setPanicMode(true);
      } else if (event.action === 'scorched_earth') {
        handleScorchedEarth();
      }
    });
  };

  const handleScorchedEarth = async () => {
    console.log('[App] SCORCHED EARTH - Clearing all data');
    await storageService.clearAll();
    // Reload to fresh state
    window.location.href = '/';
  };

  const handleOnboardingComplete = async () => {
    await storageService.set(PREF_KEYS.HAS_ONBOARDED, true);
    setHasOnboarded(true);
  };

  const exitPanicMode = () => {
    setPanicMode(false);
  };

  // Loading state
  if (hasOnboarded === null) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p>Loading Prism...</p>
      </div>
    );
  }

  // Panic mode - show decoy calculator
  if (panicMode) {
    return <DecoyCalculator onExit={exitPanicMode} />;
  }

  // Onboarding flow
  if (!hasOnboarded) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  // Main app
  return (
    <BrowserRouter>
      <div className="app-container">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Navigate to="/map" replace />} />
            <Route path="/map" element={<MapScreen />} />
            <Route path="/tribes" element={<TribesScreen />} />          <Route path="/tribes/:tribeId" element={<TribeCommunityScreen />} />            <Route path="/aid" element={<MutualAidScreen />} />
            <Route path="/bridge" element={<CommunityBridgeScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/chat/:contactHash" element={<ChatScreen />} />
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
