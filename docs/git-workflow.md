# Git workflow

- `main`: production-ready, protected, deploys via CI
- `develop`: integration branch
- `feature/<short-name>`, `fix/<short-name>`: branch from `develop`, PR back into it
- Every PR needs one approval and green CI
- Commit messages: `type: short summary` (feat, fix, docs, test, refactor, chore)
