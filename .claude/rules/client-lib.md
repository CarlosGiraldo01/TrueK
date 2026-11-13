---
paths:
  - "client/src/lib/**/*.ts"
---

# Client lib

TrueK's `client/src/lib/` currently has only `api.ts` (the axios instance, reading `process.env.NEXT_PUBLIC_API_URL` directly). The rest of this file describes the target shape — introduce each piece the first time a task actually needs it, don't do a speculative big-bang refactor of `lib/`.

- `lib/config.ts` should become the only file that reads `process.env`. Only `NEXT_PUBLIC_*` variables are available in the browser: `NEXT_PUBLIC_API_URL` (already in use), and later `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` once realtime is added. When you introduce `config.ts`, migrate `api.ts` to read from it instead of `process.env` directly — don't leave two sources of truth.
- `lib/api.ts` exports one `api` instance (`baseURL: NEXT_PUBLIC_API_URL`). Once `/add-auth` runs, auth is attached in a **request interceptor** (Bearer token from storage), not per call, and a response interceptor handles `401` by logging out and redirecting to `/login`.
- `lib/types.ts` (does not exist yet) would hold shared domain interfaces — but TrueK already has `client/src/types/*.ts` (one file per domain, re-exported from `client/src/types/index.ts`) duplicating the server's `*.types.ts` field-for-field. Keep using `client/src/types/` for now rather than creating a second, competing `lib/types.ts`; the `shared/` consolidation is a separate, deliberate task (see `.claude/docs/workflow/truek-rubric-gaps.md`).
- `lib/errors.ts` (does not exist yet) should export `getErrorMessage(error: unknown): string` (axios response message → axios message → generic) once any form needs to surface a real error instead of only logging to the console.
- `lib/supabase.ts` (does not exist yet) will export a single shared client instance with the publishable key / public URL only, once `/add-realtime` or `/add-file-upload` need it.
- `lib/authStorage.ts` (does not exist yet) will wrap the JWT storage for the session once `/add-auth` runs (key constant, getter, safe JSON parse).
- No React imports in `lib/`: it must be usable from hooks, contexts and tests.
- Never put server secrets here.

Templates: `.claude/docs/client/lib-axios-auth.md`.
