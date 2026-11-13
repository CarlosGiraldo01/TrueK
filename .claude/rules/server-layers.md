---
paths:
  - "server/src/features/**/*.ts"
---

# Server layers

Each feature lives in `server/src/features/<feature>/` with five files: `<feature>.router.ts`, `.controller.ts`, `.service.ts`, `.repository.ts`, `.types.ts`. Dependencies go one way: router → controller → service → repository. Already built this way: `users`, `posts`, `requests`, `ratings`, `messages`, `notifications`.

- **Router:** only maps HTTP verb + path to a controller. No logic. Export the router (TrueK exports a named const per feature, e.g. `export const usersRouter = Router();` — follow the existing naming, do not switch to `export default`). Mounted directly in `src/app.ts` (`app.use('/users', usersRouter)`) — **TrueK has no `/api` prefix**, do not introduce one.
- **Controller:** reads `req`, validates input (throws `Boom.badRequest` once Boom is wired in — see `server-errors-auth.md`), calls **one** service, sends the response with the right status (`201` create, `200` read, `204` delete). No SQL, no business rules.
- **Service:** business rules, ownership checks, orchestration across repositories, external APIs, realtime broadcasts. Throws `Boom` errors (`notFound`, `forbidden`...). Never touches `req`/`res`.
- **Repository:** the only layer that talks to the database (via the shared `pool` from `src/db/pool.ts`). Parameterized SQL only (`$1`, `$2`), never string interpolation of user input. Returns typed rows; maps snake_case columns with `AS "camelCase"` when the client-facing type needs camelCase, or keep snake_case when the existing type already uses it (check the feature's `.types.ts` first — `users`/`posts`/etc. currently use snake_case field names end to end; do not rename them as a side effect of an unrelated change).
- **Types:** domain interfaces and `Create*DTO` interfaces. Shared by all layers of the feature. (Note: these are currently duplicated verbatim into `client/src/types/`; see `.claude/docs/workflow/truek-rubric-gaps.md` for the `shared/` folder gap — do not silently "fix" that duplication as a side effect of an unrelated feature.)
- **Naming (TrueK's actual existing convention, different from a generic harness):**
  - Repositories and services export a **single object** named `<feature>Repository` / `<feature>Service`, whose methods are short action verbs: `usersRepository.findAll()`, `usersRepository.findById(id)`, `requestsService.getAll()`, `requestsService.getCurrent(userId)`. Do not switch to individually-exported `createXRepository`-style functions in an existing feature — match the file you're editing. For a brand-new feature, follow this same object pattern for consistency with the rest of the codebase.
  - Controllers export **individual, bare action functions**, named after the HTTP action with no `Controller` suffix: `getUsers`, `getUserById`, `createPost`, `deletePost`.
- A service may call another feature's *service*, never its repository.
- Controllers are `async` and just `throw`: Express 5 forwards rejected promises to the error handler once one exists. Do not add try/catch for that.

Patterns and templates: `.claude/docs/server/layers.md`, `.claude/docs/server/router-controller.md`, `.claude/docs/server/service.md`, `.claude/docs/server/repository.md`.
