---
paths:
  - "client/src/context/**/*.tsx"
---

# Client contexts

- One file per context: `<Name>Context.tsx` exporting `<Name>Provider` and the hook `use<Name>`. Always `'use client';`. TrueK already has `SessionContext`, `PostsContext`, `RequestContext`, `UsersContext`, `NotificationsContext`, `ChatContext`, `DataGate` — read the closest one before adding a new context.
- The context value is typed with `<Name>ContextValue`; the context is `createContext<... | null>(null)`.
- The hook throws if the provider is missing: `throw new Error('useX must be used within an XProvider')`.
- The provider owns the state, loads initial data in a `useEffect` (define `onInit` inside and call it), and exposes async actions (`createX`, `deleteX`) that call the API and then update local state.
- Update state with functional setters (`setItems((prev) => ...)`). Make appends idempotent (check `id`) when realtime and HTTP responses can both deliver the same item — this matters as soon as `/add-realtime` wires Supabase Broadcast into `ChatContext`/`NotificationsContext`.
- Realtime: subscribe in a `useEffect` and **always** clean up in the effect's return (`supabase.removeChannel`).
- Browser-only external state (`localStorage`) is read with `useSyncExternalStore` plus a server snapshot, never directly during render. **`SessionContext` currently does neither of these things** — it's a `useState` that fakes a logged-in user and the login page doesn't check any credentials. Replacing it with a real, `useSyncExternalStore`-based `AuthContext` is the `/add-auth` skill's job (see `.claude/docs/client/lib-axios-auth.md`), not something to patch inline from an unrelated feature.
- Session-scoped providers are re-created per user with `key={user?.id ?? 'anonymous'}` so state resets on login/logout.
- Providers are mounted in the page or layout that needs them, as low in the tree as possible. Cross-cutting ones (auth, toasts) go in `app/layout.tsx`. TrueK has no toast provider yet — see `.claude/docs/workflow/truek-rubric-gaps.md`.
- Do not put pure UI state used by a single component in a context.

Templates: `.claude/docs/client/contexts.md`, `.claude/docs/client/realtime-subscription.md`.
