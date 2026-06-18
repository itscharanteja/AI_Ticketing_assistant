# Agent Handoff Template

Use this template when passing work to another agent or summarizing migration progress for a human reviewer.

## Task

Short description of the requested work.

## Current Status

Choose one:

- Complete
- In progress
- Blocked
- Needs review

## Files Changed

List files changed by this work only.

```text
path/to/file
path/to/another-file
```

## Behavior Changed

Describe user-visible, API, database, configuration, or deployment behavior changes.

If no behavior changed, write:

```text
No runtime behavior changed.
```

## Tests and Checks

Record exact commands and results.

```text
cd ticket-service && npm test
Result: passed
```

Skipped checks:

```text
Not run: reason
```

## Migration Notes

Include:

- API compatibility concerns.
- Data migration concerns.
- Environment variable changes.
- Service-to-service URL changes.
- Known rollback considerations.

## Open Questions

List decisions still needed from the user or next agent.

## Next Recommended Step

One concrete next action.

