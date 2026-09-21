# UniSphere — Security

**Version:** 0.1.0  
**Principle:** Security from Day 1 (continuous track)

---

## 1. Authentication

- Password hashing: bcrypt (cost factor ≥ 12) or argon2
- JWT access tokens (short-lived)
- Refresh token strategy with rotation and revocation
- Email verification & password reset flows
- MFA-ready architecture (TOTP / future)
- Login history & device tracking
- Session invalidation on password change / admin action

## 2. Authorization (RBAC)

- Role + Permission model (resource:action)
- Resource-level ownership checks
- Hierarchical scope (university / campus / department)
- Middleware: `authenticate` → `authorize(permission)` → resource ownership
- Never trust frontend permission checks

## 3. Tenant Isolation

- Every query filtered by authenticated user’s allowed tenant/scope
- IDOR protection on all resource endpoints
- Super Admin is the only cross-tenant role

## 4. Input & Output

- Zod validation on every write endpoint
- Helmet, CORS, rate limiting
- Secure headers
- Parameterized queries (Mongoose)
- File upload validation (type, size, virus scan readiness)

## 5. Practical Execution Security

- Student code never runs in the main Node process
- Isolated containers / workers with:
  - CPU / memory / time limits
  - No network (or restricted)
  - Read-only filesystem where possible
  - Automatic cleanup
- Job queue isolation

## 6. Audit & Compliance

- Immutable audit log for critical actions
- Access reviews support
- Data retention & soft-delete policies
- Privacy controls for student data

## 7. Secrets & Configuration

- Environment variables + secrets management
- No secrets in source control
- Different configs for development / staging / production

## 8. Testing Requirements

Security tests must cover:
- Invalid / expired / missing tokens
- Privilege escalation attempts
- Tenant bypass attempts
- Permission bypass
- Rate limit enforcement
- Injection attempts
