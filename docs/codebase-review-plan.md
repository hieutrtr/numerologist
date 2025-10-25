# Numerologist Codebase Deep-Dive Review Plan

## Objectives
- Map every critical user flow (numerology insights, Daily.co voice conversations, voice transcription, auth/session bootstrap) end-to-end from client interaction to persistence.
- Surface correctness, reliability, security, and performance risks across API, mobile app, and shared libraries.
- Produce actionable findings backlog (bugs, refactors, missing tests, documentation gaps) with severity and ownership.
- Establish regression safeguards (tests, tooling, monitoring) aligned with discovered risk areas.

## Deliverables
- End-to-end architecture narrative with sequence diagrams for each flow (checked into `docs/architecture/review`).
- Risk register with prioritized remediation items and owners (shared via Git + tracker).
- Test coverage & observability gap report with recommendations.
- Executive summary highlighting go/no-go concerns and quick wins.

## Scope & Prioritization
1. **Core Flows (Highest Priority)**
   - Numerology profile creation & retrieval (`apps/api` ↔ `libs/numerology`).
   - Daily.co conversation lifecycle (room creation, Pipecat bot, voice transcription) across API + mobile.
   - Mobile onboarding/auth bootstrap & state hydration.
2. **Supporting Systems**
   - Persistence layer: SQLAlchemy models, migrations, DB lifecycle.
   - Shared utilities (logging, config, dependency injection, messaging).
3. **Cross-Cutting Concerns**
   - Error handling & resilience.
   - Security/compliance (PII, secrets, auth/z).
   - Performance & scalability (async patterns, resource cleanup).
   - Testing strategy & automation.

## Review Streams & Activities

### 1. Backend API (FastAPI)
- **Entry Artifacts**: `apps/api/src`, existing docs (`docs/architecture`, `DAILY_CO_*`), API tests.
- **Activities**
  - Trace request flow for numerology endpoints and conversation/voice routes (routers → services → repositories → DB).
  - Validate data models, session management, and migrations; confirm consistency between `Base` definitions and database init.
  - Assess async patterns, error handling (custom exceptions, HTTP responses), and cleanup logic (lifespan, Pipecat pipelines).
  - Review third-party integrations (Azure OpenAI, Daily.co REST, Redis) for secret handling, retries, backoff, telemetry.
  - Examine tests under `apps/api/tests` (or absence) for coverage, fixture hygiene, CI readiness.
- **Outputs**
  - Flow diagrams and call graphs.
  - Findings with severity/tags (bug, debt, gap).
  - Recommendations for tests/monitoring/alerts.

### 2. Voice & Bot Pipeline (Pipecat + Daily.co)
- **Entry Artifacts**: `apps/api/src/services/{voice_service.py,pipecat_bot_service.py,conversation_service.py}`, Daily documents, Pipecat configs.
- **Activities**
  - Model full pipeline from Daily.co token issuance through Pipecat tasks, STT/TTS services, to message persistence.
  - Stress-test concurrency points (semaphores, pipeline lifecycle, cleanup on failures).
  - Evaluate resilience to network/interruption scenarios; note missing retry/timeout strategies.
  - Verify configuration flow (env vars, deployment names) and fallback/error messaging (Vietnamese UX).
- **Outputs**
  - Sequence diagrams for pipeline lifecycle.
  - Risk items regarding stability, resource leaks, error propagation.
