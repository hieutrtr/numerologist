/**
 * Speech-to-Text Service
 *
 * Frontend client for transcribing Vietnamese audio via the REST endpoint that proxies
 * Azure OpenAI gpt-4o-mini-transcribe. Handles audio capture, upload, error handling,
 * and state management.
 */

import { API_BASE_URL } from './api';
import { audioRecorder, AudioMetrics } from './audio';

const TRANSCRIPTION_ENDPOINT = `${API_BASE_URL}/voice/transcriptions`;

export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
  confidence: number;
  alternatives: Array<{ text: string; confidence: number }>;
  timestamp: number;
}

export interface SpeechToTextError {
  code: string;
  message: string; // Vietnamese error message from backend
  timestamp: number;
}

export type SpeechToTextCallback = (result: TranscriptionResult) => void;
export type ErrorCallback = (error: SpeechToTextError) => void;
export type MeterCallback = (meter: number) => void;

export class SpeechToTextClient {
  private conversationId: string | null = null;
  private onResult: SpeechToTextCallback | null = null;
  private onError: ErrorCallback | null = null;
  private isRecording = false;
  private requestId: string | null = null;

  /**
   * Prepare client for a new voice capture session.
   */
  async connect(
    conversationId: string,
    onResult: SpeechToTextCallback,
    onError: ErrorCallback,
  ): Promise<void> {
    this.conversationId = conversationId;
    this.onResult = onResult;
    this.onError = onError;
    this.requestId = this.generateRequestId();
  }

  /**
   * Start recording audio locally.
   */
  async startStreaming(onMeter?: MeterCallback): Promise<void> {
    try {
      const hasPermission = await audioRecorder.requestPermissions();
      if (!hasPermission) {
        this.handleError({
          code: 'PERMISSION_DENIED',
          message: 'Vui lòng cấp quyền truy cập microphone.',
          timestamp: Date.now(),
        });
        throw new Error('Microphone permission denied');
      }

      await audioRecorder.startRecording(onMeter);
      this.isRecording = true;
    } catch (error) {
      let message = error instanceof Error ? error.message : 'Unknown error';

      // Handle common web microphone errors
      if (message.includes('NotAllowedError') || message.includes('Permission denied')) {
        message = 'Quyền truy cập microphone bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.';
      } else if (message.includes('NotFoundError') || message.includes('No microphone')) {
        message = 'Không tìm thấy microphone. Vui lòng kiểm tra thiết bị.';
      } else if (message.includes('Request interrupted')) {
        message = 'Yêu cầu truy cập microphone bị gián đoạn. Vui lòng thử lại.';
      }

      this.handleError({
        code: 'RECORDING_FAILED',
        message: `Không thể bắt đầu ghi âm: ${message}`,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Stop recording, upload audio file, and dispatch transcription result.
   */
  async stopStreaming(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    try {
      const audioUri = await audioRecorder.stopRecording();
      this.isRecording = false;
      await this.uploadAndTranscribe(audioUri);
    } catch (error) {
      this.isRecording = false;
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.handleError({
        code: 'TRANSCRIPTION_FAILED',
        message: `Không thể xử lý âm thanh: ${message}`,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Cancel recording without uploading audio.
   */
  async cancelStreaming(): Promise<void> {
    if (!this.isRecording) {
      return;
    }

    await audioRecorder.cancelRecording();
    this.isRecording = false;
  }

  /**
   * Get current recording metrics (metering, duration).
   */
  async getMetrics(): Promise<AudioMetrics | null> {
    return audioRecorder.getRecordingMetrics();
  }

  /**
   * Disconnect and cleanup.
   */
  async disconnect(): Promise<void> {
    if (this.isRecording) {
      await audioRecorder.cancelRecording();
      this.isRecording = false;
    }
    this.conversationId = null;
    this.onResult = null;
    this.onError = null;
    this.requestId = null;
  }

  /**
   * Check connection status (always true for REST flow).
   */
  isConnected(): boolean {
    return this.conversationId !== null;
  }

  /**
   * Check recording state (legacy helper for compatibility).
   */
  isRecording(): boolean {
    return this.isRecording;
  }

  /**
   * Check recording state.
   */
  isRecordingActive(): boolean {
    return this.isRecording;
  }

  /**
   * Cleanup resources.
   */
  async cleanup(): Promise<void> {
    await this.disconnect();
  }

  private async uploadAndTranscribe(audioUri: string): Promise<void> {
    const formData = new FormData();
    formData.append('audio_file', {
      uri: audioUri,
      name: `recording-${Date.now()}.wav`,
      type: 'audio/wav',
    } as any);

    const headers: Record<string, string> = {};
    if (this.requestId) {
      headers['x-request-id'] = this.requestId;
    }
    if (this.conversationId) {
      headers['x-conversation-id'] = this.conversationId;
    }

    const response = await fetch(TRANSCRIPTION_ENDPOINT, {
      method: 'POST',
      headers,
      body: formData,
    });

    const payload = await response.json();

    if (!response.ok) {
      const error = payload?.detail?.error;
      const message = error?.message || 'Không thể xử lý âm thanh. Vui lòng thử lại.';
      const code = error?.error_code || 'TRANSCRIPTION_FAILED';
      this.handleError({
        code,
        message,
        timestamp: Date.now(),
      });
      throw new Error(message);
    }

    const result: TranscriptionResult = {
      text: payload.text || '',
      isFinal: true,
      confidence: payload.confidence ?? 0,
      alternatives: payload.alternatives || [],
      timestamp: Date.now(),
    };

    this.onResult?.(result);
  }

  private handleError(error: SpeechToTextError): void {
    console.error(`Speech-to-Text Error [${error.code}]: ${error.message}`);
    this.onError?.(error);
  }

  private generateRequestId(): string {
    if (globalThis.crypto && 'randomUUID' in globalThis.crypto) {
      return globalThis.crypto.randomUUID();
    }
    return `req-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

// Export singleton instance
export const speechToTextClient = new SpeechToTextClient();
