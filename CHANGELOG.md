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
- Added detailed fork/clone quick-start and demo run instructions in `README.md`.
- Added a runnable local demo server (`pnpm --filter redwood-demo run dev`) with browser UI at `http://localhost:8910`.
- Updated provider setup docs to use `.env` / `.dev.vars` instead of shell `export` commands.
- Added `apps/redwood-demo/.env.example` and `apps/redwood-demo/.dev.vars.example` templates.
- Added `docs/plan-ui-parity.md` with a phased delivery plan for RWSdk-first full AI SDK UI parity.
- Updated `docs/roadmap.md` timeline/progress to track the new v2 UI parity plan.
- Added Phase 0 scenario planning and Scenario Coverage Matrix in `docs/plan-ui-parity.md` to lock parity scope before implementation.
- Migrated `apps/redwood-demo` to RedwoodSDK `vite + worker` runtime wiring and routed `/` to the React chat page.
- Expanded parity implementation with richer message-part rendering, `useGenericChat` callback/request-body passthrough, true OpenAI/OpenRouter streaming, and live resume continuation coverage.
- Finalized v2 release hardening by updating README runtime guidance, validating RedwoodSDK demo boot, and trimming legacy demo-only server files.
- Fixed RedwoodSDK demo client boot by narrowing `forceClientPaths` to file globs so Vite no longer generates invalid `import("/web/src/components")` lookups.
- Added Phase 8 visual parity plan scope and scenario matrix to deliver exact Vercel-style chat UI presentation in the demo.
- Replaced the plain demo shell with a Vercel-style chat interface (header, conversation lane, user/assistant bubble styling, sticky composer, and attachment chips) and added UI parity tests.
- Clarified README demo quickstart with explicit Vercel-style UI verification steps and dynamic local-port behavior (`5173` or next available).
