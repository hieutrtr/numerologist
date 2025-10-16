/**
 * Playback Status Component
 * 
 * Displays audio progress with seekable timeline and time display.
 */

import React from 'react';
import { View, Slider, Text, StyleSheet } from 'react-native';

export interface PlaybackStatusProps {
  currentTime: number; // in seconds
  duration: number; // in seconds
  isPlaying: boolean;
  onSeek: (time: number) => void;
}

export const PlaybackStatus: React.FC<PlaybackStatusProps> = ({
  currentTime,
  duration,
  isPlaying,
  onSeek,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = Math.max(0, duration - currentTime);

  return (
    <View style={styles.container}>
      {/* Progress Slider */}
      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration || 1}
        value={currentTime}
        onValueChange={onSeek}
        step={0.1}
        minimumTrackTintColor="#007AFF"
        maximumTrackTintColor="#e0e0e0"
        accessible={true}
        accessibilityLabel="Timeline"
        accessibilityHint={`${formatTime(currentTime)} of ${formatTime(duration)}`}
      />

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <View style={styles.statusIndicator}>
          {isPlaying && <View style={styles.playingDot} />}
          <Text style={styles.statusText}>{isPlaying ? 'Đang phát' : 'Tạm dừng'}</Text>
        </View>
        <Text style={styles.timeText}>-{formatTime(remainingTime)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  slider: {
    height: 40,
    marginHorizontal: -8,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 0,
    marginTop: 4,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    minWidth: 40,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default PlaybackStatus;
