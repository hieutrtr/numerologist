/**
 * Voice Orchestration Service
 * High-level wrapper for TTS and STT services
 * Provides simple functions for speaking text and recording transcription
 */

import { textToSpeechClient } from './text-to-speech';
import { speechToTextClient } from './speech-to-text';
import { audioRecorder } from './audio';

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
export async function recordAndTranscribe(
  maxDuration: number = 30000, // 30 seconds max
  onMeter?: (meter: number) => void,
): Promise<string> {
  const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  return new Promise(async (resolve, reject) => {
    let timeoutId: NodeJS.Timer | null = null;
    let finalTranscript = '';

    try {
      // Request audio permissions and setup
      const hasPermissions = await audioRecorder.checkPermissions();
      if (!hasPermissions) {
        const granted = await audioRecorder.requestPermissions();
        if (!granted) {
          reject(new Error('Không có quyền truy cập microphone'));
          return;
        }
      }

      // Setup audio session
      await audioRecorder.setupAudioSession();

      // Setup STT callbacks
      const onResult = (result: any) => {
        finalTranscript = result.text;
        if (result.isFinal) {
          // If we got a final result, wait a bit to see if more comes, then resolve
          clearTimeout(timeoutId!);
          timeoutId = setTimeout(() => {
            resolve(finalTranscript);
          }, 500);
        }
      };

      const onError = (error: any) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(error.message || 'Lỗi khi ghi âm'));
      };

      // Connect to STT service
      await speechToTextClient.connect(conversationId, onResult, onError);

      // Start recording and streaming
      await audioRecorder.startRecording(onMeter);
      await speechToTextClient.startStreaming(onMeter);

      // Set maximum duration timeout
      timeoutId = setTimeout(async () => {
        try {
          await stopRecording();
          resolve(finalTranscript || '');
        } catch (error) {
          reject(error);
        }
      }, maxDuration);

      // Helper function to stop recording
      const stopRecording = async () => {
        try {
          await speechToTextClient.stopStreaming();
          await audioRecorder.stopRecording();
          await speechToTextClient.disconnect();
        } catch (error) {
          console.error('Error stopping recording:', error);
        }
      };

      // Make stopRecording accessible if needed (e.g., button press)
      (window as any).numerologyStopRecording = stopRecording;
    } catch (error) {
      if (timeoutId) clearTimeout(timeoutId);
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
    await audioRecorder.stopRecording();
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
    await audioRecorder.cancelRecording();
    await speechToTextClient.cancelStreaming();
    await speechToTextClient.disconnect();
  } catch (error) {
    console.error('Error canceling recording:', error);
  }
}

export { speechToTextClient, textToSpeechClient };
