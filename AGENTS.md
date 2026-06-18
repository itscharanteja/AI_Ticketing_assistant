# Agent Instructions

This repository contains an AI-powered internal ticketing assistant built as a small microservice system. Any coding or migration agent should read this file first, then follow the linked workflow documents.

## Required Reading Order

1. `PROJECT_API_AND_FUNCTIONALITY.md` - current API behavior, data model, service flows, and migration gotchas.
2. `docs/AGENT_WORKFLOW.md` - standard agent workflow for analysis, implementation, verification, and handoff.
3. `docs/MIGRATION_PLAYBOOK.md` - migration-specific checklist and sequencing.
4. `docs/AGENT_HANDOFF_TEMPLATE.md` - format for handing work to another agent or human.

## Project Map

| Area | Path | Responsibility |
| --- | --- | --- |
| Frontend | `frontend/` | React UI for ticket submission and dashboard |
| Ticket Service | `ticket-service/` | Express CRUD API and PostgreSQL persistence |
| AI Service | `ai-service/` | RAG search, Anthropic Claude call, ticket update, email notification |
| Orchestration | `docker-compose.yml` | Local multi-service runtime |
| API guide | `PROJECT_API_AND_FUNCTIONALITY.md` | Source-derived API and functionality documentation |

## Non-Negotiable Rules

- Treat the source code as the final authority when documentation conflicts with implementation.
- Preserve existing API paths and response field names during migration unless the task explicitly changes them.
- Do not delete or overwrite user changes. This repo may have a dirty worktree.
- Keep migrations incremental. Change one service boundary or behavior at a time when possible.
- Keep frontend browser URLs separate from container-internal service URLs.
- Verify service behavior with tests or targeted API checks after changes.
- Document behavior changes in the handoff notes before ending work.

## Current Architecture Facts

- The frontend currently orchestrates ticket creation and AI processing as two separate HTTP calls.
- Ticket Service owns ticket persistence.
- AI Service owns AI response generation, ticket status update, and email notification.
- Knowledge base entries in AI Service are in memory and are lost on restart.
- `ai-service/src/server.js` has a runtime `SmartRAGEngine` implementation that differs from `ai-service/src/SmartRAGEngine.js`.
- `frontend/src/App.js` currently defines environment URL variables but uses hardcoded submit URLs.
- Ticket email is collected by the frontend but is not stored in the ticket database.

## Useful Commands

Run these from the repository root unless noted otherwise.

```bash
docker-compose up --build
```

```bash
cd ticket-service && npm test
```

```bash
cd ai-service && npm test
```

```bash
cd frontend && npm test -- --watchAll=false
```

## Expected Agent Output

Every completed task should leave:

- A short summary of what changed.
- Files changed.
- Tests or checks run.
- Any skipped checks and why.
- Migration risks or follow-up items.

