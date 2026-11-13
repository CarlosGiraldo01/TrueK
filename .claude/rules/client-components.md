---
paths:
  - "client/src/components/**/*.tsx"
  - "client/src/app/**/*.tsx"
---

# Client components and pages

- One component per file in `client/src/components/`, file named after the component in PascalCase (`MessagesList.tsx`), exported by name: `export const MessagesList = () => {}`. (TrueK currently has components under `client/src/components/ui/` and `client/src/components/feed/` — keep grouping by domain subfolder rather than flattening everything into one folder.)
- Components that use hooks, state, effects or browser APIs start with `'use client';`. Keep server components the default in `app/` when nothing interactive is needed.
- Components are presentational + composition. Data fetching and mutations live in contexts (TrueK already has several: `SessionContext`, `PostsContext`, `RequestContext`, `UsersContext`, `NotificationsContext`, `ChatContext`) or hooks, consumed through `useX()`. Do not call the `api` axios instance directly from a component unless it is a one-off form submit with no shared state.
- Props are typed with an inline interface above the component; callbacks are named `onX` and never leak DOM events (`onDelete(id)`, not `onDelete(e, id)`) — this is an explicit Delivery 3 rubric line item.
- Styling is Tailwind utility classes. Shared class strings go in a `const` in the same file (or `components/<name>Styles.ts` when reused).
- Pages in `app/` compose providers + components and stay thin. Dynamic route params are a `Promise` read with `use(params)` (Next.js 16).
- Render all states: loading, empty, error. Disable submit buttons while a request is in flight. TrueK currently has **no reusable `EmptyState` component** — introduce one (see `.claude/docs/workflow/truek-rubric-gaps.md`) rather than hand-rolling empty-state markup per page once more than one page needs it.
- Accessibility: labels for inputs, `role="alert"` for errors, buttons are `<button type="button">` unless submitting.
- Before using any Next.js API, check the version in `client/package.json` (currently Next 16) and read the matching guide in `client/node_modules/next/dist/docs/` if it exists: this Next.js can differ from what you remember.

Templates: `.claude/docs/client/components.md`.
