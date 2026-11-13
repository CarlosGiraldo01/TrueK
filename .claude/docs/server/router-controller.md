# Router and controller

## Router

```ts
import { Router } from 'express';
import { createPost, deletePost, getPostById, getPosts } from './posts.controller';

export const postsRouter = Router();

postsRouter.get('/', getPosts);
postsRouter.get('/:id', getPostById);
postsRouter.post('/', createPost);
postsRouter.delete('/:id', deletePost);
```

Mounted directly in `app.ts` as `app.use('/posts', postsRouter)` — **no `/api` prefix** in this project. Protected route: pass `authMiddleware` per route once it exists, `postsRouter.get('/', authMiddleware, getPostsController)` (see `auth-middleware.md`). Never `router.use(authMiddleware)` on a router mounted at `/`: it would intercept every request that reaches it and make later public routers answer `401`. Nested resources follow the existing style, e.g. a request's messages: `/requests/:requestId/messages`.

## Controller

```ts
import Boom from '@hapi/boom';
import { Request, Response } from 'express';
import { postsService } from './posts.service';

export const createPost = async (req: Request, res: Response) => {
  const { name, description } = req.body;

  if (typeof name !== 'string' || !name.trim()) {
    throw Boom.badRequest('Name is required');
  }

  const post = await postsService.create({ ...req.body, name: name.trim() });

  res.status(201).json(post);
};

export const getPosts = async (_req: Request, res: Response) => {
  res.status(200).json(await postsService.getAll());
};

export const deletePost = async (req: Request, res: Response) => {
  await postsService.delete(String(req.params.id));

  res.status(204).send();
};
```

Existing controllers (`getUsers`, `getUserById`, `getRequests`...) currently handle a "not found" miss inline with `res.status(404).json({ error: '...' })` rather than throwing `Boom.notFound`. Once `middlewares/errorMiddleware.ts` exists (see `errors-boom.md`), new code should `throw Boom.notFound(...)` from the **service**, not the controller, and let the middleware format the response — match that for anything you add from now on, even though older controllers still do it the other way until they're touched.

## Conventions

- Express 5 handles rejected promises: `throw` directly, no try/catch, no `next(err)` — this only reaches a clean JSON response once `middlewares/errorMiddleware.ts` is registered (it doesn't exist yet; see `errors-boom.md`). Until then, an uncaught throw still produces Express's default error page — that's expected and is exactly the gap `/add-auth`'s error-handling step closes.
- `req.params.x` is typed `string | string[]`: wrap with `String(...)`.
- Validate type **and** shape: strings trimmed and non-empty, numbers with ranges, enums against an allow-list (TrueK already has string-union enums like `ServiceStatus`, `NotificationType` — validate against those unions, not free-form strings), regex for formats, arrays with a minimum length.
- Pass the service a clean DTO, never `req.body` itself.
- Status codes: `201` create, `200` read/update, `204` delete (no body).
- Authenticated handlers: `const user = getUserFromRequest(req);` and pass `user.sub` (the user id from the JWT) to the service.
- Long validation blocks that repeat across controllers go in `<feature>.validation.ts` as small functions that throw `Boom.badRequest`.
