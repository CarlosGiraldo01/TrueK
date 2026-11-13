# `lib/`: config, axios, errors, auth

TrueK's `client/src/lib/` currently has only `api.ts`. Everything else below is the target shape — introduce each file the first time a task actually needs it.

## `lib/config.ts` (does not exist yet)

```ts
export const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Add once realtime is wired in:
// export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
// export const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
```

`client/.env.example` (current real content, keep the format):

```
NEXT_PUBLIC_API_URL=
```

Only public values: anything `NEXT_PUBLIC_*` ships to the browser.

## `lib/api.ts` (exists — this is what to evolve, not replace)

Current:

```ts
import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});
```

With auth (adds the Bearer token to every request, and handles an expired/invalid token):

```ts
import axios from 'axios';
import { getStoredToken, clearStoredAuth } from './authStorage';

export const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

api.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearStoredAuth();
      if (typeof window !== 'undefined') window.location.href = '/login';
    }

    return Promise.reject(error);
  },
);
```

This is the "token refresh / expired-session handling" the rubric asks for — TrueK's JWTs are long-lived (7 days, see `auth-middleware.md`) rather than short-lived-with-refresh-token, so "refresh" here means *detect an expired/invalid token on any request and force a clean re-login*, not a silent background refresh call. If the rubric interview pushes back on this, that's a legitimate, statable design choice: a refresh-token flow is real added complexity for a 7-day token in a student project, and this is the kind of trade-off the rubric's own "justify design decisions" section rewards being able to explain.

## `lib/errors.ts` (does not exist yet)

```ts
import { isAxiosError } from 'axios';

export const getErrorMessage = (error: unknown): string => {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? error.message;
  }

  return 'Something went wrong';
};
```

## `lib/authStorage.ts` (does not exist yet)

```ts
const AUTH_STORAGE_KEY = 'truek_auth';

interface StoredAuth {
  token: string;
  user: { id: string; name: string; email: string; role: 'client' | 'provider' };
}

export const getStoredAuth = (): StoredAuth | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredAuth) : null;
  } catch {
    return null;
  }
};

export const getStoredToken = (): string | null => getStoredAuth()?.token ?? null;

export const setStoredAuth = (value: StoredAuth) => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(value));
};

export const clearStoredAuth = () => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
```

## `context/AuthContext.tsx` — replaces `SessionContext`

TrueK's current `SessionContext` is a `useState` holding a hardcoded user id (`DEFAULT_USER_ID`), switched between 3 hardcoded UUIDs by a `handleSetRole` function; `app/login/page.tsx` logs the typed email/password to the console and never checks them. This is the single biggest rubric gap ("Auth & Session Management"). Built on `useSyncExternalStore` so SSR/hydration are safe:

```tsx
'use client';

import { createContext, useContext, useMemo, useSyncExternalStore } from 'react';
import { api } from '@/lib/api';
import { clearStoredAuth, getStoredAuth, setStoredAuth } from '@/lib/authStorage';

const listeners = new Set<() => void>();
const getServerSnapshot = () => null;
const subscribeNoop = () => () => {};
const getHydrated = () => true;
const getServerHydrated = () => false;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const notify = () => listeners.forEach((listener) => listener());

interface AuthUser { id: string; name: string; email: string; role: 'client' | 'provider' }

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const raw = useSyncExternalStore(subscribe, () => JSON.stringify(getStoredAuth()), getServerSnapshot);
  const isReady = useSyncExternalStore(subscribeNoop, getHydrated, getServerHydrated);
  const user = useMemo(() => getStoredAuth()?.user ?? null, [raw]);

  const login = async (email: string, password: string) => {
    const res = await api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });
    setStoredAuth(res.data);
    notify();
  };

  const logout = () => {
    clearStoredAuth();
    notify();
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
```

## Route protection

In a page (or a shared `PrivateRoute` wrapper — see `components.md`, does not exist yet): wait for `isReady`, then `if (!isAuthenticated) router.replace('/login')` inside an effect; render nothing (or a spinner) until then. Feature providers that need a session are keyed by user id (see `contexts.md`'s per-user reset variant).

`localStorage` tokens are readable by any script on the page; keep the CSP tight and never render untrusted HTML.

## Migration note

`/add-auth`'s client step should replace `SessionContext`'s role entirely (every `useSession()` call site becomes `useAuth()`), not run both side by side — a half-migrated app with two competing "who is logged in" sources is worse than the current honestly-fake one. List every call site it touches in its report so the reviewer can check nothing was missed.
