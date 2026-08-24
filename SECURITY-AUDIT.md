# Production security audit

## Effective controls in this build
- Helmet security headers are enabled.
- CORS uses an explicit origin allowlist. Unknown browser origins are rejected.
- Express trusts one Render proxy hop so `req.ip` is suitable for rate limiting.
- Global API rate limiting plus stricter inquiry, admin-login, client-login and analytics limits.
- `express-mongo-sanitize` strips MongoDB operator injection keys.
- JSON request bodies are capped at 20 KB.
- Admin and client JWTs use HS256 with issuer/audience validation and 32+ character secrets.
- Passwords are hashed with Node `scrypt`; admin password hash is preferred over a plaintext environment variable.
- Admin/client routes require role-specific JWTs.
- API responses are `no-store` by default to avoid sensitive browser caching.
- Inquiry/review output is rendered as React text or escaped before HTML insertion.
- Live project URLs created by admins must use HTTPS.
- Real secrets and `node_modules` are excluded from Git.
- Service-worker cache is versioned and old caches are deleted on activation.

## Deliberate limitations
- A strict CSP is not enabled because the current public page uses inline style attributes/SVG and third-party technology-logo assets. Helmet's other security headers remain active.
- Admin/client access tokens are still stored in `sessionStorage` by the current React UI. This limits persistence after closing the tab but does not protect tokens from a successful same-origin XSS attack. A future hardening pass can move authentication to Secure, HttpOnly, SameSite cookies with CSRF protection.
- The `ADMIN_PASSWORD` environment variable remains supported only for migration. Use `ADMIN_PASSWORD_HASH` and remove `ADMIN_PASSWORD` after migration.

## Deployment verification
Before production deployment, set:
- `VITE_API_BASE_URL` on the frontend service.
- `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET`, `CLIENT_JWT_SECRET` and `ALLOWED_ORIGINS` on the backend service.
- SMTP variables only if admin email replies/notifications are required.

Do not commit `.env` files or secrets.
