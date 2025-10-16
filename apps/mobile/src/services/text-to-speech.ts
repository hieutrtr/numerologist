/**
 * Text-to-Speech Client Service
 * 
 * Frontend client for requesting voice synthesis from backend.
 * Handles API communication, error handling, and audio delivery.
 */

import { API_URL } from './api';

export interface TextToSpeechRequest {
  text: string;
  voiceId?: string;
  emotionalTone?: 'neutral' | 'warm' | 'empathetic';
  speed?: number;
  stability?: number;
}

export interface TextToSpeechResponse {
  audioUrl: string;
  audioBase64?: string;
  duration: number;
  textTokens: number;
  audioContentType: string;
  voiceId: string;
}

export interface TextToSpeechError {
  code: string;
  message: string; // Vietnamese error message
  timestamp: number;
}

export type TextToSpeechCallback = (response: TextToSpeechResponse) => void;
export type ErrorCallback = (error: TextToSpeechError) => void;

export class TextToSpeechClient {
  private readonly maxRetries = 3;
  private readonly timeout = 30000; // 30 seconds for API call

  /**
   * Request text-to-speech synthesis from backend
   * 
   * @param request TTS request with text and options
   * @returns Promise resolving to audio response
   * @throws TextToSpeechError on failure
   */
  async synthesize(request: TextToSpeechRequest): Promise<TextToSpeechResponse> {
    let retryCount = 0;

    while (retryCount < this.maxRetries) {
      try {
        console.log(`Requesting TTS synthesis (attempt ${retryCount + 1}/${this.maxRetries})`);

        const payload = {
          text: request.text,
          voice_id: request.voiceId,
          emotional_tone: request.emotionalTone || 'warm',
          speed: request.speed || 1.0,
          stability: request.stability || 0.5,
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
          const response = await fetch(`${API_URL}/api/v1/tts/synthesize`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorData = await response.json();
            const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
            console.error(`TTS API error: ${errorMsg}`);
            throw new Error(errorMsg);
          }

          const data = await response.json();

          console.log(`TTS synthesis complete: ${data.text_tokens} tokens → ${data.audio_content_type}`);

          return {
            audioUrl: data.audio_url,
            audioBase64: data.audio_base64,
            duration: data.duration || 0,
            textTokens: data.text_tokens || 0,
            audioContentType: data.audio_content_type || 'audio/mpeg',
            voiceId: data.voice_id || 'default',
          };
        } catch (error) {
          clearTimeout(timeoutId);

          if (error instanceof Error && error.name === 'AbortError') {
            throw new Error('Yêu cầu hết thời gian chờ. Vui lòng thử lại.');
          }

          throw error;
        }
      } catch (error) {
        retryCount++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';

        console.warn(`TTS synthesis attempt ${retryCount} failed: ${errorMsg}`);

        if (retryCount < this.maxRetries) {
          // Exponential backoff before retry
          const backoffMs = 500 * Math.pow(2, retryCount - 1);
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          continue;
        } else {
          throw {
            code: 'SYNTHESIS_FAILED',
            message: this.mapErrorToVietnamese(errorMsg),
            timestamp: Date.now(),
          };
        }
      }
    }

    throw {
      code: 'SYNTHESIS_FAILED',
      message: 'Không thể tạo giọng nói sau nhiều lần thử. Vui lòng thử lại sau.',
      timestamp: Date.now(),
    };
  }

  /**
   * Map error messages to Vietnamese user-facing messages
   * 
   * @param errorMessage Error message from API or network
   * @returns Vietnamese error message
   */
  private mapErrorToVietnamese(errorMessage: string): string {
    const lowerError = errorMessage.toLowerCase();

    if (lowerError.includes('timeout')) {
      return 'Yêu cầu hết thời gian chờ. Vui lòng thử lại.';
    } else if (lowerError.includes('network') || lowerError.includes('connection')) {
      return 'Lỗi kết nối. Vui lòng kiểm tra internet.';
    } else if (lowerError.includes('authentication') || lowerError.includes('api_key')) {
      return 'Lỗi xác thực. Vui lòng liên hệ hỗ trợ.';
    } else if (lowerError.includes('rate_limit')) {
      return 'Quá nhiều yêu cầu. Vui lòng chờ một lát.';
    } else if (lowerError.includes('voice')) {
      return 'Giọng nói không khả dụng. Vui lòng thử lại sau.';
    } else if (lowerError.includes('invalid')) {
      return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
    } else {
      return 'Lỗi xảy ra khi tạo giọng nói. Vui lòng thử lại.';
    }
  }
}

// Export singleton instance
export const textToSpeechClient = new TextToSpeechClient();
