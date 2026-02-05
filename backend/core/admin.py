"""
Project Prism - Django Admin Configuration

Register models for admin interface (for development/moderation)
"""

from django.contrib import admin
from .models import (
    PrismUser, PreKey, SignedPreKey,
    Organization, EncryptedMessage,
    Beacon, QueerCache, MutualAidListing, Feedback,
    AdminApplication, TribePost, TribeReaction
)


# =============================================================================
# USER ADMIN
# =============================================================================

class PreKeyInline(admin.TabularInline):
    model = PreKey
    extra = 0
    readonly_fields = ['key_id', 'is_used', 'created_at']


class SignedPreKeyInline(admin.TabularInline):
    model = SignedPreKey
    extra = 0
    readonly_fields = ['key_id', 'is_active', 'created_at']


@admin.register(PrismUser)
class PrismUserAdmin(admin.ModelAdmin):
    list_display = ['user_hash_short', 'pre_keys_available', 'created_at', 'last_seen']
    list_filter = ['created_at']
    search_fields = ['user_hash']
    readonly_fields = ['user_hash', 'identity_key', 'registration_id', 'created_at', 'last_seen']
    inlines = [PreKeyInline, SignedPreKeyInline]
    
    def user_hash_short(self, obj):
        return f"{obj.user_hash[:12]}..."
    user_hash_short.short_description = "User Hash"


# =============================================================================
# ORGANIZATION ADMIN
# =============================================================================

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['name', 'org_type', 'is_safe_space', 'is_verified', 'is_active']
    list_filter = ['org_type', 'is_safe_space', 'is_verified', 'is_active']
    search_fields = ['name', 'description', 'address']
    list_editable = ['is_safe_space', 'is_verified', 'is_active']
    
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'description', 'org_type')
        }),
        ('Location', {
            'fields': ('latitude', 'longitude', 'address')
        }),
        ('Contact', {
            'fields': ('phone', 'website', 'hours')
        }),
        ('Status', {
            'fields': ('is_safe_space', 'is_verified', 'is_active', 'tags')
        }),
    )


# =============================================================================
# MESSAGE ADMIN (Limited for privacy)
# =============================================================================

@admin.register(EncryptedMessage)
class EncryptedMessageAdmin(admin.ModelAdmin):
    list_display = ['id_short', 'sender_short', 'recipient_short', 'is_delivered', 'created_at']
    list_filter = ['is_delivered', 'created_at']
    readonly_fields = ['id', 'sender_hash', 'recipient_hash', 'ciphertext', 'created_at']
    
    # NOTE: We cannot read message content - it's E2E encrypted
    
    def id_short(self, obj):
        return f"{obj.id[:8]}..."
    id_short.short_description = "ID"
    
    def sender_short(self, obj):
        return f"{obj.sender_hash[:8]}..."
    sender_short.short_description = "Sender"
    
    def recipient_short(self, obj):
        return f"{obj.recipient_hash[:8]}..."
    recipient_short.short_description = "Recipient"


# =============================================================================
# BEACON ADMIN
# =============================================================================

@admin.register(Beacon)
class BeaconAdmin(admin.ModelAdmin):
    list_display = ['id_short', 'topic', 'geohash', 'created_at', 'expires_at']
    list_filter = ['topic', 'created_at']
    search_fields = ['broadcast_hash']
    readonly_fields = ['id', 'broadcast_hash', 'created_at']
    
    def id_short(self, obj):
        return f"{obj.id[:8]}..."
    id_short.short_description = "ID"


# =============================================================================
# QUEER CACHE ADMIN
# =============================================================================

@admin.register(QueerCache)
class QueerCacheAdmin(admin.ModelAdmin):
    list_display = ['id_short', 'icon_type', 'created_at', 'expires_at']
    list_filter = ['icon_type', 'created_at']
    readonly_fields = ['id', 'ciphertext', 'created_at']
    
    def id_short(self, obj):
        return f"{obj.id[:8]}..."
    id_short.short_description = "ID"


# =============================================================================
# MUTUAL AID ADMIN
# =============================================================================

