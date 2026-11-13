# Contexts

A context = state + API actions for one domain, exposed through a `useX` hook. TrueK already has several real ones under `client/src/context/`: `SessionContext` (fake auth — see `lib-axios-auth.md`), `PostsContext`, `RequestContext`, `UsersContext`, `NotificationsContext`, `ChatContext`, `DataGate`. Read the closest existing one before writing a new one — some already mix a local `localStorage` cache with server data (`PostsContext` does this for posts created client-side); match that pattern only if the new feature genuinely needs offline-style local creation, not by default.

## Template

```tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Post } from '@/types';

interface PostsContextValue {
  posts: Post[];
  createPost: (data: Partial<Post>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

const PostsContext = createContext<PostsContextValue | null>(null);

export const PostsProvider = ({ children }: { children: React.ReactNode }) => {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const onInit = async () => {
      const res = await api.get<Post[]>('/posts');
      setPosts(res.data);
    };

    onInit();
  }, []);

  const createPost = async (data: Partial<Post>) => {
    const res = await api.post<Post>('/posts', data);
    setPosts((prev) => [...prev, res.data]);
  };

  const deletePost = async (id: string) => {
    await api.delete(`/posts/${id}`);
    setPosts((prev) => prev.filter((post) => post.id !== id));
  };

  return (
    <PostsContext.Provider value={{ posts, createPost, deletePost }}>
      {children}
    </PostsContext.Provider>
  );
};

export const usePosts = () => {
  const context = useContext(PostsContext);

  if (!context) {
    throw new Error('usePosts must be used within a PostsProvider');
  }

  return context;
};
```

Note: `client/src/lib/api.ts` is TrueK's existing axios instance (`baseURL: process.env.NEXT_PUBLIC_API_URL`), not `@/lib/axios` — use that import path, not a file that doesn't exist.

## Variants

**Status machine** (drawing, wizard flows, the map): `status: 'loading' | 'idle' | ...`, plus a `draft`. Wrap `setStatus` so leaving a state clears related data.

**Initial load with `finally`:** `try { ... } finally { setStatusState('idle'); }` so the UI never stays in `loading`.

**Param-driven provider** (detail page): `RequestProvider({ requestId, children })`, effect depends on `[requestId]`, use `Promise.all` for parallel loads.

**Idempotent updates** (needed once realtime is added via `/add-realtime`):

```tsx
const appendMessage = (messages: Message[], message: Message) =>
  messages.some((m) => m.id === message.id) ? messages : [...messages, message];
```

**Per-user reset:** split into `XState` (does the work) and `XProvider` that renders `<XState key={user?.id ?? 'anonymous'}>`; state resets on login/logout. TrueK's current `SessionContext` does **not** do this yet — it holds a single hardcoded user id with no real reset semantics; `/add-auth` introduces the real `AuthContext` this pattern is for.

**Context depending on another context:** `const { user } = useSession();` (or `useAuth()` once that exists) inside the inner component; fetch only when authenticated, with `[user?.id]` as the dependency.

**Request in flight:** `isSending` boolean set in `try/finally` around the call.

**Browser storage as state** (session/auth): `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)` with a module-level `listeners` set and a `notify()` after each write. The server snapshot returns `null`, which avoids hydration mismatches. Expose `isReady` (true after hydration) so pages can wait before redirecting. See `lib-axios-auth.md`.

**Toasts (UI-wide):** does not exist yet. `ToastProvider` in `app/layout.tsx` exposing `showToast(message, type)`; keep timers in a ref set and clear them on unmount. This is an explicit rubric gap (see `.claude/docs/workflow/truek-rubric-gaps.md`).

## Mounting

```tsx
// app/layout.tsx — once AuthProvider/ToastProvider exist
<AuthProvider>
  <ToastProvider>{children}</ToastProvider>
</AuthProvider>
```

Feature providers go in the page that needs them (a request-detail page wraps `RequestProvider`; the map screen wraps whatever provider holds provider-location state).

## Error handling

Actions may throw (axios errors). Let the calling component catch and show a message, or catch in the context and call `showToast` once it exists. There is no `getErrorMessage` helper yet (`client/src/lib/errors.ts` doesn't exist) — create it per `.claude/rules/client-lib.md` the first time a form needs to show a real server error message instead of a generic one.
