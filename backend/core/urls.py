"""
Project Prism - Django URL Configuration

MERGED & IMPROVED: Complete API routing
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    UserRegistrationView, PreKeyBundleView, UploadPreKeysView,
    OrganizationViewSet, MessageViewSet,
    BeaconViewSet, QueerCacheViewSet, MutualAidViewSet,
    FeedbackView, CommunityBridgeView,
    AdminApplicationView, TribePostListCreateView, TribePostDeleteView, TribeReactionView
)

# Router for ViewSets
router = DefaultRouter()
router.register(r'orgs', OrganizationViewSet, basename='org')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'beacons', BeaconViewSet, basename='beacon')
router.register(r'caches', QueerCacheViewSet, basename='cache')
router.register(r'mutual-aid', MutualAidViewSet, basename='mutual-aid')

# URL patterns
urlpatterns = [
    # User & Auth
    path('users/', UserRegistrationView.as_view(), name='user-register'),
    path('users/<str:user_hash>/prekey/', PreKeyBundleView.as_view(), name='user-prekey'),
    path('users/prekeys/', UploadPreKeysView.as_view(), name='user-upload-prekeys'),
    
    # Feedback
    path('feedback/', FeedbackView.as_view(), name='feedback'),
    path('community-bridge/', CommunityBridgeView.as_view(), name='community-bridge'),
    
    # Admin Applications
    path('admin-applications/', AdminApplicationView.as_view(), name='admin-application'),
    
    # Tribe Posts & Moderation
    path('tribes/<str:tribe_id>/posts/', TribePostListCreateView.as_view(), name='tribe-posts'),
    path('posts/<int:post_id>/delete/', TribePostDeleteView.as_view(), name='post-delete'),
    path('posts/<int:post_id>/react/', TribeReactionView.as_view(), name='post-react'),
    
    # Router URLs
    path('', include(router.urls)),
]
