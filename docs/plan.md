# RedwoodChat v1 Plan: Reusable RedwoodSDK Chat System (2 Weeks)

## Summary
Build a reusable, out-of-the-box chat system based on RedwoodSDK + AI SDK `useChat`, implemented as one package with subpath exports, optimized for Redwood first, and designed for future portability.

Primary goal: accelerate iteration speed for chat features while keeping integration friction low.

## Locked Product Decisions
1. Packaging: one package with subpath exports (`core`, `react`, `redwood`, `providers`, `ui`).
2. Runtime first: Cloudflare Workers + Miniflare.
3. Integration style: Redwood server-functions first, with framework-neutral contracts.
4. Audience: internal teams first.
5. Auth: anonymous-first (no built-in auth/accounts).
6. Providers in v1: OpenAI + OpenRouter; Anthropic/Google as typed contract refs/docs only.
7. Persistence: local Miniflare-first, D1 adapter + abstraction for production.
8. Attachments: in scope now; Images + PDFs; 10MB per file; R2 + local fallback; MIME + size validation baseline.
9. Streaming: include stream resumption in v1.
10. UI: headless + default skin.
11. Telemetry: structured event hooks (no built-in analytics dashboard).
12. Retention: 30 days default.
13. Ops endpoints: no explicit delete/cleanup admin APIs in v1.
14. Demo coverage: Redwood demo only in v1.
15. Delivery window: 2-week MVP.
16. Success priority: install-and-run speed in fresh Redwood app.

## Success Criteria (Acceptance)
1. Fresh Redwood app integration completes in <= 30 minutes using docs/templates.
2. Live provider first-token latency is < 2s on baseline prompt under local dev test conditions.
3. Provider swap between OpenAI and OpenRouter requires config change only (no UI code changes).
4. Attachment flow works end-to-end for allowed image/PDF files up to 10MB.
5. Stream resumption reconnects and continues active response after disconnect.
6. CI passes lint + typecheck + unit/integration + smoke.

## Progress Tracking
Completion gate: A workstream can be `done` only when lint passes, tests pass, and the change is committed.

| Workstream | Status | Lint | Tests | Commit | Updated At (UTC) | Notes |
|---|---|---|---|---|---|---|
| Days 1-2: monorepo bootstrap + package scaffolding + Redwood demo boot | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Tracking initialized |
| Days 3-4: core contracts + `useGenericChat` + base streaming endpoint | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Pending implementation |
| Days 5-6: OpenAI/OpenRouter adapters + telemetry hooks | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Pending implementation |
| Days 7-8: D1 adapter + Miniflare + anonymous sessions + retention | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Pending implementation |
| Days 9-10: attachments (R2/local fallback) + validation + rendering | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Pending implementation |
| Days 11-12: stream resumption + reconnect + disconnect handling | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Pending implementation |
| Days 13-14: tests/docs/CI hardening + polish | `todo` | `not-run` | `not-run` | `no` | 2026-02-12 | Pending implementation |

## Scope Boundaries

### In Scope
1. Reusable chat package with stable host-facing API.
2. Redwood-first server integration and demo app.
3. AI SDK `useChat` compatibility via canonical AI SDK server stream response.
4. D1 persistence adapter and local Miniflare setup.
5. R2 attachment storage and local fallback.
6. Anonymous session handling.
7. Telemetry hooks and default event schema.
8. 30-day retention policy behavior.

### Out of Scope
1. Built-in authentication/account management.
2. Built-in analytics dashboard.
3. Production-grade malware scanning pipeline.
4. Full Anthropic/Google provider implementations.
5. Second framework demo app.
6. Admin delete/cleanup endpoints.

## Implementation Architecture

### Workspace and File Layout
1. Create implementation root at `/Users/georgestander/dev/tools/redwoodChat`.
2. Use pnpm workspace with app + package layout.
3. App path: `/Users/georgestander/dev/tools/redwoodChat/apps/redwood-demo`.
4. Package path: `/Users/georgestander/dev/tools/redwoodChat/packages/redwood-chat-system`.

### Package Export Strategy (Single Package)
1. Package name: `@redwood-chat/system`.
2. Subpath exports:
   - `@redwood-chat/system/core`
   - `@redwood-chat/system/react`
   - `@redwood-chat/system/redwood`
   - `@redwood-chat/system/providers`
   - `@redwood-chat/system/ui`
3. Keep internal module boundaries strict so package can split later without host API breakage.

### Server/Client Flow
1. Client uses `useGenericChat()` from `@redwood-chat/system/react`.
2. `useGenericChat()` wraps AI SDK `useChat` and configures `DefaultChatTransport`.
3. Transport points to Redwood endpoint(s), default `/api/chat`.
4. Redwood route/server function delegates to provider adapter and returns AI SDK UI stream response.
5. Persistence writes thread/messages/attachments metadata to D1.
6. Attachment binary data stores in R2/local fallback; message parts reference attachment IDs/URLs.
7. Resume flow reconnects through `/api/chat/:id/stream` handler (support method expected by current `useChat` transport behavior).

