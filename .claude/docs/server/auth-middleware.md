# Auth (TrueK's own JWT + Bearer token — NOT Supabase Auth)

**This is the second biggest difference from the original harness.** That harness defaults to Supabase Auth (`auth.users`, `supabase.auth.signUp`/`signInWithPassword`). TrueK does not use Supabase Auth: the `users` table (real, seeded with 3 users — Valentina, Camila, Camilo) already holds a bcrypt-hashed `password` column, and that stays the source of truth. Moving to `auth.users` would mean migrating real data and rewriting every foreign key that currently points at `users.id` — out of scope. Instead, the server issues and verifies its own JWTs.

Dependencies to add: `jsonwebtoken`, `@types/jsonwebtoken`, `bcrypt`, `@types/bcrypt` (`bcrypt` may already be available as a dev-only tool from seeding — check `server/package.json` before assuming; if it's not a real dependency yet, add it, not just a script-only use).

## Types

```ts
// features/auth/auth.types.ts
export interface AuthenticatedUser {
  sub: string;   // users.id
  role: 'client' | 'provider';
}

export interface LoginDTO { email: string; password: string }

export interface LoginResult {
  token: string;
  user: { id: string; name: string; email: string; role: 'client' | 'provider' };
}
```

## Service

```ts
import Boom from '@hapi/boom';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { usersRepository } from '../users/users.repository';
import { LoginDTO, LoginResult } from './auth.types';

const JWT_EXPIRES_IN = '7d';

export const authService = {
  login: async ({ email, password }: LoginDTO): Promise<LoginResult> => {
    const user = await usersRepository.findByEmailWithPassword(email);

    if (!user) {
      throw Boom.unauthorized('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);

    if (!passwordMatches) {
      throw Boom.unauthorized('Invalid email or password');
    }

    const token = jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
    });

    return {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
  },
};
```

`usersRepository.findByEmailWithPassword` is a new repository method — the existing `findAll`/`findById` deliberately exclude `password` from their `SELECT_COLUMNS` (so it never leaks to any client response); this new method is the one and only place allowed to select it, and its result must never be returned from a controller as-is.

Route: `POST /auth/login` (no `/api` prefix, matching every other TrueK route). There is no `/auth/register` yet — the 3 users are already seeded; add registration only if the task explicitly asks for it.

## Middleware

```ts
// middlewares/authMiddleware.ts
import Boom from '@hapi/boom';
import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AuthenticatedUser } from '../features/auth/auth.types';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw Boom.unauthorized('Missing or malformed Authorization header');
  }

  try {
    req.user = jwt.verify(token, config.jwtSecret) as AuthenticatedUser;
  } catch {
    throw Boom.unauthorized('Invalid or expired token');
  }

  next();
};

export const getUserFromRequest = (req: Request): AuthenticatedUser => {
  if (!req.user) {
    throw Boom.unauthorized('User not authenticated');
  }

  return req.user;
};
```

Add `jwtSecret` to `src/config/index.ts` (fail fast if missing, same pattern as `databaseUrl`) and to `server/.env.example` as `JWT_SECRET=`.

## Using it

```ts
const router = Router();
// Per route: routers are mounted directly ('/requests', no '/api' prefix), so a router-level
// `router.use(authMiddleware)` would also guard every later public router mounted the same way.
router.get('/requests', authMiddleware, getRequests);
router.post('/requests/:id/messages', authMiddleware, createMessage);
```

Controllers: `const user = getUserFromRequest(req);` then pass `user.sub` to the service for ownership checks (see `.claude/rules/server-errors-auth.md`).

## What this replaces on the client

The current `client/src/context/SessionContext.tsx` is not real auth — it's a `useState` holding a hardcoded user id, switched between 3 hardcoded UUIDs by role, with a login page that logs form data to the console and never checks a password. `/add-auth`'s client step (see `.claude/docs/client/lib-axios-auth.md`) replaces this with a real `AuthContext` that calls `POST /auth/login`, stores the returned JWT, and attaches it via an axios interceptor.
