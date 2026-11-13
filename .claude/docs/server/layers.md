# Server layers

## Folder map

```
server/src/
├── app.ts                    # builds the Express app (no listen) — already exports `app` as default
├── index.ts                  # loads app, listens (no initDb: schema lives in Supabase already)
├── config/
│   └── index.ts              # dotenv + typed config object (DATABASE_URL, PORT, CLIENT_ORIGIN, ...)
├── db/
│   └── pool.ts                # pg Pool against Supabase's transaction pooler (port 6543)
├── middlewares/               # currently EMPTY — errorMiddleware.ts and authMiddleware.ts belong here
└── features/<feature>/
    ├── <feature>.router.ts
    ├── <feature>.controller.ts
    ├── <feature>.service.ts
    ├── <feature>.repository.ts
    └── <feature>.types.ts
```

Already built: `users`, `posts`, `requests`, `ratings`, `messages`, `notifications`.

## Request flow

```
HTTP → router → controller → service → repository → PostgreSQL (Supabase)
                    │            │
         validates input    business rules, ownership,
         picks status       broadcasts, external APIs
```

| Layer | Knows about | Must not |
|-------|-------------|----------|
| Router | verbs, paths, middlewares, controllers | contain logic |
| Controller | `req`, `res`, validation, status codes | run SQL or business rules |
| Service | repositories, other services, Boom, external APIs | touch `req`/`res` |
| Repository | `pool`, SQL, row mapping | throw HTTP errors, call services |

## Naming

Repositories and services export one object per feature with short action-verb methods: `postsRepository.findAll()`, `postsRepository.findById(id)`, `requestsService.getAll()`. Controllers export individual bare-verb functions with no `Controller` suffix: `getPosts`, `getPostById`, `createPost`, `deletePost`. Types: `Post`, `CreatePostDTO`.

## Adding a feature, in order

1. `types.ts`
2. If a new table/column is needed: write the migration SQL, show it to the user, get it applied via Supabase (see `db-init.md`) — **before** writing the repository
3. `repository.ts` (see `repository.md`)
4. `service.ts` (see `service.md`)
5. `controller.ts` and `router.ts` (see `router-controller.md`)
6. mount in `app.ts`: `app.use('/<feature>', <feature>Router)` — TrueK mounts routers directly on the path, with **no `/api` prefix**; follow that, don't add one
7. tests (see `testing.md`)

## Mounting

```ts
// app.ts (abridged, matches the real file)
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { usersRouter } from './features/users/users.router';
import { postsRouter } from './features/posts/posts.router';
// ...

export const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => { res.json({ ok: true }); });

app.use('/users', usersRouter);
app.use('/posts', postsRouter);
// ... every feature router, same pattern

// Once middlewares/errorMiddleware.ts exists, it is registered LAST:
// app.use(errorHandler);

export default app;
```
