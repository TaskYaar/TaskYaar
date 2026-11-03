# Taskyaar

A task marketplace platform. This repository contains the Django REST API, the PostgreSQL database and the React web app, all run together with Docker Compose.

## Tech stack

| Part | Technology |
|------|------------|
| Backend API | Python 3.12, Django, Django REST Framework |
| Database | PostgreSQL 16 |
| Frontend | React 18, Vite |
| Runtime | Docker and Docker Compose |

## Prerequisites

Install these once:

1. **Docker Desktop** (Windows or Mac) or Docker Engine with the Compose plugin (Linux). On Windows, keep "Use WSL 2" enabled.
2. **Git**
3. **VS Code** (recommended)

Check that Docker works:

```
docker --version
docker compose version
docker run hello-world
```

You do not need to install Python, Node or PostgreSQL on your own machine. Everything runs inside containers.

## Quick start

Run all commands from the project root, the folder that contains `docker-compose.yml`.

### 1. Get the code

```
git clone <repository-url>
cd taskyaar
```

### 2. Create your environment files

Windows (PowerShell):

```
Copy-Item backend\.env.example backend\.env
Copy-Item web\.env.example web\.env
```

Mac / Linux:

```
cp backend/.env.example backend/.env
cp web/.env.example web/.env
```

### 3. Set your secret key

Generate a random key.

Windows (PowerShell):

```
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 50 | ForEach-Object {[char]$_})
```

Mac / Linux:

```
python3 -c "import secrets; print(secrets.token_urlsafe(50))"
```

Open `backend/.env` and replace `change-me-to-a-long-random-string` with the generated value:

```
DJANGO_SECRET_KEY=your-generated-key
```

Do not add spaces or quotes. Never commit this file or share your key.

If VS Code shows **CRLF** in the bottom-right corner when editing `.env`, click it, choose **LF** and save.

### 4. Build and start

```
docker compose build
docker compose up -d
docker compose ps
```

The first build takes a few minutes. On start, the API waits for the database, applies migrations automatically and then runs.

### 5. Check that it works

| What | URL |
|------|-----|
| Web app | http://localhost:5173 |
| API health check | http://localhost:8000/api/health/ (should show `{"status": "ok"}`) |
| Tasks API | http://localhost:8000/api/tasks/ |
| Django admin | http://localhost:8000/admin/ |

To use the admin, create a superuser:

```
docker compose exec api python manage.py createsuperuser
```

## Daily commands

| Task | Command |
|------|---------|
| Start everything | `docker compose up -d` |
| Stop everything | `docker compose down` |
| See running services | `docker compose ps` |
| View logs | `docker compose logs -f api` (or `web`, `db`) |
| Rebuild after dependency changes | `docker compose build` then `docker compose up -d` |
| Restart one service | `docker compose restart api` |
| Wipe the database too | `docker compose down -v` (deletes all data) |

## Backend commands

```
docker compose exec api python manage.py makemigrations
docker compose exec api python manage.py migrate
docker compose exec api python manage.py test
docker compose exec api python manage.py shell
```

Whenever you change a model, run `makemigrations` and commit the new migration file.

## Frontend commands

```
docker compose exec web npm install <package-name>
docker compose exec web npm run build
```

After adding a package, run `docker compose build web` so it is saved in the image.

## Project structure

```
taskyaar/
├── backend/
│   ├── config/          Django settings, URLs, WSGI/ASGI
│   │   └── settings/    base.py, dev.py
│   ├── apps/            One folder per feature (tasks, users, chat, ...)
│   ├── common/          Shared helpers
│   ├── tests/           Cross-app and end-to-end tests
│   ├── requirements.txt Python dependencies
│   └── Dockerfile
├── web/
│   ├── src/
│   │   ├── app/         App shell, layouts, route guards
│   │   ├── features/    One folder per feature (auth, tasks, chat, ...)
│   │   ├── shared/      Reusable UI, hooks, API client, helpers
│   │   └── styles/
│   ├── package.json
│   └── Dockerfile
├── docs/                Project documentation
├── infra/               Deployment and scripts
├── .github/workflows/   CI pipelines
└── docker-compose.yml
```

Current status: `apps/tasks` is working. The other app folders are placeholders for upcoming features.

## Configuration

Settings live in `backend/.env` (copied from `.env.example`):

| Variable | Meaning |
|----------|---------|
| `DJANGO_SECRET_KEY` | Secret key. Unique per person and per environment. |
| `DJANGO_DEBUG` | `1` for development, `0` for production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated allowed host names |
| `CORS_ALLOWED_ORIGINS` | Comma-separated web origins allowed to call the API |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | Database name and login |
| `POSTGRES_HOST`, `POSTGRES_PORT` | Use `db` and `5432` with Docker Compose |

`web/.env` contains `VITE_PROXY_TARGET`, the address the dev server forwards `/api` requests to (`http://api:8000` with Docker).

## Team workflow

1. Update your main branch: `git checkout main && git pull`
2. Create a branch for your work: `git checkout -b feature/short-description`
3. Make small commits with clear messages.
4. Run the tests before pushing: `docker compose exec api python manage.py test`
5. Push your branch and open a pull request for review.

Rules:

- Never commit `.env` files. They are ignored by `.gitignore`.
- Commit migration files together with the model changes that created them.
- If you add a dependency, add it to `backend/requirements.txt` or `web/package.json`, then tell the team to rebuild.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `no configuration file provided: not found` | You are in the wrong folder. `cd` into the folder that contains `docker-compose.yml`. |
| `empty compose file` | The project files did not copy or extract properly. Re-clone or re-extract and check `docker-compose.yml` is not 0 bytes. |
| `env file ... not found` | You skipped step 2. Create `backend/.env` and `web/.env`. |
| `KeyError: 'DJANGO_SECRET_KEY'` | `backend/.env` is missing the key or the file name is wrong (for example `.env.txt`). |
| Port already in use (5173, 8000 or 5432) | Stop the other program using it, or change the port mapping in `docker-compose.yml`. |
| `docker` is not recognized | Close all terminals and open a new one. If it persists, restart Docker Desktop. |
| Docker stuck on "Starting..." | Restart your computer, then open Docker Desktop again. |
| "WSL 2 installation is incomplete" | Run `wsl --update` in PowerShell, then restart Docker Desktop. |
| Virtualization error | Enable Intel VT-x or AMD SVM in your BIOS. |
| API cannot connect to the database | Run `docker compose logs db`. Make sure `POSTGRES_HOST=db` in `backend/.env`. |
| Web shows "unreachable" for API status | Check `docker compose ps` and `docker compose logs api`. |
| Odd errors after pulling new changes | Run `docker compose build` then `docker compose up -d`. |
| Want a completely fresh start | `docker compose down -v`, then `docker compose build --no-cache`, then `docker compose up -d`. |

## Security notes

- The current API is open and has no login. Authentication is planned next, so do not deploy this as is.
- Use `DJANGO_DEBUG=0` and a strong, unique secret key in any shared or production environment.
- Change the default database password outside local development.