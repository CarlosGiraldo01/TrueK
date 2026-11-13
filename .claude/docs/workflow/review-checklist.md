# Review checklist (for `code-reviewer`)

Mark each item pass / fail / not applicable. Every fail is a blocker with `file:line`.

## Server

- [ ] Five-file feature structure; imports only go router → controller → service → repository.
- [ ] Repositories/services follow TrueK's object convention (`xRepository`/`xService` with method names), controllers export bare-verb functions — not a mismatched individually-exported-function style introduced by mistake.
- [ ] No SQL outside repositories; no `req`/`res` in services; no business rules in controllers.
- [ ] All SQL parameterized; no user input interpolated into queries.
- [ ] No schema change applied to Supabase without first being shown to the user as SQL, and no reintroduced code-level `initDb()`.
- [ ] Controller validates type, shape and ranges; throws `Boom.badRequest` (once Boom is wired in for that feature) or returns the existing `res.status(400).json({ error: ... })` shape consistently with the rest of that feature.
- [ ] Correct status codes (201 create, 200 read, 204 delete) and error statuses.
- [ ] Ownership checks use the real columns (`client_id`/`provider_id`/`user_id`/`sender_id`, not an invented `owner_id`); a resource belonging to someone else returns 404, not 403.
- [ ] Protected routes pass `authMiddleware` per route (no `router.use(authMiddleware)` on a router mounted at `/`); handlers use `getUserFromRequest`.
- [ ] Routes are mounted with no `/api` prefix, matching the rest of the app.
- [ ] Uploads: auth before multer, MIME allow-list, size limit, per-user path; client-sent URLs validated.
- [ ] Realtime (Supabase Broadcast) emitted after a successful write, never thrown into the request.
- [ ] Env vars only read in `src/config/index.ts`; `.env.example` updated; `.env` untouched.
- [ ] `errorMiddleware` (once it exists) is registered after all routers.
- [ ] Build layout unchanged: `server/tsconfig.json` keeps `rootDir: "src"`; `start` still runs `dist/index.js`. Tests are typechecked through `tsconfig.test.json`. Any change to these is a blocker.

## Client

- [ ] One component per file, named export, `'use client'` only where needed.
- [ ] Data and mutations live in contexts/hooks (`client/src/context/`, `client/src/hooks/`); components render and compose.
- [ ] Context hook throws outside its provider; actions update state with functional setters.
- [ ] Appends from realtime/HTTP are idempotent by `id`.
- [ ] Every subscription, timer, listener, object URL and `navigator.geolocation.watchPosition` is cleaned up.
- [ ] Loading, empty and error states exist; submit buttons disabled in flight; errors use `role="alert"`.
- [ ] `api` used through `@/lib/api` (not an invented `@/lib/axios` path); auth via interceptor once `/add-auth` has run; errors via `getErrorMessage` once it exists.
- [ ] No secrets in the client; only `NEXT_PUBLIC_*` variables.
- [ ] Accessible labels on inputs and buttons.
- [ ] Callbacks don't leak DOM events (`onDelete(id)`, not `onDelete(e, id)`) — explicit rubric line item.
- [ ] Paths are correct: `client/src/...`, never a top-level `client/app`/`client/components` that doesn't exist in this project.

## Tests

- [ ] Happy path, validation errors, not found, ownership/unauthorized, side effects.
- [ ] Expected values written by hand; no weakened assertions to hide a bug.
- [ ] No `any`, `@ts-ignore`, `.only`, or skipped tests without a reason.
- [ ] No integration test asserts against or mutates the real seeded demo data (Valentina/Camila/Camilo and their posts/requests).

## General

- [ ] No `any`, no `@ts-ignore`, no leftover `console.log`.
- [ ] Function/variable names in English; comments and user-facing messages match whatever language the surrounding file already uses (don't mix English and Spanish within one file).
- [ ] `typecheck`, `lint` and `test` pass in every touched workspace (once those scripts exist).
- [ ] Nothing outside the plan's scope was added. Exception: a minimal, behaviour-preserving fix to a pre-existing error that blocks typecheck or lint, reported by the writer, is a suggestion, not a blocker.
