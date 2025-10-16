import React, { useRef, useEffect } from 'react';
import { FlatList, View, StyleSheet } from 'react-native';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ConversationTranscriptProps } from '../../types';
import { Spacing } from '../../utils/colors';

export const ConversationTranscript: React.FC<ConversationTranscriptProps> = ({
  messages,
  isAiTyping,
  onMessageTap,
  onMessageLongPress,
  maxHeight,
}) => {
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new message arrives
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  return (
    <View style={[styles.container, maxHeight && { maxHeight }]}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            onTap={() => onMessageTap?.(item.id)}
            onLongPress={() => onMessageLongPress?.(item.id)}
          />
        )}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      />
      {isAiTyping && <TypingIndicator />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: Spacing.md,
  },
});
