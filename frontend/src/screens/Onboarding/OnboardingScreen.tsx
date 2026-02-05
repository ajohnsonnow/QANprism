/**
 * Onboarding Screen
 */

import React, { useState } from 'react';
import { signalProtocol } from '../../crypto/SignalProtocol';
import './OnboardingScreen.css';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const screens = [
    {
      icon: '🏳️‍🌈',
      title: 'Welcome to Prism',
      subtitle: 'Privacy-first community network for LGBTQ+ folks',
    },
    {
      icon: '🔒',
      title: 'Your Privacy Matters',
      subtitle: 'End-to-end encryption. No tracking. Your data stays yours.',
    },
    {
      icon: '🗺️',
      title: 'Find Safe Spaces',
      subtitle: 'Discover LGBTQ+-friendly organizations and resources nearby.',
    },
    {
      icon: '🏕️',
      title: 'Join Tribes',
      subtitle: 'Connect with your community anonymously through topic-based beacons.',
    },
  ];

  const handleNext = async () => {
    if (step < screens.length - 1) {
      setStep(step + 1);
    } else {
      setLoading(true);
      try {
        await signalProtocol.initialize();
        setTimeout(() => onComplete(), 500);
      } catch (error) {
        console.error('[Onboarding] Failed:', error);
        setLoading(false);
      }
    }
  };

  const currentScreen = screens[step];

  return (
    <div className="onboarding">
      <div className="onboarding-content">
        <div className="onboarding-icon">{currentScreen.icon}</div>
        <h1 className="onboarding-title">{currentScreen.title}</h1>
        <p className="onboarding-subtitle">{currentScreen.subtitle}</p>
      </div>

      <div className="onboarding-footer">
        <div className="onboarding-dots">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`dot ${index === step ? 'dot-active' : ''}`}
            />
          ))}
        </div>

        <button
          className="onboarding-button"
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? 'Setting up...' : step === screens.length - 1 ? 'Get Started' : 'Next'}
        </button>
      </div>
    </div>
  );
};
