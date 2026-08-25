# Website Makers — Production Clean Build

## What was cleaned
- Removed `node_modules`, `.vite`, `dist` and stale legacy `script.js` / `build-cache.js`.
- Removed duplicate `backend/routes/package.json`.
- Centralized JWT verification and password hashing.
- Added login rate limits for admin and client portal.
- Strict CORS allowlist.
- Render proxy-aware rate limiting.
- API responses default to `Cache-Control: no-store`.
- Helmet security headers enabled; CSP intentionally left off because the current public page uses inline SVG/style attributes and external logo assets.
- Server-side validation and Mongo sanitization retained.
- HTTPS-only live project URLs in client management.
- Production frontend has a backend URL fallback, but `VITE_API_BASE_URL` should still be set in Render.
- Service-worker cache is versioned and old caches are removed on activation.

## Render variables
### Frontend
`VITE_API_BASE_URL=https://website-makers-api.onrender.com`

### Backend
Set `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_JWT_SECRET` (32+ random chars), `CLIENT_JWT_SECRET` (different 32+ random chars), `ALLOWED_ORIGINS`, and preferably `ADMIN_PASSWORD_HASH`.

Generate admin password hash locally:
`cd backend && npm install && npm run hash-admin-password -- "your-password-at-least-12-chars"`

Set `ALLOWED_ORIGINS=https://sitesmaker.online,https://www.sitesmaker.online,http://localhost:5173` (add the exact Render frontend origin only if you still use it).

## Render commands
Frontend root: `frontend`
Build: `npm ci && npm run build`
Publish: `dist`

Backend root: `backend`
Build: `npm ci`
Start: `npm start`

## Important
Do not upload `.env` or `node_modules`.
