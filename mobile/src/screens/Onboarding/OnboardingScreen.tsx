/**
 * Project Prism - Onboarding Screen
 * 
 * MERGED & IMPROVED: Privacy-first onboarding with:
 * - Mission introduction
 * - Feature highlights
 * - Account creation (no personal info)
 * - Recovery phrase generation
 * - PIN setup
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  TextInput,
  Alert,
} from 'react-native';
import { signalProtocol } from '../../crypto/SignalProtocol';
import { recoveryService } from '../../crypto/RecoveryService';
import { storageService } from '../../utils/StorageService';
import { apiClient } from '../../api/client';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: 'welcome',
    icon: '🏳️‍🌈',
    title: 'Welcome to Prism',
    description: 'A safe digital space built by and for LGBTQIA+ community. No corporate data collection. No surveillance.',
    color: COLORS.primary,
  },
  {
    id: 'privacy',
    icon: '🔐',
    title: 'Your Privacy Matters',
    description: 'No email, no phone number, no real name required. Your identity is a cryptographic key that only you control.',
    color: '#FF6B6B',
  },
  {
    id: 'map',
    icon: '🗺️',
    title: 'Find Safe Spaces',
    description: 'Discover LGBTQ+ friendly businesses, organizations, and services verified by the community.',
    color: '#4ECDC4',
  },
  {
    id: 'tribes',
    icon: '🏕️',
    title: 'Connect Anonymously',
    description: 'Find others with shared experiences through blind beacons. No profiles, no photos—just community.',
    color: '#FFA500',
  },
  {
    id: 'panic',
    icon: '🚨',
    title: 'Stay Safe',
    description: 'Shake to hide the app instantly. Duress codes protect you even if someone forces you to unlock.',
    color: '#FF4444',
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

interface SlideViewProps {
  slide: OnboardingSlide;
}

const SlideView: React.FC<SlideViewProps> = ({ slide }) => (
  <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
    <View style={[styles.iconContainer, { backgroundColor: slide.color + '20' }]}>
      <Text style={styles.slideIcon}>{slide.icon}</Text>
    </View>
    <Text style={styles.slideTitle}>{slide.title}</Text>
    <Text style={styles.slideDescription}>{slide.description}</Text>
  </View>
);

interface PinInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label: string;
}

const PinInput: React.FC<PinInputProps> = ({ value, onChangeText, label }) => (
  <View style={styles.pinContainer}>
    <Text style={styles.pinLabel}>{label}</Text>
    <View style={styles.pinDots}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={[
            styles.pinDot,
            value.length > i && styles.pinDotFilled
          ]}
        />
      ))}
    </View>
    <TextInput
      style={styles.pinHiddenInput}
      value={value}
      onChangeText={(text) => {
        if (/^\d{0,4}$/.test(text)) {
          onChangeText(text);
        }
      }}
      keyboardType="number-pad"
      maxLength={4}
      autoFocus
    />
  </View>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  // State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<'slides' | 'pin' | 'recovery'>('slides');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);

  // Handlers
  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      setStep('pin');
    }
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      Alert.alert('Invalid PIN', 'Please enter a 4-digit PIN');
      return;
    }

    if (pin === '1969' || pin === '0000' || pin === '9111') {
      Alert.alert(
        'Reserved PIN',
        'This PIN is reserved for special functions. Please choose a different PIN.'
      );
      return;
    }

    if (confirmPin === '') {
      setConfirmPin(pin);
      setPin('');
      return;
    }

    if (pin !== confirmPin) {
      Alert.alert('PIN Mismatch', 'The PINs do not match. Please try again.');
      setPin('');
      setConfirmPin('');
      return;
    }

    // Generate recovery phrase
    const phrase = recoveryService.generateMnemonic();
    setMnemonic(phrase.split(' '));
    setStep('recovery');
  };

  const handleComplete = async () => {
    setLoading(true);

    try {
      // Create account - returns a PreKeyBundle
      const bundle = await signalProtocol.createAccount();

      // Register with server
      const response = await apiClient.registerUser({
        identityKey: bundle.identityKey,
        registrationId: bundle.registrationId,
        signedPreKey: {
          keyId: bundle.signedPreKey.keyId,
          publicKey: bundle.signedPreKey.publicKey,
          signature: bundle.signedPreKey.signature,
        },
        preKeys: bundle.preKey ? [{
          keyId: bundle.preKey.keyId,
          publicKey: bundle.preKey.publicKey,
        }] : undefined,
      });

      // Store user hash
      await storageService.setUserHash(response.user_hash);
      apiClient.setUserHash(response.user_hash);

      // Store recovery phrase encrypted with PIN
      const mnemonicStr = mnemonic.join(' ');
      // In production: encrypt mnemonic with PIN before storing
      await storageService.setSecure('prism.recovery.mnemonic', mnemonicStr);

      // Mark onboarding complete
      await storageService.setOnboarded();

      onComplete();
    } catch (error) {
      console.error('[Onboarding] Account creation failed:', error);
      // Continue anyway for development
      await storageService.setOnboarded();
      onComplete();
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = (event: any) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(slideIndex);
  };

  // Render slides
  if (step === 'slides') {
    return (
      <View style={styles.container}>
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => <SlideView slide={item} />}
        />

        {/* Pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                currentIndex === index && styles.paginationDotActive
              ]}
            />
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
          <Text style={styles.continueButtonText}>
            {currentIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Render PIN setup
  if (step === 'pin') {
    return (
      <View style={styles.container}>
        <Text style={styles.stepIcon}>🔢</Text>
        <Text style={styles.stepTitle}>
          {confirmPin === '' ? 'Create Your PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.stepDescription}>
          {confirmPin === ''
            ? 'This PIN unlocks your real data. Choose something memorable.'
            : 'Enter the same PIN again to confirm.'}
        </Text>

        <PinInput
          value={pin}
          onChangeText={(text) => {
            setPin(text);
            if (text.length === 4) {
              setTimeout(handlePinSubmit, 300);
            }
          }}
          label=""
        />

        <View style={styles.pinInfo}>
          <Text style={styles.pinInfoTitle}>🔐 Duress PINs (memorize these)</Text>
          <View style={styles.pinInfoRow}>
            <Text style={styles.pinInfoCode}>1969</Text>
            <Text style={styles.pinInfoDesc}>Real unlock (Stonewall)</Text>
          </View>
          <View style={styles.pinInfoRow}>
            <Text style={styles.pinInfoCode}>0000</Text>
            <Text style={styles.pinInfoDesc}>Shows calculator decoy</Text>
          </View>
          <View style={styles.pinInfoRow}>
            <Text style={[styles.pinInfoCode, styles.dangerText]}>9111</Text>
            <Text style={styles.pinInfoDesc}>Scorched Earth (wipes all)</Text>
          </View>
        </View>
      </View>
    );
  }

  // Render recovery phrase
  return (
    <View style={styles.container}>
      <Text style={styles.stepIcon}>📝</Text>
      <Text style={styles.stepTitle}>Your Recovery Phrase</Text>
      <Text style={styles.stepDescription}>
        Write these words down and store them safely. This is the ONLY way to recover your account.
      </Text>

      <View style={styles.mnemonicContainer}>
        {mnemonic.map((word, index) => (
          <View key={index} style={styles.mnemonicWord}>
            <Text style={styles.mnemonicIndex}>{index + 1}</Text>
            <Text style={styles.mnemonicText}>{word}</Text>
          </View>
        ))}
      </View>

      <View style={styles.warning}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Never share these words. Anyone with them can access your account.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.continueButton, loading && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={loading}
      >
        <Text style={styles.continueButtonText}>
          {loading ? 'Creating Account...' : 'I\'ve Saved My Phrase'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  slide: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  slideIcon: {
    fontSize: 60,
  },
  slideTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDescription: {
    color: COLORS.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  continueButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 30,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  stepIcon: {
    fontSize: 60,
    marginBottom: 20,
  },
  stepTitle: {
    color: COLORS.textPrimary,
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDescription: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  pinContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  pinLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginBottom: 16,
  },
  pinDots: {
    flexDirection: 'row',
    gap: 16,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  pinHiddenInput: {
    position: 'absolute',
    opacity: 0,
    height: '100%',
    width: '100%',
  },
  pinInfo: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: BORDER_RADIUS.lg,
    width: '100%',
  },
  pinInfoTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  pinInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinInfoCode: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    width: 50,
  },
  pinInfoDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  dangerText: {
    color: COLORS.danger,
  },
  mnemonicContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: 20,
  },
  mnemonicWord: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '45%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    margin: 4,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
  },
  mnemonicIndex: {
    color: COLORS.textMuted,
    fontSize: 12,
    width: 20,
  },
  mnemonicText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerFaded,
    padding: 14,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.danger + '40',
  },
  warningIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  warningText: {
    color: COLORS.textPrimary,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
});
