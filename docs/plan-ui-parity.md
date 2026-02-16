# RedwoodChat v2 Plan: Full AI SDK UI Parity in RWSdk Demo

## Objective
Ship a real RWSdk-running demo app with a React chat UI that reaches practical feature parity with AI SDK UI chat capabilities used by product teams.

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

## Progress Tracking
Completion gate: A row can be `done` only when lint passes, tests pass, and the change is committed.

| Item | Status | Lint | Tests | Commit | Updated At (UTC) | Notes |
|---|---|---|---|---|---|---|
| Phase 0: parity spec lock and protocol contract mapping | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Freeze parity matrix against AI SDK UI message/stream contracts |
| Phase 1: promote RWSdk runtime as default demo execution path | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Replace custom Node HTML entry path with RWSdk app runtime |
| Phase 2: wire React chat page as canonical demo UI | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Make web UI the documented and tested local demo flow |
| Phase 3: message model + renderer parity (reasoning/source/tool/data/file) | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Extend contracts and default UI renderer coverage |
| Phase 4: hook/transport parity (`useGenericChat`, request shaping, callbacks) | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Align with AI SDK chat helper/init behaviors used in app UIs |
| Phase 5: true provider streaming + abort propagation | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Replace synthetic chunking with real stream bridge |
| Phase 6: resume semantics hardening (continue active generation) | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Ensure reconnect continues in-flight stream rather than replay only |
| Phase 7: test/doc hardening and release-readiness gates | `todo` | `not-run` | `not-run` | `no` | 2026-02-16T00:00:00Z | Complete docs/CI evidence for parity sign-off |

## Delivery Timeline
1. Week 1 (2026-02-16 to 2026-02-22): Phases 0-3.
2. Week 2 (2026-02-23 to 2026-03-01): Phases 4-6.
3. Week 3 (2026-03-02 to 2026-03-06): Phase 7, polish, and acceptance validation.

## Work Breakdown
### Phase 0: Parity Spec Lock
1. Create a parity matrix from AI SDK UI capabilities to local package/demo surfaces.
2. Identify required protocol events and message-part mappings.
3. Lock what "full parity" means for this repo before implementation work begins.

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
