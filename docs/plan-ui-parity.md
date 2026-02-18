# RedwoodChat v2 Plan: Full AI SDK UI Parity in RWSdk Demo

## Objective
Ship a real RWSdk-running demo app with a React chat UI that reaches behavior and visual parity with the Vercel AI chatbot reference experience.

## Why This Plan Exists
The current runnable demo path uses a custom Node HTML server and text-only stream rendering. This plan closes that gap and makes the demo represent the package's intended production integration model.

## Scope
### In Scope
1. RWSdk demo runtime as the default runnable path.
2. React UI wired as first-class demo entrypoint.
3. Full message-part rendering support needed for AI SDK UI parity:
   - text
   - file/attachments
   - reasoning
   - source-url/source-document
   - tool invocation states and results
   - data parts used by app flows
4. Hook/transport parity improvements in `useGenericChat` and transport shaping.
5. True provider streaming with cancellation and reconnect semantics.
6. Resume behavior that continues active streams, not replay-only behavior.
7. Unit/regression/demo-smoke coverage for all parity-critical paths.
8. Docs refresh: README quickstart/demo path, roadmap, changelog, and progress logs.
9. Vercel-style visual parity for the core chat surface (layout, message bubbles, composer, controls, and attachment previews).

### Out of Scope
1. New provider families beyond current v1 provider set.
2. Built-in auth/account system.
3. New admin/ops dashboards.
4. Non-Redwood secondary demos.

## Acceptance Criteria
1. `pnpm --filter redwood-demo run dev` starts an RWSdk app that serves the React chat UI.
2. The default demo UI can send, stop, regenerate, resume, upload attachments, and render non-text parts listed above.
3. Provider stream path uses actual streaming (not synthetic chunk splitting) for OpenAI/OpenRouter adapters.
4. Abort/stop propagates from UI to provider request signal.
5. Resume endpoint continues active output across disconnect and is covered by regression tests.
6. `useGenericChat` exposes parity-relevant init options from AI SDK ChatInit where safe to support.
7. Lint, typecheck, unit, regression, and demo smoke pass in CI.
8. The core chat screen visually matches the Vercel baseline for desktop and mobile in structure, spacing, and control hierarchy.
9. No placeholder shell remains in the demo path; the UI is implemented as a production-like chat screen.

## Progress Tracking
Completion gate: A row can be `done` only when lint passes, tests pass, and the change is committed.

| Item | Status | Lint | Tests | Commit | Updated At (UTC) | Notes |
|---|---|---|---|---|---|---|
| Phase 0: parity spec lock and protocol contract mapping | `done` | `pass` | `pass` | `yes` | 2026-02-16T11:15:19Z | Scenario plan + coverage matrix locked and validated via lint/typecheck/unit/regression gates |
| Phase 1: promote RWSdk runtime as default demo execution path | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:13:43Z | RedwoodSDK `vite + worker` runtime scaffolded; `/api/chat*` and `/api/chat/attachments` routed through chat handlers |
| Phase 2: wire React chat page as canonical demo UI | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:19:56Z | `/` now serves React chat UI with send/stop/regenerate/resume and attachment upload controls |
| Phase 3: message model + renderer parity (reasoning/source/tool/data/file) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:19:56Z | Core message-part contracts extended and default shell renders text/reasoning/file/source/tool/data parts |
| Phase 4: hook/transport parity (`useGenericChat`, request shaping, callbacks) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:19:56Z | `useGenericChat` now forwards ChatInit callbacks and supports custom request-body shaping |
| Phase 5: true provider streaming + abort propagation | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:19:56Z | OpenAI/OpenRouter adapters now use real streaming responses and runtime passes abort signals |
| Phase 6: resume semantics hardening (continue active generation) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:19:56Z | Runtime resume can attach to active streams and continue live deltas; regression coverage added |
| Phase 7: test/doc hardening and release-readiness gates | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:33:28Z | README/runtime guidance refreshed, RedwoodSDK demo boot verified, and full lint/typecheck/unit/regression gates passing |
| Post-closeout patch: Redwood `use-client` lookup import fix | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:41:06Z | Vite `virtual:use-client-lookup.js` no longer emits invalid `import(\"/web/src/components\")` entries |
| Phase 8: Vercel visual parity pass (`$balls`) | `done` | `pass` | `pass` | `yes` | 2026-02-18T16:56:51Z | Demo now renders Vercel-style chat shell/composer/bubbles, adds parity UI tests, and passes full validation + demo boot checks |

## Delivery Timeline
1. Week 1 (2026-02-16 to 2026-02-22): Phases 0-3.
2. Week 2 (2026-02-23 to 2026-03-01): Phases 4-6.
3. Week 3 (2026-03-02 to 2026-03-06): Phase 7, polish, and acceptance validation.
4. Week 3 extension (2026-02-18): Phase 8 visual parity patch and validation closeout.

