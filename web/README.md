# Web (React + TypeScript)

The TaskYaar user interface, built as a mobile-first PWA.

## Structure

```
web/
├── public/             Static files, PWA manifest
├── e2e/                Playwright end-to-end tests
└── src/
    ├── main.tsx        Entry point
    ├── app/            App shell: router, providers, guards, layouts
    ├── features/       One folder per product area (the bulk of the code)
    ├── shared/         Reusable pieces with no business meaning
    ├── styles/         Design tokens, animations, global CSS
    ├── assets/         Images, logo
    └── test/           Test setup and API mocks (tests only)
```

## `app/`

| Path | Purpose |
|---|---|
| `router.tsx` | Every route in one place, lazy-loaded |
| `providers.tsx` | Query client, auth, toasts, language |
| `guards/` | `RequireAuth`, `RequireKyc` route protection |
| `layouts/` | Public layout, app layout, navbar, bottom nav, footer |

## `features/`

Each feature folder has the same shape:

```
features/tasks/
├── index.ts        Public exports. Other features import ONLY from here
├── api.ts          Calls to the backend for this feature
├── hooks.ts        TanStack Query hooks (useTasks, useCreateTask ...)
├── schemas.ts      Zod schemas for forms and responses
├── types.ts        TypeScript types
├── components/     Pieces used only by this feature
└── pages/          One file per route/screen
```

| Feature | Screens |
|---|---|
| `auth` | Login, OTP, Register |
| `onboarding` | Splash, Welcome, Onboarding, Language, Terms intro |
| `tasks` | Browse, Task details, Post task, My tasks |
| `bookings` | Apply, accept, progress timeline |
| `payments` | Wallet, Checkout, History |
| `chat` | Chat list, Chat room |
| `reviews` | Write review |
| `notifications` | Notifications |
| `profile` | Profile, Edit profile, Activity stats |
| `trust` | Report and block dialogs |
| `legal` | Legal center, Terms, Privacy |
| `settings` | Settings, Help, About |

## `shared/`

| Path | Purpose |
|---|---|
| `ui/` | Design-system components: Button, Modal, Toast, EmptyState, LoadingSkeleton, TrustBadge, Logo, PageHeader |
| `api/client.ts` | The one HTTP client, token refresh, error handling |
| `api/types.generated.ts` | Types **generated from the backend's OpenAPI schema**. Never edit by hand |
| `hooks/` | Generic hooks (debounce, geolocation, media query) |
| `lib/` | Formatters (₹, dates) and constants |
| `i18n/` | English, Hindi, Marathi text files |

## Rules

1. **Features own their code.** Pages, API calls, hooks and schemas for tasks live in `features/tasks/`.
2. **Import direction:** `app` → `features` → `shared`. `shared/` must never import from `features/`. One feature talks to another only through its `index.ts`.
3. **Server data lives in TanStack Query.** Do not copy API data into component state. Small UI state stays local.
4. **No mock data in the app.** Fake data is allowed only in `src/test/mocks/`.
5. **One file per route.** No duplicate re-export stubs.
6. **Validate with Zod** at form boundaries and on API responses where it matters.
7. **No tokens in `localStorage`.** Auth uses httpOnly cookies set by the backend.
8. **Mobile first.** Design for a small phone screen, then widen.
9. **Accessible by default:** labels, focus states, keyboard use, contrast.
10. **All user-facing text goes through `i18n`**, not hard-coded strings.

## What to reuse from the earlier React prototype

The visual design, onboarding flow, task cards, post-task stepper, chat layout, wallet and profile screens, and CSS variables. Move each into the matching feature folder and replace mock services with real API hooks.

## Testing

- **Vitest + Testing Library** for components and hooks.
- **MSW** (in `src/test/mocks/`) to simulate the API in tests.
- **Playwright** (`e2e/`) for the full flows: login, and post → apply → accept → complete.
