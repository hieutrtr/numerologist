import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { WaveformVisualizerProps } from '../../types';
import { Colors } from '../../utils/colors';

const Bar: React.FC<{ animatedHeight: Animated.Value; color: string }> = ({
  animatedHeight,
  color,
}) => {
  return (
    <Animated.View
      style={[
        styles.bar,
        {
          height: animatedHeight,
          backgroundColor: color,
        },
      ]}
    />
  );
};

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  mode,
  barCount = 40,
  height = 60,
  amplitudeData,
  isActive = true,
}) => {
  const bars = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(10))
  ).current;

  const getColor = () => {
    switch (mode) {
      case 'listening':
        return Colors.primaryBlue;
      case 'speaking':
        return Colors.primaryPurple;
      default:
        return Colors.waveformIdle;
    }
  };

  useEffect(() => {
    if (!isActive) {
      bars.forEach((bar) => {
        Animated.timing(bar, {
          toValue: 10,
          duration: 300,
          useNativeDriver: false,
        }).start();
      });
      return;
    }

    if (amplitudeData) {
      // Use provided amplitude data
      amplitudeData.forEach((amplitude, index) => {
        if (bars[index]) {
          Animated.spring(bars[index], {
            toValue: 10 + amplitude * (height - 20),
            useNativeDriver: false,
          }).start();
        }
      });
    } else {
      // Generate ambient wave animation for idle/active states
      bars.forEach((bar, index) => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(bar, {
              toValue: 10 + Math.random() * (height - 20),
              duration: 1000 + Math.random() * 500,
              useNativeDriver: false,
            }),
            Animated.timing(bar, {
              toValue: 10,
              duration: 1000 + Math.random() * 500,
              useNativeDriver: false,
            }),
          ])
        ).start();
      });
    }
  }, [mode, isActive, amplitudeData, bars, height]);

  return (
    <View style={[styles.container, { height }]}>
      {bars.map((barHeight, index) => (
        <Bar key={index} animatedHeight={barHeight} color={getColor()} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 2,
  },
});
