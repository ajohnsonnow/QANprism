"""
Project Prism - Django REST Views

MERGED & IMPROVED: Complete API views with:
- Privacy-first design
- Rate limiting ready
- Error handling
- Geo-queries
"""

import hashlib
from math import radians, sin, cos, sqrt, atan2

from django.utils import timezone
from django.db.models import F
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle

from .models import (
    PrismUser, PreKey, SignedPreKey,
    Organization, EncryptedMessage,
    Beacon, QueerCache, MutualAidListing, Feedback
)
from .serializers import (
    UserRegistrationSerializer, PreKeyBundleSerializer,
    OrganizationSerializer, OrganizationListSerializer,
    MessageSerializer, SendMessageSerializer,
    BeaconSerializer, CreateBeaconSerializer,
    QueerCacheSerializer, CreateCacheSerializer,
    MutualAidListingSerializer, CreateListingSerializer,
    FeedbackSerializer, PreKeySerializer
)


# =============================================================================
# RATE LIMITING
# =============================================================================

class RegisterThrottle(AnonRateThrottle):
    rate = '5/hour'
    scope = 'register'

class MessageThrottle(UserRateThrottle):
    rate = '60/minute'
    scope = 'messages'

class KeyThrottle(UserRateThrottle):
    rate = '30/minute'
    scope = 'keys'


