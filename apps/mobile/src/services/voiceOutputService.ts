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
  useParticipantIds,
  useParticipantProperty,
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

  // Get remote participant IDs (filter for remote participants only)
  const remoteParticipantIds = useParticipantIds({ filter: 'remote' });

  // Get audio track state for the first remote participant (usually the assistant/bot)
  const remoteAudioState = useParticipantProperty(
    remoteParticipantIds[0] || '',
    ['tracks.audio.state']
  )?.[0] as AudioTrackState | undefined;

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
  const prevAudioStateRef = useRef<AudioTrackState>('unknown');

  // Update callbacks ref on options change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Update available speakers when devices change
  useEffect(() => {
    if (speakers && speakers.length > 0) {
      const availableSpeakers = speakers.map((speaker) => ({
        id: speaker.device.deviceId,
        label:
          speaker.device.label ||
          `Speaker ${speaker.device.deviceId.substring(0, 8)}`,
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

  // Monitor remote audio state changes
  useEffect(() => {
    if (!remoteParticipantIds.length) {
      // No remote participants
      if (state.remoteAudioAvailable) {
        callbacksRef.current.onRemoteAudioUnavailable?.();
      }
      setState((prevState) => ({
        ...prevState,
        remoteAudioAvailable: false,
        remoteAudioState: 'off',
        remoteParticipantId: null,
      }));
      return;
    }

    // We have a remote participant
    const firstRemoteId = remoteParticipantIds[0];
    const audioState: AudioTrackState = remoteAudioState || 'unknown';
    const isAudioAvailable = audioState === 'playable';

    setState((prevState) => {
      const newState = {
        ...prevState,
        remoteParticipantId: firstRemoteId,
        remoteAudioAvailable: isAudioAvailable,
        remoteAudioState: audioState,
      };

      // Trigger callbacks based on state transitions
      if (isAudioAvailable && prevAudioStateRef.current !== 'playable') {
        callbacksRef.current.onRemoteAudioAvailable?.();
      } else if (
        audioState === 'interrupted' &&
        prevAudioStateRef.current === 'playable'
      ) {
        callbacksRef.current.onRemoteAudioInterrupted?.();
      } else if (
        audioState === 'off' &&
        prevAudioStateRef.current !== 'off'
      ) {
        callbacksRef.current.onRemoteAudioUnavailable?.();
      }

      prevAudioStateRef.current = audioState;
      return newState;
    });
  }, [remoteParticipantIds, remoteAudioState]);

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
