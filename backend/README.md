# Website Makers — Inquiries API

Small Express + MongoDB Atlas backend that stores contact-form submissions
from the website (`POST /api/inquiries`) and lets you list them
(`GET /api/inquiries`).

## 1. MongoDB Atlas setup

1. In Atlas, open your cluster → **Connect** → **Drivers** → copy the
   connection string. It looks like:
   `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
2. Add a database user (Atlas → **Database Access**) if you haven't — note
   the username/password.
3. Allow network access (Atlas → **Network Access** → **Add IP Address**):
   for Render deployment, add `0.0.0.0/0` (allow from anywhere), since
   Render's outbound IPs aren't fixed on the free tier.
4. Put the connection string in `MONGODB_URI` (see `.env.example`), adding
   a database name before the `?`, e.g. `.../website_makers?retryWrites=...`.

## 2. Run locally (optional, needs Node 18+ and internet)

```
cd backend
cp .env.example .env   # then edit .env with your real Atlas URI
npm install
npm start
```

Server runs on `http://localhost:4000`. Test with:

```
curl -X POST http://localhost:4000/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"9999999999","email":"test@test.com","service":"Website Development","message":"hi"}'
```

## 3. Deploy on Render

1. Push this `backend/` folder to a Git repo (separate repo, or a
   subfolder of your existing one).
2. Render → **New** → **Web Service** (this one genuinely needs a server,
   unlike the static frontend).
3. **Root Directory:** `backend` (if it's a subfolder of a bigger repo).
4. **Build Command:** `npm install`
5. **Start Command:** `npm start`
6. **Environment Variables** (Render dashboard → Environment):
   - `MONGODB_URI` = your Atlas connection string
   - `ALLOWED_ORIGINS` = your frontend's deployed URL, e.g.
     `https://website-makers.onrender.com` (comma-separate if you have more
     than one, like a custom domain too)
7. Deploy. Once live, note the service URL, e.g.
   `https://website-makers-api.onrender.com`.

## 4. Connect the frontend

In the frontend's `index.html`, set:

```html
<script>
  window.API_BASE_URL = "https://website-makers-api.onrender.com";
</script>
```

Redeploy the static site. The contact form will now POST to
`/api/inquiries` and save into MongoDB Atlas.

## 5. Viewing leads

`GET /api/inquiries` returns the latest 200 leads as JSON. This route is
currently open (no login) — fine for quick testing, but before sharing
this URL or going fully live, add a simple auth check (e.g. an API key
header) so random visitors can't read your leads. Ask if you want that
added.

## Notes

- Render's free web service tier sleeps after inactivity — the first
  request after idle time can take ~30–50 seconds to wake up. That's
  normal, not a bug.
- The frontend's static site and this API are two separate Render
  services (Static Site + Web Service) — that's expected.
