/**
 * OrdinaryMatter — ChatBubble Component
 *
 * Displays a chat message (user prompt or AI response) in a bubble.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface ChatBubbleProps {
  type: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export function ChatBubble({ type, content, timestamp }: ChatBubbleProps) {
  const isUser = type === 'user';

  return (
    <View style={[styles.container, isUser ? styles.userContainer : styles.assistantContainer]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.text, isUser && styles.userText]}>{content}</Text>
      </View>
      {timestamp && (
        <Text style={[styles.timestamp, isUser && styles.userTimestamp]}>
          {new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  assistantContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  userBubble: {
    backgroundColor: colors.accentPrimary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  text: {
    ...typography.body,
    color: colors.textPrimary,
  },
  userText: {
    color: '#FFFFFF',
  },
  timestamp: {
    ...typography.caption,
    marginTop: 4,
    color: colors.textMuted,
  },
  userTimestamp: {
    textAlign: 'right',
  },
});
