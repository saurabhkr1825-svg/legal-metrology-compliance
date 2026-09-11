# Smart Legal Metrology — API Documentation

Base URL: `/api/v1`

## Authentication

All protected endpoints require a Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## Endpoints

### 1. Health & Readiness

#### `GET /health`
Basic service liveness probe.

**Authentication:** None  
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "slm-api",
    "version": "0.1.0",
    "uptime": 12.34
  },
  "metadata": {
    "timestamp": "2026-09-11T22:30:00.000Z",
    "requestId": "uuid"
  }
}
```

#### `GET /health/ready`
Readiness probe verifying PostgreSQL connection.

**Authentication:** None  
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ready",
    "checks": {
      "database": "healthy"
    }
  }
}
```
**Response (503 Service Unavailable):**
```json
{
  "success": false,
  "error": {
    "code": "SERVICE_UNAVAILABLE",
    "message": "Database connection failed"
  }
}
```

---

### 2. Authentication

#### `POST /auth/login`
Authenticate user with email and password.

**Authentication:** None  
**Request Body:**
```json
{
  "email": "officer@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "officer@example.com",
      "name": "Officer Name",
      "role": "FIELD_OFFICER",
      "phone": "+91-9876543210",
      "region": "Delhi NCR",
      "department": "Legal Metrology",
      "isActive": true,
      "createdAt": "2026-09-11T22:00:00.000Z",
      "updatedAt": "2026-09-11T22:00:00.000Z"
    },
    "token": {
      "accessToken": "jwt_token_here",
      "refreshToken": "refresh_token_here",
      "expiresIn": 3600
    }
  }
}
```

**Error Responses:**
- `400 Bad Request` — `VALIDATION_ERROR` (missing/invalid fields)
- `401 Unauthorized` — `INVALID_CREDENTIALS` (wrong email/password or disabled account)

#### `GET /auth/me`
Retrieve the currently authenticated user profile.

**Authentication:** Required  
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "officer@example.com",
      "name": "Officer Name",
      "role": "FIELD_OFFICER",
      "isActive": true
    }
  }
}
```

---

### 3. Inspections

#### `POST /inspections`
Create a new inspection record. Supports idempotency via `clientUuid`.

**Authentication:** Required (`FIELD_OFFICER`, `SUPERVISOR`, `ADMIN`)  
**Request Body:**
```json
{
  "clientUuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "imageUrl": "https://storage.example.com/evidence/uuid.jpg",
  "imageMetadata": {
    "width": 1920,
    "height": 1080,
    "format": "image/jpeg",
    "sizeBytes": 2048576,
    "captureMode": "camera"
  },
  "capturedAt": "2026-09-11T22:30:00.000Z",
  "location": {
    "latitude": 28.6139,
    "longitude": 77.2090,
    "accuracy": 5.0
  },
  "notes": "Sample inspection note"
}
```

**Response (201 Created / 200 OK if existing clientUuid):**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "uuid",
      "clientUuid": "550e8400-e29b-41d4-a716-446655440000",
      "officerId": "user_uuid",
      "status": "QUEUED",
      "imageUrl": "https://storage.example.com/evidence/uuid.jpg",
      "imageMetadata": { ... },
      "violations": [],
      "capturedAt": "2026-09-11T22:30:00.000Z",
      "createdAt": "2026-09-11T22:30:01.000Z",
      "updatedAt": "2026-09-11T22:30:01.000Z"
    }
  }
}
```

#### `GET /inspections/:id`
Retrieve inspection details by server ID.

**Authentication:** Required (Owner, `SUPERVISOR`, `ADMIN`)  
**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "uuid",
      "clientUuid": "uuid",
      "officerId": "uuid",
      "status": "QUEUED",
      "violations": []
    }
  }
}
```

**Error Responses:**
- `401 Unauthorized` — Token missing/invalid
- `403 Forbidden` — Officer attempting to access another officer's inspection
- `404 Not Found` — Inspection does not exist

#### `GET /inspections`
List inspections for the authenticated user (paginated).

**Authentication:** Required  
**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "pageSize": 20,
    "hasMore": true
  }
}
```