## Work Breakdown
### Phase 0: Parity Spec Lock
1. Create a parity matrix from AI SDK UI capabilities to local package/demo surfaces.
2. Identify required protocol events and message-part mappings.
3. Lock what "full parity" means for this repo before implementation work begins.

## Phase 0 Scenario Plan (`$balls`)
Phase 0 is documentation-first and exists to freeze scope, risks, and validation coupling before implementation begins.

### Stakeholders
1. Internal Redwood product teams that need a trustworthy parity baseline.
2. `@redwood-chat/system` maintainers that own API/runtime compatibility.
3. CI/release owners that enforce completion gates before phase promotion.

### Success Criteria
1. A locked parity contract exists for UI message parts and stream events used by this repo.
2. Each Phase 0 scenario is mapped to acceptance checks, unit suites, and regression suites.
3. Plan and roadmap progress rows remain aligned with lint/tests/commit gates.

### Known Risks and Failure Modes
1. Contract drift between local message/stream semantics and AI SDK UI expectations.
2. False parity claims without executable suite coupling.
3. Gaps in provider/attachments/resume coverage that surface late in implementation.
4. Premature completion marking without lint/tests/commit evidence.

### Scenario Coverage Matrix
All scenarios below must remain mapped to acceptance checks and executable suites before Phase 0 can be closed.

| Scenario | Acceptance Check | Unit Tests | Regression Tests |
|---|---|---|---|
| AI SDK UI message-part contract lock (`text`, `file`, `reasoning`, `source`, `tool`, `data`) | Phase 0 parity matrix explicitly lists supported/target parts and stream event expectations for v2 | `tests/unit/react/use-generic-chat.unit.test.ts`, `tests/unit/redwood/handlers-stream.unit.test.ts` | `tests/regression/chat/stream-resume.regression.test.ts` |
| Provider swap contract (`openai` <-> `openrouter`) | Provider choice remains config-only with stable chat handler contract | `tests/unit/providers/provider-registry.unit.test.ts` | `tests/regression/chat/provider-swap.regression.test.ts` |
| Attachment validation + storage behavior | MIME/size contract and storage fallbacks remain explicit in parity scope | `tests/unit/attachments/validation.unit.test.ts`, `tests/unit/attachments/r2-store.unit.test.ts` | `tests/regression/chat/attachments.regression.test.ts`, `tests/regression/chat/r2-binding.regression.test.ts` |
| Persistence + resume state lifecycle | `/api/chat` and `/api/chat/:id/stream` expectations map to deterministic storage and resume semantics | `tests/unit/storage/d1-adapter.unit.test.ts`, `tests/unit/storage/concurrency.unit.test.ts` | `tests/regression/chat/persistence-retention.regression.test.ts`, `tests/regression/chat/concurrency.regression.test.ts` |
| Telemetry traceability | Event emission flow is documented and mapped to send/stream/resume/attachment behaviors | `tests/unit/telemetry/events.unit.test.ts` | `tests/regression/chat/telemetry-flow.regression.test.ts` |
| Install + bootstrap reliability for consumers | Quickstart and baseline run path stay aligned with documented commands | `tests/unit/workspace/bootstrap.unit.test.ts` | `tests/regression/install/install-path.regression.test.ts` |

### Phase 1: Runtime Path Correction
1. Make RWSdk runtime the default dev/demo entrypoint.
2. Keep compatibility route coverage for `/api/chat`, `/api/chat/:id/stream`, and `/api/chat/attachments`.
3. Remove drift between README demo commands and actual runtime architecture.

### Phase 2: Canonical React Demo UI
1. Promote `chat-page` as served demo UI path.
2. Add UX controls for stop/regenerate/resume.
3. Integrate attachment upload and display in the primary screen.

### Phase 3: Message and Rendering Parity
1. Expand core message part types to support parity-required UI parts.
2. Extend default renderer to handle each supported part safely.
3. Preserve backward compatibility for existing text/attachment flows.

### Phase 4: Hook and Transport Parity
1. Expand `GenericChatOptions` to pass through safe ChatInit callbacks.
2. Confirm send/reconnect request shaping supports richer payloads.
3. Validate helper behavior (send, stop, regenerate, resume, tool outputs) in tests.

### Phase 5: Streaming Fidelity
1. Implement true provider streaming for OpenAI/OpenRouter adapters.
2. Bridge provider stream events to AI SDK UI stream events without synthetic chunking.
3. Thread request abort signals end-to-end.

