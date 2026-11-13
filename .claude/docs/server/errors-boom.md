# Errors with Boom

`@hapi/boom` (`^10.0.1`) is already a server dependency but **nothing uses it yet** — every current controller handles a miss inline (`res.status(404).json({ error: "Usuario no encontrado" })`). Introducing Boom + the error middleware is the first real step of making real auth/ownership checks possible, and is naturally done together with `/add-auth`.

## Which status

| Situation | Call | Status |
|-----------|------|--------|
| Missing/invalid body, bad params | `Boom.badRequest('Name is required')` | 400 |
| No/invalid token | `Boom.unauthorized('Invalid or expired token')` | 401 |
| Authenticated but not allowed | `Boom.forbidden('...')` | 403 |
| Not found or not owned by caller | `Boom.notFound('Post not found')` | 404 |
| Duplicate / state conflict | `Boom.conflict('...')` | 409 |
| Wrong file type | `Boom.unsupportedMediaType('Only png, jpeg and webp images are supported')` | 415 |
| Upstream API/storage failed | `Boom.badGateway('The upload service failed to respond')` | 502 |

Messages can stay in whichever language the feature already uses (several existing ones are in Spanish, e.g. `"Usuario no encontrado"`) — pick one language per feature and don't mix. Never include SQL, stack traces or secrets in a message.

## Error middleware

`server/src/middlewares/errorMiddleware.ts` — this file does not exist yet (`middlewares/` is currently empty). Registered after every router:

```ts
import { Request, Response, NextFunction } from 'express';
import Boom from '@hapi/boom';

export const errorHandler = (
  err: Error | Boom.Boom,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  // Non-Boom errors (bugs, DB errors) are normalized to a 500
  const boomError: Boom.Boom = Boom.isBoom(err) ? err : Boom.boomify(err);

  const { statusCode, payload } = boomError.output;
  res.status(statusCode).json({
    ...payload,
    details: boomError.detail,
  });
};
```

Response shape: `{ statusCode, error, message, details? }`. The client reads `error.response.data.message` (see `.claude/docs/client/lib-axios-auth.md`'s `getErrorMessage`).

Mount it last, in `app.ts`:

```ts
// after every app.use('/<feature>', ...) line
app.use(errorHandler);
```

For 500s, `Boom.boomify` keeps a generic message in `payload`; `console.error` the original if you need to debug.

## Rethrow rule

When catching around external calls, never swallow a Boom you already created:

```ts
if (Boom.isBoom(error)) throw error;
```

## Migrating an existing controller

When a task touches an existing controller that still does `res.status(404).json({ error: '...' })`, it's fine to leave it as-is unless the task is specifically about introducing Boom there — don't do a drive-by rewrite of unrelated error handling as a side effect of an unrelated feature; that belongs to its own small, reviewable change.
