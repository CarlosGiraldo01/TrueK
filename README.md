# TrueK

TrueK is a platform that connects people to exchange services and experiences with each other. This repository contains the frontend of the project, built with Next.js, TypeScript, and Tailwind CSS.

This delivery focuses on the **visual layer only** — all screens, no backend functionality yet. Data integration comes in a later delivery.

## Tech stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS v4** for styling
- **Heroicons** (`@heroicons/react`) for icons
- **Express** + TypeScript for the backend 

## Getting started

```bash
git clone <repo-url>
cd TrueK/client
npm install
npm run dev
```

Open `http://localhost:3000`. If the page doesn't load with a dark background, something didn't install correctly — don't keep working on top of it, ask in the group chat first.

The backend is only a skeleton for now. To check it runs:

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Then open `http://localhost:4000/health`; it should show `{"ok":true}`. On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Design tokens

Colors and fonts are defined as Tailwind tokens in `client/src/app/globals.css` (e.g. `bg-truek-lime`, `text-truek-white`, `truek-card`). Use those classes instead of hardcoding hex values in a component.

## Project structure

```
TrueK/
├── client/
│   └── src/
│       ├── app/            # Routes (App Router)
│       ├── components/
│       │   ├── ui/         # Shared components — see rule below
│       │   └── [feature]/  # Screen-specific components, scoped per flow
│       ├── context/        # React contexts (simulated data for now)
│       └── lib/            # Types, mock data, helpers
└── server/
    └── src/
        ├── config/         # Environment variables
        ├── db/             # Database connection and SQL
        ├── middlewares/    # Auth, error handling
        └── features/       # One folder per feature (auth, posts, chat...)
```

## Team workflow rules

These exist so three people can work on the same repo without constantly colliding. Please actually follow them, not just read them once.

### 1. The shared component rule

`components/ui/` holds the fixed set of components used across most screens (Button, Header, BottomNav, Input, Card, Avatar, Badge, StarRating, Logo). **Nobody builds their own version of one of these.** If you need one and it's not there yet, that's rule #2.

### 2. Adding a new shared component

If mid-work you realize you need a shared component that doesn't exist in `ui/` yet:
1. Build it in `components/ui/`, by itself, in its own small commit.
2. Open a Pull Request for just that component (not bundled with your screens).
3. Ping the other two for a quick look — this should take minutes, not days.
4. Once merged to `main`, pull it into your branch and keep going.

Never quietly duplicate a component because asking felt slower. It isn't, long term.

### 3. Branching

- `main` stays stable and working at all times. Nobody pushes directly to it.
- Each person works on their own feature branch (e.g. `feature/auth-screens`, `feature/discovery-screens`, `feature/transaction-screens`).
- Open a Pull Request to merge into `main`. At least one other teammate should glance at it before merging — mainly to catch an accidental duplicate component, not to nitpick style.

### 4. Commits

Small and frequent beats one giant commit at the end. A commit message should say what changed, in plain words (`"Add login form"`, not `"stuff"` or `"update"`).

### 5. Scope discipline

Stay inside your assigned screens/routes. If something you need touches a shared file outside `components/ui/` (like `globals.css` or the root `layout.tsx`), flag it to the group before changing it — those files affect everyone at once.

## Screen ownership (tentative — still finishing a few design details, so this may shift)

| Area | Owner | Screens |
|---|---|---|
| Entry & Identity | Person 1 | Splash, Login, Sign up, Complete profile (x3), View/Edit profile (client & provider) |
| Discovery & Notifications | Person 2 | Feed (client & provider), Search, Nearby map, Empty services state, Publication, Create a truek, notification overlays |
| Transaction lifecycle | Person 3 | Service request/accept/reject, Scheduling flow, Active/finished service, Payment flow, Rating |

This table will be updated once a few remaining design details are settled.