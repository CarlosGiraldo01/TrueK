---
paths:
  - "client/src/hooks/**/*.ts"
  - "client/src/hooks/**/*.tsx"
---

# Client hooks

- **`client/src/hooks/` does not exist yet.** Create it the first time a genuinely reusable, non-shared piece of logic is needed — do not create it speculatively.
- One hook per file in `client/src/hooks/`, named `useThing.ts`, exported by name. Always `'use client';`.
- A hook encapsulates reusable stateful logic that is **not** shared app state (that belongs in a context): uploads, debounced values, geolocation (see `.claude/docs/client/map-geolocation.md` for the map feature specifically), media queries, subscriptions for one component.
- Return a plain object with state first and actions after: `{ imageUrl, isUploading, error, selectFile, clear }`.
- Errors are converted to user-facing strings with `getErrorMessage` from `@/lib/errors` (create this file per `.claude/rules/client-lib.md` if it doesn't exist yet) and returned as `error: string | null`; the hook does not throw to the component.
- Clean up everything created in an effect: object URLs (`URL.revokeObjectURL`), timers, listeners, channels, `navigator.geolocation.watchPosition` subscriptions (`clearWatch`).
- Validate cheap constraints (type, size) before any network call.
- Constants (limits, allowed types) are module-level `const`s; export what components need (for example `IMAGE_ACCEPT`).
- Hooks never render JSX.

Templates: `.claude/docs/client/hooks.md`, `.claude/docs/client/file-upload.md`, `.claude/docs/client/map-geolocation.md`.
