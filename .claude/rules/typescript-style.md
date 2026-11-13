---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript style

- `strict` mode (already on in both `tsconfig.json`s). No `any`, no `@ts-ignore`; use `unknown` and narrow.
- Type every parameter and return value of exported functions.
- Named exports only, except Next.js files that require a default export (`page.tsx`, `layout.tsx`).
- Arrow functions for services, controllers, repositories, hooks and components: `export const name = async () => {}`.
- Style: match the existing code (double or single quotes — check the file you're editing; TrueK's server code currently uses double quotes in several files, so don't reformat a whole file just to switch quote style). Once `server/` gets an ESLint config (see `.claude/docs/server/env-config.md`), its rules become the source of truth.
- `console.log` should be removed before finishing a feature (`console.error` in a catch that swallows an error on purpose is fine).
- Unused params are prefixed with `_` (`_req`, `_res`).
- Function/variable names are in English. Comments and user-facing error messages in the existing code are often in Spanish (e.g. `"Usuario no encontrado"`) — match whatever the file you're editing already uses rather than mixing languages within one file. Comment the *why* (a constraint, a trade-off), not the *what*.
- Always finish with `npm run typecheck` and `npm run lint` clean in the workspace you touched (once those scripts exist — see `CLAUDE.md`).
