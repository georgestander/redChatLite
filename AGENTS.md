# AGENTS.md

## Purpose
Repository operating rules for humans and coding agents.

## Scope
These rules apply to the full repo unless a deeper `AGENTS.md` overrides them.

## Core Workflow
1. Make one atomic git commit per logical change.
2. Do not combine unrelated changes in the same commit.
3. Use clear, imperative commit messages with scope.

## Logging (Required)
1. Log every logical update in `docs/log.ndjson`.
2. Append exactly one NDJSON object per logical change.
3. Use UTC ISO-8601 timestamps.
4. Minimum fields: `ts`, `actor`, `type`, `summary`, `files`, `checks`, `commit`.

## Planning and Progress (Required)
1. Every plan document must include a progress table.
2. Each progress row must include: item, status, lint, tests, commit, updated time, notes.
3. Allowed statuses: `todo`, `in_progress`, `blocked`, `done`.
4. A row can be `done` only when lint passes, tests pass, and the work is committed.
5. Never mark a feature/step complete when any completion gate is missing or failing.

## Required Project Docs
1. Keep `README.md` current with purpose, architecture, setup status, and usage path.
2. Keep `CHANGELOG.md` current with user-visible changes (latest at top).
3. Keep `docs/roadmap.md` current with timeline for the active plan plus future plans.
4. Keep `docs/plan.md` current with implementation details and progress updates.

## Definition of Done
1. Implementation matches accepted scope.
2. Lint passes.
3. Tests pass.
4. Progress tables are updated.
5. `docs/log.ndjson` is updated.
6. Changes are committed atomically.

## Safety and Quality
1. Prefer small, reversible changes.
2. Do not rewrite git history unless explicitly requested.
3. Escalate blockers immediately; do not fake completion.
