# Client testing

Not set up yet (client has `lint` only — no `typecheck`, no `test`, no Vitest). Stack: Vitest + Testing Library + jsdom.

## Setup (done by `test-writer` if missing)

```bash
cd client && npm install -D vitest @vitejs/plugin-react jsdom \
  @testing-library/react @testing-library/user-event @testing-library/jest-dom
```

`client/vitest.config.ts`:

```ts
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
  },
  resolve: {
    // TrueK's `@/` alias resolves to client/src — mirror the real tsconfig path mapping here
    alias: { '@': path.resolve(__dirname, 'src') },
  },
});
```

`client/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

Scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`. Add `"types": ["vitest/globals"]` to `tsconfig.json` and include `test/**/*`.

## Component test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, test, vi } from 'vitest';
import { CreatePostForm } from '@/components/feed/CreatePostForm';

const createPost = vi.fn();

vi.mock('@/context/PostsContext', () => ({
  usePosts: () => ({ posts: [], createPost, deletePost: vi.fn() }),
}));

test('CreatePostForm submits the trimmed name', async () => {
  const user = userEvent.setup();
  render(<CreatePostForm />);

  await user.type(screen.getByLabelText('Post name'), '  gardening help  ');
  await user.click(screen.getByRole('button', { name: 'Create' }));

  expect(createPost).toHaveBeenCalledWith(expect.objectContaining({ name: 'gardening help' }));
});
```

## Context test (real provider, mocked network)

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { PostsProvider, usePosts } from '@/context/PostsContext';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({ api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() } }));

test('PostsProvider loads posts on mount', async () => {
  vi.mocked(api.get).mockResolvedValue({ data: [{ id: '1', name: 'help moving' }] });

  const { result } = renderHook(() => usePosts(), { wrapper: PostsProvider });

  await waitFor(() => expect(result.current.posts).toHaveLength(1));
});

test('usePosts throws outside its provider', () => {
  expect(() => renderHook(() => usePosts())).toThrow('usePosts must be used within a PostsProvider');
});
```

Mock `@/lib/api` (TrueK's real axios module path), not `@/lib/axios` — that file doesn't exist in this project.

## Hook test with cleanup

```ts
test('useGeolocation falls back when geolocation is unsupported', () => {
  const originalGeolocation = navigator.geolocation;
  // @ts-expect-error -- deleting a readonly navigator property for the test
  delete navigator.geolocation;

  const { result } = renderHook(() => useGeolocation([3.45, -76.53]));

  expect(result.current.position).toEqual([3.45, -76.53]);
  expect(result.current.isSupported).toBe(false);

  Object.defineProperty(navigator, 'geolocation', { value: originalGeolocation, configurable: true });
});
```

## Realtime

Mock `@/lib/supabase` so `channel().on().subscribe()` captures handlers; call a captured handler twice with the same payload and assert one item; unmount and assert `removeChannel` was called.

## Guidelines

- Query by role/label/text, never by class or test-id unless there is no accessible alternative.
- Mock at the network boundary (`@/lib/api`, `@/lib/supabase`), not inside components.
- Always test: initial render states (loading/empty), the main action, an error path (`role="alert"`), and cleanup.
- Hand-written expected values; no snapshots of whole pages.

Note: a fresh Next.js checkout may fail `tsc` with `Cannot find name 'LayoutProps'` (or `PageProps`) until the route types are generated: run `npx next typegen` (or `next dev`/`next build` once) before `npm run typecheck`. Do not rewrite existing layout code to work around it.
