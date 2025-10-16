import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface WaveformVisualizerProps {
  isActive: boolean;
  meterValue?: number; // -160 to 0 dB scale
  color?: string;
  barCount?: number;
  animationDuration?: number;
}

/**
 * WaveformVisualizer Component
 * Displays animated waveform during voice recording
 * Shows audio levels in real-time
 */
export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isActive,
  meterValue = -160,
  color = '#FFD700',
  barCount = 12,
  animationDuration = 400,
}) => {
  const animatedValues = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    if (!isActive) {
      // Reset all bars
      animatedValues.forEach((animated) => {
        Animated.timing(animated, {
          toValue: 0,
          duration: 200,
          easing: Easing.ease,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    // Normalize meter value (convert from -160 to 0 dB to 0 to 1)
    const normalized = Math.max(0, Math.min(1, (meterValue + 160) / 160));

    // Animate bars with staggered timing
    animatedValues.forEach((animated, index) => {
      const delay = (index / barCount) * animationDuration;
      const randomHeight = Math.random() * normalized;

      Animated.timing(animated, {
        toValue: randomHeight,
        duration: animationDuration,
        delay: delay,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: false,
      }).start();
    });
  }, [isActive, meterValue, barCount, animationDuration]);

  const bars = animatedValues.map((animated, index) => (
    <Animated.View
      key={index}
      style={[
        styles.bar,
        {
          backgroundColor: color,
          height: animated.interpolate({
            inputRange: [0, 1],
            outputRange: ['8%', '100%'],
          }),
        },
      ]}
    />
  ));

  return (
    <View style={styles.container}>
      <View style={styles.waveform}>{bars}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    width: '100%',
    height: 80,
    paddingHorizontal: 16,
    gap: 4,
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 6,
    maxWidth: 6,
  },
});
