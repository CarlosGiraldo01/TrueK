# Docs index

On-demand reference for skills, agents and rules. Read only the page the task needs.

## Server (`.claude/docs/server/`)

| Page | Read it when |
|------|--------------|
| `layers.md` | Adding any feature; shows the folder map and request flow |
| `router-controller.md` | Writing routes, input validation, status codes |
| `service.md` | Business rules, ownership, calling other services |
| `repository.md` | Writing SQL (CRUD, joins, nested objects with `json_build_object`/`json_agg`) |
| `db-init.md` | Adding or changing a table/column — the Supabase-migration workflow TrueK actually uses |
| `errors-boom.md` | Choosing error statuses; the error middleware |
| `auth-middleware.md` | TrueK's own JWT bearer auth (login against the `users` table + bcrypt, not Supabase Auth) |
| `file-upload.md` | multer + Supabase Storage |
| `realtime-supabase.md` | Server broadcasts through Supabase Realtime (the rubric's "Sockets" requirement) |
| `realtime-socketio.md` | socket.io server (fallback only — Supabase Realtime is the default choice for TrueK) |
| `env-config.md` | `config/`, env vars, `app.ts` / `index.ts` bootstrap |
| `testing.md` | Server tests and tooling setup (not installed yet) |

## Client (`.claude/docs/client/`)

| Page | Read it when |
|------|--------------|
| `components.md` | Writing components and pages |
| `contexts.md` | Shared state and API actions |
| `hooks.md` | Reusable logic (`client/src/hooks/` doesn't exist yet) |
| `lib-axios-auth.md` | `lib/` files, axios, auth session and `AuthContext` (replaces the current fake `SessionContext`/login) |
| `realtime-subscription.md` | Subscribing to Supabase Realtime events |
| `file-upload.md` | Upload hook with validation and compression |
| `map-geolocation.md` | Wiring real browser geolocation + `posts.latitude`/`longitude` into the existing Leaflet map |
| `testing.md` | Client tests and tooling setup (not installed yet) |

## Workflow (`.claude/docs/workflow/`)

| Page | Read it when |
|------|--------------|
| `api-contract-template.md` | Planning a feature |
| `review-checklist.md` | Reviewing changes |
| `truek-rubric-gaps.md` | Any task tied to the Delivery 3 rubric — exact rubric text + checklist of what's already done vs. missing |

Stack versions in use: Node 22.22, TypeScript 5.9, Express 5.3, Next.js 16, React 19, Tailwind 4, `pg` 8, `@hapi/boom` 10.0.1 (installed, not yet used), axios. No Supabase JS client on either side yet (schema access is via `pg` + the Supabase dashboard/MCP tooling; realtime/storage will be the first use of `@supabase/supabase-js`).