## Public APIs / Interfaces / Types
| Surface | Signature (v1) | Notes |
|---|---|---|
| Core runtime | `createChatSystem(config: ChatSystemConfig): ChatRuntime` | Factory for providers/storage/attachments/telemetry wiring |
| React hook | `useGenericChat(options: GenericChatOptions)` | Stable host API wrapping AI SDK `useChat` |
| UI shell | `DefaultChatShell(props: DefaultChatShellProps)` | Ready-to-use skin built on headless primitives |
| Provider | `interface ChatProviderAdapter` | `stream(request)`, `supportsAttachments`, provider id |
| Storage | `interface ChatStorageAdapter` | thread/message create/read/list methods + retention hooks |
| Attachments | `interface AttachmentStore` | upload/get/delete metadata + size/MIME enforcement |
| Telemetry | `type ChatTelemetryEvent` | standard event names and payload shape |
| Redwood integration | `createRedwoodChatHandlers(config)` | returns request handlers for chat/send/resume/attachments |

## HTTP/Handler Contracts
1. `POST /api/chat`: send message and start stream; accepts chat id + latest message + metadata.
2. `GET or POST /api/chat/:id/stream`: reconnect to active stream for resume behavior.
3. `POST /api/chat/attachments`: upload attachment with validation; returns attachment ref for message parts.
4. Keep server responses AI SDK-compatible (`toUIMessageStreamResponse`) for `useChat` interoperability.

## Data Model (D1)
1. `chat_threads`: thread metadata, session identity key, timestamps.
2. `chat_messages`: message id, thread id, role, serialized parts, provider/model metadata, usage/timestamps.
3. `chat_attachments`: attachment metadata, thread/message linkage, MIME, size, R2 key/url, timestamps.
4. `chat_stream_state`: resume metadata for active/incomplete assistant streams.
5. Retention: default TTL 30 days via write-time cleanup hooks and scheduled-ready internals (no admin endpoint in v1).

## Two-Week Delivery Plan
1. Days 1-2: monorepo bootstrap, package scaffolding, subpath exports, Redwood demo boot.
2. Days 3-4: core contracts (`core`, `react`, `redwood`), `useGenericChat`, base chat endpoint, text streaming.
3. Days 5-6: OpenAI + OpenRouter adapters, config-driven provider selection, telemetry event hooks.
4. Days 7-8: D1 persistence adapter + local Miniflare wiring, anonymous session behavior, retention policy implementation.
5. Days 9-10: attachments pipeline (R2/local fallback), MIME/size enforcement, UI message part rendering for images/PDF refs.
6. Days 11-12: stream resumption endpoint + reconnect behavior, disconnect/abort handling.
7. Days 13-14: test hardening, docs for 30-minute install path, CI pipeline, polish.

## Test Plan and Scenarios
1. Unit: provider adapter contract tests (OpenAI/OpenRouter), error mapping, config validation.
2. Unit: storage adapter CRUD + retention behavior.
3. Unit: attachment validation (size/MIME) and metadata mapping.
4. Unit: telemetry event emission ordering and payload schema.
5. Integration: `/api/chat` stream lifecycle with AI SDK-compatible response.
6. Integration: stream resume reconnect after simulated disconnect.
7. Integration: D1 persistence round-trip for threads/messages.
8. Integration: R2/local attachment upload and message linking.
9. Smoke: Redwood demo full flow (new chat, stream, upload, reconnect).
10. Performance check: install flow <=30 min; live first-token latency <2s baseline.

## Risks and Mitigations
1. Scope density risk (attachments + resume + multi-provider): mitigate with strict daily checkpoints and keep Anthropic/Google as docs/contracts only.
2. AI SDK resume contract drift: mitigate by pinning AI SDK version and covering reconnect behavior with integration tests.
3. OpenRouter compatibility differences: mitigate through adapter normalization layer and provider-specific error translation.
4. Attachment complexity on Workers: mitigate with narrow type scope (Images/PDF) and strict upload limits.
5. No auth in v1: mitigate by explicit anonymous mode labeling and extension hook for host-owned identity.

## Assumptions and Defaults
1. Decision owner is you.
2. No formal compliance requirements in v1.
3. Internal use is primary release target.
4. Redwood demo is the only first-party demo in v1.
5. No admin ops endpoints in v1 despite 30-day retention default.
6. Setup/docs assume pnpm workflow.
7. CI baseline is mandatory from v1.

## Key References
1. [AI SDK `useChat` reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
2. [AI SDK UI transport docs](https://ai-sdk.dev/docs/ai-sdk-ui/transport)
3. [AI SDK stream protocols](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
4. [RedwoodSDK docs](https://docs.rwsdk.com/)
