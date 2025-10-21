/**
 * Voice Output Service - Daily.co speaker management
 * Story 1.2c: Handles speaker device selection and monitoring remote audio state
 *
 * Provides hooks and utilities for:
 * - Detecting remote participant audio (bot/assistant)
 * - Monitoring remote audio track state (playable, interrupted, off)
 * - Switching between speaker devices
 * - Tracking speaker availability and selection state
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  useDaily,
  useDevices,
  useDailyEvent,
  useParticipants,
  DailyParticipant,
} from '@daily-co/daily-react';

/**
 * Remote audio track state types
 */
type AudioTrackState = 'playable' | 'interrupted' | 'off' | 'unknown';

/**
 * State for voice output service
 */
interface VoiceOutputState {
  remoteAudioAvailable: boolean;
  remoteAudioState: AudioTrackState;
  availableSpeakers: Array<{ id: string; label: string }>;
  selectedSpeakerId: string | null;
  error: string | null;
  isLoading: boolean;
  remoteParticipantId: string | null;
}

/**
 * Options for initializing voice output service
 */
interface VoiceOutputOptions {
  onRemoteAudioAvailable?: () => void;
  onRemoteAudioInterrupted?: () => void;
  onRemoteAudioUnavailable?: () => void;
  onError?: (error: string) => void;
  autoSelectFirst?: boolean;
}

/**
 * Hook for managing voice output (speaker control) and monitoring remote audio
 *
 * Acceptance Criteria (Story 1.2c):
 * - useVoiceOutputService() hook implemented with:
 *   - Detection of remote participant (bot/assistant)
 *   - Monitoring of remote audio track state (playable, interrupted, off)
 *   - changeSpeaker(deviceId) - switch speaker devices
 *   - State tracking: remoteAudioAvailable, availableSpeakers, selectedSpeakerId
 *
 * @param options - Configuration options
 * @returns Voice output state and control methods
 */
export function useVoiceOutputService(
  options: VoiceOutputOptions = {}
): VoiceOutputState & {
  changeSpeaker: (deviceId: string) => Promise<void>;
} {
  const daily = useDaily();
  const { speakers } = useDevices();
  const participants = useParticipants();

  const [state, setState] = useState<VoiceOutputState>({
    remoteAudioAvailable: false,
    remoteAudioState: 'unknown',
    availableSpeakers: [],
    selectedSpeakerId: null,
    error: null,
    isLoading: false,
    remoteParticipantId: null,
  });

  const callbacksRef = useRef(options);

  // Update callbacks ref on options change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Update available speakers when devices change
  useEffect(() => {
    if (speakers && speakers.length > 0) {
      const availableSpeakers = speakers.map((speaker) => ({
        id: speaker.deviceId,
        label:
          speaker.label ||
          `Speaker ${speaker.deviceId.substring(0, 8)}`,
      }));

      setState((prevState) => ({
        ...prevState,
        availableSpeakers,
      }));

      // Auto-select first speaker if enabled and none selected
      if (
        options.autoSelectFirst &&
        !prevState.selectedSpeakerId &&
        availableSpeakers.length > 0
      ) {
        setState((prevState) => ({
          ...prevState,
          selectedSpeakerId: availableSpeakers[0].id,
        }));
      }
    }
  }, [speakers, options.autoSelectFirst]);

  // Monitor remote participants for audio state
  useEffect(() => {
    if (!participants || participants.length === 0) {
      setState((prevState) => ({
        ...prevState,
        remoteAudioAvailable: false,
        remoteAudioState: 'off',
        remoteParticipantId: null,
      }));
      callbacksRef.current.onRemoteAudioUnavailable?.();
      return;
    }

    // Find remote participant (non-local user)
    const remoteParticipant = participants.find(
      (p: DailyParticipant) => !p.local
    );

    if (!remoteParticipant) {
      setState((prevState) => ({
        ...prevState,
        remoteAudioAvailable: false,
        remoteAudioState: 'off',
        remoteParticipantId: null,
      }));
      callbacksRef.current.onRemoteAudioUnavailable?.();
      return;
    }

    // Check audio track state
    const audioTrack = remoteParticipant.audioTrack;
    let audioState: AudioTrackState = 'unknown';
    let isAudioAvailable = false;

    if (audioTrack) {
      // Determine track state based on readyState and enabled
      if (audioTrack.enabled === false) {
        audioState = 'off';
      } else if (audioTrack.readyState === 'live') {
        audioState = 'playable';
        isAudioAvailable = true;
      } else if (audioTrack.readyState === 'ended') {
        audioState = 'off';
      } else {
        audioState = 'interrupted';
      }
    } else {
      audioState = 'off';
    }

    setState((prevState) => ({
      ...prevState,
      remoteParticipantId: remoteParticipant.session_id || null,
      remoteAudioAvailable: isAudioAvailable,
      remoteAudioState: audioState,
    }));

    // Trigger appropriate callbacks
    if (isAudioAvailable && prevState.remoteAudioState !== 'playable') {
      callbacksRef.current.onRemoteAudioAvailable?.();
    } else if (
      audioState === 'interrupted' &&
      prevState.remoteAudioState === 'playable'
    ) {
      callbacksRef.current.onRemoteAudioInterrupted?.();
    } else if (
      audioState === 'off' &&
      prevState.remoteAudioState !== 'off'
    ) {
      callbacksRef.current.onRemoteAudioUnavailable?.();
    }
  }, [participants]);

  // Listen for participant audio changes
  useDailyEvent(
    'participant-updated',
    useCallback((event) => {
      if (event?.participant?.audioTrack) {
        // Trigger re-render by updating participants effect
        // The participants hook will already have the updated data
      }
    }, [])
  );

  /**
   * Switch to a different speaker device
   */
  const changeSpeaker = useCallback(
    async (deviceId: string): Promise<void> => {
      if (!daily) {
        const error = 'Daily instance not available';
        setState((prevState) => ({ ...prevState, error }));
        throw new Error(error);
      }

      try {
        setState((prevState) => ({
          ...prevState,
          isLoading: true,
          error: null,
        }));

        // Switch speaker device
        await daily.setOutputDevices({
          audioDeviceId: deviceId,
        });

        setState((prevState) => ({
          ...prevState,
          selectedSpeakerId: deviceId,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to change speaker';

        setState((prevState) => ({
          ...prevState,
          error: errorMessage,
          isLoading: false,
        }));

        callbacksRef.current.onError?.(errorMessage);
        throw error;
      }
    },
    [daily]
  );

  return {
    ...state,
    changeSpeaker,
  };
}

export type { VoiceOutputState, VoiceOutputOptions, AudioTrackState };
