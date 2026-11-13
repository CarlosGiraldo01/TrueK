# Service

The service owns business rules. It is the only layer that decides "does this exist", "is this the user's", "should we notify others".

```ts
import Boom from '@hapi/boom';
import { messagesRepository } from './messages.repository';
import { requestsRepository } from '../requests/requests.repository';
import { CreateMessageDTO, Message } from './messages.types';

// Reused guard: a repository miss becomes a 404
const getExistingRequest = async (id: string) => {
  const request = await requestsRepository.findById(id);

  if (!request) {
    throw Boom.notFound('Request not found');
  }

  return request;
};

export const messagesService = {
  create: async (message: CreateMessageDTO, callerId: string): Promise<Message> => {
    const request = await getExistingRequest(message.service_request_id);

    // Ownership: only the request's own client or provider may send a message on it
    if (request.client_id !== callerId && request.provider_id !== callerId) {
      throw Boom.notFound('Request not found');
    }

    return messagesRepository.create(message);
  },
};
```

TrueK's repositories and services export one object per feature (`usersRepository`, `postsService`, ...) with short method names (`findAll`, `findById`, `getAll`, `create`) — follow that, not individually-exported `createXService`-style functions. See `.claude/rules/server-layers.md`.

## Ownership (user-scoped data)

Prefer querying by `id` **and** the owning column in one repository call when the repository already supports it; when it doesn't, fetch the row and compare in the service as above. Either way, a miss or a mismatch means "not found or not yours" and is a `404`, not `403` — TrueK's own `ServiceRequest`/`Message`/`Notification` types already carry `client_id`/`provider_id`/`user_id`/`sender_id` for exactly this check.

## Delete

```ts
// inside postsService = { ... }
delete: async (id: string): Promise<void> => {
  const deleted = await postsRepository.delete(id); // returns boolean

  if (!deleted) {
    throw Boom.notFound('Post not found');
  }
},
```

## Side effects

- Realtime: emit **after** the repository succeeded, fire-and-forget (see `realtime-supabase.md`). TrueK's two concrete uses: broadcast a `new-message` event per `service_request_id` channel from `createMessageService`, and a `new-notification` event per `user_id` channel from wherever `notifications` are created.
- External APIs (storage, etc.): wrap failures as `Boom.badGateway('...')` and rethrow Boom errors untouched:

```ts
} catch (error) {
  if (Boom.isBoom(error)) throw error;
  throw Boom.badGateway('The upload service failed to respond');
}
```

- Multi-step writes that must succeed together use a transaction: get a client with `pool.connect()`, `BEGIN` / `COMMIT` / `ROLLBACK`, and pass the client to repository functions that accept an optional `client = pool`.

## Known, deliberate exceptions in the current code

`requests.service.ts`'s `addProvider` currently does N+1 queries (calls `postsRepository.findById` once per request in a loop) and `ratings.service.ts`'s `getAverages()` aggregates in JavaScript instead of SQL `GROUP BY`. Both work correctly; they are optimization opportunities flagged for the rubric interview, not bugs to fix as a side effect of an unrelated task.