@admin.register(MutualAidListing)
class MutualAidListingAdmin(admin.ModelAdmin):
    list_display = ['title', 'listing_type', 'category', 'is_fulfilled', 'created_at']
    list_filter = ['listing_type', 'category', 'is_fulfilled', 'created_at']
    search_fields = ['title', 'description']
    list_editable = ['is_fulfilled']
    readonly_fields = ['id', 'creator_hash', 'contact_cipher', 'created_at']


# =============================================================================
# FEEDBACK ADMIN
# =============================================================================

@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    list_display = ['id_short', 'feedback_type', 'status', 'email_sent', 'created_at']
    list_filter = ['feedback_type', 'status', 'email_sent', 'created_at']
    list_editable = ['status']
    readonly_fields = ['id', 'content', 'created_at', 'updated_at', 'email_sent']
    fieldsets = [
        ('Feedback Info', {
            'fields': ['id', 'feedback_type', 'content', 'status', 'admin_response', 'admin_notes']
        }),
        ('Organization Details', {
            'fields': ['org_name', 'org_description', 'org_type', 'org_address', 'org_phone', 
                      'org_website', 'org_hours', 'org_latitude', 'org_longitude', 'org_is_safe_space'],
            'classes': ['collapse']
        }),
        ('Metadata', {
            'fields': ['email_sent', 'created_at', 'updated_at']
        }),
    ]
    
    def id_short(self, obj):
        return f"{obj.id[:8]}..."
    id_short.short_description = "ID"


# =============================================================================
# ADMIN APPLICATIONS
# =============================================================================

@admin.register(AdminApplication)
class AdminApplicationAdmin(admin.ModelAdmin):
    list_display = ['name', 'email', 'location', 'status', 'created_at', 'email_sent']
    list_filter = ['status', 'email_sent', 'created_at']
    search_fields = ['name', 'email', 'location', 'experience', 'motivation']
    readonly_fields = ['created_at', 'updated_at', 'email_sent']
    
    fieldsets = (
        ('Applicant Information', {
            'fields': ('name', 'email', 'location')
        }),
        ('Application Details', {
            'fields': ('experience', 'motivation', 'availability', 'references')
        }),
        ('Admin Review', {
            'fields': ('status', 'admin_notes', 'reviewed_at')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at', 'email_sent')
        }),
    )
    
    actions = ['approve_applications', 'reject_applications']
    
    def approve_applications(self, request, queryset):
        from django.utils import timezone
        count = queryset.update(status='approved', reviewed_at=timezone.now())
        self.message_user(request, f"{count} application(s) approved.")
    approve_applications.short_description = "Approve selected applications"
    
    def reject_applications(self, request, queryset):
        from django.utils import timezone
        count = queryset.update(status='rejected', reviewed_at=timezone.now())
        self.message_user(request, f"{count} application(s) rejected.")
    reject_applications.short_description = "Reject selected applications"


# =============================================================================
# TRIBE POSTS
# =============================================================================

@admin.register(TribePost)
class TribePostAdmin(admin.ModelAdmin):
    list_display = ['tribe_id', 'author_hash_short', 'content_preview', 'created_at', 'is_deleted']
    list_filter = ['tribe_id', 'is_deleted', 'created_at']
    search_fields = ['content', 'author_hash', 'deleted_reason']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Post Info', {
            'fields': ('tribe_id', 'author_hash', 'content', 'created_at')
        }),
        ('Moderation', {
            'fields': ('is_deleted', 'deleted_by', 'deleted_reason', 'deleted_at')
        }),
    )
    
    def author_hash_short(self, obj):
        return f"{obj.author_hash[:16]}..."
    author_hash_short.short_description = "Author"
    
    def content_preview(self, obj):
        return obj.content[:50] + ('...' if len(obj.content) > 50 else '')
    content_preview.short_description = "Content"


@admin.register(TribeReaction)
class TribeReactionAdmin(admin.ModelAdmin):
    list_display = ['post', 'reaction_type', 'user_hash_short', 'created_at']
    list_filter = ['reaction_type', 'created_at']
    readonly_fields = ['created_at']
    
    def user_hash_short(self, obj):
        return f"{obj.user_hash[:16]}..."
    user_hash_short.short_description = "User"


# Customize admin site
admin.site.site_header = "Project Prism Admin"
admin.site.site_title = "Prism"
admin.site.index_title = "Administration"

