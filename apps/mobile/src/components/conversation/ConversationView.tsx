/**
 * Conversation View Component - Daily.co integration
 * Story 1.2c: Main UI component for voice conversations
 *
 * Integrates voice services for managing real-time voice conversations with the bot
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { useDaily, useAppMessage } from '@daily-co/daily-react';
import { MicrophoneSelector } from '../voice/MicrophoneSelector';
import { useVoiceInputService } from '../../services/voiceInputService';
import { useVoiceOutputService } from '../../services/voiceOutputService';

/**
 * Message type for display
 */
interface DisplayMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  confidence?: number;
  emotionalTone?: string;
}

/**
 * Props for ConversationView
 */
interface ConversationViewProps {
  conversationId: string;
  onConversationEnd?: (rating?: number) => void;
  onError?: (error: string) => void;
}

/**
 * Processing status type
 */
type ProcessingStatus = 'idle' | 'listening' | 'processing' | 'responding' | 'complete';

/**
 * Conversation View Component
 *
 * Acceptance Criteria (Story 1.2c):
 * - ConversationView component integrates voice services:
 *   - Voice button with hold-to-speak interaction pattern
 *   - Real-time transcription display
 *   - Processing status indicators (listening, processing, responding)
 *   - Remote audio state feedback
 *   - Microphone/speaker selection UI
 *   - End conversation button with rating prompt
 */
