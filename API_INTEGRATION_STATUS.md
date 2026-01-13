# API Integration Progress

## ✅ Completed

### 1. API Client Setup (`lib/api.ts`)
- ✅ Base API configuration (http://212.220.105.29:8079/api)
- ✅ Error handling with ApiError class
- ✅ User API endpoints (getCurrentUser, getUserById, createUser, updateUser, deleteUser)
- ✅ Group API endpoints (getAvailableGroups, getGroupById, createGroup, updateGroup, deleteGroup, addStudentToGroup, removeStudentFromGroup)
- ✅ Present API endpoints (getPresents, getPresent, searchPresents, createPresent, updatePresent, deletePresent, addPhotos, deletePhoto, getPhotoUrl)

### 2. TypeScript Types (`lib/types.ts`)
- ✅ ErrorResponse
- ✅ UserDTO with UserRole enum
- ✅ GroupDTO and CreateGroupRequest
- ✅ AdminPresentResponse and MobilePresentResponse
- ✅ PresentUpdateRequest
- ✅ PhotoResponse

### 3. Profile Page (`app/profile/page.tsx`)
- ✅ Integrated GET /api/users/me
- ✅ Integrated PUT /api/users/{id} for email updates
- ✅ Integrated PUT /api/users/{id} for password changes
- ✅ Loading states
- ✅ Error handling with Russian messages

### 4. Users Page (`app/users/page.tsx`)
- ✅ Integrated user CRUD operations
- ✅ CREATE: POST /api/users
- ✅ READ: GET /api/users/me (note: need GET all users endpoint)
- ✅ UPDATE: PUT /api/users/{id}
- ✅ DELETE: DELETE /api/users/{id}
- ✅ Form validation
- ✅ Loading states
- ✅ Error handling

## ⏳ Remaining Work

### 5. Groups Page (`app/groups/page.tsx`)
**Endpoints to integrate:**
- GET /api/groups - Get available groups
- GET /api/groups/{id} - Get specific group
- POST /api/groups - Create group with CreateGroupRequest
- PUT /api/groups/{id} - Update group
- DELETE /api/groups/{id} - Delete group
- POST /api/groups/{groupId}/students/{studentId} - Add student
- DELETE /api/groups/{groupId}/students/{studentId} - Remove student

**Changes needed:**
- Replace mock data with API calls
- Use groupApi from lib/api.ts
- Update interfaces to match GroupDTO
- teacher_id instead of teacher object in create/update
- Handle teacher and students relationships

### 6. Gifts Page (`app/gifts/page.tsx`)
**Endpoints to integrate:**
- GET /api/presents?page=0&size=20 - Get presents with pagination
- GET /api/presents/{id} - Get specific present
- GET /api/presents/search?query=xxx - Search presents
- POST /api/presents - Create with name, priceCoins, stock, photos (multipart)
- PUT /api/presents/{id} - Update present
- DELETE /api/presents/{id} - Delete present
- POST /api/presents/{id}/photos - Add photos
- DELETE /api/presents/{presentId}/photos/{photoId} - Delete photo
- GET /api/presents/{presentId}/photos/{photoId} - Get photo URL

**Changes needed:**
- Replace mockGifts with API data
- Use presentApi from lib/api.ts
- Update Gift interface to match MobilePresentResponse/AdminPresentResponse
- Implement photo upload with FormData
- Use presentApi.getPhotoUrl() for image URLs
- Handle pagination
- Implement search functionality

### 7. Orders Page (`app/orders/page.tsx`)
**Status:** No API endpoints available yet
**Recommendation:**
- Keep mock data for now
- Add TODO comments indicating endpoints needed:
  - GET /api/orders
  - GET /api/orders/{id}
  - PUT /api/orders/{id}/status
  - etc.

### 8. History Page (`app/history/page.tsx`)
**Status:** No API endpoints available yet
**Recommendation:**
- Keep mock data for now
- Add TODO comments indicating endpoints needed:
  - GET /api/transactions or /api/history
  - POST /api/transactions (create bonus transaction)
  - Filter by group, teacher, date range
  - etc.

## Important Notes

### Missing Backend Endpoints
The following endpoints are not in the OpenAPI spec but may be needed:

1. **GET /api/users** - Get all users (currently only getCurrentUser exists)
   - Alternative: Backend team should add this for the admin panel

2. **Order Management Endpoints** - None exist yet
   - POST /api/orders
   - GET /api/orders
   - PUT /api/orders/{id}
   - etc.

3. **Transaction/History Endpoints** - None exist yet
   - GET /api/transactions
   - POST /api/transactions (award bonuses)
   - GET /api/transactions/history
   - etc.

### API URL Configuration
Base URL is currently hardcoded in `lib/api.ts`:
```typescript
const API_BASE_URL = 'http://212.220.105.29:8079/api';
```

Consider using environment variables:
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://212.220.105.29:8079/api';
```

### CORS & Authentication
- No authentication headers are currently implemented
- Backend may need CORS configuration for localhost:3000
- May need to add JWT or session tokens to API calls

### Date Format
API expects: `YYYY-MM-DD` (ISO 8601)
Frontend displays: `DD.MM.YYYY` (Russian format)
Need conversion utilities in relevant forms.

## Next Steps

1. ✅ Complete Groups page integration
2. ✅ Complete Gifts page integration  
3. ✅ Add placeholders for Orders/History pages
4. Test all API integrations with real backend
5. Add environment variable for API URL
6. Implement authentication/authorization
7. Handle photo uploads and display
8. Add proper error boundaries
9. Implement loading skeletons
10. Add success notifications

## Testing Checklist

- [ ] Profile: Load user data
- [ ] Profile: Update email
- [ ] Profile: Change password
- [ ] Users: Create new user
- [ ] Users: Edit existing user
- [ ] Users: Delete user
- [ ] Users: Filter by role (Student/Teacher)
- [ ] Groups: Load groups
- [ ] Groups: Create group
- [ ] Groups: Edit group
- [ ] Groups: Delete group
- [ ] Groups: Add student to group
- [ ] Groups: Remove student from group
- [ ] Gifts: Load presents
- [ ] Gifts: Search presents
- [ ] Gifts: Create present with photos
- [ ] Gifts: Edit present
- [ ] Gifts: Delete present
- [ ] Gifts: Add/delete photos
- [ ] All: Error handling
- [ ] All: Loading states
