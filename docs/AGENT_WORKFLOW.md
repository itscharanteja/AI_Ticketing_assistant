# Agent Workflow

Use this workflow whenever an agent makes code, configuration, migration, or documentation changes in this repository.

## 1. Intake

Before editing:

- Read `AGENTS.md`.
- Read `PROJECT_API_AND_FUNCTIONALITY.md` for current behavior.
- Inspect the exact files involved in the requested change.
- Check `git status --short` and assume unrelated modified files belong to the user.
- Identify which services are affected:
  - `frontend`
  - `ticket-service`
  - `ai-service`
  - `docker-compose.yml`
  - CI/CD or deployment files

## 2. Impact Analysis

For every change, determine:

- API compatibility impact.
- Database schema impact.
- Environment variable impact.
- Docker Compose or networking impact.
- Frontend runtime URL impact.
- Test coverage impact.
- Whether existing tickets or knowledge base entries need migration.

If the task touches API behavior, compare it against `PROJECT_API_AND_FUNCTIONALITY.md` and update documentation when behavior changes.

## 3. Implementation Rules

- Keep service boundaries clear:
  - Ticket Service persists tickets.
  - AI Service processes tickets and sends email.
  - Frontend displays workflows and calls APIs.
- Prefer small, focused changes over broad rewrites.
- Avoid introducing new frameworks unless the migration requires it.
- Preserve current status values unless a planned schema migration changes them:
  - `open`
  - `auto-resolved`
  - `resolved`
  - `in-progress`
  - `escalated`
- Preserve current public response fields unless the caller migration is included in the same task.
- Add validation near the API boundary when changing request handling.
- If moving orchestration out of the frontend, migrate the frontend call sequence and backend endpoint together.

## 4. Verification

Choose checks based on affected files:

| Changed area | Minimum check |
| --- | --- |
| `ticket-service/` | `cd ticket-service && npm test` |
| `ai-service/` | `cd ai-service && npm test` |
| `frontend/` | `cd frontend && npm test -- --watchAll=false` |
| Docker/runtime config | `docker-compose config` and targeted startup if practical |
| Docs only | Markdown review and source cross-check |

If a check cannot be run, record why in the handoff.

## 5. Documentation Updates

Update docs when the implementation changes:

- `PROJECT_API_AND_FUNCTIONALITY.md` for API, data, service behavior, or migration gotchas.
- `docs/MIGRATION_PLAYBOOK.md` for migration sequence or risk changes.
- `AGENTS.md` for stable agent guidance that should apply to future tasks.

Do not duplicate large API details across multiple docs. Link to the source-of-truth document instead.

## 6. Handoff

Use `docs/AGENT_HANDOFF_TEMPLATE.md` when work is incomplete, risky, or intended for another agent. A handoff should include enough context for the next agent to continue without rediscovering the whole repo.

