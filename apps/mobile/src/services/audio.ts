/**
 * Audio Recording Service
 *
 * Handles audio recording from device microphone using Expo Audio API for native
 * and Web Audio API for web platform.
 * Configures 16kHz PCM mono format for Azure Speech Services compatibility.
 */

import * as Audio from 'expo-av';
import { Platform } from 'react-native';

// Web Audio API context for browser recording
let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;

// Audio recording configuration for Azure Speech Services
// 16kHz sample rate, PCM format (LINEAR16), mono channel
const RECORDING_CONFIG: Audio.RecordingOptions = {
  isMeteringEnabled: true,
  ...(Platform.OS === 'android' && {
    android: {
      extension: '.wav',
      outputFormat: Audio.AndroidOutputFormat.MPEG_4,
      audioEncoder: Audio.AndroidAudioEncoder.AAC,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
    },
  }),
  ...(Platform.OS === 'ios' && {
    ios: {
      extension: '.wav',
      audioQuality: Audio.IosAudioQuality.MAX,
      sampleRate: 16000,
      numberOfChannels: 1,
      bitRate: 128000,
      linearPCMBitDepth: 16,
      linearPCMIsBigEndian: false,
      linearPCMIsFloat: false,
    },
  }),
  ...(Platform.OS === 'web' && {
    web: {
      mimeType: 'audio/wav',
      bitsPerSecond: 128000,
    },
  }),
};

