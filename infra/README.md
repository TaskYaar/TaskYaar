# Infra

Everything needed to run TaskYaar outside your editor.

| Path | Purpose |
|---|---|
| `docker/backend.Dockerfile` | Builds the API/worker image |
| `docker/web.Dockerfile` | Builds the frontend image |
| `docker/nginx.conf` | Reverse proxy, HTTPS, static files, WebSocket pass-through |
| `compose/docker-compose.local.yml` | Local stack: API, PostGIS database, Redis, Celery worker, web |
| `compose/docker-compose.prod.yml` | Production-like stack |
| `scripts/backup.sh` | Database backup |
| `scripts/restore.sh` | Restore from backup (test this regularly!) |
| `scripts/deploy.sh` | Deployment helper |

**Environments:** `local` → `staging` (mirrors production) → `production`.
**Rule:** the only way code reaches production is through CI/CD from `main`.
