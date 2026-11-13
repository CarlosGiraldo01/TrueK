# Hooks

`client/src/hooks/` does not exist yet in TrueK — create it the first time a genuinely reusable, non-shared piece of logic is needed (geolocation for the map, image upload, a debounced search input). Shared app state belongs in a context (see `contexts.md`), not a hook.

## Template

```ts
'use client';

import { useEffect, useState } from 'react';

export const useDebouncedValue = <T,>(value: T, delayMs = 300): T => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);

    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
};
```

## Object-returning hook (state + actions)

```ts
export const useToggle = (initial = false) => {
  const [isOn, setIsOn] = useState(initial);

  const toggle = () => setIsOn((prev) => !prev);
  const set = (value: boolean) => setIsOn(value);

  return { isOn, toggle, set };
};
```

## Async hook with error string

```ts
export const useRequest = <T,>(request: () => Promise<T>) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setData(await request());
    } catch {
      setError('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return { data, isLoading, error, run };
};
```

## Rules of thumb

- Name starts with `use`, file is `client/src/hooks/useThing.ts`, named export.
- Return state first, actions after; the component never sees thrown errors, it reads `error`.
- Anything allocated in an effect is released in its cleanup.
- Constants (limits, allowed types) at module level; export those components need.
- Dependencies arrays are complete.
- Window/DOM access only inside effects or handlers (SSR-safe — Next.js 16 App Router).
- Geolocation (the map feature specifically — see `map-geolocation.md`) / media / observers: wrap the browser API in the hook, expose plain values (`position`, `isSupported`, `error`).
