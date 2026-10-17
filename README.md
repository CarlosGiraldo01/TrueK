# TrueK

TrueK is a platform that connects people to exchange services and experiences with each other. This repository contains the frontend of the project, built with Next.js, TypeScript, and Tailwind CSS.

This delivery focuses on the **visual layer only**: all screens, with simulated data and no backend functionality yet. Data integration comes in a later delivery.

## Tech stack

- **Next.js 16** (App Router) + **React 19** + TypeScript
- **Tailwind CSS v4** for styling
- **Heroicons** (`@heroicons/react`) for icons
- **Express** + TypeScript for the backend (skeleton only for now)

## Getting started

```bash
git clone https://github.com/CarlosGiraldo01/TrueK.git
cd TrueK/client
npm install
npm run dev
```

The default branch is `develop`, so that is the one you get after cloning. Open `http://localhost:3000`. If the page doesn't load with a dark background, something didn't install correctly. Don't keep working on top of it; ask in the group chat first.

To preview it as a phone, use F12 and then Ctrl+Shift+M. The app is drawn in a phone-width column (max 440 px) set in `layout.tsx`, so screens don't draw it themselves.

Before pushing anything, run `npm run lint`.

The backend is only a skeleton for now. To check it runs:

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

Then open `http://localhost:4000/health`; it should show `{"ok":true}`. On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

## Design tokens

Colors and fonts are defined as Tailwind tokens in `client/src/app/globals.css` (e.g. `bg-truek-black`, `text-truek-lime`, `bg-truek-card`). Use those classes instead of hardcoding hex values in a component.

## Project structure

```
TrueK/
├── client/
│   └── src/
│       ├── app/            # Screens: one folder per route, with a page.tsx
│       ├── components/
│       │   └── ui/         # Shared components
│       ├── context/        # React contexts and Providers.tsx
│       └── lib/
│           └── mock/       # Shared simulated data and types
└── server/
    └── src/
        ├── config/         # Environment variables
        ├── db/             # Database connection and SQL
        ├── middlewares/    # Auth, error handling
        └── features/       # One folder per feature (auth, posts, chat...)
```

A component used by only one screen lives next to that screen's `page.tsx`. A component used by several people goes in `components/ui/`.

## How we work

Rules, Git commands, the Pull Request flow and where each file goes are in **[CONTRIBUTING.md](./CONTRIBUTING.md)**. Read it before starting.

The repository has two permanent branches, plus one working branch per cycle:

| Branch | What it is |
|---|---|
| `main` | The stable version, the one that is shown and delivered. It always has to run |
| `develop` | Where the cycles of the three of us are merged and tested together. It is the default branch |
| `feature/<name>-<topic>` | The working branch of each cycle |

The path of any screen is always the same: the cycle branch goes into `develop` through a Pull Request reviewed by another team member, and only what has been tested in `develop` goes into `main`.

## Who does what

| Person | Responsibility |
|---|---|
| **1** | Account, profile and discovery |
| **2** | Requests, service and notifications |
| **3** | Payment, chat and map |

Screens, in the order they are built. Carlos is Person 3; Dana and Ana replace `<name>` once they decide who is Person 1 and who is Person 2:

### Person 1

| Cycle | Branch | Screens |
|---|---|---|
| A. Entry & profile | `feature/<name>-entrada-perfil` | Splash → Sign up → Complete profile (none chosen, Client, Provider) → Login → Client profile → Provider profile → Edit profile (with Log out) |
| B. Discover | `feature/<name>-descubrir` | Client feed → Provider feed → Search (with search item) → Publication → Create a truek |

### Person 2

| Cycle | Branch | Screens |
|---|---|---|
| C. Request | `feature/<name>-pedir` | Schedule service → Confirm service → Service requested → Services (tab, with its states) → Service request (provider detail). Includes the 4 notification overlays and their host |
| D. Service & rating | `feature/<name>-servicio-calificacion` | Active service (client) → Rating (client) → Finished service (provider) |

