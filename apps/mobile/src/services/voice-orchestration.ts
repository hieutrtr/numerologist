/**
 * Voice Orchestration Service
 * High-level wrapper for TTS and STT services
 * Provides simple functions for speaking text and recording transcription
 */

import { textToSpeechClient } from './text-to-speech';
import { speechToTextClient, MeterCallback } from './speech-to-text';

/**
 * Speak text using text-to-speech service
 * Handles audio playback after synthesis
 */
export async function speakText(text: string): Promise<void> {
  try {
    // Request TTS synthesis
    const response = await textToSpeechClient.synthesize({
      text,
      emotionalTone: 'warm',
      speed: 1.0,
    });

    // Play audio
    if (response.audioBase64) {
      // If audio is provided as base64, decode and play
      await playAudioFromBase64(response.audioBase64, response.audioContentType);
    } else if (response.audioUrl) {
      // If audio URL is provided, play from URL
      await playAudioFromUrl(response.audioUrl);
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Lỗi khi phát âm thanh';
    console.error('TTS error:', errorMsg);
    throw new Error(errorMsg);
  }
}

/**
 * Record audio and return transcription text
 * Handles WebSocket streaming and audio recording
 */
type RecordOptions = {
  conversationId?: string;
  maxDuration?: number;
  onMeter?: MeterCallback;
};

const createConversationId = () => `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;

export async function recordAndTranscribe(
  optionsOrDuration?: number | RecordOptions,
  legacyOnMeter?: MeterCallback,
): Promise<string> {
  let conversationId = createConversationId();
  let maxDuration = 30000;
  let onMeter: MeterCallback | undefined = undefined;

  if (typeof optionsOrDuration === 'object' && optionsOrDuration !== null) {
    conversationId = optionsOrDuration.conversationId ?? conversationId;
    maxDuration = optionsOrDuration.maxDuration ?? maxDuration;
    onMeter = optionsOrDuration.onMeter;
  } else {
    if (typeof optionsOrDuration === 'number') {
      maxDuration = optionsOrDuration;
      onMeter = legacyOnMeter;
    }
  }

  return new Promise(async (resolve, reject) => {
    let timeoutId: NodeJS.Timer | null = null;
    let finalTranscript = '';

    const cleanup = async () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      await speechToTextClient.disconnect();
    };

    const onResult = (result: { text: string; isFinal: boolean }) => {
      finalTranscript = result.text;
      if (result.isFinal) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        cleanup()
          .then(() => resolve(finalTranscript))
          .catch((error) => reject(error as Error));
      }
    };

    const onError = (error: { message?: string }) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      cleanup()
        .then(() => reject(new Error(error.message || 'Lỗi khi ghi âm')))
        .catch((cleanupError) => reject(cleanupError as Error));
    };

    try {
      await speechToTextClient.connect(conversationId, onResult, onError);
      await speechToTextClient.startStreaming(onMeter);

      timeoutId = setTimeout(async () => {
        try {
          await speechToTextClient.stopStreaming();
          await cleanup();
          resolve(finalTranscript || '');
        } catch (error) {
          reject(error as Error);
        }
      }, maxDuration);

      (globalThis as any).numerologyStopRecording = async () => {
        await speechToTextClient.stopStreaming();
        await cleanup();
      };
    } catch (error) {
      await cleanup();
      const errorMsg = error instanceof Error ? error.message : 'Lỗi ghi âm không xác định';
      reject(new Error(errorMsg));
    }
  });
}

/**
 * Play audio from base64 encoded data
 * Private helper function
 */
async function playAudioFromBase64(audioBase64: string, contentType: string): Promise<void> {
  // Create blob from base64
  const binaryString = atob(audioBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: contentType });

  // Create object URL and play
  const url = URL.createObjectURL(blob);
  await playAudioFromUrl(url);
  URL.revokeObjectURL(url);
}

/**
 * Play audio from URL
 * Private helper function
 */
async function playAudioFromUrl(audioUrl: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.src = audioUrl;
    audio.onended = () => resolve();
    audio.onerror = () => reject(new Error('Lỗi phát âm thanh'));
    audio.play().catch(reject);
  });
}

/**
 * Stop ongoing recording if active
 */
export async function stopRecording(): Promise<void> {
  try {
    await speechToTextClient.stopStreaming();
    await speechToTextClient.disconnect();
  } catch (error) {
    console.error('Error stopping recording:', error);
  }
}

/**
 * Cancel recording without saving
 */
export async function cancelRecording(): Promise<void> {
  try {
    await speechToTextClient.cancelStreaming();
    await speechToTextClient.disconnect();
  } catch (error) {
    console.error('Error canceling recording:', error);
  }
}

export { speechToTextClient, textToSpeechClient };
