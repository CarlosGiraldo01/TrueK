# Realtime on the server: socket.io (fallback — Supabase Realtime Broadcast is the default for TrueK)

Only use this if a task explicitly needs client → server events, acknowledgements, rooms, or there's a specific reason to avoid Supabase Realtime. For the Delivery 3 rubric's Sockets requirement, use `.claude/docs/server/realtime-supabase.md` instead — that is what the rubric literally asks for ("Sockets de Supabase"). Dependencies: `socket.io` (server), `socket.io-client` (client).

## Bootstrap: `app.ts` / `index.ts` with an HTTP server

```ts
// index.ts
import { createServer } from 'node:http';
import app from './app';
import { initSocket } from './config/socket';
import { config } from './config';

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(config.port, () => {
  console.log(`Server is running on http://localhost:${config.port}`);
});
```

## `config/socket.ts`

```ts
import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { config } from './index';

let io: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, { cors: { origin: config.clientOrigin } });

  io.on('connection', (socket) => {
    socket.on('request:join', (requestId: string) => {
      socket.join(`request:${requestId}`);
    });

    socket.on('request:leave', (requestId: string) => {
      socket.leave(`request:${requestId}`);
    });
  });

  return io;
};

// Services emit through this; a missing server (tests) is a no-op
export const emit = (room: string, event: string, payload: object) => {
  io?.to(room).emit(event, payload);
};
```

## Emit from the service

```ts
import { emit } from '../../config/socket';

// inside messagesService
create: async (message: CreateMessageDTO): Promise<Message> => {
  const created = await messagesRepository.create(message);
  emit(`request:${message.service_request_id}`, 'new-message', created);
  return created;
},
```

## Authenticated sockets

```ts
io.use((socket, next) => {
  const token = socket.handshake.auth.token as string | undefined;

  try {
    socket.data.user = jwt.verify(token ?? '', config.jwtSecret);
    next();
  } catch {
    next(new Error('unauthorized'));
  }
});
```

Validate every client-sent payload in the handler (same rigor as a controller) and check the user may join the room before `socket.join`.

## Conventions

- Event names: `entity-action` for server → client (`new-message`), `scope:action` for client → server (`request:join`).
- Mutations still go through REST (controller → service → repository); sockets are for notifications, so tests and auth stay in one path.
- Handlers never run SQL; they call services.
