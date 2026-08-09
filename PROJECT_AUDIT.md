# VasthuConnect — Project Audit (Phase 0)

Date: 2026-08-09

## 0. How this codebase was recovered

The working directory (`~/Downloads/vasthu`) contained only a minified production
build (`vasthuconnect-dist/`, one JS bundle + CSS, no source). The actual source —
`backend/` (Express + Prisma + PostgreSQL) and `frontend/` (Vite + React) — had been
moved to the OS Trash on 2026-08-07 (along with an even earlier single-file
prototype, also trashed). Per your instruction, I restored `backend/`, `frontend/`,
`docker-compose.yml`, and the project `README.md` from Trash back into
`~/Downloads/vasthu` and initialized a git repo scoped to this directory (the
top-level `~/Downloads` folder turned out to be a separate, unrelated git repo
containing unrelated multi-GB files — I left that alone; this project now has its
own clean repo).

`vasthuconnect-dist/` (the stale build output) is still sitting in the directory.
Recommend deleting it once the frontend is rebuilding cleanly — it's a build
artifact, not source, and shouldn't be committed.

## 1. Existing architecture

This is **not a mock/localStorage demo** — it's an already-real, already-working
full-stack app:

- **Backend**: Node.js + Express (CommonJS), PostgreSQL via Prisma ORM, JWT access
  tokens + httpOnly-cookie refresh tokens with rotation, phone/OTP auth (no
  passwords), Socket.IO for real-time chat, Zod validation, RBAC middleware,
  double-submit-cookie CSRF, `sharp` for image processing, `sanitize-html` for
  stored-XSS defense, Razorpay payment scaffolding, an Anthropic Claude proxy for
  two AI features. Deploy target: Render (`backend/render.yaml`, free tier +
  managed Postgres).
- **Frontend**: Vite + React 18 (JS, not TS) + React Router + Tailwind, context-based
  state (Auth/Socket/Toast/Compare — no Redux/Zustand/TanStack Query), a thin `api/`
  fetch layer per resource. Deploy target: Vercel (`frontend/vercel.json`, SPA
  rewrites + security headers already configured).
- **Local dev**: `docker-compose.yml` runs Postgres only; SMS provider defaults to
  `console` (OTP prints to backend terminal, no real SMS account needed).

This already matches the spirit of your target stack (Vercel + managed Postgres +
JWT auth) — it's a self-hosted equivalent of "Supabase Auth" rather than Supabase
itself. See §7 for the recommendation on whether to keep it that way.

## 2 & 3. Existing / working features

Verified by reading the actual controllers/routes/schema, not just the README:

| Feature | Status |
|---|---|
| Registration/login via phone OTP | **Real.** Hashed OTP codes, expiry, max-attempt lockout, generic errors (no phone-number enumeration on login). |
| Session management | **Real.** Short-lived JWT access token (client memory only, never localStorage) + rotating refresh token in httpOnly cookie scoped to `/api/auth`, theft-detection on reuse of a revoked token. |
| RBAC | **Real**, server-side only. `requireRole` + `requireOwnerOrAdmin`, never trusts a client-sent role. Roles: `BUYER`, `SELLER`, `ADMIN` (spec's 8-role list is not implemented — see §5). |
| Property CRUD | **Real.** Prisma-backed, ownership-checked, editing an approved listing correctly bounces it back to `PENDING` for re-review. |
| Property approval workflow | **Real** but minimal state machine: `PENDING → APPROVED/REJECTED/SOLD` only (spec wants 12 states — see §5). |
| Image upload | **Real** processing (resize/webp/compress via `sharp`) but **stores to local disk only** — `STORAGE_PROVIDER=s3` throws `"not wired up"`. No Cloudinary integration despite your spec requiring it. |
| Duplicate-photo / spam detection | **Real**, and genuinely clever: perceptual-hash (average-hash) Hamming-distance matching against every existing listing photo, plus a rapid-posting + duplicate-title heuristic that sets a `spamScore` for admin triage. |
| Likes / Saves | **Real**, transactional, with a unique constraint preventing double-likes, and a notification fired to the seller. |
| Comments | **Real**, but flat (no threaded replies, no reactions — spec wants both). |
| Chat | **Real** persistent Socket.IO chat, JWT-authenticated sockets, thread model tied to buyer+seller+property, read receipts. Not "simulated." |
| Notifications | **Real**, DB-backed + live-pushed over the same socket. |
| Admin panel | **Real**: pending-queue, approve/reject (with reason + notification), blacklist user, verify-seller flag, verify-documents flag, basic analytics (counts, revenue-last-30-days). **No audit log** of any of these actions (spec explicitly requires one — see §5). |
| Reporting | Schema exists (`Report` model, `reportsCount`-style threshold mentioned in README as "3+ reports auto-hide") — **partially wired**; I did not find the auto-hide trigger implemented in `property.controller.js` or `report.controller.js` in the code I read; needs a closer look/finish in Phase 4/7. |
| Payments | **Real** Razorpay order-creation + signature verification scaffolding; no live keys configured (expected — that's a credential, not a code gap). |
| AI features | **Real** server-side-only Claude proxy (key never reaches the browser), rate-limited, role-gated. Two endpoints: property-description generator, and a free-text "Vastu insight" blurb. |
| Security headers / CORS / rate limiting | **Real**: Helmet CSP, locked-origin CORS, tiered rate limits (auth/AI stricter than general), 1MB body limits. |
| Compare properties | **Real** on the frontend (`CompareContext`, `ComparePage`) — client-side only, not persisted server-side. |
| Seed data | **Real**: 1 admin, 1 seller, 1 buyer, a few approved listings — smaller than spec's "5 sellers/10 buyers" ask but functional. |

## 4. Broken / incomplete-in-practice features

- **Image/document storage will not survive most production hosts as configured.**
  Local disk under `process.cwd()/uploads` works only as long as the process disk
  persists across deploys and isn't horizontally scaled. This is a real production
  blocker, not a style nitpick — flagged correctly in your own spec (§15: "Never
  store images/videos directly..." — well, this isn't Postgres, but the same
  ephemeral-filesystem problem applies) and even the project's own README admits it
  ("Set `STORAGE_PROVIDER=s3`... for production-scale storage" — but that code path
  currently just `throw`s).
- ~~Report auto-hide threshold mentioned in README but not confirmed wired~~ —
  **correction**: re-checked `report.controller.js` directly; it's implemented
  (3+ open reports on an approved listing flips it back to `PENDING`).
- ~~Default AI model id is stale~~ — **fixed in Phase 1** (see below).
- No automated tests exist anywhere (`*.test.*`, `*.spec.*` — zero matches), and no
  CI config (`.github/` doesn't exist). Nothing here is "broken" per se, but nothing
  is regression-guarded either.

## 5. Missing features (relative to your V1 spec)

This is the most important section, since your spec is explicit that **Vastu is
the primary product differentiator**, and that's the area with the biggest gap:

**Vastu (highest priority gap)**
- No Vastu rule engine / `vastu_rules` table. Scoring is a 4-line hardcoded
  heuristic (`computeVastuScore` in `property.controller.js`): a base score by
  facing (N/E/S/W only — **no NE/SE/SW/NW intercardinal directions anywhere in the
  schema**, which your spec requires throughout), ±adjustments for kitchen
  direction/pooja room/water. It is deterministic (good — matches your "AI must
  not invent the score" rule) but not remotely a rule engine, not testable as
  independent rule objects, not extensible by category/tradition/source/confidence.
- No standalone **Vastu Advisor** section at all — no `/vastu` route, no Land Vastu
  flow, no Home Vastu flow, no interactive compass (there's a `CompassLogo.jsx`,
  but it's branding artwork, not an input tool), no per-room direction picker, no
  "Ask Vastu" conversational assistant, no Vastu report generation/PDF, no personal
  Vastu profile/preferences.
- Vastu "explanation" is a single freeform Claude prompt (`generateVastuInsight`)
  with no grounding in structured rules — it's fine as flavor text but isn't the
  rule-engine-backed, testable, reproducible system your spec calls for.
- No `vastu_analyses` / `vastu_reports` tables — a property's Vastu score is a
  column on `Property`, not a first-class analyzable/re-runnable entity, and there's
  no way for a user to analyze a plot/home they don't own or haven't listed.

**Everything else, gapped but lower priority than Vastu:**
- Roles: 3 implemented (`BUYER/SELLER/ADMIN`) vs. spec's 8
  (`SUPER_ADMIN/ADMIN/MODERATOR/VERIFICATION_AGENT/SELLER/BUYER/AGENT/BUILDER`).
- Property status machine: 4 states vs. spec's 12 (no `DRAFT/SUBMITTED/UNDER_REVIEW/
  PAUSED/RENTED/EXPIRED/SUSPENDED/ARCHIVED`).
- No audit log for admin actions (approve/reject/blacklist/verify all silently
  mutate state with no `audit_logs` row).
- No follows, no threaded comment replies/reactions, no shares/views-as-entity
  tracking beyond a raw counter.
- No enquiries/visits/offers/leads pipeline, no saved searches, no price history,
  no recently-viewed tracking.
- No email/password auth path (phone/OTP only) or password reset (not applicable
  without passwords) or "logout all devices"/account deletion.
- No map integration wired up beyond a placeholder component + optional Maps key.
- No SEO work (no metadata/sitemap/OpenGraph/human-readable URLs — property URLs
  are raw UUIDs).
- No Cloudinary/S3 storage (see §4).
- No tests (unit/integration/E2E), no CI.
- No `docs/`, no `PROJECT_AUDIT.md` (this file), no `VERCEL_DEPLOYMENT.md`, no
  `.env.example` at the repo root (there is one per-package, which is fine).
- Frontend is JavaScript, not TypeScript, and doesn't use React Hook Form / Zod
  resolvers on the client (Zod is a backend dependency here; frontend validation in
  `utils/validation.js` is hand-rolled) — a deliberate-looking choice to keep the
  dependency footprint small, flagging since your spec calls out TS + RHF + Zod
  explicitly.

## 6. Security issues found

Nothing critical. The existing security posture is unusually good for a first
project — someone (a prior session, going by the code) clearly took OWASP-top-10
concerns seriously: parameterized queries throughout (Prisma, no raw SQL), CSRF
double-submit pattern, httpOnly+sameSite=strict cookies, encrypted-at-rest survey
numbers with masked reads, RBAC enforced server-side only, honeypot field, rate
limiting tiered by sensitivity, Helmet CSP. The only issues worth fixing:

- Local-disk file storage (see §4) is an availability/durability risk, not a
  confidentiality one, but it's the top production blocker.
- No audit trail on admin actions is a light accountability gap, not an exploit.
- `FIELD_ENCRYPTION_KEY` falls back to `"0".repeat(64)` in dev if unset — correctly
  gated to not silently do this in production (`required()` throws when
  `NODE_ENV=production` and the var is missing), so this is fine as-is, just worth
  knowing.

## 7. Mobile / responsive issues

Not evaluated live in a browser yet (needs `npm install` + `npm run dev` in both
packages, which I haven't run in this pass). From reading the code: Tailwind is
used throughout, there's a dedicated `MobileTabBar.jsx`, 44px+ touch targets are
mentioned in the README as a design intent, and `prefers-reduced-motion` is
respected. I'd treat this as "looks intentionally mobile-first" but **unverified
until Phase 8**, when I'll actually run the app and check it on mobile breakpoints.

## 8. Recommended migration path (Phase 1 decision)

Your master spec's *preferred* stack is Supabase (DB+Auth) or Neon (DB) +
Cloudinary + Vercel. What actually exists is a hand-built, well-executed Express +
Prisma + custom JWT/OTP backend on Render, with local-disk storage.

**Recommendation: keep the existing backend architecture, don't migrate to
Supabase Auth.** Reasoning:
- It already satisfies every behavioral requirement your spec lists for auth
  (OTP, session mgmt, logout, RBAC, rate limiting/abuse prevention) — rewriting it
  on Supabase Auth would be pure churn for no new capability, and directly
  contradicts your own instruction not to "rewrite the application from scratch
  unless the existing architecture genuinely prevents the required production
  implementation." It doesn't.
- It's already cost-optimal: Render's free web-service tier + free Postgres tier
  fits comfortably inside ₹10,000.
- The one real infra gap — file storage — should be fixed by wiring Cloudinary
  into the existing `storageService.js` (it already has a clean provider-switch
  shape: `local` vs `s3`; add a `cloudinary` branch, same interface). This is a
  small, targeted fix, not an architecture change.

Where I'd deviate from "keep everything as-is": the **database** should move from
"whatever Postgres you run yourself" to a managed free-tier Postgres (Neon or
Render's managed Postgres, which is already what `render.yaml` provisions) — that's
already the plan, no change needed there either. So net: Phase 1 is mostly *additive*
(Cloudinary, audit logs, expanded roles/status enum if you want them) rather than
replacement.

The **Vastu system**, by contrast, needs substantial new build-out — that's Phase 3
and the highest-priority phase per your own spec, since almost none of the rule
engine / advisor UX exists yet.

## 9. Files to retain (as-is or near-as-is)

Essentially the whole backend: `app.js`, `server.js`, `config/`, all of `auth`,
`admin`, `chat`, `comment`, `notification`, `payment`, `user` controllers/routes,
all middleware, `utils/`, `sockets/`, `validators/`, and the Prisma schema (to be
*extended*, not replaced). Frontend: the whole `context/`, `hooks/`, `common/`
components, `layout/` components, `api/` client layer, and all existing pages —
these are real, working, and shouldn't be thrown away to add Vastu features.

## 10. Files to refactor

- `backend/src/services/storageService.js` — add Cloudinary provider branch.
- `backend/src/controllers/property.controller.js` — extract `computeVastuScore`
  out into a new `backend/src/services/vastuEngine.js` (or a `vastu/` module) once
  the real rule engine lands in Phase 3, so it's independently testable per your
  spec's §54 (deterministic, reproducible scoring tests).
- `backend/prisma/schema.prisma` — extend `Facing` enum to all 8 directions,
  add `vastu_rules`/`vastu_analyses`/`vastu_reports` models, add `audit_logs`,
  optionally expand `Role` and `PropertyStatus` enums (worth confirming with you
  whether you want the full 8-role/12-state spec or a trimmed version — that's a
  scope call, not a code call).
- `frontend/src/App.jsx` — add `/vastu`, `/vastu/land`, `/vastu/home`,
  `/vastu/ask`, `/vastu/reports` routes once those pages exist.
- `backend/src/config/env.js` — bump the default `ANTHROPIC_MODEL`.

## 11. Files to eventually remove

- `vasthuconnect-dist/` at the repo root — stale build output, not source, and
  currently the *only* thing that was in the working directory before this
  recovery. Safe to delete once you've confirmed the restored source builds and
  you don't need it as a reference.

## Summary

This project is much further along than a ground-up build — the non-Vastu
plumbing (auth, RBAC, CRUD, chat, admin, security) is genuinely production-shaped
and shouldn't be rewritten. The gap between what exists and your spec is
concentrated almost entirely in one place: **Vastu is currently a minor bolt-on
(a 4-line score heuristic + one AI blurb) instead of the standalone, rule-engine-
backed product pillar your spec describes.** That should be Phase 3's focus, per
your own phased plan, after Phase 1 lands the small infra fixes (Cloudinary,
audit logging) this audit surfaced.

**Proposed next step:** Phase 1 (env config, Cloudinary wiring, audit_logs table,
confirm role/status-enum scope with you) — or, given how solid the foundation
already is, we could fold Phase 1's small additions into the start of Phase 3 and
go straight at the Vastu rule engine, which is where the real work is. Your call.

## Phase 1 — completed (2026-08-09)

Per your direction ("minimal Phase 1, then straight to Vastu"), roles and the
property status enum were left as-is. Completed:

- **Cloudinary storage** wired into `storageService.js` as a real third
  provider alongside `local`/`s3` (images upload via `upload_stream` + the
  existing `sharp` optimize/resize step; documents upload as `authenticated`
  raw resources, not publicly listable). Added the `cloudinary` npm package,
  `CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/`CLOUDINARY_API_SECRET` to
  `.env.example` and `render.yaml` (`STORAGE_PROVIDER` now defaults to
  `cloudinary` on Render). Local dev is unaffected (`STORAGE_PROVIDER=local`
  still the `.env.example` default).
- **Audit logging**: new `AuditLog` Prisma model + migration
  (`20260809104646_add_audit_log`), a small `auditService.js`, and every admin
  moderation action now records one — property approve/reject/verify-documents,
  user blacklist/unblacklist, seller verify/unverify, and report resolution.
  Exposed read-only via `GET /api/admin/audit-logs`.
- **Stale AI model id fixed**: `ANTHROPIC_MODEL` default changed from
  `claude-sonnet-4-6` to `claude-haiku-4-5` — Haiku 4.5 is the cost-appropriate
  choice for the two short-text AI features (property-description blurbs and
  Vastu-insight blurbs, both ~100–400 output tokens), not Sonnet.
- Migration was generated against a throwaway local Postgres cluster (Docker
  wasn't accessible in this environment) — the resulting `migration.sql` is
  ordinary, portable SQL and applies cleanly via `prisma migrate deploy` on any
  real Postgres.

**Next: Phase 3, the Vastu rule engine** — the actual product differentiator.
