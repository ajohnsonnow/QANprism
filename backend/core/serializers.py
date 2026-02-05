"""
Project Prism - Django REST Serializers

MERGED & IMPROVED: Complete serializers with:
- Input validation
- Output formatting
- Privacy-safe representations
"""

from rest_framework import serializers
from .models import (
    PrismUser, PreKey, SignedPreKey,
    Organization, EncryptedMessage,
    Beacon, QueerCache, MutualAidListing, Feedback,
    AdminApplication, TribePost, TribeReaction
)


# =============================================================================
# USER & AUTH
# =============================================================================

class PreKeySerializer(serializers.Serializer):
    """Pre-key for key exchange."""
    key_id = serializers.IntegerField(min_value=1)
    public_key = serializers.CharField()


class SignedPreKeySerializer(serializers.Serializer):
    """Signed pre-key with signature."""
    key_id = serializers.IntegerField(min_value=1)
    public_key = serializers.CharField()
    signature = serializers.CharField()


class UserRegistrationSerializer(serializers.Serializer):
    """Register a new user with key bundle."""
    identity_key = serializers.CharField()
    registration_id = serializers.IntegerField(min_value=1)
    signed_pre_key = SignedPreKeySerializer()
    pre_keys = PreKeySerializer(many=True, required=False)


class PreKeyBundleSerializer(serializers.Serializer):
    """Output serializer for pre-key bundle."""
    registration_id = serializers.IntegerField()
    identity_key = serializers.CharField()
    signed_pre_key = SignedPreKeySerializer()
    pre_key = PreKeySerializer(required=False)


# =============================================================================
# ORGANIZATIONS
# =============================================================================

class OrganizationSerializer(serializers.ModelSerializer):
    """Full organization details."""
    distance = serializers.FloatField(read_only=True, required=False)
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'description', 'org_type',
            'latitude', 'longitude', 'address',
            'phone', 'website', 'hours',
            'tags', 'is_safe_space', 'is_verified',
            'created_at', 'updated_at', 'distance'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class OrganizationListSerializer(serializers.ModelSerializer):
    """Lightweight organization for list views."""
    distance = serializers.FloatField(read_only=True, required=False)
    
    class Meta:
        model = Organization
        fields = [
            'id', 'name', 'org_type',
            'latitude', 'longitude',
            'is_safe_space', 'is_verified', 'distance'
        ]


# =============================================================================
# MESSAGING
# =============================================================================

class MessageSerializer(serializers.ModelSerializer):
    """Encrypted message serializer."""
    
    class Meta:
        model = EncryptedMessage
        fields = [
            'id', 'sender_hash', 'recipient_hash',
            'ciphertext', 'created_at'
        ]
        read_only_fields = ['id', 'sender_hash', 'created_at']


class SendMessageSerializer(serializers.Serializer):
    """Input for sending a message."""
    recipient_hash = serializers.CharField(max_length=64)
    ciphertext = serializers.CharField()


# =============================================================================
# BEACONS
# =============================================================================

class BeaconSerializer(serializers.ModelSerializer):
    """Beacon serializer."""
    
    class Meta:
        model = Beacon
        fields = [
            'id', 'topic', 'broadcast_hash',
            'geohash', 'created_at', 'expires_at'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']


class CreateBeaconSerializer(serializers.Serializer):
    """Input for creating a beacon."""
    topic = serializers.ChoiceField(choices=Beacon.TOPICS)
    broadcast_hash = serializers.CharField(max_length=64)
    geohash = serializers.CharField(max_length=6, required=False, allow_blank=True)


# =============================================================================
# QUEER CACHE
# =============================================================================

class QueerCacheSerializer(serializers.ModelSerializer):
    """Queer cache serializer."""
    distance = serializers.FloatField(read_only=True, required=False)
    
    class Meta:
        model = QueerCache
        fields = [
            'id', 'latitude', 'longitude',
            'ciphertext', 'icon_type',
            'created_at', 'expires_at', 'distance'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']


class CreateCacheSerializer(serializers.Serializer):
    """Input for creating a cache."""
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    ciphertext = serializers.CharField()
    icon_type = serializers.ChoiceField(
        choices=QueerCache.ICON_TYPES, 
        default='heart'
    )


# =============================================================================
# MUTUAL AID
# =============================================================================

class MutualAidListingSerializer(serializers.ModelSerializer):
    """Mutual aid listing serializer."""
    distance = serializers.FloatField(read_only=True, required=False)
    
    class Meta:
        model = MutualAidListing
        fields = [
            'id', 'listing_type', 'category',
            'title', 'description',
            'latitude', 'longitude',
            'is_fulfilled', 'created_at', 'expires_at', 'distance'
        ]
        read_only_fields = ['id', 'created_at', 'expires_at']


class CreateListingSerializer(serializers.Serializer):
    """Input for creating a listing."""
    listing_type = serializers.ChoiceField(choices=MutualAidListing.LISTING_TYPES)
    category = serializers.ChoiceField(choices=MutualAidListing.CATEGORIES)
    title = serializers.CharField(max_length=100)
    description = serializers.CharField(max_length=500)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6)
    contact_cipher = serializers.CharField(required=False)


# =============================================================================
# FEEDBACK
# =============================================================================

class FeedbackSerializer(serializers.ModelSerializer):
    """Feedback with status tracking."""
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'feedback_type', 'content', 'status',
            'org_name', 'org_description', 'org_type', 'org_address',
            'org_phone', 'org_website', 'org_hours',
            'org_latitude', 'org_longitude', 'org_is_safe_space',
            'admin_response', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'admin_response']


# =============================================================================
# ADMIN APPLICATIONS
# =============================================================================

class AdminApplicationSerializer(serializers.ModelSerializer):
    """Admin application serializer."""
    
    class Meta:
        model = AdminApplication
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'email_sent', 'status', 'admin_notes', 'reviewed_at']


# =============================================================================
# TRIBE POSTS & MODERATION
# =============================================================================

class TribeReactionSerializer(serializers.ModelSerializer):
    """Tribe reaction serializer."""
    
    class Meta:
        model = TribeReaction
        fields = '__all__'
        read_only_fields = ['created_at']


class TribePostSerializer(serializers.ModelSerializer):
    """Tribe post with reaction counts."""
    reaction_counts = serializers.SerializerMethodField()
    reply_count = serializers.SerializerMethodField()

    class Meta:
        model = TribePost
        fields = ['id', 'tribe_id', 'author_hash', 'content', 'created_at', 
                  'is_deleted', 'reaction_counts', 'reply_count']
        read_only_fields = ['created_at', 'is_deleted']

    def get_reaction_counts(self, obj):
        from django.db.models import Count
        reactions = obj.reactions.values('reaction_type').annotate(count=Count('reaction_type'))
        result = {'heart': 0, 'support': 0, 'celebrate': 0}
        for r in reactions:
            result[r['reaction_type']] = r['count']
        return result

    def get_reply_count(self, obj):
        # Placeholder for future reply functionality
        return 0

