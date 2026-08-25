/**
 * OrdinaryMatter — ConnectionBar Component
 *
 * Persistent status bar showing connection state.
 * Appears at the top of all screens.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { useStore } from '../store';

export function ConnectionBar() {
  const { state } = useStore();
  const slideAnim = useRef(new Animated.Value(-40)).current;

  const showBar = !state.isConnected && state.isPaired;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: showBar ? 0 : -40,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBar]);

  if (!state.isPaired) return null;

  return (
    <Animated.View
      style={[
        styles.bar,
        state.isConnected ? styles.connected : styles.disconnected,
        { transform: [{ translateY: showBar ? 0 : -40 }] },
      ]}
    >
      <View style={[styles.dot, state.isConnected ? styles.dotGreen : styles.dotRed]} />
      <Text style={styles.text}>
        {state.isConnected
          ? 'Connected to PC'
          : state.isReconnecting
          ? 'Reconnecting...'
          : 'Disconnected'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  connected: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  disconnected: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: colors.statusActive,
  },
  dotRed: {
    backgroundColor: colors.error,
  },
  text: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
