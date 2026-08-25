/**
 * OrdinaryMatter — StatusBadge Component
 *
 * Animated status indicator with pulsing glow effect.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, statusConfig, spacing, borderRadius, typography } from '../theme';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function StatusBadge({ status, size = 'md', showLabel = true }: StatusBadgeProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const config = statusConfig[status] || statusConfig.idle;

  const isAnimated = status === 'working' || status === 'waiting_input';

  useEffect(() => {
    if (isAnimated) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.6,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
      return () => animation.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isAnimated]);

  const dotSizes = { sm: 8, md: 12, lg: 16 };
  const dotSize = dotSizes[size];

  return (
    <View style={styles.container}>
      <View style={[styles.dotContainer, { width: dotSize * 2.5, height: dotSize * 2.5 }]}>
        {/* Glow ring */}
        {isAnimated && (
          <Animated.View
            style={[
              styles.glowRing,
              {
                width: dotSize * 2.5,
                height: dotSize * 2.5,
                borderRadius: dotSize * 1.25,
                backgroundColor: config.glowColor,
                transform: [{ scale: pulseAnim }],
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.6],
                  outputRange: [0.6, 0],
                }),
              },
            ]}
          />
        )}
        {/* Dot */}
        <View
          style={[
            styles.dot,
            {
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: config.color,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, size === 'sm' && styles.labelSm]}>
          {config.icon} {config.label}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dotContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  dot: {
    // Size and color applied inline
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
});
