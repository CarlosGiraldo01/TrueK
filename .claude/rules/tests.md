---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "server/test/**/*.ts"
  - "client/test/**/*.{ts,tsx}"
---

# Tests

Neither workspace has test tooling installed yet. `test-writer` installs the minimal setup described in `.claude/docs/server/testing.md` / `.claude/docs/client/testing.md` the first time it is needed — do not skip tests just because the scripts don't exist.

**Server** (`server/test/<feature>/*.test.ts`): `node:test` + `node:assert/strict`, run with `tsx` (`npm test`). Node is 22.22 locally, which satisfies the 22.3+ requirement for `--experimental-test-module-mocks`.
- Service tests replace the repository with `mock.module` and assert behavior: success value, `Boom` status codes, and that ownership is enforced.
- Route tests use `supertest` against the exported `app` (TrueK's `server/src/app.ts` already exports the app separately from `index.ts`, which is what lets this work without opening a port).
- Repository tests need the real Supabase database; keep them separate (`*.integration.test.ts`), skip when `DATABASE_URL` is unset, and never assert on or mutate the already-seeded demo rows (Valentina/Camila/Camilo and their posts/requests) — create and clean up disposable rows instead.

**Client** (`client/test/**` or next to the file): Vitest + Testing Library (`@testing-library/react`, `user-event`), jsdom environment.
- Test components through what the user sees and does (`getByRole`, `userEvent.click`), not through implementation details.
- Wrap components in the real provider; mock `@/lib/api` (TrueK's axios instance, currently at `client/src/lib/api.ts`) at the network boundary with `vi.mock`.
- Hooks: `renderHook`. Assert cleanup (for example that a realtime channel is removed on unmount).

**Both**
- Names describe behavior: `test('createMessageService throws 404 when the request does not exist', ...)`.
- Each feature covers: happy path, validation errors, not found, and unauthorized/ownership when applicable.
- Expected values are written by hand, never computed with the code under test.
- One main assertion per test. No `any`, no `@ts-ignore`.
- If a test fails because of a real bug, do not weaken the test: report the bug.

Templates: `.claude/docs/server/testing.md`, `.claude/docs/client/testing.md`.
