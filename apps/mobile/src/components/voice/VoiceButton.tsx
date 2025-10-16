import React, { useEffect, useRef } from 'react';
import { Pressable, View, Text, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { VoiceButtonProps } from '../../types';
import { Colors, Spacing, BorderRadius } from '../../utils/colors';

const BUTTON_SIZES = {
  small: 48,
  medium: 80,
  large: 200,
};

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  size = 'large',
  state,
  onPress,
  audioAmplitude = 0,
  label,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  const buttonSize = BUTTON_SIZES[size];

  // Pulse animation for idle state
  useEffect(() => {
    if (state === 'idle') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.05,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      Animated.timing(scale, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state, scale]);

  // Rotating shimmer for processing state
  useEffect(() => {
    if (state === 'processing') {
      Animated.loop(
        Animated.timing(rotation, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        })
      ).start();
      Animated.timing(opacity, {
        toValue: 0.7,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      rotation.setValue(0);
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [state, rotation, opacity]);

  // Shake animation for error state
  useEffect(() => {
    if (state === 'error') {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 0.95,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1.05,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [state, scale]);

  const handlePress = () => {
    if (state !== 'disabled') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  const getGradientColors = () => {
    switch (state) {
      case 'error':
        return [Colors.error, '#FF6B6B'];
      case 'listening':
        return [Colors.primaryBlue, Colors.primaryPurple];
      case 'speaking':
        return [Colors.primaryPurple, '#9B82FF'];
      default:
        return [Colors.primaryPurple, Colors.primaryBlue];
    }
  };

  const getLabel = () => {
    if (label) return label;
    switch (state) {
      case 'listening':
        return 'Đang nghe...';
      case 'processing':
        return 'Đang xử lý...';
      case 'speaking':
        return 'Đang nói...';
      case 'error':
        return 'Lỗi - Thử lại';
      default:
        return 'Chạm để nói';
    }
  };

  const rotateInterpolate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Pressable
        onPress={handlePress}
        disabled={state === 'disabled'}
        accessibilityLabel="Nút ghi âm. Nhấn để bắt đầu nói."
        accessibilityRole="button"
        accessibilityState={{ disabled: state === 'disabled' }}
      >
        <Animated.View
          style={[
            styles.buttonContainer,
            { width: buttonSize, height: buttonSize },
            {
              transform: [
                { scale },
                { rotate: rotateInterpolate },
              ],
              opacity: state === 'disabled' ? 0.4 : opacity,
            },
          ]}
        >
          <LinearGradient
            colors={getGradientColors()}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.gradient,
              { borderRadius: buttonSize / 2 },
            ]}
          >
            {state === 'listening' && (
              <View style={styles.waveformContainer}>
                {/* Simplified waveform - use WaveformVisualizer component for full version */}
                <View style={styles.waveformBar} />
                <View style={[styles.waveformBar, { height: 20 }]} />
                <View style={styles.waveformBar} />
              </View>
            )}
            {state === 'idle' && (
              <Text style={[styles.micIcon, { fontSize: buttonSize * 0.3 }]}>
                🎤
              </Text>
            )}
            {state === 'processing' && (
              <Text style={[styles.micIcon, { fontSize: buttonSize * 0.3 }]}>
                ⚙️
              </Text>
            )}
            {state === 'speaking' && (
              <Text style={[styles.micIcon, { fontSize: buttonSize * 0.3 }]}>
                🔊
              </Text>
            )}
            {state === 'error' && (
              <Text style={[styles.micIcon, { fontSize: buttonSize * 0.3 }]}>
                ⚠️
              </Text>
            )}
          </LinearGradient>
        </Animated.View>
      </Pressable>
      <Text style={styles.label}>{getLabel()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContainer: {
    shadowColor: Colors.primaryPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  micIcon: {
    color: Colors.white,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  waveformBar: {
    width: 4,
    height: 30,
    backgroundColor: Colors.white,
    borderRadius: 2,
  },
  label: {
    marginTop: Spacing.md,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.black,
  },
});
