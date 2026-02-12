# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]
### Added
- Added project governance rules in `/Users/georgestander/dev/tools/redwoodChat/AGENTS.md` (atomic commits, logging, progress-gate completion rules).
- Added a baseline project readme in `/Users/georgestander/dev/tools/redwoodChat/README.md`.
- Added roadmap timeline and progress tracking in `/Users/georgestander/dev/tools/redwoodChat/docs/roadmap.md`.
- Added progress tracking table and completion gate rules to `/Users/georgestander/dev/tools/redwoodChat/docs/plan.md`.
- Added/update entries in `/Users/georgestander/dev/tools/redwoodChat/docs/log.ndjson` to track project activity.
- Added pnpm workspace scaffolding, package/app layout, and canonical validation scripts.
- Added `@redwood-chat/system` baseline implementation across `core`, `react`, `redwood`, `providers`, `storage`, `attachments`, and `ui`.
- Added Redwood demo API/web scaffolding with chat, resume, and attachment handlers.
- Added unit and regression test suites mapped to the Scenario Coverage Matrix.
- Added D1 query-path storage adapter with schema init and fallback behavior.
- Added R2 attachment store with local fallback and regression coverage for bound bucket usage.
- Updated Redwood handlers to emit AI SDK UI stream-compatible responses (`text-start`/`text-delta`/`text-end`).
- Added Miniflare configuration and GitHub Actions CI pipeline for lint/typecheck/unit/regression gates.
