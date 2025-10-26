# Investigation Plan: Daily Microphone Stream & Audio Level Failures

## Observed Symptoms
- Home screen waveform hovers near the floor (≈ −160 dB) even while speaking.
- Backend `PipecatBotService` logs no inbound frames from Daily; downstream transcription never fires.
- Daily room shows the participant joined, but no audio events reach the server.

## Working Hypotheses
1. **Daily connection state mismatch** – client joins with a token but never publishes audio (local audio muted, no track).
2. **Microphone permission/device issue** – browser returns a dummy input or Daily reports `input-level` only after `startCamera` + active track.
3. **Pipeline ingestion problem** – Daily transport connected but pipeline not consuming frames (permission, token scope, or bot join failure).
4. **Environment/config mismatch** – front/back using different rooms, or Daily domain misconfigured causing SFU to drop media.

## Data to Collect
- Frontend console & network logs around `daily.readyState`, `localAudio`, `participant.audio`.
- Daily call object state dumps (`daily.participants()`) during/after button press.
- Backend logs from `DailyTransport` / Pipecat pipeline (input frame counts, errors).
- Daily dashboard session diagnostics (SFU timeline, media stats).

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

### Backend (FastAPI / Pipecat)
1. Enable debug logging for `DailyTransport` (frame counts) and pipeline stages.
2. Confirm bot token join succeeds (`PipecatBotService` logs). If not, capture exceptions.
3. Inspect Pipecat pipeline: add counters/metrics in `SimpleEchoProcessor.process_frame`.
4. Verify Daily webhook/API: confirm the bot participant appears in Daily dashboard.

### Daily Portal / External
1. Use Daily’s dashboard to inspect the room session (media stats, participants, tracks).
2. Cross-check API key scopes (recording, owner permissions).
3. Validate domain/room name matches environment (no stale staging tokens).

## Triage & Next Actions
1. Instrument frontend with the above logs; reproduce and capture console traces.
2. Collect backend logs with elevated verbosity while reproducing.
3. Compare Daily session info with captured logs to pinpoint where audio stops.
4. Based on findings, file follow-up tasks (e.g., force `setLocalAudio(true)` earlier, adjust pipeline, fix Daily client config).

> Keep instrumentation changes isolated (behind debug flags) to remove once root cause is confirmed.