- **Current Architecture Snapshot**
  1. **User Integration Path**
     - Mobile `conversationStore.startConversation()` POSTs to `/api/v1/conversations/daily/room`, providing a synthetic user ID (TODO: wire real auth). The backend’s `ConversationService.create_conversation_with_daily` creates a Daily.co room, issues a user token, creates a second bot token, persists the conversation, optionally caches metadata in Redis, and spins up a Pipecat pipeline keyed by `conversation_id`.
     - React Navigation’s `TabNavigator` wraps `HomeScreen` in `DailyProvider`. Once the Zustand store receives `room_url` and `token`, the provider’s `DailyDeviceInitializer` runs `preAuth` and `startCamera` to prime microphone permissions.
  2. **Frontend Streaming Loop**
     - `HomeScreen` binds the Voice button to `useVoiceInputService`. On press it ensures an active conversation, calls `daily.setLocalAudio(true)` to begin publishing the microphone track, and keeps recording until the user releases. `useVoiceOutputService` simultaneously watches remote participants to surface bot audio availability. `useAppMessage` handlers process backend app messages (`transcription_update`, `processing_status`, `assistant_response`) to update UI state.
  3. **Backend Pipeline Flow**
     - `PipecatBotService.create_pipeline` composes the pipeline: `DailyTransport.input()` → `OpenAISTTService` (Azure gpt-4o-mini-transcribe endpoint) → `SimpleEchoProcessor` placeholder → `OpenAITTSService` (Azure TTS) → `DailyTransport.output()`. The transport bridges the Daily SFU so that published microphone frames reach Pipecat and synthesized speech returns to the room.
     - Each pipeline instance is tracked in `_pipelines`/`_transports`, with an `asyncio` runner task stored for cancellation; lifecycle helpers ensure cleanup via `destroy_pipeline` and `destroy_all_pipelines`.
  4. **Supplementary HTTP STT Path**
     - For uploaded audio clips (`/v1/voice/transcriptions`), `AzureOpenAISpeechToTextService.transcribe_audio_stream` buffers the request payload, calls the Azure SDK transcription endpoint, and emits final text plus confidence. Error mapping returns localized Vietnamese messages.
  5. **Areas Requiring Deep Review**
     - Token security and expiry handling; reliance on cached room metadata.
     - Back-pressure and buffering in the pipeline when STT/TTS latency spikes.
     - Robustness of app-message protocol between backend → frontend (ordering, deduplication, reconnection).
     - Graceful shutdown coverage (Daily room deletion, Redis eviction, Pipecat teardown) under failure conditions.

### 3. Mobile App (Expo React Native)
- **Entry Artifacts**: `apps/mobile/src`, `App.tsx`, navigation/store/service layers, Daily provider.
- **Activities**
  - Map onboarding → auth → main tab navigation; inspect Zustand stores for persistence, hydration, and token usage.
  - Review HomeScreen voice flow (Daily hooks, voice state machine, API coupling) for race conditions and UX gaps.
  - Check service layer (`voiceInputService`, `voiceOutputService`, `conversationStore`, REST clients) for error handling and env configuration (`EXPO_PUBLIC_API_URL` expectations).
  - Audit component accessibility, localization, and resilience to offline scenarios.
  - Evaluate existing tests (`__tests__`) and propose additions (unit/E2E via Detox/React Testing Library).
- **Outputs**
  - Interaction diagrams showing client ↔ backend messaging.
  - Issue list for UX blockers, state bugs, missing analytics or logging.

### 4. Shared Libraries & Utilities
- **Entry Artifacts**: `libs/numerology`, shared configs, scripts.
- **Activities**
  - Validate numerology math vs. documented rules; ensure Vietnamese normalization coverage.
  - Examine packaging (`setup.py`) and inter-module dependencies for future reuse/versioning.
  - Cross-check interpretations mapping completeness and error handling.
- **Outputs**
  - Test recommendations (property-based tests, boundary conditions).
  - Documentation updates required for maintainability.

### 5. Tooling, Infrastructure, and Delivery
- **Entry Artifacts**: `docker-compose.yml`, `start-*.sh`, CI (if present), environment docs (`docs/azure-setup-guide.md`, etc.).
- **Activities**
  - Review local/dev/prod parity, container configs, and deployment scripts.
  - Assess secret management, configuration loading, and logging aggregation strategy.
  - Identify required CI workflows (lint/test) and recommend additions (static analysis, vulnerability scans).
- **Outputs**
  - Ops checklist with gaps and suggested automation tasks.

## Execution Cadence
- **Week 1**
  - Days 1-2: Backend API deep dive, draft flow diagrams.
  - Days 3-4: Voice & Pipecat pipeline review, integration trace.
  - Day 5: Mobile architecture mapping, initial findings sync.
- **Week 2**
  - Days 6-7: Mobile detailed audit (UX, stores, services) + shared lib verification.
  - Day 8: Tooling/infra assessment.
  - Day 9: Consolidate findings, severity assignment, remediation backlog.
  - Day 10: Present executive summary, confirm next steps.

## Collaboration & Reporting
- Daily async checkpoint in project channel with progress + blockers.
- Mid-point review (end of Week 1) to validate focus areas and reprioritize.
- Final readout includes demo/walkthrough of critical issues and proposed mitigations.
- Track all issues in shared tracker with links to code references and repro steps.

## Acceptance Criteria for Review Completion
- All scoped flows documented with accurate diagrams and narrative.
- No critical/severity-high issues unresolved or without clear mitigation plan.
- Test/observability recommendations accepted or explicitly deferred by stakeholders.
- Knowledge handoff pack published in `docs/architecture/review/` and communicated to team.
