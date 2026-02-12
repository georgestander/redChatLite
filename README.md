# RedwoodChat

RedwoodChat is a Redwood-first reusable chat system centered on RedwoodSDK + AI SDK `useChat`, designed to ship as `@redwood-chat/system` with subpath exports.

## Current Status
- Phase: implementation in progress.
- Active plan: `docs/plan.md`.
- Active roadmap: `docs/roadmap.md`.
- Validation baseline: `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit`, `pnpm run test:regression`.

## Quick Start (Fork or Clone)
### 1) Prerequisites
- Git
- Node.js 20+
- Corepack enabled (`corepack enable`)
- pnpm 9.x (repo is pinned to `pnpm@9.15.9`)

### 2) Fork + Clone
If you are forking:
1. Fork this repo in GitHub.
2. Clone your fork:

```bash
git clone <your-fork-url>
cd redwoodChat
```

If you are not forking:

```bash
git clone <repo-url>
cd redwoodChat
```

### 3) Install Dependencies
```bash
pnpm install
```

### 4) Verify Everything Works
```bash
pnpm run lint
pnpm run typecheck
pnpm run test:unit
pnpm run test:regression
```

## How To Run The Demo Locally
Run the local demo app and use it in the browser.

### 1) Start Demo Server
```bash
pnpm --filter redwood-demo run dev
```

Default URL:
- `http://localhost:8910`

### 2) Use The Demo
1. Open `http://localhost:8910`.
2. Enter a prompt in the textarea.
3. Click `Send`.
4. Watch the assistant stream output live.

### Optional: Run With Provider Keys
By default, demo uses the built-in `mock` provider. To use live providers:

```bash
export AI_PROVIDER=openai
export OPENAI_API_KEY=<your_key>
export OPENAI_MODEL=gpt-4o-mini
pnpm --filter redwood-demo run dev
```

or

```bash
export AI_PROVIDER=openrouter
export OPENROUTER_API_KEY=<your_key>
export OPENROUTER_MODEL=openai/gpt-4o-mini
pnpm --filter redwood-demo run dev
```

### Optional: Start Miniflare Bindings
```bash
pnpm --filter redwood-demo run dev:miniflare
```

## Provider Configuration (Optional)
The demo runtime supports config-driven provider selection.

```bash
export AI_PROVIDER=openai
export OPENAI_API_KEY=<your_key>
export OPENAI_MODEL=gpt-4o-mini
```

or

```bash
export AI_PROVIDER=openrouter
export OPENROUTER_API_KEY=<your_key>
export OPENROUTER_MODEL=openai/gpt-4o-mini
```

Optional telemetry output:

```bash
export CHAT_TELEMETRY_STDOUT=1
```

## v1 Goals
1. One package with stable subpath exports (`core`, `react`, `redwood`, `providers`, `ui`).
2. Redwood server-function integration with AI SDK-compatible streaming responses.
3. Provider support for OpenAI + OpenRouter in v1.
4. D1 persistence + R2/local attachment storage (images/PDF up to 10MB).
5. Stream resumption support and telemetry hooks.

## Planned Layout
- App demo: `apps/redwood-demo`
- Package: `packages/redwood-chat-system`

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
1. Follow `AGENTS.md`.
2. Log each logical change in `docs/log.ndjson`.
3. Keep progress tables updated in plan documents.
4. Only mark items `done` after lint + tests pass and changes are committed.

## Documentation Index
- Plan: `docs/plan.md`
- Roadmap: `docs/roadmap.md`
- Change history: `CHANGELOG.md`
- Activity log: `docs/log.ndjson`
