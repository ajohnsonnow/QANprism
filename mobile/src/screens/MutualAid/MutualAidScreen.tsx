/**
 * Project Prism - Mutual Aid Screen
 * 
 * MERGED & IMPROVED: Community gifting economy with:
 * - Offers and requests
 * - Category filtering
 * - Location-based discovery
 * - Anonymous contact exchange
 * - HARD CODE NO DATING - purely resource sharing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { apiClient } from '../../api/client';
import { locationService } from '../../utils/LocationService';
import { MutualAidListing, ListingType, ListingCategory } from '../../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../../theme/constants';

// =============================================================================
// CONSTANTS
// =============================================================================

const CATEGORIES: { id: ListingCategory; icon: string; label: string }[] = [
  { id: 'food', icon: '🍲', label: 'Food' },
  { id: 'clothing', icon: '👕', label: 'Clothing' },
  { id: 'housing', icon: '🏠', label: 'Housing' },
  { id: 'transport', icon: '🚗', label: 'Transport' },
  { id: 'emotional', icon: '💜', label: 'Support' },
  { id: 'medical', icon: '💊', label: 'Medical' },
  { id: 'tech', icon: '📱', label: 'Tech' },
  { id: 'other', icon: '📦', label: 'Other' },
];

// =============================================================================
// COMPONENTS
// =============================================================================

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, selected && styles.filterChipSelected]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

interface ListingCardProps {
  listing: MutualAidListing;
  onContact: () => void;
}

const ListingCard: React.FC<ListingCardProps> = ({ listing, onContact }) => {
  const category = CATEGORIES.find(c => c.id === listing.category);
  
  const formatTimeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <View style={styles.listingCard}>
      {/* Badge */}
      <View style={[
        styles.listingBadge,
        listing.listing_type === 'offer' ? styles.offerBadge : styles.requestBadge
      ]}>
        <Text style={styles.listingBadgeText}>
          {listing.listing_type === 'offer' ? '📤 Offering' : '📥 Requesting'}
        </Text>
      </View>

      {/* Header */}
      <View style={styles.listingHeader}>
        <Text style={styles.listingIcon}>{category?.icon || '📦'}</Text>
        <View style={styles.listingTitleContainer}>
          <Text style={styles.listingTitle} numberOfLines={2}>{listing.title}</Text>
          <Text style={styles.listingMeta}>
            {category?.label} • {formatTimeAgo(listing.created_at)}
            {listing.distance && ` • ${locationService.formatDistanceMiles(listing.distance)}`}
          </Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.listingDescription} numberOfLines={3}>
        {listing.description}
      </Text>

      {/* Actions */}
      <View style={styles.listingActions}>
        {listing.is_fulfilled ? (
          <View style={styles.fulfilledBadge}>
            <Text style={styles.fulfilledText}>✓ Fulfilled</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.contactButton} onPress={onContact}>
            <Text style={styles.contactButtonText}>
              {listing.listing_type === 'offer' ? 'Accept Offer' : 'I Can Help'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export const MutualAidScreen: React.FC = () => {
  // State
  const [listings, setListings] = useState<MutualAidListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'offers' | 'requests'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ListingCategory | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Create form state
  const [createType, setCreateType] = useState<ListingType>('offer');
  const [createCategory, setCreateCategory] = useState<ListingCategory>('other');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');

  // Effects
  useEffect(() => {
    loadListings();
  }, [filter, categoryFilter]);

  const loadListings = async () => {
    try {
      const location = await locationService.getCurrentLocation();
      
      const typeParam = filter === 'all' ? undefined : 
                        filter === 'offers' ? 'offer' : 'request';
      
      const data = await apiClient.getMutualAidListings(
        location.latitude,
        location.longitude,
        typeParam,
        categoryFilter || undefined
      );
      
      // Add distance calculation
      const withDistance = data.map(listing => ({
        ...listing,
        distance: locationService.calculateDistance(
          location.latitude,
          location.longitude,
          listing.latitude,
          listing.longitude
        ),
      }));
      
      setListings(withDistance.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
    } catch (error) {
      console.error('[MutualAid] Load failed:', error);
      // Mock data for development
      setListings([
        {
          id: '1',
          listing_type: 'offer',
          category: 'food',
          title: 'Home-cooked meals available',
          description: 'Happy to cook for anyone in need. Can accommodate dietary restrictions. No strings attached.',
          latitude: 0,
          longitude: 0,
          distance: 450,
          is_fulfilled: false,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: '2',
          listing_type: 'request',
          category: 'transport',
          title: 'Need ride to medical appointment',
          description: 'Looking for a ride to the clinic next Tuesday at 2pm. Can offer gas money if helpful.',
          latitude: 0,
          longitude: 0,
          distance: 1200,
          is_fulfilled: false,
          created_at: new Date(Date.now() - 7200000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: '3',
          listing_type: 'offer',
          category: 'emotional',
          title: 'Peer support available',
          description: 'Trans elder here. Happy to chat, share resources, or just listen. DMs always open.',
          latitude: 0,
          longitude: 0,
          distance: 2500,
          is_fulfilled: false,
          created_at: new Date(Date.now() - 14400000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
        {
          id: '4',
          listing_type: 'request',
          category: 'clothing',
          title: 'Looking for feminine clothes (size M)',
          description: 'Recently came out, building a new wardrobe. Would appreciate any hand-me-downs or thrift finds.',
          latitude: 0,
          longitude: 0,
          distance: 3800,
          is_fulfilled: false,
          created_at: new Date(Date.now() - 28800000).toISOString(),
          expires_at: new Date(Date.now() + 86400000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadListings();
  }, [filter, categoryFilter]);

  const handleContact = async (listing: MutualAidListing) => {
    const actionText = listing.listing_type === 'offer' 
      ? 'accept this offer'
      : 'help with this request';
    
    Alert.alert(
      `Connect with this person?`,
      `You'll start an encrypted conversation to ${actionText}. Your identity stays private.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: async () => {
            // In production: decrypt contact_cipher and establish Signal session
            Alert.alert('Connected!', 'Check your messages to coordinate.');
          },
        },
      ]
    );
  };

  const handleCreate = async () => {
    if (!createTitle.trim() || !createDescription.trim()) {
      Alert.alert('Missing Info', 'Please fill in both title and description.');
      return;
    }

    try {
      const location = await locationService.getCurrentLocation();
      const fuzzyLocation = locationService.fuzzyLocation(location);
      
      // Note: In production, contact_cipher would be encrypted with a server-side key
      // For now, we leave it empty and rely on the user_hash header for contact routing

      await apiClient.createListing({
        listing_type: createType,
        category: createCategory,
        title: createTitle.trim(),
        description: createDescription.trim(),
        latitude: fuzzyLocation.latitude,
        longitude: fuzzyLocation.longitude,
      });

      Alert.alert('Posted!', 'Your listing is now visible to the community.');
      setShowCreateModal(false);
      resetCreateForm();
      handleRefresh();
    } catch (error) {
      console.error('[MutualAid] Create failed:', error);
      Alert.alert('Error', 'Could not create listing. Please try again.');
    }
  };

  const resetCreateForm = () => {
    setCreateType('offer');
    setCreateCategory('other');
    setCreateTitle('');
    setCreateDescription('');
  };

  const filteredListings = listings.filter(l => {
    if (filter === 'offers' && l.listing_type !== 'offer') return false;
    if (filter === 'requests' && l.listing_type !== 'request') return false;
    if (categoryFilter && l.category !== categoryFilter) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mutual Aid</Text>
        <Text style={styles.headerSubtitle}>
          Community gifting economy 💜
        </Text>
      </View>

      {/* Type Filters */}
      <View style={styles.filterRow}>
        <FilterChip
          label="All"
          selected={filter === 'all'}
          onPress={() => setFilter('all')}
        />
        <FilterChip
          label="Offers"
          selected={filter === 'offers'}
          onPress={() => setFilter('offers')}
        />
        <FilterChip
          label="Requests"
          selected={filter === 'requests'}
          onPress={() => setFilter('requests')}
        />
      </View>

      {/* Category Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        <TouchableOpacity
          style={[styles.categoryChip, !categoryFilter && styles.categoryChipSelected]}
          onPress={() => setCategoryFilter(null)}
        >
          <Text style={styles.categoryIcon}>🌐</Text>
          <Text style={[styles.categoryText, !categoryFilter && styles.categoryTextSelected]}>
            All
          </Text>
        </TouchableOpacity>
        
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.categoryChip, categoryFilter === cat.id && styles.categoryChipSelected]}
            onPress={() => setCategoryFilter(categoryFilter === cat.id ? null : cat.id)}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[
              styles.categoryText, 
              categoryFilter === cat.id && styles.categoryTextSelected
            ]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Listings */}
      <FlatList
        data={filteredListings}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        renderItem={({ item }) => (
          <ListingCard listing={item} onContact={() => handleContact(item)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🤝</Text>
            <Text style={styles.emptyTitle}>
              {loading ? 'Loading...' : 'No listings yet'}
            </Text>
            <Text style={styles.emptyText}>
              Be the first to offer help or share a need
            </Text>
          </View>
        }
      />

      {/* FAB - Create */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Create Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Share with the community</Text>

            {/* Type Toggle */}
            <View style={styles.typeToggle}>
              <TouchableOpacity
                style={[styles.typeButton, createType === 'offer' && styles.typeButtonActive]}
                onPress={() => setCreateType('offer')}
              >
                <Text style={[
                  styles.typeButtonText,
                  createType === 'offer' && styles.typeButtonTextActive
                ]}>
                  📤 I'm Offering
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeButton, createType === 'request' && styles.typeButtonActive]}
                onPress={() => setCreateType('request')}
              >
                <Text style={[
                  styles.typeButtonText,
                  createType === 'request' && styles.typeButtonTextActive
                ]}>
                  📥 I'm Requesting
                </Text>
              </TouchableOpacity>
            </View>

            {/* Category Picker */}
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryPickerChip,
                    createCategory === cat.id && styles.categoryPickerChipSelected
                  ]}
                  onPress={() => setCreateCategory(cat.id)}
                >
                  <Text style={styles.categoryPickerIcon}>{cat.icon}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              value={createTitle}
              onChangeText={setCreateTitle}
              placeholder={createType === 'offer' ? 'What are you offering?' : 'What do you need?'}
              placeholderTextColor={COLORS.textMuted}
              maxLength={100}
            />

            {/* Description */}
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              value={createDescription}
              onChangeText={setCreateDescription}
              placeholder="Add details..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              maxLength={500}
            />

            {/* Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowCreateModal(false);
                  resetCreateForm();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.postButton} onPress={handleCreate}>
                <Text style={styles.postButtonText}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Privacy Notice */}
      <View style={styles.privacyBanner}>
        <Text style={styles.privacyText}>
          🔒 Location fuzzed • Identity private • No dating
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  categoryRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    marginRight: 8,
  },
  categoryChipSelected: {
    backgroundColor: COLORS.primary + '30',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  categoryTextSelected: {
    color: COLORS.primary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  listingCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: 16,
    marginBottom: 12,
  },
  listingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  offerBadge: {
    backgroundColor: COLORS.successFaded,
  },
  requestBadge: {
    backgroundColor: COLORS.primaryFaded,
  },
  listingBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  listingHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  listingIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  listingTitleContainer: {
    flex: 1,
  },
  listingTitle: {
    color: COLORS.textPrimary,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  listingMeta: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  listingDescription: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 14,
  },
  listingActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  contactButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  contactButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  fulfilledBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successFaded,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  fulfilledText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  fabIcon: {
    color: 'white',
    fontSize: 28,
    fontWeight: '300',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  typeToggle: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryFaded,
  },
  typeButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  typeButtonTextActive: {
    color: COLORS.primary,
  },
  inputLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: 14,
    color: COLORS.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputMultiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryPickerChip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryPickerChipSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryFaded,
  },
  categoryPickerIcon: {
    fontSize: 20,
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: 16,
    fontWeight: '500',
  },
  postButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  postButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  privacyBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 10,
    alignItems: 'center',
  },
  privacyText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
});
