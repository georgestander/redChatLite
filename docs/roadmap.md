# RedwoodChat Roadmap

## Timeline
| Plan | Window | Goal | Status |
|---|---|---|---|
| v1 MVP (current) | 2026-02-12 to 2026-02-25 | Reusable Redwood-first chat package with streaming, attachments, persistence, and resume support | `in_progress` |
| v2 UI parity (next) | 2026-02-16 to 2026-03-06 | RWSdk-first runnable demo with practical full AI SDK UI chat parity | `done` |
| v1.1 (later, draft) | TBD | Post-MVP hardening and expansion (provider breadth, ops tooling, production readiness) | `backlog` |

## Current Plan Progress (v1 MVP)
Completion gate: A row can be `done` only when lint passes, tests pass, and the work is committed.

| Item | Status | Lint | Tests | Commit | Updated At (UTC) | Notes |
|---|---|---|---|---|---|---|
| Governance docs baseline (AGENTS/README/CHANGELOG/roadmap/progress tables) | `in_progress` | `not-run` | `not-run` | `yes (48543ff)` | 2026-02-12 | Committed; awaiting lint/tests before `done` |
| Product implementation sprint (from `docs/plan.md`) | `in_progress` | `pass` | `pass` | `mixed (e9c4d76 + bd33afe + 15285b5 + pending)` | 2026-02-12 | Core build and hardening committed; demo docs now prefer `.env` / `.dev.vars` local setup; final external acceptance checks pending |

## Next Plan Progress (v2 UI parity)
Completion gate: A row can be `done` only when lint passes, tests pass, and the work is committed.

| Item | Status | Lint | Tests | Commit | Updated At (UTC) | Notes |
|---|---|---|---|---|---|---|
| Full AI SDK UI parity plan bootstrap (from `docs/plan-ui-parity.md`) | `done` | `pass` | `pass` | `yes` | 2026-02-16T11:15:19Z | Phase 0 scenario plan + coverage matrix locked with full validation evidence |
| Phase 1 runtime migration (v2) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:13:43Z | redwood-demo now runs on RedwoodSDK `vite + worker` path with chat API routes preserved |
| Phases 2-6 parity implementation (v2) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:19:56Z | Chat UI controls, rich part rendering, hook parity, true provider streaming, and live resume continuation are implemented |
| Phase 7 release hardening (v2) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:33:28Z | README/docs refreshed, RedwoodSDK demo boot validated, and release gates confirmed green |
| Post-closeout boot regression fix (v2) | `done` | `pass` | `pass` | `yes` | 2026-02-18T14:41:06Z | Narrowed Redwood `forceClientPaths` glob to files so Vite client lookup imports resolve cleanly |
| Phase 8 visual parity patch (v2) | `done` | `pass` | `pass` | `yes` | 2026-02-18T16:56:51Z | Demo UI now matches Vercel-style chat structure/controls and ships with UI parity lock tests |

## Future Plan Intake
Add new plan cycles here after planning:
1. Add a timeline row with dates and objective.
2. Add a progress row with completion gates.
3. Link to the corresponding plan doc (`docs/plan.md`, `docs/plan-ui-parity.md`, or later plan files).
