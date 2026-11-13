---
name: add-db-table
description: Proposes a Supabase migration for a new table or column, gets it applied, then adds the repository functions that use it. Use when a feature needs persistent data.
argument-hint: "<table and columns>"
---

# Add a database table or column

Argument: the table and its columns (for example `saved_posts(user_id, post_id)`), or the column to add to an existing table.

1. Read `.claude/rules/server-db.md` and `.claude/docs/server/db-init.md` (migration conventions: `timestamptz`, RLS enabled with no public policies, `on delete cascade`, `if not exists`).
2. Read `.claude/docs/server/repository.md` for the repository template (object-per-feature, `json_build_object`/`json_agg` for nested JOINs).
3. Write the exact migration SQL and show it to the user in your response **before running anything**.
4. Get it applied: use the `mcp__Supabase__apply_migration` tool if you have it (after the user has seen and agreed to the SQL), or ask the user to run it in the Supabase SQL editor and confirm back.
5. Add the types to `<feature>.types.ts` (entity + `Create*DTO`) — only after the migration is confirmed applied.
6. Add repository functions to the feature's `<feature>Repository` object: `create` (`RETURNING`), `findAll`, `findById` (and a by-owner variant when user-scoped), `delete` (returns `boolean`).
7. Add repository integration tests (skipped when `DATABASE_URL` is unset, and never touching the already-seeded demo data) per `.claude/docs/server/testing.md`.
8. Run `npm run typecheck` and `npm run lint` in `server/`.

Never add a code-level `initDb()` or any startup script that creates/alters tables — that is not how this project's schema works (see `.claude/rules/server-db.md`).
