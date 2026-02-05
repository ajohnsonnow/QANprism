"""
Project Prism - Django Models

MERGED & IMPROVED: Complete backend models with:
- Zero-knowledge user model (hash only)
- Signal Protocol key storage
- Organizations with verification
- Encrypted messages
- Beacons for Tribes
- Queer Cache (encrypted location drops)
- Mutual Aid listings
- Anonymous feedback
"""

import secrets
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator


# =============================================================================
# USER & AUTH
# =============================================================================

class PrismUser(models.Model):
    """
    Zero-knowledge user model.
    No email, no name - just a cryptographic hash.
    """
    # SHA-256 hash of identity key (64 hex chars)
    user_hash = models.CharField(max_length=64, primary_key=True)
    
    # Registration ID for Signal Protocol
    registration_id = models.IntegerField()
    
    # Identity key (base64 encoded public key)
    identity_key = models.TextField()
    
    # Key bundle status
    pre_keys_available = models.IntegerField(default=100)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prism_users'
        verbose_name = 'Prism User'
        verbose_name_plural = 'Prism Users'
    
    def __str__(self):
        return f"User {self.user_hash[:12]}..."


class PreKey(models.Model):
    """
    One-time pre-keys for Signal Protocol key exchange.
    Each key is used once and then deleted.
    """
    user = models.ForeignKey(
        PrismUser,
        on_delete=models.CASCADE,
        related_name='pre_keys'
    )
    key_id = models.IntegerField()
    public_key = models.TextField()  # Base64 encoded
    is_used = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'prism_pre_keys'
        unique_together = ['user', 'key_id']
        indexes = [
            models.Index(fields=['user', 'is_used']),
        ]


class SignedPreKey(models.Model):
    """
    Signed pre-key for Signal Protocol.
    Rotated periodically (e.g., weekly).
    """
    user = models.ForeignKey(
        PrismUser,
        on_delete=models.CASCADE,
        related_name='signed_pre_keys'
    )
    key_id = models.IntegerField()
    public_key = models.TextField()  # Base64 encoded
    signature = models.TextField()    # Base64 encoded
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'prism_signed_pre_keys'
        indexes = [
            models.Index(fields=['user', 'is_active']),
        ]


# =============================================================================
# ORGANIZATIONS
# =============================================================================

class Organization(models.Model):
    """
    LGBTQ+ friendly organizations, businesses, and services.
    """
    ORG_TYPES = [
        ('nonprofit', 'Non-Profit'),
        ('healthcare', 'Healthcare'),
        ('community', 'Community Center'),
        ('housing', 'Housing'),
        ('business_food', 'Business - Food'),
        ('business_retail', 'Business - Retail'),
        ('business_service', 'Business - Service'),
        ('legal', 'Legal Services'),
        ('education', 'Education'),
        ('religious', 'Religious'),
    ]
    
    id = models.CharField(max_length=64, primary_key=True, default=secrets.token_hex)
    name = models.CharField(max_length=255)
    description = models.TextField()
    org_type = models.CharField(max_length=20, choices=ORG_TYPES)
    
    # Location
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    address = models.CharField(max_length=500, blank=True)
    
    # Contact
    phone = models.CharField(max_length=20, blank=True)
    website = models.URLField(blank=True)
    hours = models.CharField(max_length=500, blank=True)
    
    # Tags for filtering
    tags = models.JSONField(default=list)
    
    # Status
    is_safe_space = models.BooleanField(default=False)
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prism_organizations'
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['org_type']),
            models.Index(fields=['is_active', 'is_verified']),
        ]
    
    def __str__(self):
        return self.name


# =============================================================================
# MESSAGING
# =============================================================================

