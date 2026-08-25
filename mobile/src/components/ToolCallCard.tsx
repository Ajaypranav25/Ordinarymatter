/**
 * OrdinaryMatter — ToolCallCard Component
 *
 * Collapsible card showing a tool call's name and arguments.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface ToolCallCardProps {
  name: string;
  args?: any;
  error?: string | null;
}

export function ToolCallCard({ name, args, error }: ToolCallCardProps) {
  const [expanded, setExpanded] = useState(false);

  const argsStr = args
    ? typeof args === 'string'
      ? args
      : JSON.stringify(args, null, 2)
    : null;

  return (
    <TouchableOpacity
      style={[styles.card, error && styles.cardError]}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{error ? '❌' : '⚙️'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{name}</Text>
          {!expanded && argsStr && (
            <Text style={styles.preview} numberOfLines={1}>
              {argsStr.replace(/\n/g, ' ').substring(0, 60)}
            </Text>
          )}
        </View>
        <Text style={styles.chevron}>{expanded ? '▼' : '▶'}</Text>
      </View>

      {expanded && argsStr && (
        <View style={styles.argsContainer}>
          <Text style={styles.argsText}>{argsStr}</Text>
        </View>
      )}

      {expanded && error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  cardError: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(79, 110, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 14,
  },
  info: {
    flex: 1,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.accentPrimary,
  },
  preview: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  chevron: {
    fontSize: 10,
    color: colors.textMuted,
  },
  argsContainer: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    padding: spacing.md,
  },
  argsText: {
    ...typography.mono,
    color: colors.textSecondary,
    fontSize: 11,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(239, 68, 68, 0.2)',
    padding: spacing.md,
  },
  errorText: {
    ...typography.mono,
    color: colors.error,
    fontSize: 11,
  },
});
