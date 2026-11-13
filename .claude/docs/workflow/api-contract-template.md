# API contract template (for `feature-planner`)

Fill this in the plan before any code is written. Server and client writers implement exactly this. TrueK's routes have **no `/api` prefix** — write `GET /posts`, not `GET /api/posts`.

## Endpoints

| Method + path | Auth | Request body / params | Success | Errors |
|---------------|------|-----------------------|---------|--------|
| `POST /requests/:id/messages` | yes | `{ content: string }` (non-empty) | `201` `Message` | `400` content required, `404` request not found or not yours |
| `GET /requests/:id/messages` | yes | `:id` uuid | `200` `Message[]` | `404` not found or not yours |

## Types (shared shape)

```ts
interface Message { id: string; service_request_id: string; sender_id: string; content: string; created_at: string }
```

These should match `server/src/features/<feature>/<feature>.types.ts` field-for-field; note that until the `shared/` gap is closed (see `truek-rubric-gaps.md`), the client's copy under `client/src/types/` must be kept in sync by hand.

## Database

```
-- only if a new table/column is genuinely needed; otherwise "none"
-- this is a migration to propose via Supabase, NOT a local initDb() entry — see .claude/docs/server/db-init.md
alter table public.posts add column if not exists is_active boolean not null default true;
```

## Realtime (if any)

| Channel | Event | Payload | Emitted by | Handled by |
|---------|-------|---------|------------|------------|
| `request:<id>` | `new-message` | `Message` | `messagesService.create` | `ChatContext` |

## Server files

- `features/messages/messages.{types,repository,service,controller,router}.ts`: list the functions/methods to add per layer, using TrueK's real convention (`messagesRepository`/`messagesService` as objects, bare-verb controller functions — see `.claude/rules/server-layers.md`).
- Migration (if any, see Database above). `app.ts`: mount router with no `/api` prefix.

## Client files

- `client/src/types/`: new/changed interfaces (and the matching server `.types.ts`, kept in sync by hand).
- `context/ChatContext.tsx`: state + actions added.
- `components/`: list each component with its props.
- The page that mounts the relevant provider.

## Test cases

Server: service (happy path, not found, ownership), routes (validation). Client: form submit, list empty/non-empty, realtime handler dedupes by id.

## Assumptions

Anything decided without asking (auth model is fixed project-wide — see `CLAUDE.md` — but things like realtime channel naming, ownership rules for a brand-new resource, etc. go here).
