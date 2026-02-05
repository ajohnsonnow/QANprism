# Admin Application & Post Moderation System

## Overview
Added comprehensive admin application and content moderation system to Project Prism, allowing community members to apply to be local moderators and giving admins the ability to delete inappropriate content.

## Features Implemented

### 1. Admin Application System

**Frontend:**
- New "🛡️ Apply to be a Local Admin" button in Settings screen
- Beautiful modal form with comprehensive fields:
  - Name & Email
  - Location
  - LGBTQ+ Community Experience
  - Motivation
  - Time Availability
  - Optional References
- Success confirmation screen after submission
- Located at: `frontend/src/screens/Settings/AdminApplicationModal.tsx`

**Backend:**
- `AdminApplication` model with status tracking (pending/approved/rejected)
- Email notification sent to `Anth@StructuredForGrowth.com` when someone applies
- Admin can review, approve, or reject applications in Django Admin
- Bulk actions for approving/rejecting multiple applications

### 2. Tribe Post Management

**Frontend:**
- Tribe posts now stored in database (not mock data)
- Real-time post creation and display
- Anonymous author hashing for privacy
- Reaction system (heart, support, celebrate) with real counts

**Backend:**
- `TribePost` model with soft-delete support
- `TribeReaction` model with unique user+reaction constraints
- Posts are never hard-deleted - they're marked `is_deleted=True`
- Tracks who deleted, why, and when

### 3. Admin Moderation

**Delete Post Functionality:**
- Admins can delete posts via API with admin key
- Requires `X-Admin-Key` header for authentication
- Soft delete preserves post for audit trail
- Records: admin email, reason, timestamp

**API Endpoint:**
```
DELETE /api/posts/{post_id}/delete/
Headers:
  X-Admin-Key: your-secret-admin-key-here
Body:
  {
    "reason": "Violated community guidelines",
    "admin_email": "admin@example.com"
  }
```

## Database Models

### AdminApplication
- `name`, `email`, `location` - Applicant info
- `experience` - LGBTQ+ community work
- `motivation` - Why they want to be admin
- `availability` - Time commitment
- `references` - Optional community connections
- `status` - pending/approved/rejected
- `admin_notes` - Internal notes
- `reviewed_at` - Review timestamp

### TribePost
- `tribe_id` - Which tribe (trans_fem, bipoc_queer, etc.)
- `author_hash` - Anonymous identifier
- `content` - Post text
- `is_deleted` - Soft delete flag
- `deleted_by`, `deleted_reason`, `deleted_at` - Moderation tracking

### TribeReaction
- `post` - ForeignKey to TribePost
- `reaction_type` - heart/support/celebrate
- `user_hash` - Anonymous user identifier
- Unique constraint: one reaction type per user per post

## API Endpoints

### Admin Applications
```
POST /api/admin-applications/
Body: { name, email, location, experience, motivation, availability, references }
```

### Tribe Posts
```
GET  /api/tribes/{tribe_id}/posts/          # List posts
POST /api/tribes/{tribe_id}/posts/          # Create post
      Body: { content }

DELETE /api/posts/{post_id}/delete/         # Delete post (admin only)
       Headers: { X-Admin-Key }
       Body: { reason, admin_email }

POST /api/posts/{post_id}/react/            # Toggle reaction
     Body: { reaction_type: 'heart'|'support'|'celebrate' }
```

## Configuration

### Backend Settings
Add to `.env` or settings:
```python
ADMIN_DELETE_KEY = 'your-secret-admin-key-here'  # For post deletion
EMAIL_HOST_USER = 'your-email@gmail.com'
EMAIL_HOST_PASSWORD = 'your-app-password'
ADMIN_EMAIL = 'Anth@StructuredForGrowth.com'
```

### Security Notes
1. **Admin Key:** Change `ADMIN_DELETE_KEY` in production
2. **Rate Limiting:** Add rate limiting to admin endpoints
3. **Audit Log:** All deletions are logged with who/why/when
4. **Email Verification:** Consider email verification for admin applicants