### Person 3

| Cycle | Branch | Screens |
|---|---|---|
| E. Payment | `feature/carlos-pago` | Pay (with its swipe-to-simulate state) → Payment successful → Payment received (provider) |
| F-G. Chat & map | `feature/carlos-chat-mapa` | Chat preview → Chat → Nearby map |

## How it all connects

A new person signs up and completes their profile (cycle A). Then they enter the feed, search and open a publication (B). From there they schedule a service (C), and the provider accepts or rejects it. If accepted, the service takes place, is marked as finished, and the client rates it (D). Then the client pays (E). Chat (F) and map (G) are used throughout.

### The Services tab

Services shows the **current** service, not a list.

- **Client:** sees a card whose state changes: empty → pending ("In progress...") → **Request accepted** (the provider accepted) → **Active service** (with a chat button), or **Request rejected**.
- **Provider:** sees the request detail with Accept and Reject. Rejecting returns to the empty state. Accepting moves to **Active service**, and finishing moves to **Finished service**.

### Notifications

The 4 notifications are overlays that appear on top of any screen when a state changes:

| Notification | When it appears | Type |
|---|---|---|
| Service request | To the provider, when a service is requested | `incoming_services` |
| Request accepted | To the client, when the provider accepts | `request_accepted` |
| Request rejected | To the client, when the provider rejects | `request_rejected` |
| Service finished | To the client, when the service is finished | `services_finished` |

The components already exist in `components/ui/notifications`. Person 2 builds the host that shows them; the others only call "show notification".

## Shared routes

The main screens must be named exactly `/home`, `/search`, `/requests`, `/map` and `/profile`, because the bottom bar navigates to those routes.

These are the points where one cycle hands over to another. The names are so everyone uses the same ones:

| From | To | Route |
|---|---|---|
| Publication (P1) | Schedule service (P2) | `/schedule/[postId]` |
| Active service (P2) | Chat (P3) | `/chat/[requestId]` |
| Rating (P2) | Pay (P3) | `/payment/[requestId]` |

If the destination screen doesn't exist yet, leave the button pointing to its route and it will work once its owner finishes it.

## Shared components

They live in `client/src/components/ui` and are imported from `@/components/ui`. **Nobody builds their own version of one of these.** If you need one that doesn't exist yet, follow the steps in CONTRIBUTING.

| Component | What it is for |
|---|---|
| `Avatar` | Profile picture |
| `Button` | Main button |
| `Logo` | Logo in three variants: `horizontal`, `vertical` and `icon` |
| `NavBar` | Bottom bar with the 5 tabs. Highlights the active one by route |
| `PostCard` | Publication card, as a list item and as a detail view |
| `StarRating` | Star rating |
| `TextField` | Text field with a label |
| `TopHeader` | Header with a title and a back button |
| Notifications | `NotificationServiceRequest`, `NotificationRequestAccepted`, `NotificationRequestRejected`, `NotificationServiceFinished` |

Each component's props are visible in its file. Texts, sizes and images change through props; don't copy a component.

## Simulated data

It lives in `client/src/lib/mock/` and mirrors the database columns (in `snake_case`):

| File | Contents |
|---|---|
| `users.ts` | 4 users (1 client and 3 providers) and `CURRENT_USER_ID` |
| `posts.ts` | 3 publications and the 7 tags |
| `requests.ts` | 8 requests, one for each status |
| `ratings.ts` | 3 ratings |
| `notifications.ts` | 4 notifications, one for each type |
| `types.ts` | The TypeScript types for all of the above |

`lib/mock/index.ts` exports them together with the helpers `getUserById`, `getPostById` and `getUserRating`.

### Session

`SessionContext` says who is using the app. Read it with `useSession()`:

```tsx
const { user } = useSession();
```

It starts as `CURRENT_USER_ID` (`u1`, a client). To test the provider view, change it to `"u2"` in `lib/mock/users.ts`.