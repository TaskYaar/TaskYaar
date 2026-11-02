# TaskYaar

> *Kaam bhi, kamai bhi — apne sheher mein.*

TaskYaar is a hyperlocal task marketplace. People **post everyday tasks** (errands, pickups, assembly, help), nearby **workers apply**, the poster **accepts one**, they coordinate over **chat**, the money is **held safely (escrow)** until the job is done, and both sides **review** each other.

This repository is the **production rebuild (v2)**. The earlier Django-template prototype and the React mock-data frontend are used only as references for product flow and UI.

> **Status:** Folder structure only. Every file is an empty placeholder. Nothing is implemented yet. Build order is in [Roadmap](#roadmap).

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, TanStack Query, React Router, Zod, React Hook Form |
| Backend | Python, Django, Django REST Framework, Django Channels |
| Database | PostgreSQL + PostGIS (location search) |
| Cache / queue | Redis, Celery |
| Auth | Phone OTP, JWT in httpOnly cookies |
| Payments | Razorpay Route (marketplace split payments) |
| Files | S3 / Cloudflare R2 |
| Notifications | FCM (push), SMS provider (MSG91 or similar) |
| DevOps | Docker, GitHub Actions, Nginx, Sentry |

---

## 2. Repository layout

```
taskyaar/
├── backend/     Django API + WebSocket server        → see backend/README.md
├── web/         React app (PWA)                      → see web/README.md
├── infra/       Dockerfiles, compose files, scripts
├── docs/        Decisions, API, state machines, runbook, legal
├── .github/     CI/CD workflows, PR template
├── docker-compose.yml
└── Makefile     One-word shortcuts (run, test, lint)
```

---

## 3. How the system fits together

```
 Browser / PWA (web/)
        │  HTTPS (REST)            WebSocket (chat, live updates)
        ▼                                   ▼
      Nginx ───────────────► Django API (DRF) + Channels (ASGI)
                                   │        │         │
                                   ▼        ▼         ▼
                              PostgreSQL  Redis   Celery workers
                              (+PostGIS)  (cache,  (SMS, push,
                                          sockets)  payouts, timers)
                                   │
                         Razorpay · S3/R2 · FCM · SMS
```

---

## 4. Core product flow

```
POST TASK → APPLY → ACCEPT → PAY (held) → WORK → SUBMIT → CONFIRM → RELEASE PAYMENT → REVIEW
```

| Step | Who | What happens |
|---|---|---|
| Post | Poster | Creates task with category, budget (₹), location, time |
| Apply | Worker | Sends pitch and optional proposed rate |
| Accept | Poster | Picks one applicant; others are declined; a **Booking** is created |
| Pay | Poster | Pays; money is **held**, not yet paid out |
| Work | Worker | Starts task, chats with poster |
| Submit | Worker | Marks work done with a note |
| Confirm | Poster | Confirms; payment is released to worker minus platform fee |
| Review | Both | 1–5 stars and comment; ratings update trust scores |

If something goes wrong, either side can **cancel** (refund rules in `docs/state-machine.md`) or open a **dispute**.

---

## 5. Team rules (please read)

1. **Money rules are sacred.** Never change payment or ledger code without a second reviewer.
2. **Backend layering:** `views` → `services` (writes) / `selectors` (reads) → `models`. No business logic in views or serializers. Details in `backend/README.md`.
3. **Frontend layering:** each feature owns its API calls, hooks, schemas, components and pages. `shared/` never imports from `features/`. Details in `web/README.md`.
4. **No mock data in production code.** Mocks live only in `web/src/test/`.
5. **No secrets in Git.** Use `.env` files (ignored) and `.env.example` (committed, no real values).
6. **Every PR needs:** passing CI, one review, and tests for new logic.
7. **State changes only through services.** Task, booking and payment status is never edited directly.
8. **Write decisions down.** Add a short entry to `docs/decisions.md` for any choice that affects architecture.

Git workflow is in `docs/git-workflow.md`: `main` (protected) ← `develop` ← `feature/...` branches.

---

## 6. Roadmap

| Phase | Weeks | Goal |
|---|---|---|
| 0 Foundation | 1 | Decisions locked, repo, Docker, CI, lint/format hooks |
| 1 Backend core | 2–3 | Custom user, tasks, bookings and state machine, API + tests |
| 2 Auth and trust | 3–4 | OTP login, JWT cookies, KYC status, block/report, throttling |
| 3 Payments | 4–6 | Razorpay, webhooks, immutable ledger, refunds, auto-release |
| 4 Frontend | 3–7 | Port UI into new structure, connect to real API, remove mocks |
| 5 Real-time and discovery | 6–8 | WebSocket chat, push, PostGIS "near me", image uploads |
| 6 Quality and security | 8–9 | Test coverage, E2E, load test, security review, legal pages |
| 7 Deploy | 9–10 | Staging and production, backups, monitoring, runbook |
| 8 Beta launch | 10+ | One locality, 20–50 users, measure, iterate |

---

## 7. Suggested ownership

| Role | Owns |
|---|---|
| Backend lead | `backend/`, API design, payments |
| Frontend lead | `web/`, UX, API integration |
| DevOps / QA | `infra/`, CI/CD, tests, monitoring |
| Product / ops | Launch wedge, KYC, legal, beta users, support playbook |

---

## 8. Getting started

> To be filled in during Phase 0, once Docker and config files exist. The goal is:
> 1. Copy `.env.example` files to `.env`
> 2. Run one command (`make up`) to start database, Redis, API, worker and web
> 3. Run `make test` to run all tests

---

## 9. Docs index

| File | Purpose |
|---|---|
| `docs/decisions.md` | Why we chose what we chose |
| `docs/data-model.md` | Tables and relationships |
| `docs/state-machine.md` | Allowed status transitions for task, booking, payment |
| `docs/api.md` | API conventions and link to generated OpenAPI docs |
| `docs/runbook.md` | Deploy, rollback, backup restore, incident steps |
| `docs/git-workflow.md` | Branching, commits, PR rules |
| `docs/legal/` | Terms, privacy policy, grievance process |
