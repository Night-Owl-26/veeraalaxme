# VasthuConnect — full-stack

A real backend + a modularized, responsive React frontend for the social
real-estate platform spec. Replaces the earlier single-file prototype.

```
vasthuconnect/
├── backend/     Express API — Postgres (Prisma), JWT+OTP auth, Socket.IO chat,
│                RBAC, file uploads, fraud checks, server-side AI proxy
├── frontend/    Vite + React — talks to the backend over HTTPS, nothing
│                sensitive lives in the browser
└── docker-compose.yml   Local Postgres for development
```

## Why two hosts (Vercel + Render)

Vercel is excellent for the React frontend, but its serverless functions
don't hold persistent WebSocket connections — and the real-time chat here
depends on Socket.IO staying connected. So:

- **Frontend → Vercel** (static Vite build)
- **Backend → Render or Railway** (long-running Node process, managed
  Postgres, real WebSockets — both have free tiers)

If you don't need real-time chat, the backend *could* be adapted to Vercel
serverless functions with polling instead of Socket.IO — but as shipped, run
it on Render/Railway/Fly.io/a VPS.

## Local development

```bash
# 1. Start Postgres
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env        # edit values — DATABASE_URL already matches docker-compose
npm install
npx prisma migrate dev --name init
npm run prisma:seed         # creates an admin, a seller, a buyer, and 3 listings
npm run dev                 # http://localhost:4000

# 3. Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Seeded phone numbers (OTPs print to the **backend console** since
`SMS_PROVIDER=console` by default — no SMS account needed for local dev):
- Admin: `+919999900000`
- Seller: `+919876543210`
- Buyer: `+919000011223`

## Deploying

### Backend → Render
1. Push this repo to GitHub.
2. In Render: New → Blueprint → point at the repo → it reads `backend/render.yaml`.
3. Set the secrets Render can't generate for you: `CLIENT_ORIGIN` (your Vercel URL),
   `ANTHROPIC_API_KEY`, and optionally Twilio/Razorpay/S3 keys.
4. Note the deployed API URL (e.g. `https://vasthuconnect-api.onrender.com`).

### Frontend → Vercel
1. Import the repo in Vercel, set **Root Directory** to `frontend`.
2. Vercel auto-detects `vercel.json` (SPA rewrites + security headers) and the Vite build.
3. Add environment variables in Vercel's dashboard:
   - `VITE_API_URL` = `https://vasthuconnect-api.onrender.com/api`
   - `VITE_SOCKET_URL` = `https://vasthuconnect-api.onrender.com`
   - `VITE_GOOGLE_MAPS_API_KEY` = (optional — map tab shows a clean fallback without it)
4. Deploy. Then go back to Render and set `CLIENT_ORIGIN` to the Vercel URL it gives you,
   so CORS/cookies line up.

## What's real vs. what needs your own credentials

| Feature | Status |
|---|---|
| Auth (OTP + JWT + refresh + CSRF) | Fully implemented. OTP delivery defaults to console-log; flip `SMS_PROVIDER=twilio` + fill in credentials to actually send SMS. |
| Database / all CRUD / search / RBAC | Fully implemented (Postgres + Prisma). |
| Image upload, resize, duplicate-photo detection | Fully implemented, stores to local disk by default (dev only). Set `STORAGE_PROVIDER=cloudinary` + `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` for production — fully wired in `storageService.js`. (`s3` is stubbed but not implemented.) |
| Real-time chat | Fully implemented (Socket.IO, JWT-authenticated). |
| AI description / Vastu insights | Fully implemented server-side proxy — just needs `ANTHROPIC_API_KEY`. |
| Maps | Frontend component is ready; needs `VITE_GOOGLE_MAPS_API_KEY`. Falls back gracefully without one. |
| Payments (Razorpay) | Order creation + signature verification implemented; needs a Razorpay account's test/live keys. |
| Fraud checks | Duplicate-image hashing and a spam-score heuristic are implemented; report-based auto-hide (3+ reports) is live. |
| Admin audit log | Fully implemented — every approve/reject/blacklist/verify-seller/verify-documents/report-resolve action writes an `AuditLog` row (actor, action, target, metadata). View via `GET /api/admin/audit-logs`. |

## Security measures implemented

- Helmet (CSP, HSTS, etc.), CORS locked to one origin, rate limiting (tighter on auth & AI)
- Zod validation on every request body/query
- Prisma's parameterized queries (no raw SQL string interpolation anywhere — grep for `queryRaw` to confirm)
- `sanitize-html` strips markup from all free-text fields before they're stored (stored-XSS defense)
- httpOnly refresh cookie + double-submit-cookie CSRF token; short-lived access token kept in memory only, never localStorage
- RBAC middleware plus object-level "owner or admin" checks on every mutation
- Survey numbers encrypted at rest (AES-256-GCM), only ever shown masked
- Honeypot field + per-hour posting rate limit + duplicate-title/photo detection against spam

## Responsive / UI notes

- Mobile gets a native-app-style bottom tab bar (Feed / Compare / Post / Saved / Chat);
  desktop gets the horizontal nav row in the header.
- All interactive targets are ≥44px for touch.
- Forms show inline validation errors; buttons show loading states; lists show skeletons while fetching.
- Respects `prefers-reduced-motion`; visible focus rings throughout for keyboard nav.