## Django Admin Access

**View Applications:**
1. Go to http://127.0.0.1:8000/admin/
2. Navigate to "Admin Applications"
3. Filter by status, review applications
4. Use bulk actions to approve/reject

**Moderate Posts:**
1. Go to http://127.0.0.1:8000/admin/
2. Navigate to "Tribe Posts"
3. Filter by tribe or deleted status
4. View moderation history

## User Flow

### Applying to be Admin:
1. User goes to Settings
2. Clicks "🛡️ Apply to be a Local Admin"
3. Fills out comprehensive application form
4. Submits application
5. Receives confirmation message
6. Email sent to project owner for review

### Creating Tribe Post:
1. User joins a tribe
2. Clicks tribe to open community board
3. Clicks "+ Post" button
4. Writes anonymous message
5. Post appears with anonymous hash (anon_abc123...)
6. Others can react with heart/support/celebrate emojis

### Admin Deleting Post:
1. Admin reviews post in Django Admin or via API
2. Sends DELETE request with admin key
3. Post is soft-deleted (not visible to users)
4. Audit trail preserved: who deleted, reason, when

## Migrations

New migrations created:
```
core/migrations/0003_adminapplication_tribepost_tribereaction.py
```

Applied with:
```bash
python manage.py migrate
```

## Future Enhancements

1. **Admin Dashboard:** Custom frontend for admins to moderate
2. **User Reports:** Allow users to flag inappropriate posts
3. **Auto-Moderation:** ML-based content filtering
4. **Appeal System:** Users can appeal deletions
5. **Admin Levels:** Different admin roles (local, regional, global)
6. **Reply Threading:** Add comment/reply system to posts
7. **Email Notifications:** Notify users when their posts are deleted

## Testing

### Test Admin Application:
1. Open Settings → Apply to be Local Admin
2. Fill out form and submit
3. Check Django Admin for new application
4. Check email at Anth@StructuredForGrowth.com

### Test Tribe Posts:
1. Go to Tribes
2. Join any tribe
3. Click tribe card to open community
4. Create a post
5. Refresh page - post should persist
6. React to posts

### Test Post Deletion (Admin):
```bash
curl -X DELETE http://127.0.0.1:8000/api/posts/1/delete/ \
  -H "X-Admin-Key: your-secret-admin-key-here" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Test deletion", "admin_email": "admin@test.com"}'
```

## Files Modified/Created

**Backend:**
- `core/models.py` - Added AdminApplication, TribePost, TribeReaction
- `core/serializers.py` - Added serializers for new models
- `core/views.py` - Added AdminApplicationView, TribePostListCreateView, TribePostDeleteView, TribeReactionView
- `core/urls.py` - Added new endpoints
- `core/admin.py` - Added admin interfaces for new models
- `prism/settings.py` - Added ADMIN_DELETE_KEY

**Frontend:**
- `src/screens/Settings/AdminApplicationModal.tsx` - NEW
- `src/screens/Settings/AdminApplicationModal.css` - NEW
- `src/screens/Settings/SettingsScreen.tsx` - Added admin button
- `src/screens/Settings/SettingsScreen.css` - Added admin button styles
- `src/screens/Tribes/TribeCommunityScreen.tsx` - Connected to real API
- `src/api/client.ts` - Added admin and tribe post methods

**Database:**
- Migration: `0003_adminapplication_tribepost_tribereaction.py`

## Summary

This update transforms Project Prism into a fully moderated community platform:
- ✅ Community members can apply to help moderate
- ✅ Transparent application process with email notifications
- ✅ Full post management system with soft deletes
- ✅ Anonymous posting preserved while enabling moderation
- ✅ Audit trail for all moderation actions
- ✅ Reaction system with persistent counts
- ✅ Django Admin integration for easy management

The system maintains privacy-first principles while enabling community safety through transparent, accountable moderation.
