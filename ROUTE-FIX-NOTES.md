# Latest fixes

- Added `GET /api/inquiries/admin/customers`, which the admin dashboard already called but the backend did not expose. This was the source of the `Route not found.` panel error.
- Hardened Helmet configuration: use `frameguard` and `noSniff` options supported by Helmet 7 instead of unsupported option names.
- Admin extra-data loading now reports the failing endpoint instead of collapsing all four requests into one generic error.
- Updated admin/client visible branding to Sites Maker and refreshed the service-worker cache version.
