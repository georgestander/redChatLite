# RedwoodChat

RedwoodChat is a Redwood-first reusable chat system centered on RedwoodSDK + AI SDK `useChat`, designed to ship as `@redwood-chat/system` with subpath exports.

## Current Status
- Phase: v2 UI parity delivery completed (behavior + Vercel-style visual chat surface).
- Active roadmap: `ROADMAP.md`.
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
Run the RedwoodSDK demo app and use it in the browser.

### 1) Start Demo Server
```bash
pnpm --filter redwood-demo run dev
```

Default URL is `http://localhost:5173` (Vite may pick `5174+` if `5173` is already in use).

### 2) Use The Demo
1. Open the `Local` URL shown in terminal (usually `http://localhost:5173`).
2. Confirm the Vercel-style chat shell renders: top status bar, centered conversation lane, sticky rounded composer.
3. Enter a prompt and optionally attach image/PDF files.
4. Click `Send` to stream assistant output.
5. Use `Stop`, `Regenerate`, and `Resume` from the composer controls.
6. Confirm user messages render as blue right-aligned bubbles and assistant output renders left-aligned with assistant avatar.

### Optional: Run With Provider Keys
By default, demo uses the built-in `mock` provider. For live providers, use `.dev.vars` in `apps/redwood-demo`:

```bash
cp apps/redwood-demo/.dev.vars.example apps/redwood-demo/.dev.vars
```

Then set your values in `apps/redwood-demo/.dev.vars`:
- `AI_PROVIDER=openai` with `OPENAI_API_KEY=...` (and optional `OPENAI_MODEL`)
- or `AI_PROVIDER=openrouter` with `OPENROUTER_API_KEY=...` (and optional `OPENROUTER_MODEL`)

Then run:

```bash
pnpm --filter redwood-demo run dev
```

## Provider Configuration (Optional)
The demo runtime supports config-driven provider selection via:
1. `apps/redwood-demo/.dev.vars` for `pnpm --filter redwood-demo run dev`.
2. `apps/redwood-demo/.env` fallback for non-worker local scripts.

Optional telemetry:
- `CHAT_TELEMETRY_STDOUT=1`

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
10. RedwoodSDK worker runtime demo path with a Vercel-style chat UI (message bubbles, sticky composer, attachment chips, and send/stop/regenerate/resume controls).

## Working Agreements
1. Follow `AGENTS.md`.
2. Make atomic commits per logical change.
3. Only mark work `done` after lint + tests pass and changes are committed.

## Documentation Index
- Roadmap: `ROADMAP.md`
- Change history: `CHANGELOG.md`
- Repository rules: `AGENTS.md`
