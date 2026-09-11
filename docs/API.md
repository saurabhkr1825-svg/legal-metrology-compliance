# Smart Legal Metrology — API Documentation

Base URL: `/api/v1` (with `/health` and `/health/ready` also available at the root level).

## Authentication & Authorization

All protected endpoints require a Bearer token in the `Authorization` header:
```http
Authorization: Bearer <access_token>
```

### Role-Based Access Control (RBAC) Matrix

| Endpoint | Method | `FIELD_OFFICER` | `SUPERVISOR` | `ADMIN` |
|---|---|:---:|:---:|:---:|
| `/health`, `/health/ready` | `GET` | Public | Public | Public |
| `/auth/login`, `/auth/refresh` | `POST` | Public | Public | Public |
| `/auth/logout`, `/auth/me` | `POST`, `GET` | Yes | Yes | Yes |
| `/inspections` | `POST` | Yes | Yes | Yes |
| `/inspections` | `GET` | Own only | All / Filtered | All / Filtered |
| `/inspections/:id` | `GET` | Own only | Yes | Yes |
| `/inspections/:id/status` | `PATCH` | Own only | Yes | Yes |
| `/inspections/:id/review` | `PATCH` | No (403) | Yes | Yes |
| `/products` | `GET`, `GET :id` | Yes | Yes | Yes |
| `/products` | `POST` | No (403) | Yes | Yes |
| `/rules` | `GET`, `GET :ruleId/:v` | Yes | Yes | Yes |
| `/rules` | `POST` | No (403) | No (403) | Yes |
| `/audit-logs` | `GET` | No (403) | Yes | Yes |
| `/users` | `GET` | No (403) | Yes | Yes |
| `/users/:id` | `GET` | Own only | Yes | Yes |

---

## Standard Response Format

### Success Response (`2xx`)
```json
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-09-11T22:30:00.000Z",
    "requestId": "uuid"
  }
}
```

### Error Response (`4xx` / `5xx`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR | INVALID_CREDENTIALS | FORBIDDEN | NOT_FOUND | INVALID_TRANSITION",
    "message": "Human-readable description",
    "details": { ... }
  },
  "metadata": {
    "timestamp": "2026-09-11T22:30:00.000Z",
    "requestId": "uuid"
  }
}
```

---

## Endpoints

### 1. Health & Readiness

#### `GET /health` (or `/api/v1/health`)
Basic service liveness probe.
- **Authentication:** None
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "slm-api",
    "version": "0.1.0",
    "uptime": 12.34
  }
}
```

#### `GET /health/ready` (or `/api/v1/health/ready`)
Readiness probe verifying live PostgreSQL database connectivity.
- **Authentication:** None
- **Response (200 OK):**
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
- **Response (503 Service Unavailable):**
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
Authenticate with email and password. Generates JWT access token and refresh token.
- **Authentication:** None
- **Request Body:**
```json
{
  "email": "officer@example.com",
  "password": "Officer123!"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "officer@example.com",
      "name": "Dev Field Officer",
      "role": "FIELD_OFFICER",
      "phone": "+91-9000000001",
      "region": "Delhi NCR",
      "department": "Legal Metrology - District East",
      "isActive": true,
      "createdAt": "2026-09-11T22:00:00.000Z",
      "updatedAt": "2026-09-11T22:00:00.000Z"
    },
    "token": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": 3600
    }
  }
}
```

#### `POST /auth/refresh`
Exchange a valid refresh token for fresh access and refresh tokens.
- **Authentication:** None
- **Request Body:**
```json
{
  "refreshToken": "eyJhbGciOi..."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "token": {
      "accessToken": "eyJhbGciOi...",
      "refreshToken": "eyJhbGciOi...",
      "expiresIn": 3600
    }
  }
}
```

#### `POST /auth/logout`
Log out current session and record `USER_LOGOUT` audit log.
- **Authentication:** Required (Bearer token)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

#### `GET /auth/me`
Retrieve authenticated user profile.
- **Authentication:** Required (Bearer token)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "officer@example.com",
      "name": "Dev Field Officer",
      "role": "FIELD_OFFICER",
      "isActive": true
    }
  }
}
```

---

### 3. Inspections

#### `POST /inspections`
Create a new inspection record. Idempotent based on `clientUuid`.
- **Authentication:** Required (`FIELD_OFFICER`, `SUPERVISOR`, `ADMIN`)
- **Request Body:**
```json
{
  "clientUuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "QUEUED",
  "imageUrl": "https://storage.example.com/evidence/550e8400.jpg",
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
  "notes": "Retail store inspection at Connaught Place"
}
```
- **Response (201 Created / 200 OK if existing clientUuid):**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "uuid",
      "clientUuid": "550e8400-e29b-41d4-a716-446655440000",
      "officerId": "user-uuid",
      "status": "QUEUED",
      "imageUrl": "https://storage.example.com/evidence/550e8400.jpg",
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
Retrieve inspection details by server UUID.
- **Authentication:** Required (Owner, `SUPERVISOR`, `ADMIN`)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "uuid",
      "clientUuid": "uuid",
      "officerId": "user-uuid",
      "status": "QUEUED",
      "violations": []
    }
  }
}
```

