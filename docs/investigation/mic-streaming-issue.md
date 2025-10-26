# Investigation Plan: Daily Microphone Stream & Audio Level Failures

## Observed Symptoms
- Home screen waveform hovers near the floor (≈ −160 dB) even while speaking.
- Backend `PipecatBotService` logs no inbound frames from Daily; downstream transcription never fires.
- Daily room shows the participant joined, but no audio events reach the server.
- **Relevant files**
  - `apps/mobile/src/screens/HomeScreen.tsx` – waveform rendering & voice button workflow
  - `apps/mobile/src/services/voiceInputService.ts` – Daily microphone control & `input-level` listener
  - `apps/api/src/services/pipecat_bot_service.py` – bot pipeline startup/teardown
  - `apps/api/src/services/conversation_service.py` – Daily room + token creation

## Working Hypotheses
1. **Daily connection state mismatch** – client joins with a token but never publishes audio (local audio muted, no track).
2. **Microphone permission/device issue** – browser returns a dummy input or Daily reports `input-level` only after `startCamera` + active track.
3. **Pipeline ingestion problem** – Daily transport connected but pipeline not consuming frames (permission, token scope, or bot join failure).
4. **Environment/config mismatch** – front/back using different rooms, or Daily domain misconfigured causing SFU to drop media.
- **Relevant files**
  - `apps/mobile/src/providers/DailyProvider.tsx` – join flow, device init, `setUserName`
  - `apps/mobile/src/services/voiceOutputService.ts` – remote audio monitoring
  - `apps/api/src/services/voice_service.py` – Azure STT wrapper (errors may mask pipeline issues)
  - `apps/api/src/routes/conversations.py` – POST handler wiring to service methods

## Data to Collect
- Frontend console & network logs around `daily.readyState`, `localAudio`, `participant.audio`.
- Daily call object state dumps (`daily.participants()`) during/after button press.
- Backend logs from `DailyTransport` / Pipecat pipeline (input frame counts, errors).
- Daily dashboard session diagnostics (SFU timeline, media stats).
- **Relevant files / configs**
  - `apps/mobile/src/utils/logger.ts` (if adding structured logging)
  - `.env` / Daily API key setup (backend)
  - `apps/api/src/utils/logger.py` or equivalent logging config

## Debug Steps
### Frontend (Expo)
1. Add temporary logging in `useVoiceInputService.startRecording` and `stopRecording`:
   - `daily.getLocalAudio()` / `daily.localAudio()` state before/after.
   - `daily.participants().local.tracks.audio.state`.
2. After `daily.join`, dump `daily.participants()` and confirm `tracks.audio.state === 'playable'`.
3. Register listeners for:
   - `track-started`, `track-stopped`
   - `participant-updated`
   - `active-speaker-change`
4. Validate `input-level` events fire by logging the raw payload; verify amplitude while speaking.
5. Ensure `daily.setUserName` call resolves (catch rejection) and doesn’t throw (might interrupt join).
- **Relevant files**
  - `apps/mobile/src/services/voiceInputService.ts`
  - `apps/mobile/src/providers/DailyProvider.tsx`
  - `apps/mobile/src/components/voice/MicrophoneSelector.tsx`
  - `apps/mobile/App.tsx` / navigation entries for hook wiring

### Backend (FastAPI / Pipecat)
1. Enable debug logging for `DailyTransport` (frame counts) and pipeline stages.
2. Confirm bot token join succeeds (`PipecatBotService` logs). If not, capture exceptions.
3. Inspect Pipecat pipeline: add counters/metrics in `SimpleEchoProcessor.process_frame`.
4. Verify Daily webhook/API: confirm the bot participant appears in Daily dashboard.
- **Relevant files**
  - `apps/api/src/services/pipecat_bot_service.py`
  - `apps/api/src/services/conversation_service.py`
  - `apps/api/src/routes/conversations.py`
  - `apps/api/src/utils/logger.py` (or logging config)
  - `apps/api/src/main.py` (lifespan + startup logs)

### Daily Portal / External
1. Use Daily’s dashboard to inspect the room session (media stats, participants, tracks).
2. Cross-check API key scopes (recording, owner permissions).
3. Validate domain/room name matches environment (no stale staging tokens).
- **Relevant docs/resources**
  - Daily dashboard session inspector
  - Daily REST API docs for rooms/tokens
  - Project `.env` / infrastructure notes (`docs/architecture/*.md`)

## Triage & Next Actions
1. Instrument frontend with the above logs; reproduce and capture console traces.
2. Collect backend logs with elevated verbosity while reproducing.
3. Compare Daily session info with captured logs to pinpoint where audio stops.
4. Based on findings, file follow-up tasks (e.g., force `setLocalAudio(true)` earlier, adjust pipeline, fix Daily client config).

> Keep instrumentation changes isolated (behind debug flags) to remove once root cause is confirmed.
