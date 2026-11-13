# TrueK — Delivery 3 rubric: exact text + current status

Read this once per session when the task is tied to the Delivery 3 rubric. It is a reference, not a to-do list to blindly execute — always confirm with the user before starting a big piece of it (auth, realtime), since each is a real multi-file change.

## The rubric, verbatim

> Note: For this delivery, socket/real-time implementation is required. Real-time communication will be evaluated in the final delivery.
>
> ### 1. Code Architecture & Best Practices
>
> **Folder Architecture & Scaffolding** — Estructura clara con separación completa: cada feature tiene sus propios archivos (router, controller, service, types). Componentes en carpetas individuales. Tipos compartidos en shared/
>
> **Backend: Separación de responsabilidades** — Patrón consistente en todas las features. Si usan clases, el controller recibe el service por constructor (inyección de dependencias). Middlewares de auth y errores separados y reutilizables
>
> **Frontend: Provider Pattern** — Providers bien definidos con interfaces tipadas. Separación clara: UserProvider (auth), providers por feature (rooms, chat). Páginas limpias sin lógica de negocio. Componentes reutilizables en carpetas individuales
>
> **Code Quality & Readability** — Código limpio y modular. Un componente por archivo. Callbacks sin filtrar eventos del DOM (onDelete(id) en vez de onDelete(e, id)). Queries SQL usan json_build_object para JOINs con objetos anidados
>
> **Environment Variables** — Separación clara de variables por entorno. Client usa prefijo VITE_ para variables públicas. Server centraliza config en un solo archivo. .env.example documentado con todas las variables necesarias
>
> **Sockets** — El proyecto implementa Sockets de Supabase para emitir y recibir eventos en vivo. El backend envía un evento (channel, event type y payload) y el frontend recibe el evento en los Providers
>
> ### 2. Prototype Functionality & Interaction
>
> **Functional Prototype Demo** — Flujo robusto con manejo de errores (toasts), estados de carga (loading, creating, deleting, sending), validaciones en formularios y feedback visual en cada interacción
>
> **Coverage of All Screens** — Todas las pantallas implementadas con componentes reutilizables (AuthForm, EmptyState, PrivateRoute). Rutas protegidas con redirección. Estados vacíos y de carga con UI dedicada
>
> **Auth & Session Management** — Refresh automático de token (interceptor en Axios). Logout limpia sesión y redirige. Manejo de sesión expirada. Lógica de auth centralizada en un provider, no dispersa en páginas
>
> ### 3. Interaction
>
> **Response to Questions / Understanding** — Articula decisiones de diseño con fundamento: por qué providers y no prop drilling, por qué separar features, por qué CTE en vez de múltiples queries. Sugiere mejoras futuras (ej. sockets para la entrega final)

## Current status (checked against the real code, not assumed)

| Item | Status | Note |
|------|--------|------|
| Feature folder structure (router/controller/service/types) | ✅ Done | All 6 server features follow it |
| `shared/` folder for shared types | ❌ Missing | `client/src/types/*.ts` duplicates `server/src/features/*/*.types.ts` field-for-field, by hand, in two places |
| Backend separation / DI by constructor | ⚠️ Partial | Consistent layering, but no classes/constructor injection (plain objects/functions) — a defensible, statable alternative, not an error |
| Middlewares (auth/errors) separated and reusable | ❌ Missing | `server/src/middlewares/` exists but is **empty** |
| Frontend Provider pattern | ✅ Mostly | `SessionContext`, `PostsContext`, `RequestContext`, `UsersContext`, `NotificationsContext`, `ChatContext` exist and are reasonably separated by domain |
| `json_build_object`/`json_agg` for nested JOINs | ⚠️ Partial | Only `posts.repository.ts` does this (for `tags`); no other feature has a nested-object JOIN yet |
| Env var separation / centralized config | ✅ Mostly | Server centralizes in `config/index.ts`; the rubric's `VITE_` line is a generic-template artifact — TrueK is Next.js, so `NEXT_PUBLIC_*` is the correct equivalent, not a gap |
| Sockets (Supabase Realtime) | ❌ Missing | Nothing in client or server touches Supabase Realtime, broadcast, or any socket mechanism at all |
| Toasts / loading states / form validation | ❌ Missing | No toast library, no consistent loading-state pattern found |
| `AuthForm` / `EmptyState` / `PrivateRoute` reusable components | ❌ Missing | None of the three exist |
| Protected routes with redirect | ❌ Missing | Every page renders regardless of session state |
| Auth & Session Management (token refresh, logout, expired session, centralized provider) | ❌ Missing | `SessionContext` is fake (hardcoded user id, no password check); login page logs form data to the console and never validates |

## What's deliberately NOT a rubric item, but is still real remaining work

- Making the map use the **viewer's real location** (providers' pins are already real — only the blue "you are here" dot is a hardcoded constant). See `.claude/docs/client/map-geolocation.md`.
- Real-time chat and notifications actually working end to end (the Sockets item above covers the transport; wiring it into `ChatContext`/`NotificationsContext` is the rest of that same piece of work).
- `requests.service.ts`'s `addProvider` (N+1 queries) and `ratings.service.ts`'s `getAverages()` (JS-side aggregation instead of SQL `GROUP BY`) — good, ready-made answers for "why a CTE/single query instead of multiple" in the interview, intentionally left as-is unless a task is specifically about optimizing them.

## How to use this during a session

- Starting work on any one row above → read the matching doc page (`.claude/docs/server/auth-middleware.md`, `realtime-supabase.md`, `.claude/docs/client/lib-axios-auth.md`, `components.md`, etc.) and use `/add-auth`, `/add-realtime`, `/add-component` as appropriate — do not hand-roll a parallel implementation that ignores those docs.
- Don't try to close every row in one pass. Auth and Sockets are each a full `/add-auth` / `/add-realtime` run on their own; confirm with the user which one to tackle first if they haven't said.
