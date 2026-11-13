# Config, env vars and bootstrap

## `src/config/index.ts`: the only reader of `process.env`

This already exists and already fails fast on a missing `DATABASE_URL` — extend it the same way for any new required secret, don't invent a second config file.

```ts
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Falta la variable de entorno DATABASE_URL');
}

// Add new required secrets the same way, e.g.:
// const jwtSecret = process.env.JWT_SECRET;
// if (!jwtSecret) throw new Error('Falta la variable de entorno JWT_SECRET');

export const config = {
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
  databaseUrl,
  // jwtSecret,
  // supabaseUrl: process.env.SUPABASE_URL ?? '',
  // supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ?? '',
  // imagesBucket: process.env.IMAGES_BUCKET ?? 'images',
};
```

(The fail-fast error message is in Spanish because the existing one is — match it, don't switch to English for just the new lines.)

## Third-party clients (`config/<name>.ts`)

```ts
// config/supabase.ts (new file, created the first time realtime or uploads need it)
import { createClient } from '@supabase/supabase-js';
import { config } from './index';

export const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);
```

## `server/.env.example` (committed, placeholders only)

Current real content (keep the format, just add new lines as new vars are introduced):

```
DATABASE_URL=postgresql://postgres.<project-ref>:<password>@<host>.pooler.supabase.com:6543/postgres
CLIENT_ORIGIN=http://localhost:3000
```

Every new variable is added to `config/index.ts` **and** `.env.example`. Never read or edit `server/.env`.

## `app.ts` and `index.ts`

Already split this way — keep it, it's what lets tests import `app` without opening a port:

```ts
// app.ts (abridged — real file mounts all 6 existing feature routers the same way)
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { usersRouter } from './features/users/users.router';
// ... other feature routers

export const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

app.get('/health', (_req, res) => { res.json({ ok: true }); });

app.use('/users', usersRouter);
// ... app.use('/<feature>', <feature>Router) for every feature, no '/api' prefix

// Once it exists: app.use(errorHandler);  // always last

export default app;
```

```ts
// index.ts
import app from './app';
import { config } from './config';

app.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
```

There is **no `initDb()`/`initStorage()` call here** — the database schema lives in Supabase already (see `.claude/docs/server/db-init.md`); only add an `initStorage()` call if `/add-file-upload` introduces Supabase Storage buckets that need idempotent creation at startup.

## `package.json` scripts (server) — target shape

Current scripts are `dev`, `build`, `start` only. Add the rest the first time they're needed (`test-writer` adds `test`; anyone can add `typecheck`/`lint` as soon as they're needed):

```json
{
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js",
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "test": "node --import tsx --experimental-test-module-mocks --test \"test/**/*.test.ts\""
}
```

## ESLint (server) — does not exist yet

Server has `eslint` nowhere in its dependencies and no config file. When it's needed (first time `lint` matters, typically when `test-writer` or a reviewer asks for it), add `eslint`, `@eslint/js`, `typescript-eslint`, `@stylistic/eslint-plugin` as dev dependencies and a flat config matching the client's style for consistency: `indent 2`, `quotes` matching the file (don't force a repo-wide quote-style rewrite), `semi always`, `comma-dangle always-multiline`, `arrow-parens always`, `no-console warn`, unused vars error with `argsIgnorePattern: '^_'`; ignore `dist/` and `node_modules/`.
