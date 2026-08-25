/**
 * OrdinaryMatter — Sessions Screen
 *
 * Lists all sessions and provides a detail view with full timeline.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useStore, Session } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { EventCard } from '../components/EventCard';
import { ConnectionBar } from '../components/ConnectionBar';
import { apiService } from '../services/api';
import { colors, spacing, borderRadius, typography, cardStyle } from '../theme';

// ─── Session List ────────────────────────────────────────────────

export function SessionsListScreen({ navigation }: any) {
  const { state, refreshSessions } = useStore();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };

  const renderSession = ({ item }: { item: Session }) => {
    const updatedAt = new Date(item.updatedAt);
    const timeAgo = getTimeAgo(updatedAt);

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('SessionDetail', { sessionId: item.id })}
      >
        <View style={styles.sessionHeader}>
          <StatusBadge status={item.status} size="sm" />
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {item.project && (
          <Text style={styles.projectName}>📁 {item.project}</Text>
        )}

        {item.currentTask && (
          <Text style={styles.taskText} numberOfLines={1}>
            {item.currentTask}
          </Text>
        )}

        <View style={styles.sessionMeta}>
          <Text style={styles.metaText}>{item.toolCallCount} tools</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>{item.invocationCount} invocations</Text>
          {item.errorCount > 0 && (
            <>
              <Text style={styles.metaDot}>·</Text>
              <Text style={[styles.metaText, { color: colors.error }]}>
                {item.errorCount} errors
              </Text>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.screen}>
      <ConnectionBar />
      <FlatList
        data={state.sessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentPrimary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No Sessions Yet</Text>
            <Text style={styles.emptyText}>
              Sessions will appear here when you start tasks in Antigravity.
            </Text>
          </View>
        }
      />
    </View>
  );
}

// ─── Session Detail ──────────────────────────────────────────────

export function SessionDetailScreen({ route }: any) {
  const { sessionId } = route.params;
  const { state } = useStore();
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDetail();
  }, [sessionId]);

  const loadDetail = async () => {
    try {
      const data = await apiService.getSession(sessionId);
      setDetail(data);
    } catch {
      // Use local state as fallback
      const local = state.sessions.find((s) => s.id === sessionId);
      if (local) setDetail(local);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading session...</Text>
      </View>
    );
  }

  if (!detail) {
    return (
      <View style={[styles.screen, styles.centerContent]}>
        <Text style={styles.emptyTitle}>Session Not Found</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.detailContent}>
        {/* Session Header */}
        <View style={cardStyle}>
          <StatusBadge status={detail.status} size="lg" />

          {detail.project && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Project</Text>
              <Text style={styles.detailValue}>{detail.project}</Text>
            </View>
          )}

          {detail.modelName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Model</Text>
              <Text style={styles.detailValue}>{detail.modelName}</Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Started</Text>
            <Text style={styles.detailValue}>
              {new Date(detail.createdAt).toLocaleString()}
            </Text>
          </View>

          <View style={styles.detailStats}>
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{detail.toolCallCount}</Text>
              <Text style={styles.detailStatLabel}>Tools</Text>
            </View>
            <View style={styles.detailStat}>
              <Text style={styles.detailStatValue}>{detail.invocationCount}</Text>
              <Text style={styles.detailStatLabel}>Invocations</Text>
            </View>
            <View style={styles.detailStat}>
              <Text style={[styles.detailStatValue, detail.errorCount > 0 && { color: colors.error }]}>
                {detail.errorCount}
              </Text>
              <Text style={styles.detailStatLabel}>Errors</Text>
            </View>
          </View>
        </View>

        {/* Event Timeline */}
        <Text style={styles.timelineTitle}>Timeline</Text>
        {detail.events && detail.events.length > 0 ? (
          detail.events.slice().reverse().map((event: any) => (
            <EventCard key={event.id} event={event} />
          ))
        ) : (
          <Text style={styles.emptyText}>No events recorded yet.</Text>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Helper ──────────────────────────────────────────────────────

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

// ─── Styles ──────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },

  // Session Card
  sessionCard: {
    ...cardStyle,
    marginBottom: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  timeAgo: {
    ...typography.caption,
    color: colors.textMuted,
  },
  projectName: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  metaDot: {
    color: colors.textMuted,
    marginHorizontal: spacing.xs,
    fontSize: 10,
  },

  // Empty State
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

  // Detail
  detailContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  detailLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  detailValue: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  detailStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailStat: {
    alignItems: 'center',
  },
  detailStatValue: {
    ...typography.h2,
    color: colors.accentPrimary,
  },
  detailStatLabel: {
    ...typography.caption,
    marginTop: 2,
  },

  // Timeline
  timelineTitle: {
    ...typography.caption,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },

  loadingText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
});
