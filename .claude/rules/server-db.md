---
paths:
  - "server/src/db/**/*.ts"
  - "server/src/config/**/*.ts"
  - "server/src/**/*.repository.ts"
---

# Server database and config

- One shared `pool` (`pg.Pool`) exported from `src/db/pool.ts`, pointed at Supabase's **transaction pooler** (port `6543`, `ssl: { rejectUnauthorized: false }`, `max: 3`). Repositories import it; nothing else creates pools.
- **Schema does NOT live in code.** There is no `initDb()` and there must not be one. TrueK's tables (`users`, `posts`, `post_tags`, `tags`, `service_requests`, `chat_message`/`messages`, `ratings`, `notifications`, ...) already exist in a real, seeded Supabase project. A new table or column is a **migration**: write the exact SQL, show it to the user, and get it applied via Supabase (the `mcp__Supabase__apply_migration` tool when you have it, or the Supabase SQL editor) — never run DDL automatically and never add a startup script that creates tables.
- Primary keys are `UUID PRIMARY KEY DEFAULT gen_random_uuid()` (the `pgcrypto` extension is already enabled). Prefer `timestamptz` over bare `timestamp`/`date` for anything that represents a real moment in time — TrueK already hit a real bug where `meeting_date` was `date` and silently dropped the scheduled time; don't repeat that.
- Every query is parameterized. Column lists that repeat go in a constant (`const POST_COLUMNS = '...'`).
- Delete repositories return `boolean` (`rowCount > 0`) so the service can raise `404`.
- Environment access happens only in `src/config/index.ts`, which already fails fast on a missing `DATABASE_URL` — follow that same pattern (`if (!x) throw new Error(...)`) for any other required secret. Other modules import `config`, never `process.env` directly.
- Adding or renaming an env var means updating `server/.env.example` too. Never read or edit `.env`.
- For JOINs that return a nested object or array (e.g. a post's tags), use `json_build_object`/`json_agg(...) filter (where ... is not null)` in the query rather than a second round-trip or an N+1 loop — `posts.repository.ts` already does this for `tags` and is the pattern to copy. This is also an explicit Delivery 3 rubric requirement.

Templates: `.claude/docs/server/db-init.md`, `.claude/docs/server/repository.md`, `.claude/docs/server/env-config.md`.