export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
  onConversationEnd,
  onError,
}) => {
  const daily = useDaily();

  // Voice services
  const voiceInput = useVoiceInputService({
    onRecordingStart: () => setProcessingStatus('listening'),
    onRecordingStop: () => setProcessingStatus('processing'),
    onError: (error) => {
      setErrorMessage(error);
      onError?.(error);
    },
    autoSelectFirst: true,
  });

  const voiceOutput = useVoiceOutputService({
    onRemoteAudioAvailable: () => setRemoteAudioStatus('playing'),
    onRemoteAudioInterrupted: () => setRemoteAudioStatus('interrupted'),
    onRemoteAudioUnavailable: () => setRemoteAudioStatus('unavailable'),
    autoSelectFirst: true,
  });

  // State
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>('idle');
  const [remoteAudioStatus, setRemoteAudioStatus] = useState<'playing' | 'interrupted' | 'unavailable'>('unavailable');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHoldingButton, setIsHoldingButton] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);

  const messageIdRef = useRef(0);

  /**
   * Handle app messages from Daily.co
   */
  useAppMessage(
    useCallback(
      (event) => {
        const { data, type } = event;

        switch (type) {
          case 'transcription_update':
            // Add or update transcription message
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.type === 'user' && lastMessage?.id === 'transcribing') {
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    text: data.text,
                    confidence: data.confidence,
                  },
                ];
              }
              return [
                ...prev,
                {
                  id: 'transcribing',
                  type: 'user',
                  text: data.text,
                  timestamp: new Date().toISOString(),
                  confidence: data.confidence,
                },
              ];
            });
            break;

          case 'processing_status':
            setProcessingStatus(data.status);
            break;

          case 'assistant_response':
            // Add assistant response to messages
            const messageId = `msg_${++messageIdRef.current}`;
            setMessages((prev) => [
              ...prev,
              {
                id: messageId,
                type: 'assistant',
                text: data.text,
                timestamp: new Date().toISOString(),
                emotionalTone: data.emotionalTone,
              },
            ]);
            setProcessingStatus('complete');
            break;

          case 'user_input_ended':
            // Finalize user message
            setMessages((prev) => {
              const lastMessage = prev[prev.length - 1];
              if (lastMessage?.id === 'transcribing') {
                const messageId = `msg_${++messageIdRef.current}`;
                return [
                  ...prev.slice(0, -1),
                  {
                    ...lastMessage,
                    id: messageId,
                  },
                ];
              }
              return prev;
            });
            break;
        }
      },
      []
    )
  );

  /**
   * Handle voice button press (hold to speak)
   */
  const handleVoiceButtonPressIn = useCallback(async () => {
    try {
      setIsHoldingButton(true);
      setErrorMessage(null);
      await voiceInput.startRecording();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to start recording';
      setErrorMessage(errorMsg);
      onError?.(errorMsg);
    }
  }, [voiceInput, onError]);

  /**
   * Handle voice button release
   */
  const handleVoiceButtonPressOut = useCallback(async () => {
    try {
      setIsHoldingButton(false);
      await voiceInput.stopRecording();

      // Send message to backend that user input ended
      if (daily) {
        await daily.sendAppMessage({
          type: 'user_input_ended',
          data: { conversationId },
        });
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to stop recording';
      setErrorMessage(errorMsg);
    }
  }, [voiceInput, daily, conversationId]);

  /**
   * Handle end conversation
   */
  const handleEndConversation = useCallback(() => {
    setShowRatingPrompt(true);
  }, []);

  /**
   * Submit rating and end conversation
   */
  const handleSubmitRating = useCallback(async () => {
    try {
      setShowRatingPrompt(false);

      // Stop recording if still active
      if (voiceInput.isRecording) {
        await voiceInput.stopRecording();
      }

      onConversationEnd?.(rating || undefined);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to end conversation';
      setErrorMessage(errorMsg);
    }
  }, [voiceInput, rating, onConversationEnd]);

  /**
   * Render message item
   */
  const renderMessageItem = ({ item }: { item: DisplayMessage }) => {
    const isUser = item.type === 'user';
    const isSystem = item.type === 'system';

    return (
      <View
        style={[
          styles.messageBubble,
          isUser && styles.userMessage,
          !isUser && styles.assistantMessage,
          isSystem && styles.systemMessage,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser && styles.userMessageText,
            !isUser && styles.assistantMessageText,
          ]}
        >
          {item.text}
        </Text>
        {item.confidence !== undefined && (
          <Text style={styles.confidence}>
            Confidence: {(item.confidence * 100).toFixed(0)}%
          </Text>
        )}
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString()}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Conversation</Text>
        <Text style={styles.headerStatus}>
          {processingStatus === 'listening' && '🎤 Listening...'}
          {processingStatus === 'processing' && '⏳ Processing...'}
          {processingStatus === 'responding' && '🤖 Responding...'}
          {processingStatus === 'complete' && '✓ Ready'}
          {processingStatus === 'idle' && '👂 Ready to listen'}
        </Text>
      </View>

      {/* Error Message */}
      {errorMessage && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <TouchableOpacity
            onPress={() => setErrorMessage(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={styles.errorDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <FlatList
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContent}
        onEndReached={() => {
          /* scroll to end */
        }}
      />

      {/* Remote Audio Status */}
      <View style={styles.audioStatusContainer}>
        <View
          style={[
            styles.audioStatusIndicator,
            remoteAudioStatus === 'playing' && styles.audioPlaying,
            remoteAudioStatus === 'interrupted' && styles.audioInterrupted,
          ]}
        />
        <Text style={styles.audioStatusText}>
          {remoteAudioStatus === 'playing'
            ? '🔊 Remote audio playing'
            : remoteAudioStatus === 'interrupted'
            ? '⚠️ Remote audio interrupted'
            : '🔇 No remote audio'}
        </Text>
      </View>

      {/* Device Selection - Using dedicated MicrophoneSelector component */}
      <MicrophoneSelector
        availableMics={voiceInput.availableMics}
        selectedMicId={voiceInput.selectedMicId}
        onMicrophoneChange={voiceInput.changeMicrophone}
        isLoading={voiceInput.isLoading}
      />

      {/* Speaker Selection (inline implementation for now) */}
      {voiceOutput.availableSpeakers.length > 1 && (
        <View style={styles.deviceSelectionContainer}>
          <View style={styles.deviceSelector}>
            <Text style={styles.deviceLabel}>Speaker:</Text>
            <View style={styles.deviceOptions}>
              {voiceOutput.availableSpeakers.map((speaker) => (
                <TouchableOpacity
                  key={speaker.id}
                  style={[
                    styles.deviceOption,
                    voiceOutput.selectedSpeakerId === speaker.id &&
                    styles.deviceOptionSelected,
                  ]}
                  onPress={() => voiceOutput.changeSpeaker(speaker.id)}
                >
                  <Text
                    style={[
                      styles.deviceOptionText,
                      voiceOutput.selectedSpeakerId === speaker.id &&
                      styles.deviceOptionTextSelected,
                    ]}
                  >
                    {speaker.label.substring(0, 15)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Voice Button - Hold to Speak */}
        <Pressable
          onPressIn={handleVoiceButtonPressIn}
          onPressOut={handleVoiceButtonPressOut}
          style={[
            styles.voiceButton,
            isHoldingButton && styles.voiceButtonActive,
            voiceInput.isRecording && styles.voiceButtonRecording,
          ]}
        >
          <Text style={styles.voiceButtonText}>
            {voiceInput.isLoading ? '⏳' : '🎤'}
          </Text>
          <Text style={styles.voiceButtonLabel}>
            {voiceInput.isLoading ? 'Loading...' : 'Hold to speak'}
          </Text>
        </Pressable>

        {/* End Conversation Button */}
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndConversation}
        >
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* Rating Prompt */}
      {showRatingPrompt && (
        <View style={styles.ratingPromptContainer}>
          <View style={styles.ratingPromptContent}>
            <Text style={styles.ratingPromptTitle}>Rate this conversation</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  style={styles.ratingStar}
                >
                  <Text
                    style={[
                      styles.ratingStarText,
                      rating && rating >= star && styles.ratingStarFilled,
                    ]}
                  >
                    ⭐
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.ratingButtons}>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingButtonCancel]}
                onPress={() => setShowRatingPrompt(false)}
              >
                <Text style={styles.ratingButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.ratingButton, styles.ratingButtonSubmit]}
                onPress={handleSubmitRating}
              >
                <Text style={styles.ratingButtonText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerStatus: {
    fontSize: 12,
    color: '#666',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    margin: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#f44336',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#c62828',
  },
  errorDismiss: {
    fontSize: 16,
    color: '#c62828',
    paddingLeft: 12,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 12,
  },
  messageBubble: {
    marginVertical: 8,
    marginHorizontal: 8,
    padding: 12,
    borderRadius: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e0e0',
  },
  systemMessage: {
    alignSelf: 'center',
    backgroundColor: '#f5f5f5',
    maxWidth: '75%',
  },
  messageText: {
    fontSize: 14,
    marginBottom: 4,
  },
  userMessageText: {
    color: '#fff',
  },
  assistantMessageText: {
    color: '#333',
  },
  confidence: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 10,
    opacity: 0.6,
  },
  audioStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  audioStatusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ccc',
    marginRight: 8,
  },
  audioPlaying: {
    backgroundColor: '#4caf50',
  },
  audioInterrupted: {
    backgroundColor: '#ff9800',
  },
  audioStatusText: {
    fontSize: 12,
    color: '#666',
  },
  deviceSelectionContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  deviceSelector: {
    marginBottom: 8,
  },
  deviceLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
    color: '#333',
  },
  deviceOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  deviceOption: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  deviceOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  deviceOptionText: {
    fontSize: 11,
    color: '#666',
  },
  deviceOptionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  voiceButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#007AFF',
    borderRadius: 50,
    marginRight: 12,
  },
  voiceButtonActive: {
    backgroundColor: '#0051cc',
  },
  voiceButtonRecording: {
    backgroundColor: '#d32f2f',
  },
  voiceButtonText: {
    fontSize: 24,
    marginBottom: 4,
  },
  voiceButtonLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  endButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#f44336',
    borderRadius: 8,
  },
  endButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  ratingPromptContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingPromptContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
  },
  ratingPromptTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ratingStar: {
    marginHorizontal: 8,
  },
  ratingStarText: {
    fontSize: 32,
    opacity: 0.3,
  },
  ratingStarFilled: {
    opacity: 1,
  },
  ratingButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  ratingButtonCancel: {
    backgroundColor: '#e0e0e0',
  },
  ratingButtonSubmit: {
    backgroundColor: '#4caf50',
  },
  ratingButtonText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#333',
  },
});

export default ConversationView;
