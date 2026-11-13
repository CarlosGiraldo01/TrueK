---
name: add-auth
description: Adds TrueK's own JWT bearer authentication (login against the existing users table + bcrypt, NOT Supabase Auth), replacing the current fake SessionContext/login with a real AuthContext on the client. Use when routes must be user-scoped, or to close the Delivery 3 rubric's "Auth & Session Management" gap.
argument-hint: "[auth options]"
disable-model-invocation: true
---

# Add authentication

This is a big, real change: it replaces the project's current fake login (no password check, hardcoded session) with a real one. Confirm scope with the user before starting if anything beyond the basics below seems implied (e.g. registration — there is none yet, the 3 users are already seeded).

1. Read `.claude/docs/server/auth-middleware.md` (login service against the real `users` table + bcrypt, JWT issuing, `authMiddleware`, `getUserFromRequest`, Express type augmentation) and `.claude/docs/client/lib-axios-auth.md` (token storage, interceptor, `AuthContext` replacing `SessionContext`).
2. Server:
   - Add `jsonwebtoken` (+ `@types/jsonwebtoken`) and `bcrypt` (+ `@types/bcrypt`) if not already real dependencies.
   - `features/auth/` with the usual layers (`login` only — no `register`), mounted at `/auth` (no `/api` prefix).
   - `users.repository.ts` gets a new method that selects `password` too (the only place allowed to), used solely by the login service.
   - `middlewares/authMiddleware.ts` (the folder is currently empty); apply it **per route** (`router.get('/x', authMiddleware, handler)`). Never `router.use(authMiddleware)` on a router mounted at `/`: it would make later public routers return 401.
   - Add `JWT_SECRET` to `src/config/index.ts` (fail fast if missing, same pattern as `databaseUrl`) and `server/.env.example`.
   - Ownership checks in services use `req.user.sub` against the real columns (`client_id`/`provider_id`/`user_id`/`sender_id`) — see `.claude/rules/server-errors-auth.md`.
3. Client:
   - `lib/authStorage.ts`, interceptor + 401 response handler in `lib/api.ts` (TrueK's existing axios file, not a new `lib/axios.ts`), `context/AuthContext.tsx` (`login`, `logout`, `isReady`).
   - Replace `SessionContext` entirely — every `useSession()` call site becomes `useAuth()`. List every file touched in the report; a half-migrated app with two competing session sources is a blocker, not a suggestion.
   - Update `app/login/page.tsx` to actually call `login(email, password)` and handle a wrong-password error, instead of logging to the console.
   - `key={user?.id ?? 'anonymous'}` on session-scoped providers once `AuthContext` exists.
4. Tests: missing/malformed header → 401, invalid/expired token → 401, other user's resource → 404, correct login stores the session and redirects, wrong password → 401, logout clears storage and redirects to `/login`.
5. Run `npm run typecheck`, `npm run lint`, `npm test` in both workspaces.
