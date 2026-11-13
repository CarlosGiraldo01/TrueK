---
name: add-component
description: Adds one React component to client/src/components following the project conventions (named export, typed props, Tailwind, loading/empty/error states). Use for a single UI piece.
argument-hint: "<Name and purpose>"
---

# Add a component

Argument: component name and purpose (for example `EmptyState shows a friendly message and optional action when a list has no items`).

1. Read `.claude/rules/client-components.md` and `.claude/docs/client/components.md` (template, form and list examples).
2. Check `client/src/components/ui/` and `client/src/components/feed/` for an existing component to reuse or extend, and for where the new one best belongs (a generic, cross-feature one like `EmptyState` or `PrivateRoute` goes in `ui/`).
3. Create `client/src/components/<domain>/<Name>.tsx`. Get data from an existing `useX()` hook or accept props; do not create a context here (use `/add-context`).
4. Add a Testing Library test following `.claude/docs/client/testing.md`.
5. Run `npm run typecheck`, `npm run lint` and `npm test` in `client/`.

If the component needs new shared state, new API calls or realtime, stop and use `/add-client-feature` instead.
