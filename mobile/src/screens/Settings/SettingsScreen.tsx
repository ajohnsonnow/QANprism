/**
 * Project Prism - Settings Screen
 * 
 * MERGED & IMPROVED: Comprehensive settings with:
 * - Privacy controls
 * - Panic mode configuration
 * - Duress PIN info
 * - Data export/delete
 * - About section
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Linking,
} from 'react-native';
import { panicService } from '../../utils/PanicService';
import { signalProtocol } from '../../crypto/SignalProtocol';
import { storageService, STORAGE_KEYS } from '../../utils/StorageService';
import { COLORS } from '../../theme/constants';

// =============================================================================
// TYPES
// =============================================================================

interface SettingRowProps {
  icon: string;
  title: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  danger?: boolean;
}

// =============================================================================
// COMPONENTS
// =============================================================================

const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  title,
  subtitle,
  value,
  onValueChange,
  onPress,
  danger = false,
}) => {
  const content = (
    <View style={styles.settingRow}>
      <Text style={styles.settingIcon}>{icon}</Text>
      <View style={styles.settingText}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {onValueChange !== undefined && value !== undefined ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: COLORS.border, true: COLORS.primary }}
          thumbColor="white"
        />
      ) : (
        <Text style={styles.settingArrow}>→</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <Text style={styles.sectionHeader}>{title}</Text>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================

interface SettingsScreenProps {
  onNavigate: (screen: string) => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  // State
  const [panicEnabled, setPanicEnabled] = useState(true);
  const [locationFuzzing, setLocationFuzzing] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoDeleteDays, setAutoDeleteDays] = useState(30);
  const [preKeyCount, setPreKeyCount] = useState(0);

  // Effects
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const config = panicService.getConfig();
    setPanicEnabled(config.enabled);
    setHapticFeedback(config.hapticFeedback);
    
    const fuzzing = await storageService.get<boolean>(STORAGE_KEYS.LOCATION_FUZZING);
    setLocationFuzzing(fuzzing !== false);

    const retention = await storageService.getMessageRetention();
    setAutoDeleteDays(retention);

    setPreKeyCount(signalProtocol.getPreKeyCount());
  };

  // Handlers
  const handlePanicToggle = (enabled: boolean) => {
    setPanicEnabled(enabled);
    panicService.updateConfig({ enabled });
  };

  const handleHapticToggle = (enabled: boolean) => {
    setHapticFeedback(enabled);
    panicService.updateConfig({ hapticFeedback: enabled });
  };

  const handleLocationFuzzingToggle = async (enabled: boolean) => {
    setLocationFuzzing(enabled);
    await storageService.set(STORAGE_KEYS.LOCATION_FUZZING, enabled);
  };

  const handleTestPanic = async () => {
    Alert.alert(
      'Test Panic Mode',
      'This will trigger the panic response. The app will switch to the calculator decoy.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Test Now', 
          onPress: () => panicService.testPanic(),
        },
      ]
    );
  };

  const handleViewRecoveryPhrase = () => {
    Alert.alert(
      'View Recovery Phrase',
      'You\'ll need to verify your identity to view your recovery phrase. This is the only way to recover your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => onNavigate('recovery') },
      ]
    );
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Your Data',
      'This will create an encrypted backup of your messages and settings that only you can decrypt.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // TODO: Implement export
            Alert.alert('Coming Soon', 'Data export will be available in a future update.');
          },
        },
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      '⚠️ Delete All Data',
      'This will permanently delete:\n\n• All messages\n• Your identity keys\n• All app data\n\nThis action CANNOT be undone. You will need your recovery phrase to restore your account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => confirmDeleteAll(),
        },
      ]
    );
  };

  const confirmDeleteAll = () => {
    Alert.alert(
      'Are you absolutely sure?',
      'Type "DELETE" to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I understand, delete all',
          style: 'destructive',
          onPress: async () => {
            await signalProtocol.wipeAll();
            await storageService.wipeAll();
            // Restart app or navigate to onboarding
          },
        },
      ]
    );
  };

  const handleFeedback = () => {
    onNavigate('feedback');
  };

  const handlePrivacyPolicy = () => {
    Linking.openURL('https://prism.network/privacy');
  };

  const handleOpenSource = () => {
    Linking.openURL('https://github.com/prism-network/prism-app');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>Privacy & Security</Text>
      </View>

      {/* Panic Mode Section */}
      <SectionHeader title="PANIC MODE" />
      <View style={styles.card}>
        <SettingRow
          icon="🚨"
          title="Enable Panic Mode"
          subtitle="Shake to hide or use duress PINs"
          value={panicEnabled}
          onValueChange={handlePanicToggle}
        />
        <SettingRow
          icon="📳"
          title="Haptic Feedback"
          subtitle="Vibrate when panic triggers"
          value={hapticFeedback}
          onValueChange={handleHapticToggle}
        />
        <SettingRow
          icon="🧪"
          title="Test Panic Mode"
          subtitle="Try the shake detection"
          onPress={handleTestPanic}
        />
      </View>

      {/* Duress PIN Info */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>🔐 Duress PINs</Text>
        <View style={styles.pinRow}>
          <Text style={styles.pinCode}>1969</Text>
          <Text style={styles.pinDesc}>Real unlock (Stonewall)</Text>
        </View>
        <View style={styles.pinRow}>
          <Text style={styles.pinCode}>0000</Text>
          <Text style={styles.pinDesc}>Shows calculator decoy</Text>
        </View>
        <View style={styles.pinRow}>
          <Text style={[styles.pinCode, styles.dangerText]}>9111</Text>
          <Text style={styles.pinDesc}>Scorched Earth (wipes all)</Text>
        </View>
      </View>

      {/* Privacy Section */}
      <SectionHeader title="PRIVACY" />
      <View style={styles.card}>
        <SettingRow
          icon="📍"
          title="Fuzzy Location"
          subtitle="Randomize location by ~200m"
          value={locationFuzzing}
          onValueChange={handleLocationFuzzingToggle}
        />
        <SettingRow
          icon="⏱️"
          title="Auto-Delete Messages"
          subtitle={`After ${autoDeleteDays} days`}
          onPress={() => {
            // TODO: Show picker
            Alert.alert('Coming Soon', 'Adjustable retention will be available soon.');
          }}
        />
      </View>

      {/* Security Section */}
      <SectionHeader title="SECURITY" />
      <View style={styles.card}>
        <SettingRow
          icon="🔑"
          title="Recovery Phrase"
          subtitle="Backup your account"
          onPress={handleViewRecoveryPhrase}
        />
        <SettingRow
          icon="🔐"
          title="Encryption Keys"
          subtitle={`${preKeyCount} pre-keys available`}
          onPress={() => {
            Alert.alert(
              'Encryption Status',
              `Your account has ${preKeyCount} pre-keys for establishing new conversations.\n\nSignal Protocol ensures forward secrecy - even if keys are compromised, past messages cannot be decrypted.`,
              [{ text: 'OK' }]
            );
          }}
        />
      </View>

      {/* Data Section */}
      <SectionHeader title="YOUR DATA" />
      <View style={styles.card}>
        <SettingRow
          icon="📦"
          title="Export Data"
          subtitle="Download encrypted backup"
          onPress={handleExportData}
        />
        <SettingRow
          icon="🗑️"
          title="Delete All Data"
          subtitle="Permanently remove everything"
          onPress={handleDeleteAllData}
          danger
        />
      </View>

      {/* About Section */}
      <SectionHeader title="ABOUT" />
      <View style={styles.card}>
        <SettingRow
          icon="💬"
          title="Send Feedback"
          subtitle="Bug reports and suggestions"
          onPress={handleFeedback}
        />
        <SettingRow
          icon="📜"
          title="Privacy Policy"
          subtitle="How we protect your data"
          onPress={handlePrivacyPolicy}
        />
        <SettingRow
          icon="💜"
          title="Open Source"
          subtitle="View code on GitHub"
          onPress={handleOpenSource}
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerLogo}>🏳️‍🌈</Text>
        <Text style={styles.footerText}>Project Prism v1.0.0</Text>
        <Text style={styles.footerSubtext}>
          Built with 💜 for the community
        </Text>
        <Text style={styles.footerSubtext}>
          "We protect each other"
        </Text>
      </View>
    </ScrollView>
  );
};

// =============================================================================
// STYLES
// =============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 16,
    marginTop: 4,
  },
  sectionHeader: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    fontSize: 22,
    width: 36,
  },
  settingText: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  settingArrow: {
    color: COLORS.textMuted,
    fontSize: 18,
  },
  dangerText: {
    color: COLORS.danger,
  },
  infoCard: {
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  infoTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  pinRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pinCode: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    width: 60,
  },
  pinDesc: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  footerLogo: {
    fontSize: 40,
    marginBottom: 12,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  footerSubtext: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});
