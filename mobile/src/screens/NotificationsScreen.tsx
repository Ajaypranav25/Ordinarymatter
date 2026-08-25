/**
 * OrdinaryMatter — Notifications Screen
 *
 * Chronological list of events from the relay server.
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useStore, Notification } from '../store';
import { ConnectionBar } from '../components/ConnectionBar';
import { wsService } from '../services/websocket';
import { colors, spacing, borderRadius, typography, cardStyle } from '../theme';

const notifIcons: Record<string, string> = {
  task_completed: '✅',
  task_failed: '❌',
  needs_input: '✋',
  error: '⚠️',
  info: 'ℹ️',
};

const notifColors: Record<string, string> = {
  task_completed: colors.success,
  task_failed: colors.error,
  needs_input: colors.warning,
  error: colors.error,
  info: colors.info,
};

export function NotificationsScreen({ navigation }: any) {
  const { state, dispatch } = useStore();

  const handleMarkAllRead = () => {
    dispatch({ type: 'MARK_READ', payload: [] });
    wsService.markRead([]);
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = notifIcons[item.type] || '📌';
    const accentColor = notifColors[item.type] || colors.textMuted;
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const date = new Date(item.timestamp).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });

    return (
      <TouchableOpacity
        style={[styles.notifCard, !item.read && styles.unread]}
        activeOpacity={0.7}
        onPress={() => {
          // Mark as read
          dispatch({ type: 'MARK_READ', payload: [item.id] });
          wsService.markRead([item.id]);

          // Navigate to session if applicable
          if (item.data?.sessionId) {
            navigation.navigate('Sessions', {
              screen: 'SessionDetail',
              params: { sessionId: item.data.sessionId },
            });
          }
        }}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${accentColor}15` }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.notifContent}>
          <Text style={styles.notifMessage} numberOfLines={2}>
            {item.message}
          </Text>
          <Text style={styles.notifTime}>
            {date} · {time}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ConnectionBar />

      {/* Header with clear button */}
      {state.notifications.length > 0 && state.unreadCount > 0 && (
        <View style={styles.header}>
          <Text style={styles.headerText}>
            {state.unreadCount} unread
          </Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.clearButton}>Mark All Read</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={state.notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyText}>
              You'll receive alerts when tasks complete, fail, or need your input.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  clearButton: {
    ...typography.bodySmall,
    color: colors.accentPrimary,
    fontWeight: '600',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },

  // Notification Card
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  unread: {
    backgroundColor: 'rgba(79, 110, 247, 0.05)',
    borderColor: 'rgba(79, 110, 247, 0.15)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  notifContent: {
    flex: 1,
  },
  notifMessage: {
    ...typography.bodySmall,
    fontWeight: '500',
    color: colors.textPrimary,
  },
  notifTime: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentPrimary,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 3,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
