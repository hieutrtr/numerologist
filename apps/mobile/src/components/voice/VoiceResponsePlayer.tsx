/**
 * Voice Response Player Component
 * 
 * Main component for displaying text responses alongside audio playback.
 * Handles audio generation, playback status, and error display.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { textToSpeechClient, TextToSpeechResponse, TextToSpeechError } from '../../services/text-to-speech';
import { audioPlayer } from '../../services/audio-player';
import AudioControls from './AudioControls';
import PlaybackStatus from './PlaybackStatus';

export interface VoiceResponsePlayerProps {
  responseText: string;
  voiceId?: string;
  emotionalTone?: 'neutral' | 'warm' | 'empathetic';
  autoPlay?: boolean;
  onPlaybackStart?: () => void;
  onPlaybackComplete?: () => void;
  onError?: (error: TextToSpeechError) => void;
}

export const VoiceResponsePlayer: React.FC<VoiceResponsePlayerProps> = ({
  responseText,
  voiceId = 'default',
  emotionalTone = 'warm',
  autoPlay = true,
  onPlaybackStart,
  onPlaybackComplete,
  onError,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [speed, setSpeed] = useState(1.0);
  const [error, setError] = useState<TextToSpeechError | null>(null);
  const [audioResponse, setAudioResponse] = useState<TextToSpeechResponse | null>(null);

  // Generate audio when component mounts
  useEffect(() => {
    const generateAudio = async () => {
      try {
        setIsGenerating(true);
        setError(null);

        console.log('Generating TTS for response:', responseText.substring(0, 50));

        const response = await textToSpeechClient.synthesize({
          text: responseText,
          voiceId,
          emotionalTone,
        });

        setAudioResponse(response);
        setDuration(response.duration || 0);

        // Load audio
        await audioPlayer.loadAudio(response.audioUrl, handlePlaybackStatusUpdate);

        console.log('Audio generated and loaded');

        // Auto-play if enabled
        if (autoPlay) {
          await audioPlayer.play();
          setIsPlaying(true);
          onPlaybackStart?.();
        }
      } catch (err) {
        const error = err as TextToSpeechError;
        console.error('Failed to generate audio:', error);
        setError(error);
        onError?.(error);
      } finally {
        setIsGenerating(false);
      }
    };

    generateAudio();

    // Cleanup
    return () => {
      audioPlayer.cleanup();
    };
  }, [responseText, voiceId, emotionalTone]);

  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setCurrentTime(status.positionMillis || 0);
      setDuration(status.durationMillis || 0);

      if (!status.isPlaying && isPlaying && status.positionMillis > 0) {
        // Playback completed
        setIsPlaying(false);
        onPlaybackComplete?.();
      }
    }
  };

  const handlePlay = async () => {
    try {
      if (isPaused) {
        await audioPlayer.resume();
        setIsPaused(false);
      } else {
        await audioPlayer.play();
      }
      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to play audio:', err);
      setError({
        code: 'PLAYBACK_ERROR',
        message: 'Không thể phát âm thanh. Vui lòng thử lại.',
        timestamp: Date.now(),
      });
    }
  };

  const handlePause = async () => {
    try {
      await audioPlayer.pause();
      setIsPlaying(false);
      setIsPaused(true);
    } catch (err) {
      console.error('Failed to pause audio:', err);
    }
  };

  const handleReplay = async () => {
    try {
      await audioPlayer.replay();
      setIsPlaying(true);
      setIsPaused(false);
      onPlaybackStart?.();
    } catch (err) {
      console.error('Failed to replay audio:', err);
    }
  };

  const handleVolumeChange = async (newVolume: number) => {
    try {
      setVolume(newVolume);
      await audioPlayer.setVolume(newVolume / 100);
    } catch (err) {
      console.error('Failed to set volume:', err);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    try {
      setSpeed(newSpeed);
      await audioPlayer.setRate(newSpeed);
    } catch (err) {
      console.error('Failed to set speed:', err);
    }
  };

  const handleSeek = async (newTime: number) => {
    try {
      await audioPlayer.seek(newTime * 1000);
      setCurrentTime(newTime * 1000);
    } catch (err) {
      console.error('Failed to seek:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Response Text */}
      <View style={styles.textContainer}>
        <Text style={styles.responseText}>{responseText}</Text>
      </View>

      {/* Generating Indicator */}
      {isGenerating && (
        <View style={styles.generatingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.generatingText}>Đang tạo giọng nói...</Text>
        </View>
      )}

      {/* Error Display */}
      {error && !isGenerating && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      )}

      {/* Playback Controls - Only show if audio is ready */}
      {audioResponse && !isGenerating && !error && (
        <>
          <PlaybackStatus
            currentTime={currentTime / 1000}
            duration={duration / 1000}
            isPlaying={isPlaying}
            onSeek={handleSeek}
          />

          <AudioControls
            isPlaying={isPlaying}
            isPaused={isPaused}
            volume={volume}
            speed={speed}
            onPlay={handlePlay}
            onPause={handlePause}
            onReplay={handleReplay}
            onVolumeChange={handleVolumeChange}
            onSpeedChange={handleSpeedChange}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    marginVertical: 8,
  },
  textContainer: {
    marginBottom: 12,
  },
  responseText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    fontFamily: 'System',
  },
  generatingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  generatingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#D32F2F',
  },
});

export default VoiceResponsePlayer;
