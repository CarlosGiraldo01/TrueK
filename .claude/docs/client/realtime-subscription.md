# Realtime subscriptions on the client

Not used anywhere yet. Supabase Realtime Broadcast is the project's chosen provider (see `.claude/docs/server/realtime-supabase.md`) — this satisfies the Delivery 3 rubric's explicit Sockets requirement: *"...el frontend recibe el evento en los Providers."* Subscribe inside the context's `useEffect`, always unsubscribe in the cleanup, and make state updates idempotent.

## Supabase Broadcast

`lib/supabase.ts` (does not exist yet — publishable key only, never the service-role key):

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
);
```

Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `client/.env.example`.

## `ChatContext`: subscribe per request

```tsx
useEffect(() => {
  const channel = supabase
    .channel(`request:${requestId}`)
    .on('broadcast', { event: 'new-message' }, ({ payload }) => {
      setMessages((prev) => appendById(prev, payload as Message));
    })
    .subscribe();

  const onInit = async () => {
    const res = await api.get<Message[]>(`/messages?service_request_id=${requestId}`);
    // Merge instead of replace: a broadcast may have arrived before the HTTP response
    setMessages((prev) => res.data.reduce(appendById, prev));
  };

  onInit();

  return () => {
    supabase.removeChannel(channel);
  };
}, [requestId]);
```

## `NotificationsContext`: subscribe per logged-in user

```tsx
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel(`user:${user.id}`)
    .on('broadcast', { event: 'new-notification' }, ({ payload }) => {
      setNotifications((prev) => appendById(prev, payload as Notification));
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]);
```

Where `appendById` is:

```ts
const appendById = <T extends { id: string }>(items: T[], item: T): T[] =>
  items.some((existing) => existing.id === item.id) ? items : [...items, item];
```

## socket.io (fallback only — see `.claude/docs/server/realtime-socketio.md` for when this applies instead of Supabase)

`lib/socket.ts`:

```ts
import { io } from 'socket.io-client';

// autoConnect false: the provider connects when it mounts
export const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? '', { autoConnect: false });
```

In the provider:

```tsx
useEffect(() => {
  const onMessage = (message: Message) => setMessages((prev) => appendById(prev, message));

  socket.connect();
  socket.emit('request:join', requestId);
  socket.on('new-message', onMessage);

  return () => {
    socket.emit('request:leave', requestId);
    socket.off('new-message', onMessage);
    socket.disconnect();
  };
}, [requestId]);
```

Authenticated sockets: `socket.auth = { token: getStoredToken() };` before `connect()`.

## Rules

- The same item can arrive from the HTTP response and from the broadcast event: dedupe by `id`.
- Never forget the cleanup; a missing `removeChannel` duplicates handlers on every re-mount.
- Merge the initial fetch with events already received (see `reduce(appendById, prev)`).
- Event name and payload shape come from the plan's contract; reuse the existing `client/src/types/*.ts` interfaces (`Message`, `Notification`) rather than redefining them for the realtime payload.
- Connection state (`connected`, `reconnecting`) can be exposed in the context when the UI needs it — not needed for the rubric requirement itself.
- Test: simulate the event twice and assert one item; unmount and assert cleanup (see `testing.md`).
