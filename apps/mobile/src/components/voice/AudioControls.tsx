/**
 * Audio Controls Component
 * 
 * Provides playback controls: play/pause, replay, volume, and speed adjustment.
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Slider } from 'react-native';

export interface AudioControlsProps {
  isPlaying: boolean;
  isPaused: boolean;
  volume: number; // 0-100
  speed: number; // 0.75 to 1.5
  onPlay: () => void;
  onPause: () => void;
  onReplay: () => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  isPlaying,
  isPaused,
  volume,
  speed,
  onPlay,
  onPause,
  onReplay,
  onVolumeChange,
  onSpeedChange,
}) => {
  const speedOptions = [0.75, 1.0, 1.25, 1.5];

  return (
    <View style={styles.container}>
      {/* Playback Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={isPlaying && !isPaused ? onPause : onPlay}
          accessibilityLabel={isPlaying && !isPaused ? 'Tạm dừng' : 'Phát'}
        >
          <Text style={styles.buttonText}>
            {isPlaying && !isPaused ? '⏸' : '▶'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={onReplay}
          accessibilityLabel="Phát lại"
        >
          <Text style={styles.buttonText}>↻</Text>
        </TouchableOpacity>
      </View>

      {/* Volume Control */}
      <View style={styles.controlSection}>
        <Text style={styles.controlLabel}>🔊 Âm lượng</Text>
        <View style={styles.sliderContainer}>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            value={volume}
            onValueChange={onVolumeChange}
            step={5}
            minimumTrackTintColor="#007AFF"
            maximumTrackTintColor="#e0e0e0"
            accessibilityLabel="Âm lượng"
          />
          <Text style={styles.valueText}>{Math.round(volume)}%</Text>
        </View>
      </View>

      {/* Speed Control */}
      <View style={styles.controlSection}>
        <Text style={styles.controlLabel}>⚡ Tốc độ</Text>
        <View style={styles.speedButtonRow}>
          {speedOptions.map((speedOption) => (
            <TouchableOpacity
              key={speedOption}
              style={[
                styles.speedButton,
                speed === speedOption && styles.speedButtonActive,
              ]}
              onPress={() => onSpeedChange(speedOption)}
              accessibilityLabel={`Tốc độ ${speedOption}x`}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  speed === speedOption && styles.speedButtonTextActive,
                ]}
              >
                {speedOption}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 16,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
  },
  secondaryButton: {
    backgroundColor: '#E8E8E8',
  },
  buttonText: {
    fontSize: 24,
    color: '#fff',
  },
  controlSection: {
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  valueText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    minWidth: 40,
  },
  speedButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  speedButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  speedButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  speedButtonTextActive: {
    color: '#fff',
  },
});

export default AudioControls;
