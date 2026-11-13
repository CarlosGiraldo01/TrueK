# Components and pages

## Folder map (real, under `client/src/`, not `client/`)

```
client/src/
├── app/
│   ├── layout.tsx            # global providers, fonts, metadata
│   ├── page.tsx               # splash / entry
│   ├── login/page.tsx         # currently fake — see lib-axios-auth.md
│   ├── feed/, profile/, requests/, map/, ...
│   └── requests/[requestId]/page.tsx   # dynamic route example
├── components/
│   ├── feed/                  # FeedView.tsx
│   └── ui/                    # NavBar, PostCard, StarRating, FeedHeader, index.ts
├── context/                    # SessionContext, PostsContext, RequestContext, UsersContext, NotificationsContext, ChatContext, DataGate
├── hooks/                      # does not exist yet
├── lib/                        # api.ts only, for now
└── types/                      # one file per domain + index.ts re-exporting all
```

## Component template

```tsx
'use client';

import { usePosts } from '@/context/PostsContext';
import { PostCard } from './PostCard';

export const PostsList = () => {
  const { posts } = usePosts();

  if (posts.length === 0) {
    return <p className="text-sm text-neutral-500">No posts yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onDelete={() => deletePost(post.id)} />
      ))}
    </ul>
  );
};
```

## Form template

```tsx
'use client';

import { FormEvent, useState } from 'react';
import { usePosts } from '@/context/PostsContext';

export const CreatePostForm = () => {
  const { createPost } = usePosts();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await createPost({ name: name.trim() });
      setName('');
    } catch (err) {
      // TrueK has no shared getErrorMessage yet (client/src/lib/errors.ts does not exist) —
      // create it per client-lib.md the first time a form needs to surface a real error,
      // rather than inlining axios-specific error parsing here.
      setError('Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <label className="sr-only" htmlFor="post-name">Post name</label>
      <input
        id="post-name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        className="flex-1 rounded border px-3 py-2"
        placeholder="Post name"
      />
      <button
        type="submit"
        disabled={isSubmitting || !name.trim()}
        className="rounded bg-indigo-600 px-4 py-2 text-white disabled:opacity-50"
      >
        Create
      </button>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </form>
  );
};
```

## Page template (dynamic route, Next.js 16)

```tsx
'use client';

import { use } from 'react';
import { RequestProvider } from '@/context/RequestContext';

export default function RequestPage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = use(params);

  return (
    <RequestProvider requestId={requestId}>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-10">
        {/* components that call useRequest() */}
      </main>
    </RequestProvider>
  );
}
```

Pattern: a small inner component calls the context hook, because the hook only works **below** the provider.

## Guidelines

- Server components by default; add `'use client'` only when you need state, effects, handlers or browser APIs.
- Browser-only libraries (Leaflet — already a dependency, `react-leaflet`): load with `next/dynamic` and `{ ssr: false }`. See `map-geolocation.md` for the specific map feature.
- Loading/empty/error states are rendered explicitly. There is **no reusable `EmptyState` component yet** — introduce one in `components/ui/` the first time two pages need the same empty-state shape, rather than duplicating the markup (see `.claude/docs/workflow/truek-rubric-gaps.md`).
- Redirects after actions: `useRouter().push('/')`.
- There is also **no `PrivateRoute` component yet** — every page currently renders regardless of session state. Once `/add-auth` introduces a real `AuthContext`, a `PrivateRoute`/route-guard wrapper is the natural next step for the rubric's "Rutas protegidas con redirección" requirement.
- Shared Tailwind class strings used by several components: `components/<name>Styles.ts`.
- Next.js 16 may differ from older versions: check `client/node_modules/next/dist/docs/` before using a Next API you are unsure about.

Templates for data/state: `.claude/docs/client/contexts.md`.
