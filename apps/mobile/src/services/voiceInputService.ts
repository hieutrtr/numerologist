/**
 * Voice Input Service - Daily.co microphone management
 * Story 1.2c: Handles microphone device selection and audio input control
 *
 * Provides hooks and utilities for:
 * - Starting/stopping microphone recording
 * - Switching between microphone devices
 * - Tracking microphone availability and selection state
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import {
  useDaily,
  useDevices,
  useDailyEvent,
  DailyEventObjectParticipant,
} from '@daily-co/daily-react';

/**
 * State for voice input service
 */
interface VoiceInputState {
  isRecording: boolean;
  availableMics: Array<{ id: string; label: string }>;
  selectedMicId: string | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Options for initializing voice input service
 */
interface VoiceInputOptions {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
  onError?: (error: string) => void;
  autoSelectFirst?: boolean;
}

/**
 * Hook for managing voice input (microphone control)
 *
 * Acceptance Criteria (Story 1.2c):
 * - useVoiceInputService() hook implemented with:
 *   - startRecording() - enables microphone via useDevices() hook
 *   - stopRecording() - disables microphone
 *   - changeMicrophone(deviceId) - switch microphone devices
 *   - Proper error handling for microphone access failures
 *   - State tracking: isRecording, availableMics, selectedMicId
 *
 * @param options - Configuration options
 * @returns Voice input state and control methods
 */
export function useVoiceInputService(
  options: VoiceInputOptions = {}
): VoiceInputState & {
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  changeMicrophone: (deviceId: string) => Promise<void>;
} {
  const daily = useDaily();
  const { microphones } = useDevices();

  const [state, setState] = useState<VoiceInputState>({
    isRecording: false,
    availableMics: [],
    selectedMicId: null,
    error: null,
    isLoading: false,
  });

  const callbacksRef = useRef(options);

  // Update callbacks ref on options change
  useEffect(() => {
    callbacksRef.current = options;
  }, [options]);

  // Update available microphones when devices change
  useEffect(() => {
    if (microphones && microphones.length > 0) {
      const availableMics = microphones.map((mic) => ({
        id: mic.deviceId,
        label: mic.label || `Microphone ${mic.deviceId.substring(0, 8)}`,
      }));

      setState((prevState) => ({
        ...prevState,
        availableMics,
      }));

      // Auto-select first microphone if enabled and none selected
      if (
        options.autoSelectFirst &&
        !prevState.selectedMicId &&
        availableMics.length > 0
      ) {
        setState((prevState) => ({
          ...prevState,
          selectedMicId: availableMics[0].id,
        }));
      }
    }
  }, [microphones, options.autoSelectFirst]);

  // Listen for recording state changes
  useDailyEvent(
    'recording-started',
    useCallback(() => {
      setState((prevState) => ({
        ...prevState,
        isRecording: true,
        error: null,
      }));
      callbacksRef.current.onRecordingStart?.();
    }, [])
  );

  useDailyEvent(
    'recording-stopped',
    useCallback(() => {
      setState((prevState) => ({
        ...prevState,
        isRecording: false,
      }));
      callbacksRef.current.onRecordingStop?.();
    }, [])
  );

  /**
   * Enable microphone and start recording
   */
  const startRecording = useCallback(async (): Promise<void> => {
    if (!daily) {
      const error = 'Daily instance not available';
      setState((prevState) => ({ ...prevState, error }));
      callbacksRef.current.onError?.(error);
      throw new Error(error);
    }

    try {
      setState((prevState) => ({
        ...prevState,
        isLoading: true,
        error: null,
      }));

      // Request microphone access
      await daily.updateInputSettings({ audio: true });

      // Select specific microphone if one is chosen
      if (state.selectedMicId) {
        await daily.setInputDevices({
          audioDeviceId: state.selectedMicId,
        });
      }

      setState((prevState) => ({
        ...prevState,
        isRecording: true,
        isLoading: false,
      }));

      callbacksRef.current.onRecordingStart?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to start recording';

      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        isLoading: false,
      }));

      callbacksRef.current.onError?.(errorMessage);
      throw error;
    }
  }, [daily, state.selectedMicId]);

  /**
   * Disable microphone and stop recording
   */
  const stopRecording = useCallback(async (): Promise<void> => {
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

      await daily.updateInputSettings({ audio: false });

      setState((prevState) => ({
        ...prevState,
        isRecording: false,
        isLoading: false,
      }));

      callbacksRef.current.onRecordingStop?.();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to stop recording';

      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        isLoading: false,
      }));

      callbacksRef.current.onError?.(errorMessage);
      throw error;
    }
  }, [daily]);

  /**
   * Switch to a different microphone device
   */
  const changeMicrophone = useCallback(
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

        // Switch microphone device
        await daily.setInputDevices({
          audioDeviceId: deviceId,
        });

        setState((prevState) => ({
          ...prevState,
          selectedMicId: deviceId,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Failed to change microphone';

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
    startRecording,
    stopRecording,
    changeMicrophone,
  };
}

export type { VoiceInputState, VoiceInputOptions };
