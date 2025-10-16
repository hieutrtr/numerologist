import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Message } from '../../types';
import { Colors, Spacing, BorderRadius, FontSizes } from '../../utils/colors';

interface MessageBubbleProps {
  message: Message;
  onTap?: () => void;
  onLongPress?: () => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onTap,
  onLongPress,
}) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  const getBubbleStyle = () => {
    if (isSystem) return styles.systemBubble;
    return isUser ? styles.userBubble : styles.aiBubble;
  };

  const getTextStyle = () => {
    if (isSystem) return styles.systemText;
    return isUser ? styles.userText : styles.aiText;
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <Pressable
      onPress={onTap}
      onLongPress={onLongPress}
      style={[
        styles.container,
        isUser && styles.userContainer,
        isSystem && styles.systemContainer,
      ]}
    >
      <View style={[styles.bubble, getBubbleStyle()]}>
        <Text style={getTextStyle()}>{message.text}</Text>
        {!isSystem && (
          <Text style={styles.timestamp}>{formatTime(message.timestamp)}</Text>
        )}
        {message.audioUrl && (
          <Text style={styles.audioIndicator}>🎵</Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxWidth: '80%',
  },
  userContainer: {
    alignSelf: 'flex-end',
  },
  systemContainer: {
    alignSelf: 'center',
    maxWidth: '90%',
  },
  bubble: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: Colors.userMessageBg,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: Colors.aiMessageBg,
    borderBottomLeftRadius: 4,
  },
  systemBubble: {
    backgroundColor: Colors.systemMessageBg,
    borderRadius: BorderRadius.md,
  },
  userText: {
    fontSize: FontSizes.md,
    color: Colors.black,
  },
  aiText: {
    fontSize: FontSizes.md,
    color: Colors.black,
  },
  systemText: {
    fontSize: FontSizes.sm,
    color: Colors.grey,
    textAlign: 'center',
  },
  timestamp: {
    fontSize: FontSizes.xs,
    color: Colors.grey,
    marginTop: Spacing.xs,
  },
  audioIndicator: {
    fontSize: 12,
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
  },
});
