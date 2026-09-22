# UniSphere — API Documentation

**Base URL:** `/api/v1`  
**Format:** JSON  
**Versioning:** URL path (`/api/v1`)  
**Security:** Bearer JWT + RBAC Permissions + Tenant Guard

---

## 1. Standard Response Envelopes

### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Forbidden: You do not possess the required permission [users:read] to perform this action.",
    "details": [ ... ]
  }
}
```

---

## 2. Authentication Endpoints (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Register new user in tenant |
| `POST` | `/api/v1/auth/login` | No | Authenticate with email & password |
| `POST` | `/api/v1/auth/refresh-token` | No | Rotate refresh token & issue new access token |
| `POST` | `/api/v1/auth/logout` | No/Optional | Revoke active refresh token |
| `GET` | `/api/v1/auth/me` | Yes (Bearer) | Get current user profile, roles, and permissions |
| `POST` | `/api/v1/auth/change-password` | Yes (Bearer) | Update password and revoke other sessions |

### `POST /api/v1/auth/register`
**Body:**
```json
{
  "firstName": "Arjun",
  "lastName": "Sharma",
  "email": "arjun@university.edu",
  "password": "SecurePassword123!",
  "tenantId": "650000000000000000000001",
  "roleCode": "STUDENT"
}
```

### `POST /api/v1/auth/login`
**Body:**
```json
{
  "email": "arjun@university.edu",
  "password": "SecurePassword123!",
  "tenantId": "650000000000000000000001"
}
```
**Security Note:** 5 consecutive failed attempts trigger a 15-minute account lockout (`HTTP 423 ACCOUNT_LOCKED`).

### `POST /api/v1/auth/refresh-token`
**Body:**
```json
{
  "refreshToken": "40-byte-crypto-hex-string"
}
```
**Security Note:** Replay of a revoked refresh token triggers `TOKEN_REUSE_DETECTED` and immediately revokes all sessions for that user.

---

## 3. User Management Endpoints (`/api/v1/users`)

| Method | Endpoint | Permission Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/users` | `users:read` | List users within tenant (paginated) |
| `GET` | `/api/v1/users/:id` | `users:read` | Retrieve user profile by ID |
| `POST` | `/api/v1/users` | `users:create` | Create new user within tenant |
| `PATCH` | `/api/v1/users/:id` | `users:update` (or self) | Partial update of user profile |
| `POST` | `/api/v1/users/:id/roles` | `users:assign_role` | Assign role with hierarchical scope |
| `DELETE` | `/api/v1/users/:id` | `users:delete` | Soft-delete user and revoke sessions |

---

## 4. RBAC & Roles Endpoints (`/api/v1/roles`)

| Method | Endpoint | Permission Required | Description |
|---|---|---|---|
| `GET` | `/api/v1/roles/permissions` | `permissions:read` | List system permissions catalog |
| `GET` | `/api/v1/roles` | `roles:read` | List roles available to tenant |
| `GET` | `/api/v1/roles/:id` | `roles:read` | Retrieve role details |
| `POST` | `/api/v1/roles` | `roles:create` | Create custom tenant role |
| `PUT` | `/api/v1/roles/:id` | `roles:update` | Update custom tenant role |
| `DELETE` | `/api/v1/roles/:id` | `roles:delete` | Delete custom role (system roles protected) |
| `POST` | `/api/v1/roles/seed` | Role: `SUPER_ADMIN` | Seed or verify system baseline roles |

---

## 5. Security & Isolation Notes

1. **Multi-Tenancy Isolation**: Non-superadmin requests cannot query or manipulate resources belonging to another `tenantId`. Violations result in `403 CROSS_TENANT_ACCESS_DENIED` or `404 USER_NOT_FOUND`.
2. **Password Security**: Bcrypt cost factor 12.
3. **Audit Trail**: Every authentication and authorization event is recorded in the immutable `AuditLog` collection.
