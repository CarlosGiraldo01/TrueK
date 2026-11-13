# Realtime on the server: Supabase Broadcast

This is the project's chosen realtime mechanism — it is what satisfies the Delivery 3 rubric's explicit "Sockets" line: *"El proyecto implementa Sockets de Supabase para emitir y recibir eventos en vivo. El backend envía un evento (channel, event type y payload) y el frontend recibe el evento en los Providers."* Not used anywhere yet; this is net-new work.

The server publishes events; browsers subscribe with the publishable key (see `.claude/docs/client/realtime-subscription.md`). This is the first server-side use of `@supabase/supabase-js` — add it as a dependency (**`^2.76.0` or later** — `channel.httpSend()` below did not exist in older versions; pin at least that floor in `package.json`, don't just `npm install @supabase/supabase-js` and hope), and create `src/config/supabase.ts` (`createClient(config.supabaseUrl, config.supabaseServiceKey)`, service-role key, server-only) if `/add-file-upload` hasn't already created it.

## Broadcast helper

```ts
import { supabase } from '../../config/supabase';

// Fire-and-forget: a failed broadcast must never fail the HTTP request
export const broadcast = async (channelName: string, event: string, payload: object) => {
  const channel = supabase.channel(channelName);

  try {
    await channel.httpSend(event, payload);
  } catch (error) {
    console.error(`Failed to broadcast ${event}`, error);
  } finally {
    await supabase.removeChannel(channel);
  }
};
```

Put it in `src/config/realtime.ts` and reuse it from any service.

## TrueK's two concrete uses

**Chat (`messages`):** channel per service request, so only people viewing that request's conversation are subscribed:

```ts
// inside messagesService
create: async (message: CreateMessageDTO): Promise<Message> => {
  const created = await messagesRepository.create(message);
  broadcast(`request:${message.service_request_id}`, 'new-message', created); // not awaited on purpose
  return created;
},
```

**Notifications:** channel per user, so a provider/client only receives their own:

```ts
// wherever a notification is created (e.g. inside requestsService on accept/reject/finish)
broadcast(`user:${notification.user_id}`, 'new-notification', notification);
```

## Contract conventions

- Channel per entity the realtime update is scoped to: `request:<id>` for chat, `user:<id>` for notifications.
- Event names: kebab-case, past tense: `new-message`, `new-notification` (or `request-accepted` etc. if a future event fits that shape better — stay consistent with whichever naming the plan picked).
- Payload equals the REST response shape for that resource, so the client can reuse its existing `client/src/types/*.ts` interfaces.
- Emit only after the database write succeeded.
- The sender also gets the REST response (e.g. the message they just sent); clients must dedupe by `id`.

## Private channels

Broadcast on a public channel is readable by anyone who knows the channel name and has the publishable key. `request:<id>` and `user:<id>` channel names are UUIDs, which is weak obscurity, not real access control. If this ever needs to be airtight, use Supabase's private channels with Realtime Authorization policies, or have the client refetch through the authenticated REST API instead of trusting the broadcast payload for anything sensitive. For this delivery, treating the channel name as "hard to guess" is an acceptable, explicitly-stated tradeoff — mention it if asked in the interview.
