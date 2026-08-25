/**
 * OrdinaryMatter — EventCard Component
 *
 * Displays a single event in the session timeline.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface EventCardProps {
  event: {
    id: string;
    type: string;
    timestamp: string;
    toolName?: string | null;
    toolArgs?: any;
    error?: string | null;
    content?: string | null;
    source?: string | null;
    stepType?: string | null;
  };
}

const eventIcons: Record<string, string> = {
  'pre-invocation': '🧠',
  'post-invocation': '💭',
  'pre-tool-use': '⚙️',
  'post-tool-use': '✅',
  'stop': '🛑',
  'transcript': '📝',
};

const eventLabels: Record<string, string> = {
  'pre-invocation': 'Thinking...',
  'post-invocation': 'Response Ready',
  'pre-tool-use': 'Running Tool',
  'post-tool-use': 'Tool Completed',
  'stop': 'Stopped',
  'transcript': 'Activity',
};

export function EventCard({ event }: EventCardProps) {
  const icon = eventIcons[event.type] || '📌';
  const label = eventLabels[event.type] || event.type;
  const hasError = !!event.error;
  const time = new Date(event.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <View style={[styles.card, hasError && styles.cardError]}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.headerText}>
          <Text style={[styles.label, hasError && styles.labelError]}>{label}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>

      {event.toolName && (
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Tool</Text>
          <Text style={styles.detailValue}>{event.toolName}</Text>
        </View>
      )}

      {event.toolArgs && (
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>Args</Text>
          <Text style={styles.detailMono} numberOfLines={3}>
            {typeof event.toolArgs === 'string'
              ? event.toolArgs
              : JSON.stringify(event.toolArgs, null, 2)}
          </Text>
        </View>
      )}

      {event.content && (
        <Text style={styles.content} numberOfLines={4}>
          {event.content}
        </Text>
      )}

      {event.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{event.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardError: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  icon: {
    fontSize: 18,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    ...typography.bodySmall,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  labelError: {
    color: colors.error,
  },
  time: {
    ...typography.caption,
    color: colors.textMuted,
  },
  detail: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailLabel: {
    ...typography.caption,
    width: 40,
  },
  detailValue: {
    ...typography.bodySmall,
    flex: 1,
    color: colors.accentPrimary,
  },
  detailMono: {
    ...typography.mono,
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
  },
  content: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    color: colors.textSecondary,
  },
  errorBox: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  errorText: {
    ...typography.mono,
    color: colors.error,
    fontSize: 12,
  },
});
