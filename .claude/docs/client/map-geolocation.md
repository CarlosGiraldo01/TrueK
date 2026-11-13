# Map: real geolocation (not graded by the Delivery 3 rubric, but a real remaining feature)

`client/src/app/map/page.tsx` + `NearbyMap.tsx` already render a working Leaflet map (`react-leaflet`, already a dependency) with real post coordinates from the server (`post.latitude`/`post.longitude`, both real columns). The only thing that's fake is the viewer's own position: `client/src/app/map/constants.ts` exports a hardcoded `USER_POSITION: [number, number] = [3.4516, -76.532]` ("Simulated position (Cali)"), used both as the blue dot marker and as one of the points `NearbyMap`'s bounds calculation includes.

## The fix: `useGeolocation` hook

Create `client/src/hooks/useGeolocation.ts` (first thing to land in the new `hooks/` folder, alongside or before this):

```ts
'use client';

import { useEffect, useState } from 'react';

interface GeolocationState {
  position: [number, number] | null;
  error: string | null;
  isSupported: boolean;
}

export const useGeolocation = (fallback: [number, number]): GeolocationState => {
  const [position, setPosition] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isSupported = typeof navigator !== 'undefined' && 'geolocation' in navigator;

  useEffect(() => {
    if (!isSupported) {
      setError('Geolocation is not supported in this browser');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
      (geoError) => setError(geoError.message),
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 10_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isSupported]);

  return { position: position ?? fallback, error, isSupported };
};
```

`fallback` is deliberately required, not optional: TrueK already has a sensible Cali default (the current `USER_POSITION`), and the map should never render with `null` coordinates while permission is pending or denied.

## Wiring it into the existing map page

In `app/map/page.tsx`, replace the static import with the hook:

```tsx
// before: import { USER_POSITION } from "./constants";
// after:
import { useGeolocation } from '@/hooks/useGeolocation';
import { USER_POSITION as FALLBACK_POSITION } from './constants'; // kept as the fallback, not removed

// inside MapPage():
const { position: userPosition, error: geoError } = useGeolocation(FALLBACK_POSITION);
```

Pass `userPosition` down to `NearbyMap` instead of the old `USER_POSITION` import (it currently imports the constant directly — change that one import site, not the whole file's structure). Surface `geoError` as a small dismissible banner (there's no toast system yet — see `.claude/docs/workflow/truek-rubric-gaps.md` — a plain `role="alert"` paragraph is fine for now) rather than silently falling back with no explanation.

## Notes

- `navigator.geolocation` only works over HTTPS (or `localhost`) and requires the browser's permission prompt — test it in a real browser tab, not an iframe/preview that blocks permissions.
- `watchPosition` (not a one-off `getCurrentPosition`) is the right call here since the user may walk around while the map is open; always `clearWatch` on unmount (already handled above).
- This does not change anything about how provider pins are placed — those already come from real `posts.latitude`/`longitude`. Only the *viewer's own* blue dot was fake.
- If distance-from-the-user sorting/filtering is ever wanted (e.g. "closest providers first"), that's a separate, larger feature — a straight-line `haversine` calculation in a small `lib/geo.ts` helper, not part of this fix.
