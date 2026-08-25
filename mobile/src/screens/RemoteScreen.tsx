/**
 * OrdinaryMatter — Remote Control Screen
 *
 * Send prompts to Antigravity from your phone and see responses.
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useStore } from '../store';
import { ChatBubble } from '../components/ChatBubble';
import { ConnectionBar } from '../components/ConnectionBar';
import { colors, spacing, borderRadius, typography, cardStyle } from '../theme';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function RemoteScreen() {
  const { state, sendPrompt } = useStore();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  // Track response streaming
  const lastResponseRef = useRef('');

  // Watch for prompt response updates
  React.useEffect(() => {
    if (state.isPromptRunning && state.promptResponse !== lastResponseRef.current) {
      lastResponseRef.current = state.promptResponse;
    }

    if (!state.isPromptRunning && lastResponseRef.current) {
      // Prompt completed — add assistant message
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: state.promptResponse || lastResponseRef.current,
          timestamp: new Date().toISOString(),
        },
      ]);
      lastResponseRef.current = '';
    }
  }, [state.isPromptRunning, state.promptResponse]);

  // Watch for errors
  React.useEffect(() => {
    if (state.promptError) {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          type: 'assistant',
          content: `❌ Error: ${state.promptError}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [state.promptError]);

  const handleSend = () => {
    if (!prompt.trim() || !state.isConnected || state.isPromptRunning) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: prompt.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    sendPrompt(prompt.trim());
    setPrompt('');

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ConnectionBar />

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messages}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💬</Text>
            <Text style={styles.emptyTitle}>Remote Control</Text>
            <Text style={styles.emptyText}>
              Send prompts to Antigravity from here.{'\n'}
              Your instructions will be executed on your PC.
            </Text>
            <View style={styles.suggestions}>
              {[
                'What are you currently working on?',
                'Run the test suite',
                'Show me the recent changes',
              ].map((suggestion, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.suggestion}
                  onPress={() => setPrompt(suggestion)}
                >
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            type={msg.type}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {/* Streaming indicator */}
        {state.isPromptRunning && (
          <View style={styles.streamingContainer}>
            <View style={styles.streamingBubble}>
              {state.promptResponse ? (
                <Text style={styles.streamingText}>{state.promptResponse}</Text>
              ) : (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={colors.accentPrimary} />
                  <Text style={styles.typingText}>AI is thinking...</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          value={prompt}
          onChangeText={setPrompt}
          placeholder={
            state.isConnected
              ? 'Send a prompt to Antigravity...'
              : 'Connect to your PC first'
          }
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={5000}
          editable={state.isConnected && !state.isPromptRunning}
          returnKeyType="default"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!prompt.trim() || !state.isConnected || state.isPromptRunning) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!prompt.trim() || !state.isConnected || state.isPromptRunning}
        >
          {state.isPromptRunning ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messages: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxxl * 2,
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
    marginBottom: spacing.xl,
  },
  suggestions: {
    width: '100%',
    gap: spacing.sm,
  },
  suggestion: {
    backgroundColor: colors.surfaceGlass,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  suggestionText: {
    ...typography.bodySmall,
    color: colors.accentPrimary,
  },

  // Streaming
  streamingContainer: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
    marginBottom: spacing.md,
  },
  streamingBubble: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomLeftRadius: 4,
  },
  streamingText: {
    ...typography.body,
    color: colors.textPrimary,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typingText: {
    ...typography.bodySmall,
    color: colors.textMuted,
  },

  // Input Bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceElevated,
    opacity: 0.5,
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
