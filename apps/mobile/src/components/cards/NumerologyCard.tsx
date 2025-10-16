import React, { useEffect, useRef } from 'react';
import { Pressable, Text, StyleSheet, View, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NumerologyCardProps } from '../../types';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../utils/colors';
import { NUMEROLOGY_COLORS } from '../../utils/constants';

export const NumerologyCard: React.FC<NumerologyCardProps> = ({
  number,
  type,
  title,
  subtitle,
  meaning,
  onPress,
  isSelected,
  animateOnMount,
}) => {
  const scale = useRef(new Animated.Value(animateOnMount ? 0 : 1)).current;

  useEffect(() => {
    if (animateOnMount) {
      Animated.spring(scale, {
        toValue: 1,
        damping: 10,
        stiffness: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [animateOnMount, scale]);

  const gradientColors = NUMEROLOGY_COLORS[type];

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          { transform: [{ scale }] },
          isSelected && styles.selected,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.content}>
            <Text style={styles.number}>{number}</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>{subtitle}</Text>
            <Text style={styles.meaning} numberOfLines={2}>
              {meaning}
            </Text>
          </View>
          <Text style={styles.watermark}>🪷</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    height: 200,
    borderRadius: BorderRadius.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selected: {
    borderWidth: 3,
    borderColor: Colors.white,
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 64,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSizes.xs,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: Spacing.sm,
  },
  meaning: {
    fontSize: FontSizes.sm,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  watermark: {
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
    fontSize: 48,
    opacity: 0.2,
  },
});
