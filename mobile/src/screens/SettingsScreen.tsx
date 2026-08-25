/**
 * OrdinaryMatter — Settings Screen
 *
 * Device pairing, connection management, and preferences.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useStore } from '../store';
import { apiService } from '../services/api';
import { ConnectionBar } from '../components/ConnectionBar';
import { colors, spacing, borderRadius, typography, cardStyle } from '../theme';

export function SettingsScreen() {
  const { state, connect, disconnect } = useStore();
  const [serverUrl, setServerUrl] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [isPairing, setIsPairing] = useState(false);
  const [pairError, setPairError] = useState('');

  const handlePair = async () => {
    if (!serverUrl.trim() || !pairingCode.trim()) {
      setPairError('Enter both the server URL and pairing code');
      return;
    }

    // Normalize URL
    let url = serverUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    // Remove trailing slash
    url = url.replace(/\/+$/, '');

    setIsPairing(true);
    setPairError('');

    try {
      // Test connection first
      const healthUrl = `${url}/api/health`;
      const healthRes = await fetch(healthUrl);
      if (!healthRes.ok) {
        throw new Error('Cannot reach server');
      }

      // Pair device
      const result = await apiService.pair(
        url,
        pairingCode.trim(),
        `${Platform.OS} device`,
        Platform.OS
      );

      // Connect WebSocket
      connect(url, result.token);

      // Clear inputs
      setServerUrl('');
      setPairingCode('');
    } catch (err: any) {
      setPairError(err.message || 'Failed to pair. Check the URL and code.');
    }

    setIsPairing(false);
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect',
      'Are you sure you want to disconnect from your PC?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            await apiService.unpair();
            disconnect();
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <ConnectionBar />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Pairing Section */}
        {!state.isPaired ? (
          <View style={cardStyle}>
            <Text style={styles.sectionTitle}>CONNECT YOUR PC</Text>
            <Text style={styles.description}>
              Enter the tunnel URL and pairing code shown on your PC's terminal when you run the OrdinaryMatter relay server.
            </Text>

            <Text style={styles.inputLabel}>Server URL</Text>
            <TextInput
              style={styles.input}
              value={serverUrl}
              onChangeText={setServerUrl}
              placeholder="https://abc123.trycloudflare.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />

            <Text style={styles.inputLabel}>Pairing Code</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              value={pairingCode}
              onChangeText={setPairingCode}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
            />

            {pairError ? (
              <Text style={styles.errorText}>❌ {pairError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.pairButton, isPairing && styles.pairButtonDisabled]}
              onPress={handlePair}
              disabled={isPairing}
            >
              <Text style={styles.pairButtonText}>
                {isPairing ? 'Connecting...' : 'Connect'}
              </Text>
            </TouchableOpacity>

            <View style={styles.helpBox}>
              <Text style={styles.helpTitle}>How to get these values:</Text>
              <Text style={styles.helpText}>
                1. Run <Text style={styles.mono}>npm run server</Text> in the OrdinaryMatter project on your PC{'\n'}
                2. The pairing code will be displayed in the terminal{'\n'}
                3. Run <Text style={styles.mono}>npm run tunnel</Text> to get the tunnel URL
              </Text>
            </View>
          </View>
        ) : (
          <>
            {/* Connected Device Card */}
            <View style={cardStyle}>
              <Text style={styles.sectionTitle}>CONNECTED DEVICE</Text>

              <View style={styles.deviceInfo}>
                <View style={styles.deviceIcon}>
                  <Text style={styles.deviceEmoji}>🖥️</Text>
                </View>
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>
                    {state.pairedDevice?.name || 'Your PC'}
                  </Text>
                  <View style={styles.deviceStatus}>
                    <View
                      style={[
                        styles.statusDot,
                        state.isConnected ? styles.dotGreen : styles.dotRed,
                      ]}
                    />
                    <Text style={styles.statusText}>
                      {state.isConnected ? 'Connected' : 'Disconnected'}
                    </Text>
                  </View>
                </View>
              </View>

              {state.serverStatus && (
                <View style={styles.serverInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Server uptime</Text>
                    <Text style={styles.infoValue}>
                      Since {new Date(state.serverStatus.serverStartedAt).toLocaleTimeString()}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Active sessions</Text>
                    <Text style={styles.infoValue}>{state.serverStatus.activeSessions}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Server URL</Text>
                    <Text style={[styles.infoValue, styles.mono]} numberOfLines={1}>
                      {apiService.serverUrl}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnect}
              >
                <Text style={styles.disconnectText}>Disconnect</Text>
              </TouchableOpacity>
            </View>

            {/* About */}
            <View style={[cardStyle, { marginTop: spacing.lg }]}>
              <Text style={styles.sectionTitle}>ABOUT</Text>
              <Text style={styles.aboutText}>
                OrdinaryMatter v1.0.0{'\n'}
                Remote control for Antigravity AI coding sessions
              </Text>
            </View>
          </>
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

  // Section
  sectionTitle: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  description: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },

  // Inputs
  inputLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 8,
    textAlign: 'center',
  },

  // Error
  errorText: {
    ...typography.bodySmall,
    color: colors.error,
    marginTop: spacing.md,
  },

  // Pair Button
  pairButton: {
    backgroundColor: colors.accentPrimary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  pairButtonDisabled: {
    opacity: 0.6,
  },
  pairButtonText: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Help
  helpBox: {
    backgroundColor: colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.xl,
  },
  helpTitle: {
    ...typography.bodySmall,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  helpText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  mono: {
    fontFamily: 'monospace',
    color: colors.accentPrimary,
  },

  // Connected Device
  deviceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginBottom: spacing.lg,
  },
  deviceIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: 'rgba(79, 110, 247, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceEmoji: {
    fontSize: 28,
  },
  deviceDetails: {
    flex: 1,
  },
  deviceName: {
    ...typography.h3,
    marginBottom: 4,
  },
  deviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotGreen: {
    backgroundColor: colors.statusActive,
  },
  dotRed: {
    backgroundColor: colors.error,
  },
  statusText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
  },

  // Server Info
  serverInfo: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },
  infoValue: {
    ...typography.bodySmall,
    fontWeight: '500',
  },

  // Disconnect
  disconnectButton: {
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  disconnectText: {
    ...typography.body,
    color: colors.error,
    fontWeight: '600',
  },

  // About
  aboutText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 22,
  },
});
