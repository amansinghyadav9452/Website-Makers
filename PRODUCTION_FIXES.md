# Website Makers Production Fixes

## v1.1.0 Changes

### Security
- **Fixed XSS vulnerability** in review rendering — `innerHTML` now uses `escapeHtml()` helper
- **Removed unused custom JWT middleware** (`middleware/auth.js`) — now uses shared `jsonwebtoken` based middleware
- **Hardened admin password verification** — supports `salt:hash` format via `scryptSync`, falls back safely
- **Unified JWT secret** — renamed env var to `JWT_SECRET` (backward compatible with `ADMIN_JWT_SECRET`)
- **Added global 404 handler** on backend + frontend
- **Added global error handler** on backend
- **Added TTL index** on analytics events (auto-delete after 90 days)
- **Added database indexes** on all models for performance

### Architecture
- **Split 26KB AdminApp.jsx** into 10 focused components:
  - `admin/AdminApp.jsx` — routing shell
  - `admin/components/Login.jsx` — auth
  - `admin/components/Sidebar.jsx` — navigation
  - `admin/components/Dashboard.jsx` — overview
  - `admin/components/InquiriesTab.jsx` — lead management with pagination
  - `admin/components/ClientsTab.jsx` — client CRUD
  - `admin/components/ReviewsTab.jsx` — review moderation
  - `admin/components/AnalyticsTab.jsx` — data visualization
  - `admin/components/SettingsTab.jsx` — preferences
  - `admin/hooks/useApi.js` — shared API logic
  - `admin/utils/formatters.js` — date/currency helpers
- **Extracted shared `requireAdmin`/`requireClient`** to `middleware/auth.js`
- **Moved build deps** (`vite`, `@vitejs/plugin-react`) to `devDependencies`
- **Added root `package.json`** with `concurrently` for parallel dev

### Performance
- **Canvas animation pauses** when hero scrolls out of view (IntersectionObserver)
- **Images use `loading="lazy"`** with fade-in transition
- **Vite build** now uses manual chunks (`vendor` split)
- **Google Fonts** use `display=swap` for faster rendering
- **Added `dns-prefetch`** for API domain

### UX
- **Contact form** now shows loading spinner + success/error messages
- **Mobile nav** has proper hamburger toggle with ARIA attributes
- **Added 404 page** for unknown routes
- **Removed misleading "24/7 support desk"** stat → replaced with "Same-day response"
- **Admin dashboard** now shows real-time health checks
- **All admin tabs** have empty states, loading states, and error handling
- **Pagination** on inquiries list
- **Mobile-responsive admin** with dropdown nav on small screens

### Backend
- **Added `nodemon`** to devDependencies
- **Added `Pragma`/`Expires` headers** alongside `Cache-Control`
- **All routes** now have consistent error logging
- **Inquiry validation** improved with clearer error messages
- **Email notifications** on new inquiries (if SMTP configured)
- **Review model** now has `timestamps` and proper indexes

## Deploy

### Frontend
- Root: `frontend`
- Build: `npm install && npm run build`
- Publish: `dist`

### Backend
- Root: `backend`
- Build: `npm install`
- Start: `npm start`

### Environment
Backend:
- `MONGODB_URI`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD_HASH` (generate via `node backend/scripts/hash-password.js "your-password"`)
- `JWT_SECRET` (or legacy `ADMIN_JWT_SECRET`)
- `ALLOWED_ORIGINS=https://sitesmaker.online,https://www.sitesmaker.online`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (optional)

Frontend:
- `VITE_API_BASE_URL=https://website-makers-api.onrender.com`
