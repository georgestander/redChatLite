# RedwoodChat

RedwoodChat is a Redwood-first reusable chat system plan centered on RedwoodSDK + AI SDK `useChat`, designed to ship as `@redwood-chat/system` with subpath exports.

## Current Status
- Phase: implementation in progress.
- Active plan: `/Users/georgestander/dev/tools/redwoodChat/docs/plan.md`.
- Active roadmap: `/Users/georgestander/dev/tools/redwoodChat/docs/roadmap.md`.
- Validation baseline: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit`, `pnpm run test:regression`.

## v1 Goals
1. One package with stable subpath exports (`core`, `react`, `redwood`, `providers`, `ui`).
2. Redwood server-function integration with AI SDK-compatible streaming responses.
3. Provider support for OpenAI + OpenRouter in v1.
4. D1 persistence + R2/local attachment storage (images/PDF up to 10MB).
5. Stream resumption support and telemetry hooks.

## Planned Layout
- App demo: `/Users/georgestander/dev/tools/redwoodChat/apps/redwood-demo`
- Package: `/Users/georgestander/dev/tools/redwoodChat/packages/redwood-chat-system`

## Implemented Baseline
1. `@redwood-chat/system` package with required subpath exports.
2. Core runtime contracts and `createChatSystem`.
3. Redwood handler factory for `/api/chat`, `/api/chat/:id/stream`, `/api/chat/attachments` with AI SDK UI stream-compatible responses.
4. Provider adapters (`mock`, OpenAI-compatible, OpenRouter-compatible) plus config-driven selection.
5. Storage adapters: in-memory and D1-query-path with retention hooks.
6. Attachment adapters: local store and R2 store with fallback support.
7. Telemetry event sink wiring in the demo runtime.
8. Miniflare config and CI workflow baseline.
9. Unit + regression test harness mapped to scenario coverage in the plan.

## Working Agreements
1. Follow `/Users/georgestander/dev/tools/redwoodChat/AGENTS.md`.
2. Log each logical change in `/Users/georgestander/dev/tools/redwoodChat/docs/log.ndjson`.
3. Keep progress tables updated in plan documents.
4. Only mark items `done` after lint + tests pass and changes are committed.

## Documentation Index
- Plan: `/Users/georgestander/dev/tools/redwoodChat/docs/plan.md`
- Roadmap: `/Users/georgestander/dev/tools/redwoodChat/docs/roadmap.md`
- Change history: `/Users/georgestander/dev/tools/redwoodChat/CHANGELOG.md`
- Activity log: `/Users/georgestander/dev/tools/redwoodChat/docs/log.ndjson`
