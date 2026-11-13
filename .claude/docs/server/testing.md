# Server testing

Not set up yet (no `test` script, no test files). Stack: `node:test` + `node:assert/strict`, run with `tsx`. Optional: `supertest` for HTTP. Node here is 22.22, which satisfies the 22.3+ requirement for `--experimental-test-module-mocks`.

## Setup (done by `test-writer` if missing)

```bash
cd server && npm install -D supertest @types/supertest
```

Scripts: see `env-config.md` (`test` uses `--import tsx --experimental-test-module-mocks`). `typecheck` is `tsc --noEmit`; typecheck the tests with a separate `tsconfig.test.json` (`extends` the base, `include` `src` and `test`, `rootDir: "."`, `noEmit`) and point the `typecheck` script at it (`tsc --noEmit -p tsconfig.test.json`). Do NOT add `test/**/*` or change `rootDir` in the real `tsconfig.json`: that moves the build output and breaks the `start` script (`node dist/index.js`).

`tsconfig.test.json` (the build config stays untouched):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": { "rootDir": ".", "noEmit": true },
  "include": ["src/**/*", "test/**/*"]
}
```

Layout: `server/test/<feature>/<feature>.service.test.ts`, `<feature>.routes.test.ts`, `<feature>.repository.integration.test.ts`.

## Service test (repository mocked)

TrueK's repositories export one object per feature, so mock the whole module and reference its methods:

```ts
import assert from 'node:assert/strict';
import { beforeEach, mock, test } from 'node:test';

const requestsRepository = { findById: mock.fn() };
const messagesRepository = { create: mock.fn() };

mock.module('../../src/features/requests/requests.repository', {
  namedExports: { requestsRepository },
});
mock.module('../../src/features/messages/messages.repository', {
  namedExports: { messagesRepository },
});

const { messagesService } = await import('../../src/features/messages/messages.service');

beforeEach(() => {
  requestsRepository.findById.mock.resetCalls();
  messagesRepository.create.mock.resetCalls();
});

test('messagesService.create throws 404 when the request does not exist', async () => {
  requestsRepository.findById.mock.mockImplementation(async () => undefined);

  await assert.rejects(
    () => messagesService.create({ service_request_id: 'r1', sender_id: 'u1', content: 'hi' }, 'u1'),
    (error: { output?: { statusCode: number } }) => error.output?.statusCode === 404,
  );
});

test('messagesService.create stores the message when the caller owns the request', async () => {
  requestsRepository.findById.mock.mockImplementation(async () => ({ id: 'r1', client_id: 'u1', provider_id: 'u2' }));
  messagesRepository.create.mock.mockImplementation(async () => ({ id: 'm1', content: 'hi' }));

  const message = await messagesService.create({ service_request_id: 'r1', sender_id: 'u1', content: 'hi' }, 'u1');

  assert.equal(message.id, 'm1');
});
```

Import the module under test **after** `mock.module` (dynamic `await import`). Mock the whole module the service imports (repository, `config/supabase`, `config/realtime`).

## Route test (supertest)

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import request from 'supertest';
import app from '../../src/app';

test('POST /requests/:id/messages returns 400 when content is missing', async () => {
  const res = await request(app).post('/requests/r1/messages').send({});

  assert.equal(res.status, 400);
});
```

TrueK's routes have **no `/api` prefix** — call `request(app).get('/users')`, not `/api/users`.

TrueK's `server/tsconfig.json` already uses `"module": "CommonJS"` and `server/package.json` has no `"type": "module"`, so `import app from '../../src/app'` works directly in tests without the module-unwrapping workaround that `module: nodenext` projects need. If either of those ever changes, re-check this.

Validation failures (400) are testable without a database because they fail before the repository. Auth failures (401, once `authMiddleware` exists) are too. For success paths, mock the service module like above.

## Auth tests (once `/add-auth` has run)

- No header → 401. `Authorization: Basic x` → 401.
- Malformed/expired JWT → 401.
- Correct credentials on `/auth/login` → 200 with a token; wrong password → 401.
- Other user's resource (e.g. messaging on a request that isn't the caller's) → 404.

## Repository integration tests

Need the **real** Supabase database; skip when it is not configured, and never touch the already-seeded demo data:

```ts
import { test } from 'node:test';

const hasDb = Boolean(process.env.DATABASE_URL);

test('messagesRepository.create inserts a message', { skip: !hasDb }, async () => {
  // create a disposable row against a disposable/test service_request, assert the returned row,
  // then delete it. Never assert against or mutate Valentina/Camila/Camilo's seeded rows.
});
```

There is no separate test database configured yet for TrueK — if a feature genuinely needs integration tests, flag to the user that a disposable test schema or a second (free-tier) Supabase project would be safer than running them against the project's one real, seeded database, and default to skipping integration tests (keep only service/route tests) until that's set up.

## What to cover per feature

Happy path, each validation error, not found, ownership/unauthorized, side effects (realtime event emitted on success and not on failure, external API failure → 502).
