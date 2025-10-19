/**
 * Audio Recording Service
 * 
 * Handles audio recording from device microphone using Expo Audio API.
 * Configures 16kHz PCM mono format for Azure Speech Services compatibility.
 */

import * as Audio from 'expo-av';
import { Platform } from 'react-native';

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
      const permission = await Audio.requestPermissionsAsync();
      this.hasPermission = permission.granted;
      return permission.granted;
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
      const permission = await Audio.getPermissionsAsync();
      this.hasPermission = permission.granted;
      return permission.granted;
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

      // Stop recording
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();

      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      this.recording = null;
      return uri;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.recording = null;
      throw error;
    }
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

      // Stop recording (without saving)
      await this.recording.stopAndUnloadAsync();
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

      const status = await this.recording.getStatusAsync();
      return {
        duration: status.durationMillis || 0,
        metering: status.metering || -160,
      };
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
        this.recording.getStatusAsync().then((status) => {
          if (status.metering !== undefined) {
            this.onMeteringUpdate?.(status.metering);
          }
        });
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
