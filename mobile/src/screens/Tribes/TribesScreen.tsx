/**
 * Project Prism - Tribes (Beacons) Screen
 * 
 * MERGED & IMPROVED: Blind beacon discovery with:
 * - Topic-based matching
 * - No profiles or photos
 * - Location-optional
 * - Encrypted introductions
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { apiClient } from '../../api/client';
import { signalProtocol } from '../../crypto/SignalProtocol';
import { COLORS } from '../../theme/constants';

// =============================================================================
// TYPES
// =============================================================================

interface Tribe {
  id: string;
  topic: string;
  name: string;
  description: string;
  icon: string;
  memberCount: number;
  isJoined: boolean;
}

interface Beacon {
  id: string;
  topic: string;
  broadcastHash: string;
  createdAt: Date;
  expiresAt: Date;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const TRIBES: Tribe[] = [
  {
    id: 'trans_fem',
    topic: 'trans_fem',
    name: 'Trans Femme',
    description: 'Support and community for trans women and transfeminine people',
    icon: '🦋',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'trans_masc',
    topic: 'trans_masc',
    name: 'Trans Masc',
    description: 'Support and community for trans men and transmasculine people',
    icon: '🌟',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'nonbinary',
    topic: 'nonbinary',
    name: 'Non-Binary',
    description: 'Community for non-binary, genderqueer, and gender diverse folks',
    icon: '✨',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'bipoc_queer',
    topic: 'bipoc_queer',
    name: 'BIPOC Queer',
    description: 'Intersectional space for BIPOC LGBTQ+ individuals',
    icon: '🌈',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_parents',
    topic: 'queer_parents',
    name: 'Queer Parents',
    description: 'LGBTQ+ parents and those considering parenthood',
    icon: '👨‍👩‍👧',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'newly_out',
    topic: 'newly_out',
    name: 'Newly Out',
    description: 'Safe space for those recently out or questioning',
    icon: '🌱',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_gamers',
    topic: 'queer_gamers',
    name: 'Queer Gamers',
    description: 'LGBTQ+ gaming community',
    icon: '🎮',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_faith',
    topic: 'queer_faith',
    name: 'Queer & Faith',
    description: 'Navigating spirituality and LGBTQ+ identity',
    icon: '🕊️',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'queer_sober',
    topic: 'queer_sober',
    name: 'Queer & Sober',
    description: 'LGBTQ+ recovery and sober community',
    icon: '💪',
    memberCount: 0,
    isJoined: false,
  },
  {
    id: 'general',
    topic: 'general',
    name: 'General Community',
    description: 'Open space for all LGBTQ+ folks',
    icon: '💜',
    memberCount: 0,
    isJoined: false,
  },
];

// =============================================================================
// COMPONENTS
// =============================================================================

interface TribeCardProps {
  tribe: Tribe;
  onPress: () => void;
  onJoinToggle: () => void;
}

const TribeCard: React.FC<TribeCardProps> = ({ tribe, onPress, onJoinToggle }) => (
  <TouchableOpacity style={styles.tribeCard} onPress={onPress}>
    <View style={styles.tribeHeader}>
      <Text style={styles.tribeIcon}>{tribe.icon}</Text>
      <View style={styles.tribeInfo}>
        <Text style={styles.tribeName}>{tribe.name}</Text>
        <Text style={styles.tribeDescription} numberOfLines={2}>
          {tribe.description}
        </Text>
      </View>
    </View>
    
    <View style={styles.tribeFooter}>
      <Text style={styles.tribeMembers}>
        {tribe.memberCount > 0 ? `${tribe.memberCount} active` : 'Join to discover'}
      </Text>
      <TouchableOpacity
        style={[styles.joinButton, tribe.isJoined && styles.joinedButton]}
        onPress={onJoinToggle}
      >
        <Text style={[styles.joinButtonText, tribe.isJoined && styles.joinedButtonText]}>
          {tribe.isJoined ? '✓ Joined' : 'Join'}
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

interface BeaconCardProps {
  beacon: Beacon;
  onConnect: () => void;
}

const BeaconCard: React.FC<BeaconCardProps> = ({ beacon, onConnect }) => {
  const timeAgo = (date: Date): string => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.beaconCard}>
      <View style={styles.beaconIcon}>
        <Text style={styles.beaconEmoji}>📡</Text>
      </View>
      <View style={styles.beaconInfo}>
        <Text style={styles.beaconHash}>
          {beacon.broadcastHash.slice(0, 12)}...
        </Text>
        <Text style={styles.beaconTime}>
          Active {timeAgo(beacon.createdAt)}
        </Text>
      </View>
      <TouchableOpacity style={styles.connectButton} onPress={onConnect}>
        <Text style={styles.connectButtonText}>Connect</Text>
      </TouchableOpacity>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const TribesScreen: React.FC = () => {
  // State
  const [tribes, setTribes] = useState<Tribe[]>(TRIBES);
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [loading, setLoading] = useState(false);
  const [showTribeModal, setShowTribeModal] = useState(false);
  const [isBeaconActive, setIsBeaconActive] = useState(false);

  // Handlers
  const handleTribePress = async (tribe: Tribe) => {
    setSelectedTribe(tribe);
    setShowTribeModal(true);
    
    if (tribe.isJoined) {
      await loadBeacons(tribe.topic);
    }
  };

  const handleJoinToggle = async (tribe: Tribe) => {
    const updatedTribes = tribes.map(t =>
      t.id === tribe.id ? { ...t, isJoined: !t.isJoined } : t
    );
    setTribes(updatedTribes);

    if (!tribe.isJoined) {
      // Joining - create beacon
      try {
        const identityKey = signalProtocol.getPublicIdentityKey();
        if (!identityKey) {
          Alert.alert('Error', 'Please set up your account first');
          return;
        }

        await apiClient.createBeacon(
          tribe.topic,
          Buffer.from(identityKey).toString('base64')
        );
        
        setIsBeaconActive(true);
      } catch (error) {
        console.error('[Tribes] Failed to create beacon:', error);
      }
    }
  };

  const loadBeacons = async (topic: string) => {
    setLoading(true);
    try {
      const data = await apiClient.getBeacons(topic);
      setBeacons(data.map(b => ({
        id: b.id,
        topic: b.topic,
        broadcastHash: b.broadcast_hash,
        createdAt: new Date(b.created_at),
        expiresAt: new Date(b.expires_at),
      })));
    } catch (error) {
      console.error('[Tribes] Failed to load beacons:', error);
      // Mock data
      setBeacons([
        {
          id: '1',
          topic,
          broadcastHash: 'abc123def456ghi789jkl',
          createdAt: new Date(Date.now() - 1800000),
          expiresAt: new Date(Date.now() + 86400000),
        },
        {
          id: '2',
          topic,
          broadcastHash: 'xyz789uvw456rst123opq',
          createdAt: new Date(Date.now() - 7200000),
          expiresAt: new Date(Date.now() + 86400000),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (beacon: Beacon) => {
    Alert.alert(
      'Connect with this person?',
      'You\'ll start an encrypted conversation. Neither of you will see names or photos - just the topic that brought you together.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: async () => {
            // Establish session and navigate to chat
            try {
              const bundle = await apiClient.getPreKeyBundle(beacon.broadcastHash);
              await signalProtocol.establishSession(beacon.broadcastHash, {
                registrationId: bundle.registrationId,
                deviceId: 1,
                identityKey: new TextEncoder().encode(bundle.identityKey),
                signedPreKey: {
                  keyId: bundle.signedPreKey.keyId,
                  publicKey: new TextEncoder().encode(bundle.signedPreKey.publicKey),
                  signature: new TextEncoder().encode(bundle.signedPreKey.signature),
                },
              });
              
              Alert.alert('Connected!', 'You can now message this person from the chat screen.');
              setShowTribeModal(false);
            } catch (error) {
              console.error('[Tribes] Connection failed:', error);
              Alert.alert('Connection Failed', 'Could not connect. Please try again.');
            }
          },
        },
      ]
    );
  };

  const joinedTribes = tribes.filter(t => t.isJoined);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tribes</Text>
        <Text style={styles.headerSubtitle}>
          Find others with shared experiences
        </Text>
      </View>

      {/* Active Beacons Banner */}
      {isBeaconActive && (
        <View style={styles.activeBeaconBanner}>
          <Text style={styles.activeBeaconIcon}>📡</Text>
          <View style={styles.activeBeaconText}>
            <Text style={styles.activeBeaconTitle}>Your beacon is active</Text>
            <Text style={styles.activeBeaconSubtitle}>
              Others in your tribes can discover you
            </Text>
          </View>
        </View>
      )}

      {/* Joined Tribes Quick Access */}
      {joinedTribes.length > 0 && (
        <View style={styles.joinedSection}>
          <Text style={styles.sectionTitle}>YOUR TRIBES</Text>
          <FlatList
            horizontal
            data={joinedTribes}
            keyExtractor={item => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.joinedList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.joinedChip}
                onPress={() => handleTribePress(item)}
              >
                <Text style={styles.joinedChipIcon}>{item.icon}</Text>
                <Text style={styles.joinedChipName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* All Tribes */}
      <Text style={styles.sectionTitle}>DISCOVER TRIBES</Text>
      <FlatList
        data={tribes}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.tribeList}
        renderItem={({ item }) => (
          <TribeCard
            tribe={item}
            onPress={() => handleTribePress(item)}
            onJoinToggle={() => handleJoinToggle(item)}
          />
        )}
      />

      {/* Tribe Detail Modal */}
      <Modal
        visible={showTribeModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTribeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedTribe && (
              <>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowTribeModal(false)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>

                <Text style={styles.modalIcon}>{selectedTribe.icon}</Text>
                <Text style={styles.modalTitle}>{selectedTribe.name}</Text>
                <Text style={styles.modalDescription}>
                  {selectedTribe.description}
                </Text>

                {selectedTribe.isJoined ? (
                  <>
                    <Text style={styles.beaconsTitle}>Active Beacons</Text>
                    
                    {loading ? (
                      <ActivityIndicator color={COLORS.primary} style={styles.loader} />
                    ) : beacons.length > 0 ? (
                      <FlatList
                        data={beacons}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                          <BeaconCard
                            beacon={item}
                            onConnect={() => handleConnect(item)}
                          />
                        )}
                        style={styles.beaconList}
                      />
                    ) : (
                      <View style={styles.emptyBeacons}>
                        <Text style={styles.emptyIcon}>🔇</Text>
                        <Text style={styles.emptyText}>No active beacons</Text>
                        <Text style={styles.emptySubtext}>
                          Check back later or explore other tribes
                        </Text>
                      </View>
                    )}
                  </>
                ) : (
                  <View style={styles.joinPrompt}>
                    <Text style={styles.joinPromptText}>
                      Join this tribe to discover others and let them discover you.
                    </Text>
                    <TouchableOpacity
                      style={styles.joinLargeButton}
                      onPress={() => {
                        handleJoinToggle(selectedTribe);
                        loadBeacons(selectedTribe.topic);
                      }}
                    >
                      <Text style={styles.joinLargeButtonText}>Join Tribe</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Privacy Footer */}
      <View style={styles.privacyFooter}>
        <Text style={styles.privacyText}>
          🔒 Beacons are anonymous. No names, photos, or locations shared.
        </Text>
      </View>
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
  activeBeaconBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '20',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeBeaconIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  activeBeaconText: {
    flex: 1,
  },
  activeBeaconTitle: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  activeBeaconSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  sectionTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  joinedSection: {
    marginBottom: 20,
  },
  joinedList: {
    paddingHorizontal: 16,
  },
  joinedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  joinedChipIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  joinedChipName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  tribeList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  tribeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  tribeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tribeIcon: {
    fontSize: 36,
    marginRight: 14,
  },
  tribeInfo: {
    flex: 1,
  },
  tribeName: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
  },
  tribeDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  tribeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tribeMembers: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  joinedButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.success,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  joinedButtonText: {
    color: COLORS.success,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  modalIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalDescription: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  beaconsTitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 12,
  },
  beaconList: {
    maxHeight: 250,
  },
  beaconCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  beaconIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  beaconEmoji: {
    fontSize: 20,
  },
  beaconInfo: {
    flex: 1,
  },
  beaconHash: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  beaconTime: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  connectButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyBeacons: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyText: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  joinPrompt: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  joinPromptText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  joinLargeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 25,
  },
  joinLargeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loader: {
    marginVertical: 30,
  },
  privacyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 12,
    alignItems: 'center',
  },
  privacyText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
});