#### `GET /inspections`
List inspections with pagination and multi-field filtering. Field officers are restricted to their own inspections.
- **Authentication:** Required
- **Query Parameters:**
  - `page` (default: 1)
  - `limit` (default: 20, max: 100)
  - `status` (`DRAFT`, `QUEUED`, `PROCESSING`, `REVIEW_REQUIRED`, `COMPLETED`, `SYNCED`)
  - `officerId` (only applied for `SUPERVISOR` and `ADMIN`)
  - `startDate` (ISO 8601 string)
  - `endDate` (ISO 8601 string)
- **Response (200 OK):**
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

#### `PATCH /inspections/:id/status`
Update inspection status enforcing state machine transitions.
- **Authentication:** Required (Owner, `SUPERVISOR`, `ADMIN`)
- **Request Body:**
```json
{
  "status": "PROCESSING"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "uuid",
      "status": "PROCESSING",
      "updatedAt": "2026-09-11T22:35:00.000Z"
    }
  }
}
```
- **Error (400 Bad Request):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Invalid state transition: DRAFT -> COMPLETED. Allowed: PENDING_UPLOAD"
  }
}
```

#### `PATCH /inspections/:id/review`
Submit human supervisor review and complete an inspection.
- **Authentication:** Required (`SUPERVISOR`, `ADMIN`)
- **Request Body:**
```json
{
  "reviewedDeclaration": {
    "mrp": { "value": "₹ 150.00", "confidence": 1.0, "source": "corrected" },
    "netQuantity": { "value": "500 g", "confidence": 1.0, "source": "manual" }
  },
  "result": "PASS",
  "notes": "Reviewed and verified against packaging standard."
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "inspection": {
      "id": "uuid",
      "status": "COMPLETED",
      "result": "PASS",
      "reviewedDeclaration": { ... },
      "reviewedAt": "2026-09-11T22:40:00.000Z",
      "completedAt": "2026-09-11T22:40:00.000Z"
    }
  }
}
```

---

### 4. Products (Reference Commodities)

#### `GET /products`
List registered reference commodities.
- **Authentication:** Required
- **Query Parameters:** `page`, `limit`, `commodityName`, `category`, `barcode`

#### `GET /products/:id`
Fetch reference product by ID.
- **Authentication:** Required

#### `POST /products`
Register a new reference commodity.
- **Authentication:** Required (`SUPERVISOR`, `ADMIN`)
- **Request Body:**
```json
{
  "commodityName": "Atta Whole Wheat Flour",
  "brandName": "Nature Fresh",
  "category": "Food Grain",
  "barcode": "8901234567890"
}
```

---

### 5. Rules (Legal Metrology Compliance Rules)

#### `GET /rules`
List active compliance rules.
- **Authentication:** Required
- **Query Parameters:** `category`, `all` (boolean)

#### `GET /rules/:ruleId/:version`
Fetch specific rule by rule ID and version.
- **Authentication:** Required

#### `POST /rules`
Register a new compliance rule definition.
- **Authentication:** Required (`ADMIN`)
- **Request Body:**
```json
{
  "ruleId": "LM-007",
  "version": "1.0",
  "category": "Country of Origin",
  "name": "Country of Origin Declaration",
  "description": "Imported goods must declare Country of Origin clearly.",
  "severity": "HIGH",
  "conditions": [
    {
      "field": "countryOfOrigin",
      "operator": "exists",
      "message": "Country of Origin is missing on imported package."
    }
  ]
}
```

---

### 6. Audit Logs

#### `GET /audit-logs`
Query immutable system audit log records.
- **Authentication:** Required (`SUPERVISOR`, `ADMIN`)
- **Query Parameters:**
  - `page`, `limit`
  - `userId`
  - `action` (`USER_LOGIN`, `USER_LOGOUT`, `INSPECTION_CREATED`, `INSPECTION_REVIEWED`, etc.)
  - `resourceType`, `resourceId`
  - `startDate`, `endDate`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "userId": "user-uuid",
        "action": "INSPECTION_CREATED",
        "resourceType": "inspection",
        "resourceId": "inspection-uuid",
        "metadata": { "clientUuid": "uuid", "status": "QUEUED" },
        "ipAddress": "127.0.0.1",
        "timestamp": "2026-09-11T22:30:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 50,
    "hasMore": false
  }
}
```

---

### 7. Users

#### `GET /users`
List users in the system.
- **Authentication:** Required (`SUPERVISOR`, `ADMIN`)
- **Query Parameters:** `page`, `limit`, `role`

#### `GET /users/:id`
Fetch user profile by UUID.
- **Authentication:** Required (Self, `SUPERVISOR`, `ADMIN`)
