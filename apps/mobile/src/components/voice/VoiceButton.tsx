/**
 * Voice Button Component
 * 
 * Main UI control for voice recording with visual state feedback.
 * States: idle, listening, processing, error
 */

import React, { useCallback, useState } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

export type VoiceButtonState = 'idle' | 'listening' | 'processing' | 'error';

export interface VoiceButtonProps {
  onPress: () => Promise<void>;
  onLongPress?: () => Promise<void>;
  state: VoiceButtonState;
  isDisabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  accessibilityLabel?: string;
}

const COLORS = {
  idle: '#6366F1',
  listening: '#EC4899',
  processing: '#F59E0B',
  error: '#EF4444',
};

const SIZE_CONFIG = {
  small: { size: 48, fontSize: 12 },
  medium: { size: 64, fontSize: 14 },
  large: { size: 80, fontSize: 16 },
};

/**
 * VoiceButton Component
 * 
 * Provides voice recording control with haptic feedback and visual state indication.
 */
export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress,
  onLongPress,
  state,
  isDisabled = false,
  size = 'medium',
  accessibilityLabel = 'Voice input button',
}) => {
  const [isPressing, setIsPressing] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timer | null>(null);

  const config = SIZE_CONFIG[size];
  const isEnabled = !isDisabled && state !== 'error';

  const handlePressIn = useCallback(async () => {
    setIsPressing(true);
    try {
      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('Haptic feedback not available');
    }

    // Set up long press timer if handler provided
    if (onLongPress && !isDisabled) {
      const timer = setTimeout(async () => {
        try {
          await onLongPress();
        } catch (error) {
          console.error('Long press handler error:', error);
        }
      }, 500);
      setLongPressTimer(timer);
    }
  }, [onLongPress, isDisabled]);

  const handlePressOut = useCallback(() => {
    setIsPressing(false);

    // Clear long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  const handlePress = useCallback(async () => {
    // Clear long press timer first
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (!isEnabled) {
      return;
    }

    try {
      await onPress();
    } catch (error) {
      console.error('Button press error:', error);
    }
  }, [onPress, isEnabled, longPressTimer]);

  const buttonColor = COLORS[state];
  const containerStyle: ViewStyle = {
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
    backgroundColor: buttonColor,
    opacity: isDisabled ? 0.5 : isPressing ? 0.8 : 1,
    transform: [
      {
        scale: isPressing ? 0.95 : 1,
      },
    ],
  };

  const stateLabels = {
    idle: 'Nhấn để nói',
    listening: 'Đang nghe...',
    processing: 'Đang xử lý...',
    error: 'Lỗi',
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, containerStyle]}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!isEnabled}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{
          disabled: !isEnabled,
        }}
      >
        <Text
          style={[
            styles.icon,
            {
              fontSize: config.fontSize + 12,
            },
          ]}
        >
          {state === 'error' ? '⚠️' : '🎤'}
        </Text>
      </TouchableOpacity>

      {/* State Label */}
      <Text
        style={[
          styles.stateLabel,
          {
            color: buttonColor,
          },
        ]}
      >
        {stateLabels[state]}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    color: '#FFF',
    fontWeight: '600',
  },
  stateLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
  },
});
