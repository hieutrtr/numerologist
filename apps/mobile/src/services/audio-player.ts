/**
 * Audio Playback Service
 * 
 * Wrapper around Expo AV for audio playback control.
 * Handles pause, resume, replay, speed, and volume management.
 */

import { Audio, AVPlaybackStatus } from 'expo-av';

export interface AudioMetrics {
  currentTime: number;
  duration: number;
  volume: number;
}

export type PlaybackStateCallback = (status: AVPlaybackStatus) => void;

export class AudioPlayer {
  private sound: Audio.Sound | null = null;
  private onStatusUpdate: PlaybackStateCallback | null = null;
  private currentUri: string | null = null;

  /**
   * Load and prepare audio for playback
   * 
   * @param audioUri URI of audio file (file://, http://, or data:)
   * @param onStatusUpdate Callback for playback status updates
   */
  async loadAudio(audioUri: string, onStatusUpdate?: PlaybackStateCallback): Promise<void> {
    try {
      // Cleanup previous audio if loaded
      await this.cleanup();

      this.currentUri = audioUri;
      this.onStatusUpdate = onStatusUpdate || null;

      // Create new sound object
      this.sound = new Audio.Sound();

      // Subscribe to status updates
      if (this.onStatusUpdate) {
        this.sound.setOnPlaybackStatusUpdate(this.onStatusUpdate);
      }

      console.log(`Loading audio from: ${audioUri}`);

      // Load audio source
      if (audioUri.startsWith('data:')) {
        // Data URI - decode base64 and save to temp file
        await this.sound.loadAsync({ uri: audioUri });
      } else {
        await this.sound.loadAsync({ uri: audioUri });
      }

      console.log('Audio loaded successfully');
    } catch (error) {
      console.error('Failed to load audio:', error);
      throw error;
    }
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.playAsync();
      console.log('Playback started');
    } catch (error) {
      console.error('Failed to play audio:', error);
      throw error;
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.pauseAsync();
      console.log('Playback paused');
    } catch (error) {
      console.error('Failed to pause audio:', error);
      throw error;
    }
  }

  /**
   * Resume playback from pause
   */
  async resume(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.playAsync();
      console.log('Playback resumed');
    } catch (error) {
      console.error('Failed to resume audio:', error);
      throw error;
    }
  }

  /**
   * Replay audio from beginning
   */
  async replay(): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.setPositionAsync(0);
      await this.sound.playAsync();
      console.log('Replay started');
    } catch (error) {
      console.error('Failed to replay audio:', error);
      throw error;
    }
  }

  /**
   * Stop playback and unload audio
   */
  async stop(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.stopAsync();
      console.log('Playback stopped');
    } catch (error) {
      console.error('Failed to stop audio:', error);
    }
  }

  /**
   * Set playback position
   * 
   * @param positionMillis Position in milliseconds
   */
  async seek(positionMillis: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    try {
      await this.sound.setPositionAsync(positionMillis);
      console.log(`Seeked to ${positionMillis}ms`);
    } catch (error) {
      console.error('Failed to seek:', error);
      throw error;
    }
  }

  /**
   * Set playback rate/speed
   * 
   * @param rate Speed multiplier (0.5 to 2.0)
   */
  async setRate(rate: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    if (rate < 0.5 || rate > 2.0) {
      throw new Error('Rate must be between 0.5 and 2.0');
    }

    try {
      await this.sound.setRateAsync(rate, true);
      console.log(`Playback rate set to ${rate}x`);
    } catch (error) {
      console.error('Failed to set rate:', error);
      throw error;
    }
  }

  /**
   * Set volume level
   * 
   * @param volume Volume level (0 to 1, where 1 is 100%)
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.sound) {
      throw new Error('No audio loaded');
    }

    if (volume < 0 || volume > 1) {
      throw new Error('Volume must be between 0 and 1');
    }

    try {
      await this.sound.setVolumeAsync(volume);
      console.log(`Volume set to ${Math.round(volume * 100)}%`);
    } catch (error) {
      console.error('Failed to set volume:', error);
      throw error;
    }
  }

  /**
   * Get current playback metrics
   */
  async getMetrics(): Promise<AudioMetrics | null> {
    if (!this.sound) {
      return null;
    }

    try {
      const status = await this.sound.getStatusAsync();

      if (status.isLoaded) {
        return {
          currentTime: status.positionMillis || 0,
          duration: status.durationMillis || 0,
          volume: status.volume || 1,
        };
      }

      return null;
    } catch (error) {
      console.error('Failed to get metrics:', error);
      return null;
    }
  }

  /**
   * Check if audio is currently playing
   */
  async isPlaying(): Promise<boolean> {
    if (!this.sound) {
      return false;
    }

    try {
      const status = await this.sound.getStatusAsync();
      return status.isLoaded && status.isPlaying;
    } catch (error) {
      console.error('Failed to check playback status:', error);
      return false;
    }
  }

  /**
   * Cleanup and release audio resources
   */
  async cleanup(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
        this.sound = null;
        this.currentUri = null;
        console.log('Audio unloaded');
      } catch (error) {
        console.error('Failed to unload audio:', error);
      }
    }
  }
}

// Export singleton instance
export const audioPlayer = new AudioPlayer();
