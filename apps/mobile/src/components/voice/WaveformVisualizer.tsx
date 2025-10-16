/**
 * Waveform Visualizer Component
 * 
 * Displays animated waveform during audio recording.
 * Shows audio level in real-time with smooth animation.
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export interface WaveformVisualizerProps {
  isActive: boolean;
  audioLevel: number; // -160 to 0 dB
  barCount?: number;
  height?: number;
  barWidth?: number;
  spacing?: number;
  color?: string;
}

/**
 * WaveformVisualizer Component
 * 
 * Animates vertical bars representing audio level during recording.
 */
export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
  audioLevel,
  barCount = 20,
  height = 100,
  barWidth = 3,
  spacing = 2,
  color = '#6366F1',
}) => {
  const animatedValues = useRef<Animated.Value[]>(
    Array.from({ length: barCount }).map(() => new Animated.Value(0.2))
  ).current;

  // Normalize audio level to 0-1 range
  // Audio levels range from -160dB (silent) to 0dB (max)
  const normalizedLevel = Math.max(0, Math.min(1, (audioLevel + 160) / 160));

  useEffect(() => {
    if (!isActive) {
      // Reset all bars to minimum when not recording
      Animated.parallel(
        animatedValues.map((value) =>
          Animated.timing(value, {
            toValue: 0.2,
            duration: 200,
            useNativeDriver: false,
          })
        )
      ).start();
      return;
    }

    // Animate bars based on audio level
    const animations = animatedValues.map((value, index) => {
      // Stagger animation across bars for wave effect
      const staggerDelay = (index * 30) % 300;
      
      // Vary height per bar with random offset
      const randomOffset = Math.random() * 0.3;
      const targetHeight = normalizedLevel * 0.8 + randomOffset * 0.2;

      return Animated.sequence([
        Animated.delay(staggerDelay),
        Animated.timing(value, {
          toValue: Math.max(0.2, targetHeight),
          duration: 200,
          useNativeDriver: false,
        }),
      ]);
    });

    // Start animations
    Animated.parallel(animations).start();
  }, [isActive, audioLevel, animatedValues]);

  return (
    <View style={styles.container}>
      <View style={styles.waveformContainer}>
        {animatedValues.map((animValue, index) => (
          <Animated.View
            key={`bar-${index}`}
            style={[
              styles.bar,
              {
                width: barWidth,
                marginHorizontal: spacing / 2,
                height: animValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['20%', `${height}%`],
                }),
                backgroundColor: color,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    height: 120,
    gap: 2,
  },
  bar: {
    borderRadius: 2,
  },
});
