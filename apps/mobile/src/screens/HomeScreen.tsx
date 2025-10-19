import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { VoiceButton } from '../components/voice/VoiceButton';
import { ConversationTranscript } from '../components/conversation/ConversationTranscript';
import { WaveformVisualizer } from '../components/voice/WaveformVisualizer';
import { useConversationStore } from '../store/conversationStore';
import { useAuthStore } from '../store/authStore';
import { Colors, Spacing, FontSizes } from '../utils/colors';
import { VIETNAMESE_GREETINGS } from '../utils/constants';
import { VoiceButtonState } from '../types';
import { recordAndTranscribe, stopRecording } from '../services/voice-orchestration';

export const HomeScreen: React.FC = () => {
  const [voiceState, setVoiceState] = useState<VoiceButtonState>('idle');
  const [audioLevel, setAudioLevel] = useState<number>(-160);
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

  const handleVoicePress = useCallback(async () => {
    if (voiceState === 'listening') {
      try {
        setVoiceState('processing');
        await stopRecording();
      } catch (error) {
        console.error('Stop recording failed', error);
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
      setAudioLevel(-160);

      const conversationId =
        activeConversationId ?? (await startConversation());

      const transcript = await recordAndTranscribe({
        conversationId,
        onMeter: (meter) => setAudioLevel(meter),
      });

      setVoiceState('processing');
      setProcessing(true);

      if (transcript.trim().length > 0) {
        addMessage({
          id: `user-${Date.now()}`,
          text: transcript.trim(),
          type: 'user',
          timestamp: new Date(),
        });
        setTranscription(transcript.trim());
      }

      setVoiceState('idle');
    } catch (error) {
      console.error('Voice capture error', error);
      setVoiceState('error');
      setTimeout(() => setVoiceState('idle'), 2000);
    } finally {
      setRecording(false);
      setProcessing(false);
      setAudioLevel(-160);
    }
  }, [
    voiceState,
    activeConversationId,
    startConversation,
    addMessage,
    setRecording,
    setProcessing,
    setTranscription,
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
        {voiceState === 'listening' && (
          <WaveformVisualizer
            isActive={voiceState === 'listening'}
            audioLevel={audioLevel}
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
    padding: Spacing.xxl,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
});
