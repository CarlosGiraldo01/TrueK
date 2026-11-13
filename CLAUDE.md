# TrueK — Claude Code harness

This is the `fullstack-harness` configuration (as taught in class), adapted specifically for the TrueK project. Everything here follows that harness's structure 1:1 — agents, skills, rules, docs, hooks — only the *content* is TrueK-specific.

## Project shape (as it exists today)

```
TrueK/
├── client/   Next.js 16 (App Router), React 19, Tailwind 4, axios
│   └── src/  app/, components/, context/, lib/   (NOT client/app — everything is under client/src/)
└── server/   Express 5.3, TypeScript 5.9, pg 8, @hapi/boom 10 (installed, not yet used)
    └── src/  features/, config/, db/, middlewares/ (middlewares/ exists but is EMPTY)
```

- **Server:** `src/features/<feature>/<feature>.{router,controller,service,repository,types}.ts`. Layered: router → controller → service → repository. Already built: `users`, `posts`, `requests`, `ratings`, `messages`, `notifications`.
- **Client:** `src/app/` (routes), `src/components/`, `src/context/`, `src/lib/` (`api.ts`, no `config.ts`/`errors.ts`/`types.ts` yet — see docs). There is **no `src/hooks/` folder yet**; `/add-hook` creates it the first time it's needed. Imports use the `@/` alias, resolving to `client/src/*`.
- **Database:** a real Supabase Postgres project already exists and is seeded. **Schema changes do NOT happen in code.** There is no `initDb()` — the schema lives in Supabase and changes go through a migration (propose the SQL, apply it via Supabase, then write the repository against the result). See `.claude/rules/server-db.md`.
- **Auth decision:** custom JWT bearer auth against the existing `users` table (bcrypt-hashed `password` column, already seeded with 3 real users: Valentina, Camila, Camilo). This is **not** Supabase Auth — no `auth.users` migration. See `.claude/docs/server/auth-middleware.md`.
- **Realtime decision:** Supabase Realtime Broadcast (satisfies the Delivery 3 rubric's explicit Sockets requirement). See `.claude/docs/server/realtime-supabase.md`.

## Read this first: what's missing and why

`.claude/docs/workflow/truek-rubric-gaps.md` has the exact rubric text for this delivery and a checklist of what the current code already satisfies vs. what's missing (Sockets, real Auth, `PrivateRoute`/`AuthForm`/`EmptyState`, toasts, a `shared/` types folder, etc.). Read it once per session when the task is about closing a rubric gap, not on every turn.

## Commands

Run inside the workspace you changed.

| Workspace | Install | Dev | Typecheck | Lint | Test |
|-----------|---------|-----|-----------|------|------|
| `server/` | `npm install` | `npm run dev` | `npm run typecheck` | `npm run lint` | `npm test` (`node:test` via `tsx`) |
| `client/` | `npm install` | `npm run dev` | `npm run typecheck` | `npm run lint` | `npm test` (Vitest + Testing Library) |

As of this writing, neither workspace has a `typecheck` or `test` script yet (client has `lint`, server has neither). `test-writer` adds them the first time it needs to, per `.claude/docs/server/testing.md` / `.claude/docs/client/testing.md`. If you (a human) are setting this up before ever running a skill, see the project's own `CLAUDE-SETUP-NOTES.md` (delivered alongside this harness, not part of it) for the exact manual steps.

## Rules (loaded by file path)

Rules in `.claude/rules/` load automatically when a matching file is edited:

- `server-layers.md`, `server-db.md`, `server-errors-auth.md` for `server/src/**`
- `client-components.md`, `client-hooks.md`, `client-contexts.md`, `client-lib.md` for `client/src/**`
- `typescript-style.md` for every `*.ts` / `*.tsx`
- `tests.md` for test files

## Skills

| Skill | Use it to |
|-------|-----------|
| `/add-feature` | Orchestrate a full feature (plan → server → client → tests → review) |
| `/add-server-feature` | Add a layered server feature |
| `/add-client-feature` | Add a client feature (components + context + hooks) |
| `/add-component`, `/add-context`, `/add-hook` | Add one client building block |
| `/add-db-table` | Propose a Supabase migration for a new table/column, then the repository that uses it |
| `/add-realtime` | Add Supabase Realtime Broadcast events (the rubric's "Sockets" requirement) |
| `/add-file-upload` | Add file uploads (multer + Supabase Storage) |
| `/add-auth` | Add the project's JWT bearer auth on server and client (replaces the current fake login) |
| `/verify` | Run typecheck, lint and tests in both workspaces |

## Agents

Agents never call each other: the orchestrating skill runs them **one at a time, in order**.

1. `feature-planner`: read-only; produces the API contract, tables, files and test cases.
2. `server-writer`: writes only under `server/` (no tests).
3. `client-writer`: writes only under `client/` (no tests).
4. `test-writer`: writes only test files.
5. `code-reviewer`: read-only; ends with `APPROVED` or `CHANGES REQUIRED`.

## Docs (on-demand sub-skills)

`.claude/docs/` holds the detailed patterns and code templates. Skills, agents and rules point to specific files; read only what the task needs. Start from `.claude/docs/README.md` (the index). Do not read the whole folder up front.

## Known, deliberate inefficiencies (do not silently "fix" them outside their own task)

- `requests.service.ts`'s `addProvider` does N+1 queries (`postsRepository.findById` per request).
- `ratings.service.ts`'s `getAverages()` aggregates in JS instead of SQL `GROUP BY`.

These are acceptable for now and good talking points for the rubric's "why a CTE instead of multiple queries" interview question — only touch them if the task is explicitly about that.

## Conventions

- **Language is mixed by design, match the file you're editing.** Function/variable identifiers are in English (`getUsers`, `postsRepository`), but a lot of existing comments and every current user-facing error message are in Spanish (`"Usuario no encontrado"`). This `.claude/` configuration itself stays in English (that's the original harness's own convention, kept for consistency with what the professor taught), but do not rewrite existing Spanish comments/messages as a side effect of an unrelated task, and do not force new error messages into English if the feature you're extending already uses Spanish ones — consistency within a file beats a global rule here.
- Every behavior change ships with tests (this is part of what the professor's harness teaches — do not weaken this even though the project is time-boxed).
- Never read or edit `.env` files; update `.env.example` instead.
- Secrets stay on the server. Client env vars are `NEXT_PUBLIC_*` (this is Next.js, not Vite — the rubric's `VITE_` mention is a generic template artifact and does not apply here) and public only.

## Before calling a task done

1. `npm run typecheck` passes in every touched workspace.
2. `npm run lint` passes.
3. `npm test` is green.
4. `code-reviewer` returned `APPROVED`.

Headless version of the whole flow: `./.claude/scripts/harness.sh "feature description"`.