class EncryptedMessage(models.Model):
    """
    End-to-end encrypted messages.
    Server only sees ciphertext - cannot read content.
    """
    id = models.CharField(max_length=64, primary_key=True, default=secrets.token_hex)
    
    # Sender and recipient hashes (no user objects - privacy)
    sender_hash = models.CharField(max_length=64)
    recipient_hash = models.CharField(max_length=64)
    
    # Encrypted content (Signal Protocol ciphertext)
    ciphertext = models.TextField()
    
    # Status
    is_delivered = models.BooleanField(default=False)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Auto-delete after delivery + grace period
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'prism_messages'
        indexes = [
            models.Index(fields=['recipient_hash', 'is_delivered']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Messages expire 7 days after creation
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)


# =============================================================================
# BEACONS (Tribes)
# =============================================================================

class Beacon(models.Model):
    """
    Anonymous beacons for Tribes feature.
    Allows discovery without revealing identity.
    """
    TOPICS = [
        ('trans_fem', 'Trans Femme'),
        ('trans_masc', 'Trans Masc'),
        ('nonbinary', 'Non-Binary'),
        ('bipoc_queer', 'BIPOC Queer'),
        ('queer_parents', 'Queer Parents'),
        ('newly_out', 'Newly Out'),
        ('queer_gamers', 'Queer Gamers'),
        ('queer_faith', 'Queer & Faith'),
        ('queer_sober', 'Queer & Sober'),
        ('general', 'General'),
    ]
    
    id = models.CharField(max_length=64, primary_key=True, default=secrets.token_hex)
    
    # Topic/tribe
    topic = models.CharField(max_length=30, choices=TOPICS)
    
    # Broadcast hash (derived from identity key, not linkable)
    broadcast_hash = models.CharField(max_length=64)
    
    # Optional: coarse location (geohash, ~5km precision)
    geohash = models.CharField(max_length=6, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'prism_beacons'
        indexes = [
            models.Index(fields=['topic', 'expires_at']),
            models.Index(fields=['geohash']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Beacons expire after 24 hours
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)


# =============================================================================
# QUEER CACHE
# =============================================================================

class QueerCache(models.Model):
    """
    Encrypted location-based message drops.
    Like geocaching but for community notes.
    """
    ICON_TYPES = [
        ('heart', 'Heart'),
        ('coffee', 'Coffee'),
        ('history', 'History'),
        ('warning', 'Warning'),
        ('star', 'Star'),
    ]
    
    id = models.CharField(max_length=64, primary_key=True, default=secrets.token_hex)
    
    # Location (fuzzy - randomized ~200m)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Encrypted content (only decryptable by community key)
    ciphertext = models.TextField()
    
    # Icon hint (not encrypted)
    icon_type = models.CharField(max_length=10, choices=ICON_TYPES, default='heart')
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'prism_caches'
        indexes = [
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Caches expire after 30 days
            self.expires_at = timezone.now() + timezone.timedelta(days=30)
        super().save(*args, **kwargs)


# =============================================================================
# MUTUAL AID
# =============================================================================

class MutualAidListing(models.Model):
    """
    Community gifting economy listings.
    Offers and requests for help.
    HARD CODE NO DATING - purely resource sharing.
    """
    LISTING_TYPES = [
        ('offer', 'Offering'),
        ('request', 'Requesting'),
    ]
    
    CATEGORIES = [
        ('food', 'Food'),
        ('clothing', 'Clothing'),
        ('housing', 'Housing'),
        ('transport', 'Transport'),
        ('emotional', 'Emotional Support'),
        ('medical', 'Medical'),
        ('tech', 'Tech Help'),
        ('other', 'Other'),
    ]
    
    id = models.CharField(max_length=64, primary_key=True, default=secrets.token_hex)
    
    # Creator hash (for contact routing)
    creator_hash = models.CharField(max_length=64)
    
    # Listing details
    listing_type = models.CharField(max_length=10, choices=LISTING_TYPES)
    category = models.CharField(max_length=20, choices=CATEGORIES)
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=500)
    
    # Fuzzy location (~200m randomization)
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    
    # Encrypted contact info (decrypted when connecting)
    contact_cipher = models.TextField(blank=True)
    
    # Status
    is_fulfilled = models.BooleanField(default=False)
    fulfilled_at = models.DateTimeField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    
    class Meta:
        db_table = 'prism_mutual_aid'
        indexes = [
            models.Index(fields=['listing_type', 'is_fulfilled']),
            models.Index(fields=['category']),
            models.Index(fields=['latitude', 'longitude']),
            models.Index(fields=['expires_at']),
        ]
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            # Listings expire after 7 days
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)


# =============================================================================
# FEEDBACK
# =============================================================================

class Feedback(models.Model):
    """
    Community submissions: bug reports, feature requests, and org submissions.
    Anonymous with admin tracking and email notifications.
    """
    FEEDBACK_TYPES = [
        ('bug', 'Bug Report'),
        ('feature', 'Feature Request'),
        ('org_submission', 'Organization Submission'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
    ]
    
    id = models.CharField(max_length=64, primary_key=True, default=secrets.token_hex)
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    
    # General feedback
    content = models.TextField()
    
    # For organization submissions
    org_name = models.CharField(max_length=255, blank=True)
    org_description = models.TextField(blank=True)
    org_type = models.CharField(max_length=50, blank=True)
    org_address = models.TextField(blank=True)
    org_phone = models.CharField(max_length=50, blank=True)
    org_website = models.URLField(blank=True)
    org_hours = models.TextField(blank=True)
    org_latitude = models.FloatField(null=True, blank=True)
    org_longitude = models.FloatField(null=True, blank=True)
    org_is_safe_space = models.BooleanField(default=False)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_response = models.TextField(blank=True)
    admin_notes = models.TextField(blank=True)
    
    # Email notification flag
    email_sent = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'prism_feedback'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['feedback_type', 'status']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.get_feedback_type_display()} - {self.created_at.strftime('%Y-%m-%d')}"


# =============================================================================
# ADMIN APPLICATIONS
# =============================================================================

class AdminApplication(models.Model):
    """
    Application to become a local community admin
    """
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    # Applicant Information
    name = models.CharField(max_length=255)
    email = models.EmailField()
    location = models.CharField(max_length=255, help_text="City, State/Province, Country")
    
    # Application Details
    experience = models.TextField(help_text="Experience with LGBTQ+ community work")
    motivation = models.TextField(help_text="Why do you want to be an admin?")
    availability = models.TextField(help_text="Time commitment you can offer")
    references = models.TextField(blank=True, help_text="Optional: References or community connections")
    
    # Admin Response
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    admin_notes = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    email_sent = models.BooleanField(default=False)

    class Meta:
        db_table = 'prism_admin_applications'
        ordering = ['-created_at']

    def __str__(self):
        return f"Admin Application - {self.name} ({self.status})"


# =============================================================================
# TRIBE POSTS & MODERATION
# =============================================================================

class TribePost(models.Model):
    """
    Anonymous post in a tribe community
    """
    tribe_id = models.CharField(max_length=100)  # e.g., 'trans_fem', 'bipoc_queer'
    author_hash = models.CharField(max_length=100)  # Anonymous identifier
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Moderation
    is_deleted = models.BooleanField(default=False)
    deleted_by = models.CharField(max_length=255, blank=True)
    deleted_reason = models.TextField(blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'prism_tribe_posts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['tribe_id', '-created_at']),
            models.Index(fields=['is_deleted']),
        ]

    def __str__(self):
        return f"Post in {self.tribe_id} by {self.author_hash[:8]}..."


class TribeReaction(models.Model):
    """
    Reactions to tribe posts
    """
    REACTION_TYPES = [
        ('heart', 'Heart'),
        ('support', 'Support'),
        ('celebrate', 'Celebrate'),
    ]
    
    post = models.ForeignKey(TribePost, on_delete=models.CASCADE, related_name='reactions')
    reaction_type = models.CharField(max_length=20, choices=REACTION_TYPES)
    user_hash = models.CharField(max_length=100)  # Anonymous user identifier
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'prism_tribe_reactions'
        unique_together = ['post', 'user_hash', 'reaction_type']
        indexes = [
            models.Index(fields=['post', 'reaction_type']),
        ]

    def __str__(self):
        return f"{self.reaction_type} on post {self.post.id}"
