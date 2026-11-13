---
paths:
  - "server/src/middlewares/**/*.ts"
  - "server/src/**/*.controller.ts"
  - "server/src/**/*.service.ts"
---

# Server errors, auth and uploads

- Errors are `@hapi/boom` objects (already a dependency, `^10.0.1` — not used anywhere yet, this is the first thing that should start using it). Use the status that matches: `badRequest` (400), `unauthorized` (401), `forbidden` (403), `notFound` (404), `unsupportedMediaType` (415), `badGateway` (502, upstream service failed).
- `src/middlewares/errorMiddleware.ts` is the only place that turns errors into JSON (`server/src/middlewares/` currently exists but is **empty** — this file needs to be created). It must be registered **after** all routers. Non-Boom errors become `500` and must not leak internals.
- Validate at the edge (controller). Services trust their typed inputs but still enforce ownership and existence.
- **Auth is the project's own JWT, not Supabase Auth.** Login checks the email against the existing `users` table and compares the password with bcrypt (the `password` column there is already bcrypt-hashed for the 3 seeded users); a correct login issues a JWT (`jsonwebtoken`, signed with a `JWT_SECRET` server env var) containing at minimum `{ sub: userId, role }`. Authenticated routes use `authMiddleware` passed per route (never `router.use(authMiddleware)` in a router mounted at `/`); handlers read the user with `getUserFromRequest(req)`, never `req.user!`. See `.claude/docs/server/auth-middleware.md`.
- **Temporary convention until `/add-auth` lands (Group 1):** controllers get the caller's id with `getUserId(req)` from `src/middlewares/auth-placeholder.ts`, which reads `req.body.user_id`, then `req.query.user_id`, and throws `Boom.badRequest` (400) if neither is present. It is a placeholder, not authentication — do not add JWT, token verification or any real auth around it outside the `/add-auth` task. When `/add-auth` runs, it replaces only the body of `getUserId` (to read the authenticated user from the verified token, e.g. via `getUserFromRequest(req).sub`); the controllers that call `getUserId(req)` must not change. Write endpoints built before then must call `getUserId(req)` instead of reading `user_id` directly.
- Ownership: TrueK's resources carry `provider_id`/`client_id` (on `requests`) or a `user_id`/`sender_id` (on `posts`/`messages`/`notifications`). A service enforcing ownership checks `req.user.sub` (via `getUserFromRequest`) against the relevant id column — e.g. only the `service_requests` row's `client_id` or `provider_id` may message on it. A resource that exists but belongs to someone else returns `404`, not `403`.
- Uploads: multer with `memoryStorage`, `limits.fileSize` and a `fileFilter` allow-list. Put auth middleware **before** multer so anonymous bodies are never parsed. Store files under `<userId>/<uuid>.<ext>`.
- Any URL received from a client that the server (or a third party) will fetch must be validated against an allow-list (for example, only files in the caller's own storage folder).
- Realtime broadcasts (Supabase Realtime Broadcast — see `realtime-supabase.md`) are fire-and-forget: a failure is logged, never thrown into the request.

Templates: `.claude/docs/server/errors-boom.md`, `.claude/docs/server/auth-middleware.md`, `.claude/docs/server/file-upload.md`, `.claude/docs/server/realtime-supabase.md`.
