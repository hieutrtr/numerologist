# Daily.co Frontend ↔ Backend Integration Diagnostic

**Date:** October 23, 2025
**Author:** Codex (GPT-5)
**Context:** Story 1.2d – Daily.co bot participant with Pipecat backend

## 1. End-to-End User Flow (Current State)

| Step | Component | Description |
| --- | --- | --- |
| 1 | `useConversationStore.startConversation()` | React Native client requests `/api/v1/conversations/daily/room` to open a Daily room and receive `roomUrl` + `token`. State persists `dailyRoomUrl`, `dailyToken`, and `activeConversationId`. |
| 2 | `DailyProvider` (`apps/mobile/src/providers/DailyProvider.tsx`) | When `roomUrl` is available, wrapper runs `preAuth → startCamera → join` so Daily hooks (`useDaily`, `useDevices`, etc.) can interact with the room. |
| 3 | Voice Controls (`useVoiceInputService`, `useVoiceOutputService`) | Hooks expose microphone/speaker lists, start/stop recording, and detect remote audio by calling Daily SDK helpers. Used across `HomeScreen`, `ConversationView`, and onboarding flows. |
| 4 | User presses “Hold to Speak” (`HomeScreen` / `ConversationView`) | Button calls `voiceInput.startRecording()` and marks UI state as “listening”; audio is expected to stream via Daily SFU to the backend bot. |
| 5 | Daily App Messages (`useAppMessage`) | Components listen for Pipecat/backend messages such as `transcription_update`, `processing_status`, `assistant_response`, etc., to update UI transcripts and state. |
| 6 | Session End (`endConversation`) | Client notifies backend via `PATCH /api/v1/conversations/{id}` and clears local Zustand state. |

## 2. Relevant Code Structure

- **State & API Orchestration**
  - `apps/mobile/src/store/conversationStore.ts` — manages active conversation, tokens, and API requests for start/end.
- **Daily Provider Layer**
  - `apps/mobile/src/providers/DailyProvider.tsx` — wraps screens with Daily context and handles device pre-auth + room join.
- **Voice Services**
  - `apps/mobile/src/services/voiceInputService.ts` — microphone device management, start/stop recording interface.
  - `apps/mobile/src/services/voiceOutputService.ts` — speaker selection and remote audio state monitoring.
  - `apps/mobile/src/components/voice/MicrophoneSelector.tsx` — renders microphone options using the voice input hook.
- **Screens / UI Integration**
  - `apps/mobile/src/screens/HomeScreen.tsx` — primary voice chat UI (Story 1.2c).
  - `apps/mobile/src/components/conversation/ConversationView.tsx` — shared conversational UI with transcripts and controls.
  - `apps/mobile/src/screens/OnboardingConversationScreen.tsx` — onboarding flow that records multiple scripted prompts.

## 3. Problem Map

| Flow Step | Issue | Impact | Source |
| --- | --- | --- | --- |
| 4. Hold-to-speak → stream audio | `useVoiceInputService.startRecording()` now enables the Daily audio track via `daily.setLocalAudio(true)` so microphone audio is published to the SFU. *(Previously missing toggle caused silence.)* | ✅ Critical → **Resolved Oct 23, 2025** | `apps/mobile/src/services/voiceInputService.ts:203-263`
| 4. Hold-to-speak → stop | `useVoiceInputService.stopRecording()` now disables the track via `daily.setLocalAudio(false)` before resetting input settings, so audio streaming stops immediately. *(Previously kept the mic publishing.)* | 🟠 Medium → **Resolved Oct 23, 2025** | `apps/mobile/src/services/voiceInputService.ts:265-317`
| 5. Await transcription in onboarding flow | `recordAndTranscribeViaDaily()` polls `currentTranscript` captured in the closure; state updates from `useAppMessage` don’t propagate, so promise often times out. Requires ref/promise resolver pattern tied to listener. | 🟠 Medium: onboarding voice inputs fail or hang. | `apps/mobile/src/screens/OnboardingConversationScreen.tsx:83-129`
| 6. Session teardown | `useConversationStore.endConversation()` clears client state but never calls `daily.leave()` / `daily.stopCamera()`. Participant lingers in room, devices stay active. | 🟡 Low/Medium: leaks Daily slots, drains battery. | `apps/mobile/src/store/conversationStore.ts:77-113`
| Cross-cutting | No unified cleanup on app unmount or conversation switch; Daily connection persists across screens without lifecycle guard. | 🟡 Low: risk of stale connections when user navigates rapidly. | `HomeScreen`, `ConversationView`, `TabNavigator`

## 4. Implications

- **Backend Integration:** Mic toggling has been wired via `daily.setLocalAudio(true/false)`, so Pipecat now receives live audio when users speak.
- **User Experience:** Onboarding workflow stalls due to transcription polling bug; users see repeated “no transcription” errors.
- **Resource Utilization:** Without `daily.leave()`, concurrent sessions pile up, potentially consuming Daily limits and leaving devices active.
- **Logging Noise:** Backend `SimpleEchoProcessor` logging was downgraded to `debug`, so frame-level spam no longer floods production logs.

## 5. Suggested Design Considerations (for follow-up solution work)

1. **Mic Control Contract:** ✅ Implemented — `useVoiceInputService` now toggles `daily.setLocalAudio(true/false)` whenever recording starts or stops.
2. **Transcription Delivery:** Replace polling in onboarding with an event-driven promise (e.g., store a resolver in a ref that the `useAppMessage` listener invokes upon receiving `transcription_update`).
3. **Session Lifecycle:** Introduce a centralized teardown (hook or store action) that calls `daily.leave()`/`stopCamera()` and resets services when conversations end or the provider unmounts.
4. **Diagnostics:** Add logging metrics for mic state, track IDs, and Daily participant status to confirm audio pipeline health during QA.
5. **Backend Log Hygiene:** ✅ Frame-level logging now uses `logger.debug`; remove the test processor entirely when the real numerology processor ships.

---
*This diagnostic summarizes the integration gaps so we can scope remediation work for Story 1.2d.*