export interface AudioMetrics {
  duration: number; // milliseconds
  metering: number; // -160 to 0 dB
}

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private metersUpdateInterval: NodeJS.Timer | null = null;
  private onMeteringUpdate: ((meter: number) => void) | null = null;
  private hasPermission: boolean = false;

  /**
   * Request microphone permissions from user
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, request microphone access via getUserMedia
        if (!mediaStream) {
          try {
            mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.hasPermission = true;
            return true;
          } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            console.error('Microphone permission denied on web:', errorMsg);

            // Re-throw with more context for caller to handle
            if (errorMsg.includes('NotAllowedError') || errorMsg.includes('Permission denied')) {
              throw new Error(`NotAllowedError: ${errorMsg}`);
            } else if (errorMsg.includes('NotFoundError')) {
              throw new Error(`NotFoundError: ${errorMsg}`);
            } else if (errorMsg.includes('Request interrupted')) {
              throw new Error(`Request interrupted by user`);
            }

            this.hasPermission = false;
            return false;
          }
        }
        this.hasPermission = true;
        return true;
      } else {
        // For native platforms, use Expo Audio permissions
        const permission = await Audio.requestPermissionsAsync();
        this.hasPermission = permission.granted;
        return permission.granted;
      }
    } catch (error) {
      console.error('Failed to request audio permissions:', error);
      return false;
    }
  }

  /**
   * Check if microphone permission is granted
   */
  async checkPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, check if we have an active media stream
        return this.hasPermission || mediaStream !== null;
      } else {
        // For native platforms, use Expo Audio permissions
        const permission = await Audio.getPermissionsAsync();
        this.hasPermission = permission.granted;
        return permission.granted;
      }
    } catch (error) {
      console.error('Failed to check audio permissions:', error);
      return false;
    }
  }

  /**
   * Set up audio session for recording
   */
  async setupAudioSession(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Failed to set up audio session:', error);
      throw error;
    }
  }

  /**
   * Start recording audio
   * @param onMeter Optional callback for metering updates (amplitude levels)
   */
  async startRecording(onMeter?: (meter: number) => void): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web platform recording using Web Audio API
        if (!mediaStream) {
          // Request permission if not already granted
          mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        }

        if (!audioContext) {
          audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        // Create audio source from media stream
        const source = audioContext.createMediaStreamSource(mediaStream);

        // Create analyser for metering
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 2048;
        source.connect(analyser);

        // Create audio recorder worklet or processor
        const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
        analyser.connect(scriptProcessor);

        // Store recorder data
        const audioData: Float32Array[] = [];

        scriptProcessor.onaudioprocess = (event: AudioProcessingEvent) => {
          const inputData = event.inputData.getChannelData(0);
          audioData.push(new Float32Array(inputData));

          // Update metering if callback provided
          if (onMeter) {
            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(dataArray);
            const average =
              dataArray.reduce((a, b) => a + b) / dataArray.length;
            const dbLevel = (average / 255) * 100 - 100; // Convert to dB-like scale
            onMeter(Math.max(-160, dbLevel));
          }
        };

        // Store recording context
        (this.recording as any) = {
          audioData,
          scriptProcessor,
          source,
          analyser,
          mediaStream,
          audioContext,
        };

        this.onMeteringUpdate = onMeter;
        this.startMeteringUpdates();
      } else {
        // Native platform recording
        // Check permissions
        const hasPermission = await this.checkPermissions();
        if (!hasPermission) {
          throw new Error('Audio recording permission not granted');
        }

        // Set up audio session
        await this.setupAudioSession();

        // Create new recording
        this.recording = new Audio.Recording();

        // Set metering callback if provided
        if (onMeter) {
          this.onMeteringUpdate = onMeter;
          this.startMeteringUpdates();
        }

        // Start recording
        await this.recording.prepareToRecordAsync(RECORDING_CONFIG);
        await this.recording.startAsync();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.recording = null;
      throw error;
    }
  }

  /**
   * Stop recording and return audio file URI
   */
  async stopRecording(): Promise<string> {
    try {
      if (!this.recording) {
        throw new Error('No active recording');
      }

      // Stop metering updates
      this.stopMeteringUpdates();

      if (Platform.OS === 'web') {
        // Web platform: convert audio data to WAV and create blob URL
        const recordingData = this.recording as any;

        if (recordingData.scriptProcessor) {
          recordingData.scriptProcessor.disconnect();
          recordingData.analyser.disconnect();
          recordingData.source.disconnect();
        }

        // Combine audio chunks
        const audioData = recordingData.audioData as Float32Array[];
        const totalLength = audioData.reduce((sum, chunk) => sum + chunk.length, 0);
        const combinedData = new Float32Array(totalLength);

        let offset = 0;
        for (const chunk of audioData) {
          combinedData.set(chunk, offset);
          offset += chunk.length;
        }

        // Convert to WAV
        const wavBlob = this.encodeWAV(combinedData);
        const uri = URL.createObjectURL(wavBlob);

        this.recording = null;
        return uri;
      } else {
        // Native platform
        await (this.recording as Audio.Recording).stopAndUnloadAsync();
        const uri = (this.recording as Audio.Recording).getURI();

        if (!uri) {
          throw new Error('Failed to get recording URI');
        }

        this.recording = null;
        return uri;
      }
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      throw error;
    }
  }

  /**
   * Encode audio data to WAV format
   */
  private encodeWAV(audioData: Float32Array): Blob {
    const sampleRate = 16000;
    const numChannels = 1;
    const bitDepth = 16;

    const bytesPerSample = bitDepth / 8;
    const blockAlign = numChannels * bytesPerSample;

    // Convert float32 to int16
    const int16Data = new Int16Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      int16Data[i] = Math.max(-1, Math.min(1, audioData[i])) < 0
        ? audioData[i] * 0x8000
        : audioData[i] * 0x7FFF;
    }

    // Create WAV file
    const wavLength = 44 + int16Data.length * 2;
    const arrayBuffer = new ArrayBuffer(wavLength);
    const view = new DataView(arrayBuffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, wavLength - 8, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitDepth, true);
    writeString(36, 'data');
    view.setUint32(40, int16Data.length * 2, true);

    // Audio data
    let offset = 44;
    for (let i = 0; i < int16Data.length; i++) {
      view.setInt16(offset, int16Data[i], true);
      offset += 2;
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  /**
   * Cancel recording (discard without saving)
   */
  async cancelRecording(): Promise<void> {
    try {
      if (!this.recording) {
        return;
      }

      // Stop metering updates
      this.stopMeteringUpdates();

      if (Platform.OS === 'web') {
        // Web platform: disconnect audio nodes
        const recordingData = this.recording as any;
        if (recordingData.scriptProcessor) {
          recordingData.scriptProcessor.disconnect();
          recordingData.analyser.disconnect();
          recordingData.source.disconnect();
        }
      } else {
        // Native platform
        await (this.recording as Audio.Recording).stopAndUnloadAsync();
      }

      this.recording = null;
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      this.recording = null;
    }
  }

  /**
   * Get current recording metrics
   */
  async getRecordingMetrics(): Promise<AudioMetrics | null> {
    try {
      if (!this.recording) {
        return null;
      }

      if (Platform.OS === 'web') {
        // Web platform: estimate duration from audio data
        const recordingData = this.recording as any;
        const audioData = recordingData.audioData as Float32Array[];
        const totalSamples = audioData.reduce((sum, chunk) => sum + chunk.length, 0);
        const sampleRate = 16000; // We use 16kHz
        const durationMs = (totalSamples / sampleRate) * 1000;

        return {
          duration: durationMs,
          metering: -160, // Default, will be updated by metering callback
        };
      } else {
        // Native platform
        const status = await (this.recording as Audio.Recording).getStatusAsync();
        return {
          duration: status.durationMillis || 0,
          metering: status.metering || -160,
        };
      }
    } catch (error) {
      console.error('Failed to get recording metrics:', error);
      return null;
    }
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.recording !== null;
  }

  /**
   * Start metering updates for waveform visualization
   */
  private startMeteringUpdates(): void {
    if (this.metersUpdateInterval) {
      return; // Already running
    }

    this.metersUpdateInterval = setInterval(() => {
      if (this.recording && this.onMeteringUpdate) {
        if (Platform.OS === 'web') {
          // Web platform: metering is handled in the scriptProcessor.onaudioprocess
          // No additional update needed here
          return;
        } else {
          // Native platform
          (this.recording as Audio.Recording).getStatusAsync().then((status) => {
            if (status.metering !== undefined) {
              this.onMeteringUpdate?.(status.metering);
            }
          });
        }
      }
    }, 100); // Update 10 times per second
  }

  /**
   * Stop metering updates
   */
  private stopMeteringUpdates(): void {
    if (this.metersUpdateInterval) {
      clearInterval(this.metersUpdateInterval);
      this.metersUpdateInterval = null;
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    try {
      this.stopMeteringUpdates();
      if (this.recording) {
        await this.cancelRecording();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const audioRecorder = new AudioRecorder();
