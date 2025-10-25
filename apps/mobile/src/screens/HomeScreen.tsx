import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppMessage, useDailyEvent } from '@daily-co/daily-react';
import { VoiceButton } from '../components/voice/VoiceButton';
import { MicrophoneSelector } from '../components/voice/MicrophoneSelector';
import { ConversationTranscript } from '../components/conversation/ConversationTranscript';
import { WaveformVisualizer } from '../components/voice/WaveformVisualizer';
import { useConversationStore } from '../store/conversationStore';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSizes } from '../utils/colors';
import { VIETNAMESE_GREETINGS } from '../utils/constants';
import { VoiceButtonState } from '../types';
import { useVoiceInputService } from '../services/voiceInputService';
import { useVoiceOutputService } from '../services/voiceOutputService';

export const HomeScreen: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceButtonState>('idle');
  const [roomJoined, setRoomJoined] = useState(false);
  const { user } = useAuthStore();
  const {
    activeConversationId,
    messages,
    isAiTyping,
    startConversation,
    addMessage,
    setRecording,
    setProcessing,
    setTranscription,
  } = useConversationStore();

  // Listen for room join event
  useDailyEvent(
    'joined-meeting',
    useCallback(() => {
      console.log('[HomeScreen] Successfully joined Daily.co room');
      setRoomJoined(true);
    }, [])
  );

  // Story 1.2c: Daily.co voice services
  const voiceInput = useVoiceInputService({
    autoSelectFirst: true,
    onRecordingStart: () => {
      console.log('[Daily.co] Microphone recording started');
    },
    onRecordingStop: () => {
      console.log('[Daily.co] Microphone recording stopped');
    },
    onError: (error) => {
      console.error('[Daily.co] Voice input error:', error);
      setVoiceState('error');
    },
  });

  const voiceOutput = useVoiceOutputService({
    autoSelectFirst: true,
    onRemoteAudioAvailable: () => {
      console.log('[Daily.co] Remote audio available - bot speaking');
    },
    onRemoteAudioInterrupted: () => {
      console.log('[Daily.co] Remote audio interrupted');
    },
    onRemoteAudioUnavailable: () => {
      console.log('[Daily.co] Remote audio unavailable');
    },
    onError: (error) => {
      console.error('[Daily.co] Voice output error:', error);
    },
  });

  // Listen for app messages from backend
  useAppMessage({
    onAppMessage: (event) => {
      const data = event.data;
      console.log('[Daily.co] App message received:', data);

      if (data?.type === 'transcription_update') {
        setTranscription(data.text);
      } else if (data?.type === 'processing_status') {
        setProcessing(data.status !== 'complete');
      } else if (data?.type === 'assistant_response') {
        addMessage({
          id: `assistant-${Date.now()}`,
          text: data.text,
          type: 'assistant',
          timestamp: new Date(),
        });
      }
    },
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.fullName || 'bạn';
    
    let greeting = VIETNAMESE_GREETINGS.evening;
    if (hour >= 5 && hour < 12) {
      greeting = VIETNAMESE_GREETINGS.morning;
    } else if (hour >= 12 && hour < 18) {
      greeting = VIETNAMESE_GREETINGS.afternoon;
    }
    
    return `${greeting}, ${name}!`;
  };

  const [preinitAttempted, setPreinitAttempted] = useState(false);

  // Ensure Daily session is primed so microphone list populates before recording
  useEffect(() => {
    if (preinitAttempted || activeConversationId) {
      return;
    }

    const ensureDailySession = async () => {
      try {
        if (!activeConversationId && voiceInput.availableMics.length === 0) {
          console.log('[Daily.co] Pre-initializing conversation for device enumeration');
          await startConversation();
        }
      } catch (error) {
        console.warn('[Daily.co] Failed to pre-initialize conversation:', error);
      } finally {
        setPreinitAttempted(true);
      }
    };

    ensureDailySession();
    // Only re-run when conversation id changes or mic list remains empty
  }, [activeConversationId, voiceInput.availableMics.length, startConversation, preinitAttempted]);

  const handleVoicePress = useCallback(async () => {
    // Story 1.2c: Daily.co voice streaming
    if (voiceState === 'listening') {
      // User released the button - stop recording
      try {
        setVoiceState('processing');
        await voiceInput.stopRecording();

        // Send user_input_ended message to backend via Daily.co app message
        console.log('[Daily.co] Sending user_input_ended to backend');
        setVoiceState('idle');
      } catch (error) {
        console.error('[Daily.co] Stop recording failed', error);
        setVoiceState('error');
        setTimeout(() => setVoiceState('idle'), 2000);
      }
      return;
    }

    if (voiceState !== 'idle') {
      return;
    }

    try {
      setVoiceState('listening');
      setRecording(true);
      setProcessing(false);
      setTranscription('');
      // Ensure conversation exists
      const conversationId =
        activeConversationId ?? (await startConversation());

      console.log('[Daily.co] Starting voice input for conversation:', conversationId);

      // Start recording via Daily.co
      await voiceInput.startRecording();

      // Send user_input_started message to backend
      console.log('[Daily.co] Audio streaming started via SFU');

      // Keep recording until user releases button
      // Audio automatically streams to backend via Daily.co SFU
      // Backend processes and sends responses via app messages
    } catch (error) {
      console.error('[Daily.co] Voice capture error', error);
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 2000);
    } finally {
      // Note: Don't reset these here - let them stay until complete
    }
  }, [
    voiceState,
    activeConversationId,
    startConversation,
    addMessage,
    setRecording,
    setProcessing,
    setTranscription,
    voiceInput,
  ]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()}</Text>
      </View>

      <View style={styles.content}>
        {messages.length === 0 ? (
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeTitle}>Chào mừng đến với Numeroly</Text>
            <Text style={styles.welcomeSubtitle}>
              Nhấn nút bên dưới để bắt đầu trò chuyện về thần số học
            </Text>
          </View>
        ) : (
          <ConversationTranscript
            messages={messages}
            isAiTyping={isAiTyping}
          />
        )}
      </View>

      <View style={styles.voiceContainer}>
        {/* Story 1.2c: Microphone selector - visible when idle or not recording */}
        {voiceState === 'idle' && (
          <MicrophoneSelector
            availableMics={voiceInput.availableMics}
            selectedMicId={voiceInput.selectedMicId}
            onMicrophoneChange={voiceInput.changeMicrophone}
            isLoading={voiceInput.isLoading}
          />
        )}

        {voiceState === 'listening' && (
          <WaveformVisualizer
            isActive={voiceState === 'listening'}
            audioLevel={voiceInput.audioLevel}
            height={80}
          />
        )}

        <VoiceButton
          size="large"
          state={voiceState}
          onPress={handleVoicePress}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundGrey,
  },
  header: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
  },
  greeting: {
    fontSize: FontSizes.xl,
    fontWeight: '600',
    color: Colors.black,
  },
  content: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  welcomeTitle: {
    fontSize: FontSizes.xxl,
    fontWeight: 'bold',
    color: Colors.primaryPurple,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  welcomeSubtitle: {
    fontSize: FontSizes.md,
    color: Colors.grey,
    textAlign: 'center',
  },
  voiceContainer: {
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
