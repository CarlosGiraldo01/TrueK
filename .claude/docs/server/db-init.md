# Database changes (Supabase migrations, not `initDb`)

**This is the single biggest difference from the original `fullstack-harness`.** That harness assumes a code-level `initDb()` that creates tables idempotently at startup. TrueK does **not** work that way: a real Supabase Postgres project already exists and is seeded with real data (3 users, posts, service requests, messages, notifications). There is no `initDb()` in `server/src/`, and one must never be added.

## How a schema change actually happens here

1. Write the exact SQL for the change (new table, new column, new constraint, new index).
2. Show it to the user in your response, in a fenced SQL block, before running anything.
3. Get it applied:
   - If you have the `mcp__Supabase__apply_migration` tool available, use it (named migration, e.g. `add_bucket_list_table`) after the user has seen the SQL and agreed.
   - If you do not have that tool, ask the user to run it themselves in the Supabase SQL editor and confirm back before you write any repository code against the new shape.
4. Only after the migration is applied, write the repository functions (`repository.md`) against the resulting columns.

## Conventions for the SQL itself

- Primary keys: `id uuid primary key default gen_random_uuid()` (`pgcrypto` is already enabled).
- Use `timestamptz`, not bare `timestamp` or `date`, for anything that represents a real moment — TrueK already hit a real bug where `meeting_date` was `date` and silently dropped the scheduled time; it was fixed with `alter column meeting_date type timestamptz using meeting_date::timestamptz`. Don't repeat that mistake in a new table.
- Foreign keys declare `on delete cascade` when the child has no meaning without the parent (e.g. a message without its request).
- Enums: TrueK currently mixes **Postgres `ENUM` types** (`user_role`, `service_status`, `notification_type` — check `\dT` or ask via Supabase tooling before assuming which one a table uses) and plain columns with a `CHECK` constraint for numeric scales (`rating smallint check (rating between 1 and 5)`). Match whichever the table you're extending already uses; for a brand-new table, a `CHECK` constraint is simpler to evolve than an `ENUM` (Postgres enums need a separate `ALTER TYPE` to add a value) unless there's a strong reason to prefer the enum.
- Row Level Security: every existing table has RLS enabled with **zero public policies** — this is intentional, "closed by default", since there is no Supabase Auth in use; only the backend (holding the full connection string) can touch the data. Keep doing this for any new table: `alter table <name> enable row level security;` and no policies, unless the user explicitly asks for a table the client should query directly through Supabase (which is not how anything currently works).
- Never `DROP` or destructively `ALTER` an existing table without writing the migration, showing it, and getting explicit confirmation — a change to an existing table affects the real seeded data (Valentina/Camila/Camilo and everything attached to them).

## Example: a brand-new table

```sql
create table if not exists public.saved_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.saved_posts enable row level security;
```

## Example: adding a column to an existing table

```sql
alter table public.posts add column if not exists is_active boolean not null default true;
```

Always `if not exists` / `if exists` where the SQL supports it, so a re-run is harmless — but this is a safety net, not a reason to skip asking before running it the first time.

## Connection notes

The server connects via `server/src/db/pool.ts`, a single `pg.Pool` against Supabase's **transaction pooler** (port `6543`), with `ssl: { rejectUnauthorized: false }` and `max: 3` (the pooler already load-balances, so the app pool stays small). One pool per process; never create a pool inside a request handler.