### Phase 6: Resume Semantics
1. Differentiate replay-from-state vs continue-live-stream behavior.
2. Ensure resume can attach to active generation when available.
3. Cover disconnect/reconnect race conditions with regression tests.

### Phase 7: Validation and Docs
1. Expand regression matrix for parity features.
2. Add demo smoke checks for UI-visible behaviors.
3. Update README, roadmap, changelog, and logs with final validated status.

### Phase 8: Exact Visual Parity Patch (`$balls`)
1. Replace plain shell styling with a Vercel-style chat layout and message presentation.
2. Implement composer UI parity: rounded multiline input, sticky footer bar, attachment chips, and primary send/stop controls.
3. Preserve current behavior controls (send/stop/regenerate/resume + attachments) while matching reference visual hierarchy.
4. Add node-based unit/regression checks that lock visual structure contracts (class hooks, layout sections, control affordances).

## Phase 8 Scenario Plan (`$balls`)
Phase 8 is a visual parity patch and must be completed with explicit scenario-to-test coupling before release.

### Stakeholders
1. Redwood demo users expecting a production-grade visual reference implementation.
2. Internal maintainers responsible for parity claims in README/roadmap/changelog.
3. QA/release owners enforcing lint/typecheck/test/commit completion gates.

### Success Criteria
1. Demo no longer renders generic HTML-like shell; it renders a Vercel-style chat application surface.
2. Desktop and mobile layouts preserve reference hierarchy: message area, sticky composer, attachment strip, and control row.
3. Existing behavior parity (send/stop/regenerate/resume/attachments/streaming) remains intact after visual refactor.
4. Visual contract tests and regression checks pass and are linked to scenarios below.

### Known Risks and Failure Modes
1. Styling-only refactor may accidentally break streaming state transitions or control enable/disable rules.
2. Vercel look replication can introduce unstable dependencies; scope must stay local to this repo.
3. Redwood `use client` scanning can regress if new component structure creates invalid virtual imports.
4. UI regressions may pass functional tests unless visual structure checks are added.

### Scenario Coverage Matrix (Phase 8)
All scenarios below must map to acceptance checks and executable suites before Phase 8 can be marked `done`.

| Scenario | Acceptance Check | Unit Tests | Regression Tests |
|---|---|---|---|
| Core shell parity (app container + message viewport + sticky composer) | `/` renders Vercel-like hierarchy with dedicated shell sections and sticky composer region | `tests/unit/ui/chat-page-structure.unit.test.ts` | `tests/regression/chat/demo-ui-parity.regression.test.ts` |
| Message bubble parity (assistant/user visual differentiation) | User and assistant messages render distinct bubble/container styles matching reference directionality | `tests/unit/ui/chat-page-structure.unit.test.ts` | `tests/regression/chat/demo-ui-parity.regression.test.ts` |
| Composer parity (multiline input + primary send + stop state) | Composer shows rounded textarea, send button, and stop button state transitions | `tests/unit/ui/chat-page-structure.unit.test.ts` | `tests/regression/chat/stream-resume.regression.test.ts` |
| Attachment preview parity (chip/card previews before send) | Selected files appear as preview chips/cards and can be submitted in the same request | `tests/unit/ui/chat-page-structure.unit.test.ts` | `tests/regression/chat/attachments.regression.test.ts` |
| Compatibility safety with Redwood scanner | Generated `virtual:use-client-lookup.js` resolves only concrete files (no directory imports) | N/A | demo boot check + `pnpm --filter redwood-demo run dev` |
| Completion-gate integrity | Progress rows/log/changelog updated only after lint+tests+commit evidence | N/A | `pnpm run lint`, `pnpm run typecheck`, `pnpm run test:unit`, `pnpm run test:regression` |

## Validation Matrix
1. Static checks: `pnpm run lint`, `pnpm run typecheck`.
2. Unit checks: hook/transport/provider/core contracts.
3. Regression checks: streaming, resume, attachments, provider swaps, parity message parts.
4. Demo smoke: runnable RWSdk UI path with interactive checks.
5. Acceptance checks: all criteria above verified and documented.

## Risks and Mitigations
1. AI SDK protocol drift: pin versions and keep contract tests close to installed typings.
2. Resume complexity: isolate resume state model and add deterministic replay/continue tests.
3. Provider behavior differences: normalize adapter event envelopes and error mapping.
4. UI complexity growth: keep default shell minimal but complete for parity-required parts.

## Definition of Done for This Plan
1. All progress rows marked `done` with lint/tests/commit evidence.
2. Demo is RWSdk-first and React UI-first in docs and implementation.
3. Gap review findings for parity are closed with linked tests.
4. Roadmap and changelog reflect completion and next plan intake.
