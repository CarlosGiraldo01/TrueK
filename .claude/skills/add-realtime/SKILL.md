---
name: add-realtime
description: Adds realtime events across server and client using Supabase Realtime Broadcast — TrueK's chosen provider and the Delivery 3 rubric's explicit "Sockets" requirement. Use when changes must reach other connected users without a page refresh.
argument-hint: "<events and channel, e.g. new-message on channel request:<id>>"
disable-model-invocation: true
---

# Add realtime events

Argument: the events (for example `new-message on channel request:<id>` or `new-notification on channel user:<id>`).

TrueK's default and rubric-mandated provider is **Supabase Realtime Broadcast** (`.claude/docs/server/realtime-supabase.md` + `.claude/docs/client/realtime-subscription.md`). Only use socket.io (`realtime-socketio.md`) if the task explicitly needs client→server events/rooms/acks that Broadcast can't do — if so, flag that choice to the user first, since it does not satisfy the rubric's literal "Sockets de Supabase" wording on its own.

Steps:

1. Define the contract: channel name, event name (kebab-case, past tense: `new-message`), payload shape. Write it in the plan. TrueK's two obvious first uses are chat (`request:<id>` channel, `new-message` event) and notifications (`user:<id>` channel, `new-notification` event) — see `.claude/docs/workflow/truek-rubric-gaps.md`.
2. Server: add `@supabase/supabase-js` and `src/config/supabase.ts` (service-role key) if they don't exist yet. Emit **from the service** after the repository call succeeds. Emission is fire-and-forget: log failures, never throw.
3. Client: add `lib/supabase.ts` (publishable key only) if it doesn't exist yet. Subscribe inside the context's `useEffect`, clean up on unmount, make handlers idempotent (the HTTP response and the event can both deliver the same item).
4. Tests: service emits the event on success and not on failure; the client handler updates state once even when the event arrives twice.
5. Run `npm run typecheck`, `npm run lint`, `npm test` in both workspaces.

Never expose the Supabase service-role key to the client: the browser only ever uses the publishable key.
