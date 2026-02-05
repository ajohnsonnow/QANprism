"""
Project Prism - Main URL Configuration
"""

from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse

def api_root(request):
    return JsonResponse({
        'app': 'Project Prism - LGBTQIA+ Safety Platform',
        'version': '1.0.0',
        'status': 'active',
        'endpoints': {
            'admin': '/admin/',
            'api': '/api/',
            'organizations': '/api/orgs/',
            'mutual_aid': '/api/mutual-aid/',
            'beacons': '/api/beacons/',
            'caches': '/api/caches/',
            'users': '/api/users/',
            'messages': '/api/messages/',
            'feedback': '/api/feedback/'
        }
    })

def favicon_view(request):
    return HttpResponse(status=204)  # No Content - prevents 404

urlpatterns = [
    path('', api_root, name='api-root'),
    path('favicon.ico', favicon_view, name='favicon'),
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
]