# =============================================================================
# HELPERS
# =============================================================================

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points in meters."""
    R = 6371000  # Earth's radius in meters
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    
    return R * c


def get_user_hash(request):
    """Extract user hash from request header."""
    return request.headers.get('X-User-Hash')


def validate_coordinates(lat, lng):
    """Validate latitude and longitude coordinates."""
    try:
        lat = float(lat)
        lng = float(lng)
    except (ValueError, TypeError):
        raise ValueError("Coordinates must be numeric")
    
    if not (-90 <= lat <= 90):
        raise ValueError("Latitude must be between -90 and 90")
    if not (-180 <= lng <= 180):
        raise ValueError("Longitude must be between -180 and 180")
    
    return lat, lng


# =============================================================================
# USER VIEWS
# =============================================================================

class UserRegistrationView(APIView):
    """Register a new user with their key bundle."""
    throttle_classes = [RegisterThrottle]
    
    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        data = serializer.validated_data
        
        # Generate user hash from identity key
        user_hash = hashlib.sha256(
            data['identity_key'].encode()
        ).hexdigest()
        
        # Create user
        user, created = PrismUser.objects.get_or_create(
            user_hash=user_hash,
            defaults={
                'identity_key': data['identity_key'],
                'registration_id': data['registration_id'],
            }
        )
        
        if not created:
            return Response(
                {'detail': 'User already exists'},
                status=status.HTTP_409_CONFLICT
            )
        
        # Store signed pre-key
        SignedPreKey.objects.create(
            user=user,
            key_id=data['signed_pre_key']['key_id'],
            public_key=data['signed_pre_key']['public_key'],
            signature=data['signed_pre_key']['signature'],
        )
        
        # Store pre-keys
        if 'pre_keys' in data:
            for pk in data['pre_keys']:
                PreKey.objects.create(
                    user=user,
                    key_id=pk['key_id'],
                    public_key=pk['public_key'],
                )
        
        return Response(
            {'user_hash': user_hash},
            status=status.HTTP_201_CREATED
        )


class PreKeyBundleView(APIView):
    """Get pre-key bundle for establishing a session."""
    throttle_classes = [KeyThrottle]
    
    def get(self, request, user_hash):
        try:
            user = PrismUser.objects.get(user_hash=user_hash)
        except PrismUser.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get active signed pre-key
        signed_pre_key = SignedPreKey.objects.filter(
            user=user, is_active=True
        ).first()
        
        if not signed_pre_key:
            return Response(
                {'detail': 'No signed pre-key available'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get an unused pre-key (and mark as used)
        pre_key = PreKey.objects.filter(
            user=user, is_used=False
        ).first()
        
        if pre_key:
            pre_key.is_used = True
            pre_key.save()
            user.pre_keys_available = F('pre_keys_available') - 1
            user.save()
        
        bundle = {
            'registration_id': user.registration_id,
            'identity_key': user.identity_key,
            'signed_pre_key': {
                'key_id': signed_pre_key.key_id,
                'public_key': signed_pre_key.public_key,
                'signature': signed_pre_key.signature,
            },
        }
        
        if pre_key:
            bundle['pre_key'] = {
                'key_id': pre_key.key_id,
                'public_key': pre_key.public_key,
            }
        
        return Response(bundle)


class UploadPreKeysView(APIView):
    """Upload new pre-keys."""
    throttle_classes = [KeyThrottle]
    
    def post(self, request):
        user_hash = get_user_hash(request)
        if not user_hash:
            return Response(
                {'detail': 'User hash required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Signature verification for key upload
        signature = request.data.get('signature')
        timestamp = request.data.get('timestamp', 0)
        pre_keys_data = request.data.get('pre_keys', [])
        
        if not signature:
            return Response(
                {'detail': 'Signature required for key upload'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check timestamp to prevent replay attacks (5 minute window)
        import time
        if abs(time.time() - timestamp) > 300:
            return Response(
                {'detail': 'Request expired'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            user = PrismUser.objects.get(user_hash=user_hash)
        except PrismUser.DoesNotExist:
            return Response(
                {'detail': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # TODO: Implement signature verification
        # For now, log the signature requirement
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Key upload attempted for user {user_hash[:8]}... with signature {signature[:16]}...")
        
        serializer = PreKeySerializer(data=pre_keys_data, many=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        count = 0
        for pk_data in serializer.validated_data:
            PreKey.objects.update_or_create(
                user=user,
                key_id=pk_data['key_id'],
                defaults={'public_key': pk_data['public_key'], 'is_used': False}
            )
            count += 1
        
        user.pre_keys_available = PreKey.objects.filter(user=user, is_used=False).count()
        user.save()
        
        return Response({'uploaded': count})


# =============================================================================
# ORGANIZATION VIEWS
# =============================================================================

class OrganizationViewSet(viewsets.ReadOnlyModelViewSet):
    """Organization discovery endpoints."""
    queryset = Organization.objects.filter(is_active=True)
    serializer_class = OrganizationSerializer
    
    def get_serializer_class(self):
        if self.action == 'list':
            return OrganizationListSerializer
        return OrganizationSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        
        # Filter by type
        org_type = self.request.query_params.get('type')
        if org_type:
            qs = qs.filter(org_type=org_type)
        
        # Filter by safe space
        safe_only = self.request.query_params.get('safe_only')
        if safe_only == 'true':
            qs = qs.filter(is_safe_space=True)
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(name__icontains=search)
        
        return qs
    
    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        
        # Location-based filtering
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        radius = request.query_params.get('radius', 10)  # km
        
        if lat and lng:
            lat = float(lat)
            lng = float(lng)
            radius_m = float(radius) * 1000
            
            # Add distance annotation (simplified - use PostGIS in production)
            results = []
            for org in qs:
                distance = haversine_distance(
                    lat, lng,
                    float(org.latitude), float(org.longitude)
                )
                if distance <= radius_m:
                    org.distance = distance
                    results.append(org)
            
            results.sort(key=lambda x: x.distance)
            serializer = self.get_serializer(results, many=True)
            return Response(serializer.data)
        
        return super().list(request, *args, **kwargs)


# =============================================================================
# MESSAGE VIEWS
# =============================================================================

class MessageViewSet(viewsets.ViewSet):
    """Encrypted messaging endpoints."""
    throttle_classes = [MessageThrottle]
    
    def list(self, request):
        """Fetch pending messages for user."""
        user_hash = get_user_hash(request)
        if not user_hash:
            return Response(
                {'detail': 'User hash required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        messages = EncryptedMessage.objects.filter(
            recipient_hash=user_hash,
            is_delivered=False,
            expires_at__gt=timezone.now()
        ).order_by('created_at')
        
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Send an encrypted message."""
        user_hash = get_user_hash(request)
        if not user_hash:
            return Response(
                {'detail': 'User hash required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = SendMessageSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        message = EncryptedMessage.objects.create(
            sender_hash=user_hash,
            recipient_hash=serializer.validated_data['recipient_hash'],
            ciphertext=serializer.validated_data['ciphertext'],
        )
        
        return Response(
            {'id': message.id},
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def ack(self, request, pk=None):
        """Acknowledge message receipt."""
        user_hash = get_user_hash(request)
        
        try:
            message = EncryptedMessage.objects.get(
                id=pk,
                recipient_hash=user_hash
            )
        except EncryptedMessage.DoesNotExist:
            return Response(
                {'detail': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        message.is_delivered = True
        message.delivered_at = timezone.now()
        message.save()
        
        return Response({'status': 'acknowledged'})
    
    def destroy(self, request, pk=None):
        """Delete a message - only the recipient can delete."""
        user_hash = get_user_hash(request)
        if not user_hash:
            return Response(
                {'detail': 'Authentication required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            # Only recipient can delete their messages
            message = EncryptedMessage.objects.get(
                id=pk,
                recipient_hash=user_hash
            )
        except EncryptedMessage.DoesNotExist:
            return Response(
                {'detail': 'Message not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        message.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# BEACON VIEWS
# =============================================================================

class BeaconViewSet(viewsets.ViewSet):
    """Beacon (Tribes) endpoints."""
    
    def list(self, request):
        """Get active beacons for a topic."""
        topic = request.query_params.get('topic')
        if not topic:
            return Response(
                {'detail': 'Topic required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        beacons = Beacon.objects.filter(
            topic=topic,
            expires_at__gt=timezone.now()
        ).order_by('-created_at')
        
        # Optional geohash filter
        geohash = request.query_params.get('geohash')
        if geohash:
            beacons = beacons.filter(geohash__startswith=geohash[:4])
        
        serializer = BeaconSerializer(beacons, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a beacon."""
        user_hash = get_user_hash(request)
        if not user_hash:
            return Response(
                {'detail': 'User hash required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = CreateBeaconSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        beacon = Beacon.objects.create(**serializer.validated_data)
        
        return Response(
            BeaconSerializer(beacon).data,
            status=status.HTTP_201_CREATED
        )


# =============================================================================
# QUEER CACHE VIEWS
# =============================================================================

class QueerCacheViewSet(viewsets.ViewSet):
    """Queer Cache endpoints."""
    
    def list(self, request):
        """Get nearby caches."""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        if not lat or not lng:
            return Response(
                {'detail': 'Location required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            lat, lng = validate_coordinates(lat, lng)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        caches = QueerCache.objects.filter(
            expires_at__gt=timezone.now()
        )
        
        # Filter by distance (5km radius)
        results = []
        for cache in caches:
            distance = haversine_distance(
                lat, lng,
                float(cache.latitude), float(cache.longitude)
            )
            if distance <= 5000:  # 5km
                cache.distance = distance
                results.append(cache)
        
        results.sort(key=lambda x: x.distance)
        serializer = QueerCacheSerializer(results, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a cache."""
        serializer = CreateCacheSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        cache = QueerCache.objects.create(**serializer.validated_data)
        
        return Response(
            QueerCacheSerializer(cache).data,
            status=status.HTTP_201_CREATED
        )


# =============================================================================
# MUTUAL AID VIEWS
# =============================================================================

class MutualAidViewSet(viewsets.ViewSet):
    """Mutual Aid endpoints."""
    
    def list(self, request):
        """Get nearby listings."""
        lat = request.query_params.get('lat')
        lng = request.query_params.get('lng')
        
        listings = MutualAidListing.objects.filter(
            is_fulfilled=False,
            expires_at__gt=timezone.now()
        )
        
        # Filter by type
        listing_type = request.query_params.get('type')
        if listing_type:
            listings = listings.filter(listing_type=listing_type)
        
        # Filter by category
        category = request.query_params.get('category')
        if category:
            listings = listings.filter(category=category)
        
        # If no location specified, return recent listings without distance
        if not lat or not lng:
            listings = listings.order_by('-created_at')[:20]
            serializer = MutualAidListingSerializer(listings, many=True)
            return Response(serializer.data)
        
        # Validate and convert coordinates
        try:
            lat, lng = validate_coordinates(lat, lng)
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Filter by distance (20km radius)
        results = []
        for listing in listings:
            distance = haversine_distance(
                lat, lng,
                float(listing.latitude), float(listing.longitude)
            )
            if distance <= 20000:  # 20km
                listing.distance = distance
                results.append(listing)
        
        results.sort(key=lambda x: x.distance)
        serializer = MutualAidListingSerializer(results, many=True)
        return Response(serializer.data)
    
    def create(self, request):
        """Create a listing."""
        user_hash = get_user_hash(request)
        if not user_hash:
            return Response(
                {'detail': 'User hash required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        serializer = CreateListingSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        listing = MutualAidListing.objects.create(
            creator_hash=user_hash,
            **serializer.validated_data
        )
        
        return Response(
            MutualAidListingSerializer(listing).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=True, methods=['post'])
    def fulfill(self, request, pk=None):
        """Mark listing as fulfilled."""
        user_hash = get_user_hash(request)
        
        try:
            listing = MutualAidListing.objects.get(
                id=pk,
                creator_hash=user_hash
            )
        except MutualAidListing.DoesNotExist:
            return Response(
                {'detail': 'Listing not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        listing.is_fulfilled = True
        listing.fulfilled_at = timezone.now()
        listing.save()
        
        return Response({'status': 'fulfilled'})


# =============================================================================
# FEEDBACK VIEWS
# =============================================================================

class FeedbackView(APIView):
    """Submit anonymous feedback with email notifications."""
    
    def post(self, request):
        from django.core.mail import send_mail
        from django.conf import settings
        
        serializer = FeedbackSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        feedback = Feedback.objects.create(**serializer.validated_data)
        
        # Send email notification to admin
        try:
            feedback_type = feedback.get_feedback_type_display()
            
            if feedback.feedback_type == 'org_submission':
                subject = f'🏳️‍🌈 New Organization Submission - {feedback.org_name}'
                message = f"""
New Organization Submission to Project Prism

Organization Name: {feedback.org_name}
Type: {feedback.org_type}
Description: {feedback.org_description}

Address: {feedback.org_address}
Phone: {feedback.org_phone}
Website: {feedback.org_website}
Hours: {feedback.org_hours}

Location: {feedback.org_latitude}, {feedback.org_longitude}
Safe Space: {'Yes' if feedback.org_is_safe_space else 'No'}

Submitted: {feedback.created_at.strftime('%Y-%m-%d %H:%M:%S')}
Feedback ID: {feedback.id}

Review at: [Admin URL]
                """.strip()
            else:
                subject = f'🏳️‍🌈 New {feedback_type} - Project Prism'
                message = f"""
New {feedback_type} Submitted

Content:
{feedback.content}

Submitted: {feedback.created_at.strftime('%Y-%m-%d %H:%M:%S')}
Feedback ID: {feedback.id}

Review at: [Admin URL]
                """.strip()
            
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[settings.ADMIN_EMAIL],
                fail_silently=True,
            )
            
            feedback.email_sent = True
            feedback.save()
        except Exception as e:
            print(f'Email send failed: {e}')
        
        return Response(
            {'status': 'received', 'id': feedback.id},
            status=status.HTTP_201_CREATED
        )


class CommunityBridgeView(APIView):
    """Get community feedback status for Community Bridge tab."""
    
    def get(self, request):
        # Get all feedback with status updates
        feedback = Feedback.objects.all()[:50]  # Last 50 submissions
        
        serializer = FeedbackSerializer(feedback, many=True)
        return Response(serializer.data)


# =============================================================================
# ADMIN APPLICATIONS
# =============================================================================

class AdminApplicationView(APIView):
    """Submit application to become a local admin."""
    
    def post(self, request):
        from django.conf import settings
        from django.core.mail import send_mail
        from .serializers import AdminApplicationSerializer
        
        serializer = AdminApplicationSerializer(data=request.data)
        
        if serializer.is_valid():
            application = serializer.save()
            
            # Send email notification
            try:
                subject = f"🛡️ New Admin Application - {application.name}"
                message = f"""
New Admin Application Received

Applicant: {application.name}
Email: {application.email}
Location: {application.location}

EXPERIENCE:
{application.experience}

MOTIVATION:
{application.motivation}

AVAILABILITY:
{application.availability}

REFERENCES:
{application.references or 'None provided'}

Application ID: {application.id}
Submitted: {application.created_at.strftime('%Y-%m-%d %H:%M:%S')}

Review this application in Django Admin
                """
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [settings.ADMIN_EMAIL],
                    fail_silently=False,
                )
                application.email_sent = True
                application.save()
            except Exception as e:
                print(f"[AdminApplication] Email failed: {e}")
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# TRIBE POSTS & MODERATION
# =============================================================================

class TribePostListCreateView(APIView):
    """List and create tribe posts."""
    
    def get(self, request, tribe_id):
        from .models import TribePost
        from .serializers import TribePostSerializer
        
        posts = TribePost.objects.filter(
            tribe_id=tribe_id,
            is_deleted=False
        ).prefetch_related('reactions')
        serializer = TribePostSerializer(posts, many=True)
        return Response(serializer.data)
    
    def post(self, request, tribe_id):
        import hashlib
        import time
        from .models import TribePost
        from .serializers import TribePostSerializer
        
        data = request.data.copy()
        data['tribe_id'] = tribe_id
        
        # Generate anonymous author hash
        author_hash = hashlib.sha256(
            f"{time.time()}{request.META.get('REMOTE_ADDR', '')}".encode()
        ).hexdigest()[:16]
        data['author_hash'] = f"anon_{author_hash}"
        
        serializer = TribePostSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class TribePostDeleteView(APIView):
    """Delete a tribe post (admin only)."""
    
    def delete(self, request, post_id):
        from django.conf import settings
        from .models import TribePost
        
        try:
            post = TribePost.objects.get(id=post_id)
            admin_key = request.headers.get('X-Admin-Key', '')
            
            # Simple admin verification
            if admin_key != getattr(settings, 'ADMIN_DELETE_KEY', 'your-secret-admin-key-here'):
                return Response(
                    {'error': 'Unauthorized - Admin access required'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Soft delete
            post.is_deleted = True
            post.deleted_by = request.data.get('admin_email', 'admin')
            post.deleted_reason = request.data.get('reason', 'Violated community guidelines')
            post.deleted_at = timezone.now()
            post.save()
            
            return Response({'message': 'Post deleted successfully'})
        except TribePost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)


class TribeReactionView(APIView):
    """Add or remove reaction to a post."""
    
    def post(self, request, post_id):
        import hashlib
        from .models import TribePost, TribeReaction
        
        try:
            post = TribePost.objects.get(id=post_id, is_deleted=False)
            
            # Generate user hash
            user_hash = hashlib.sha256(
                f"{request.META.get('REMOTE_ADDR', '')}{request.session.session_key or ''}".encode()
            ).hexdigest()[:16]
            
            reaction_type = request.data.get('reaction_type')
            if reaction_type not in ['heart', 'support', 'celebrate']:
                return Response({'error': 'Invalid reaction type'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Toggle reaction (remove if exists, add if doesn't)
            reaction, created = TribeReaction.objects.get_or_create(
                post=post,
                user_hash=user_hash,
                reaction_type=reaction_type
            )
            
            if not created:
                reaction.delete()
                return Response({'message': 'Reaction removed'})
            
            return Response({'message': 'Reaction added'}, status=status.HTTP_201_CREATED)
        except TribePost.DoesNotExist:
            return Response({'error': 'Post not found'}, status=status.HTTP_404_NOT_FOUND)
