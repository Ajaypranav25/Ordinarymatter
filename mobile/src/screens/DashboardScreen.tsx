/**
 * OrdinaryMatter — Dashboard Screen
 *
 * Home screen showing at-a-glance status of the connected PC
 * and active Antigravity session.
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useStore } from '../store';
import { StatusBadge } from '../components/StatusBadge';
import { ConnectionBar } from '../components/ConnectionBar';
import { colors, spacing, borderRadius, typography, cardStyle } from '../theme';

export function DashboardScreen({ navigation }: any) {
  const { state, refreshSessions } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const currentSession = state.sessions.find(
    (s) => s.status === 'working' || s.status === 'waiting_input'
  ) || state.sessions[0];

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshSessions();
    setRefreshing(false);
  };

  // If not paired, show pairing prompt
  if (!state.isPaired) {
    return (
      <View style={styles.screen}>
        <View style={styles.pairingContainer}>
          <Text style={styles.pairingIcon}>⚛️</Text>
          <Text style={styles.pairingTitle}>OrdinaryMatter</Text>
          <Text style={styles.pairingSubtitle}>
            Remote control for your Antigravity AI coding sessions
          </Text>
          <TouchableOpacity
            style={styles.pairingButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.pairingButtonText}>Connect Your PC</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ConnectionBar />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accentPrimary}
          />
        }
      >
        {/* Header */}
        <Text style={styles.greeting}>⚛️ OrdinaryMatter</Text>

        {/* Connection Status Card */}
        <View style={[cardStyle, styles.statusCard]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, state.isConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.statusLabel}>
              {state.isConnected ? 'Connected to PC' : 'Disconnected'}
            </Text>
          </View>
          {state.serverStatus && (
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{state.serverStatus.activeSessions}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{state.serverStatus.totalSessions}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{state.unreadCount}</Text>
                <Text style={styles.statLabel}>Alerts</Text>
              </View>
            </View>
          )}
        </View>

        {/* Current Session Card */}
        {currentSession ? (
          <TouchableOpacity
            style={cardStyle}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Sessions', {
                screen: 'SessionDetail',
                params: { sessionId: currentSession.id },
              })
            }
          >
            <Text style={styles.sectionTitle}>Current Session</Text>
            <View style={styles.sessionInfo}>
              <StatusBadge status={currentSession.status} size="md" />
            </View>

            {currentSession.project && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>📁 Project</Text>
                <Text style={styles.infoValue}>{currentSession.project}</Text>
              </View>
            )}

            {currentSession.currentTask && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🔧 Task</Text>
                <Text style={styles.infoValue} numberOfLines={2}>
                  {currentSession.currentTask}
                </Text>
              </View>
            )}

            {currentSession.modelName && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>🤖 Model</Text>
                <Text style={styles.infoValue}>{currentSession.modelName}</Text>
              </View>
            )}

            <View style={styles.sessionStats}>
              <Text style={styles.sessionStat}>
                {currentSession.toolCallCount} tools used
              </Text>
              <Text style={styles.sessionStat}>
                {currentSession.invocationCount} invocations
              </Text>
              {currentSession.errorCount > 0 && (
                <Text style={[styles.sessionStat, styles.errorStat]}>
                  {currentSession.errorCount} errors
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={cardStyle}>
            <Text style={styles.sectionTitle}>No Active Session</Text>
            <Text style={styles.emptyText}>
              Start a task in Antigravity on your PC, and it will appear here.
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Remote')}
          >
            <Text style={styles.actionIcon}>💬</Text>
            <Text style={styles.actionLabel}>Send Prompt</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Sessions')}
          >
            <Text style={styles.actionIcon}>📋</Text>
            <Text style={styles.actionLabel}>Sessions</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabel}>Alerts</Text>
            {state.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{state.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        {currentSession && currentSession.eventCount > 0 && (
          <View style={cardStyle}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <Text style={styles.emptyText}>
              {currentSession.eventCount} events in this session. Tap the session card above to see details.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl * 2,
  },
  greeting: {
    ...typography.h1,
    marginBottom: spacing.xl,
    marginTop: spacing.sm,
  },

  // Pairing
  pairingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xxxl,
  },
  pairingIcon: {
    fontSize: 64,
    marginBottom: spacing.xl,
  },
  pairingTitle: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  pairingSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xxxl,
  },
  pairingButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xxxl,
  },
  pairingButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Status Card
  statusCard: {
    marginBottom: spacing.lg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  dotGreen: {
    backgroundColor: colors.statusActive,
  },
  dotRed: {
    backgroundColor: colors.error,
  },
  statusLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    ...typography.h2,
    color: colors.accentPrimary,
  },
  statLabel: {
    ...typography.caption,
    marginTop: 2,
  },

  // Session Info
  sectionTitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  sessionInfo: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
    width: 80,
  },
  infoValue: {
    ...typography.bodySmall,
    flex: 1,
    fontWeight: '500',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sessionStat: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  errorStat: {
    color: colors.error,
  },
  emptyText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    alignItems: 'center',
    position: 'relative',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.sm,
  },
  actionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.error,
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
