/**
 * Speech-to-Text Service
 * 
 * Frontend client for transcribing Vietnamese audio via backend Azure Speech Services.
 * Handles WebSocket streaming, error handling, and state management.
 */

import { API_WS_URL } from './api';
import { audioRecorder, AudioMetrics } from './audio';

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
  private ws: WebSocket | null = null;
  private conversationId: string | null = null;
  private isConnecting = false;
  private onResult: SpeechToTextCallback | null = null;
  private onError: ErrorCallback | null = null;
  private sendTimeout: NodeJS.Timer | null = null;
  private readonly maxRetries = 3;
  private retryCount = 0;

  /**
   * Initialize WebSocket connection to backend voice endpoint
   * 
   * @param conversationId Unique conversation ID for session context
   * @param onResult Callback when transcription result received
   * @param onError Callback when error occurs
   */
  async connect(
    conversationId: string,
    onResult: SpeechToTextCallback,
    onError: ErrorCallback,
  ): Promise<void> {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      console.warn('Already connected or connecting');
      return;
    }

    this.conversationId = conversationId;
    this.onResult = onResult;
    this.onError = onError;
    this.isConnecting = true;

    try {
      // Construct WebSocket URL
      const wsUrl = new URL('/ws/voice', API_WS_URL);
      wsUrl.searchParams.append('conversationId', conversationId);

      console.log(`Connecting to WebSocket: ${wsUrl.href}`);

      // Create WebSocket connection
      this.ws = new WebSocket(wsUrl.href);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.retryCount = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.error) {
            // Handle error response
            this.handleError({
              code: data.error.code || 'UNKNOWN_ERROR',
              message: data.error.message || 'Unknown error occurred',
              timestamp: Date.now(),
            });
          } else {
            // Handle successful transcription result
            const result: TranscriptionResult = {
              text: data.text || '',
              isFinal: data.isFinal || false,
              confidence: data.confidence || 0,
              alternatives: data.alternatives || [],
              timestamp: Date.now(),
            };
            this.onResult?.(result);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.handleError({
          code: 'WEBSOCKET_ERROR',
          message: 'Lỗi kết nối WebSocket. Vui lòng thử lại.',
          timestamp: Date.now(),
        });
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.ws = null;
      };

      // Wait for connection to open
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('WebSocket connection timeout'));
        }, 5000);

        const checkConnection = () => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            clearTimeout(timeout);
            resolve();
          } else if (this.ws?.readyState === WebSocket.CLOSED) {
            clearTimeout(timeout);
            reject(new Error('WebSocket connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
      });
    } catch (error) {
      this.isConnecting = false;
      const message = error instanceof Error ? error.message : 'Connection failed';
      this.handleError({
        code: 'CONNECTION_FAILED',
        message: `Không thể kết nối đến máy chủ. ${message}`,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Start recording and streaming audio to backend
   * 
   * @param onMeter Optional callback for audio level visualization
   */
  async startStreaming(onMeter?: MeterCallback): Promise<void> {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.handleError({
        code: 'NOT_CONNECTED',
        message: 'Không kết nối được đến máy chủ. Vui lòng kết nối lại.',
        timestamp: Date.now(),
      });
      throw new Error('WebSocket not connected');
    }

    try {
      // Request audio permissions
      const hasPermission = await audioRecorder.requestPermissions();
      if (!hasPermission) {
        this.handleError({
          code: 'PERMISSION_DENIED',
          message: 'Vui lòng cấp quyền truy cập microphone.',
          timestamp: Date.now(),
        });
        throw new Error('Microphone permission denied');
      }

      // Start recording
      await audioRecorder.startRecording(onMeter);
      console.log('Audio recording started');

      // Set timeout for maximum recording duration (e.g., 60 seconds)
      this.sendTimeout = setTimeout(() => {
        console.warn('Recording timeout - stopping stream');
        this.stopStreaming();
      }, 60000);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.handleError({
        code: 'RECORDING_FAILED',
        message: `Không thể bắt đầu ghi âm: ${message}`,
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  /**
   * Stop recording and stream
   */
  async stopStreaming(): Promise<void> {
    // Clear timeout
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }

    try {
      // Stop recording
      const audioUri = await audioRecorder.stopRecording();
      console.log(`Recording stopped. File: ${audioUri}`);

      // TODO: Read audio file and stream chunks to WebSocket
      // This requires reading the WAV file and chunking it for transmission
      // For now, we'll send a completion signal
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'RECORDING_COMPLETE' }));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error stopping stream:', message);
    }
  }

  /**
   * Cancel recording without transcription
   */
  async cancelStreaming(): Promise<void> {
    // Clear timeout
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }

    try {
      await audioRecorder.cancelRecording();
      console.log('Recording cancelled');
    } catch (error) {
      console.error('Error cancelling stream:', error);
    }
  }

  /**
   * Get current recording metrics
   */
  async getMetrics(): Promise<AudioMetrics | null> {
    return await audioRecorder.getRecordingMetrics();
  }

  /**
   * Disconnect WebSocket
   */
  async disconnect(): Promise<void> {
    // Clear timeout
    if (this.sendTimeout) {
      clearTimeout(this.sendTimeout);
      this.sendTimeout = null;
    }

    // Cancel any ongoing recording
    await audioRecorder.cancelRecording();

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log('Disconnected from speech-to-text service');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Check if recording
   */
  isRecording(): boolean {
    return audioRecorder.isRecording();
  }

  /**
   * Handle error and invoke callback
   */
  private handleError(error: SpeechToTextError): void {
    console.error(`Speech-to-Text Error [${error.code}]: ${error.message}`);
    this.onError?.(error);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.disconnect();
    await audioRecorder.cleanup();
  }
}

// Export singleton instance
export const speechToTextClient = new SpeechToTextClient();
