import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useAppMessage } from '@daily-co/daily-react';
import { useUserStore } from '../stores/userStore';
import { useConversationStore } from '../store/conversationStore';
import { fetchNumerologyProfile } from '../services/numerology';
import { speakText } from '../services/voice-orchestration';
import { generatePersonalInsight } from '../services/insight-generator';
import { saveConversation } from '../services/conversation-api';
import { ConversationProgress } from '../components/conversation/ConversationProgress';
import { WaveformVisualizer } from '../components/conversation/WaveformVisualizer';
import { MicrophoneSelector } from '../components/voice/MicrophoneSelector';
import { useVoiceInputService } from '../services/voiceInputService';
import {
  ConversationFlowController,
  ConversationStep,
  type ConversationState,
} from '../components/conversation/ConversationFlowController';

interface OnboardingConversationScreenProps {
  onConversationComplete?: (data: any) => void;
}

/**
 * OnboardingConversationScreen
 * Main screen component for the voice-based numerology onboarding conversation.
 * Orchestrates the complete flow: greeting → name → date → concern → calculation → insight → feedback.
 */
export const OnboardingConversationScreen: React.FC<OnboardingConversationScreenProps> = ({
  onConversationComplete,
}) => {
  const [conversationState, setConversationState] = useState<ConversationState | null>(null);
  const [displayText, setDisplayText] = useState('Chào mừng đến với Numeroly...');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [meterValue, setMeterValue] = useState(-160);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [isWaitingForTranscription, setIsWaitingForTranscription] = useState(false);

  const flowControllerRef = useRef<ConversationFlowController>(new ConversationFlowController());
  const { setNumerologyProfile, setLoadingProfile, setProfileError, user } = useUserStore();
  const { startConversation: createDailyRoom, activeConversationId } = useConversationStore();

  // Initialize Daily.co voice input service
  const voiceInput = useVoiceInputService({
    autoSelectFirst: true,
    onRecordingStart: () => {
      console.log('[Daily.co] Microphone recording started');
      setMeterValue(0);
    },
    onRecordingStop: () => {
      console.log('[Daily.co] Microphone recording stopped');
      setMeterValue(-160);
    },
    onError: (error) => {
      console.error('[Daily.co] Voice input error:', error);
      handleError('Lỗi khi ghi âm. Vui lòng thử lại.');
    },
  });

  // Listen for transcription updates from backend via Daily.co app messages
  useAppMessage({
    onAppMessage: useCallback((event) => {
      const data = event.data;
      console.log('[Daily.co] App message received:', data);

      if (data?.type === 'transcription_update') {
        console.log('[Daily.co] Transcription update:', data.text);
        setCurrentTranscript(data.text);
        setIsWaitingForTranscription(false);
      }
    }, []),
  });

  // Note: Auth token should come from authentication service
  // For now, we'll use a placeholder that should be replaced with actual auth
  const getAuthToken = () => {
    // TODO: Get from auth store/service
    return 'placeholder-token';
  };

  /**
   * Record voice using Daily.co WebRTC streaming and wait for transcription
   * Replaces the old recordAndTranscribe() REST API approach
   */
  const recordAndTranscribeViaDaily = useCallback(async (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('[Daily.co] Starting voice recording...');
        setCurrentTranscript('');
        setIsWaitingForTranscription(true);

        // Start recording via Daily.co
        await voiceInput.startRecording();

        // Wait for user to finish speaking (simulate user finishing after 5 seconds)
        // In production, this should be triggered by VAD or user action
        await new Promise((resolve) => setTimeout(resolve, 5000));

        console.log('[Daily.co] Stopping voice recording...');
        await voiceInput.stopRecording();

        // Wait for transcription to arrive via useAppMessage hook
        // Poll currentTranscript for up to 10 seconds
        const maxWaitTime = 10000;
        const pollInterval = 100;
        let elapsed = 0;

        while (elapsed < maxWaitTime) {
          if (currentTranscript && currentTranscript.trim().length > 0) {
            console.log('[Daily.co] Transcription received:', currentTranscript);
            setIsWaitingForTranscription(false);
            resolve(currentTranscript);
            return;
          }

          await new Promise((resolve) => setTimeout(resolve, pollInterval));
          elapsed += pollInterval;
        }

        // Timeout - no transcription received
        throw new Error('Không nhận được phiên âm từ máy chủ');
      } catch (error) {
        console.error('[Daily.co] Recording error:', error);
        setIsWaitingForTranscription(false);
        reject(error);
      }
    });
  }, [voiceInput, currentTranscript]);

  // Initialize conversation on mount - create Daily.co room
  useEffect(() => {
    const initializeConversation = async () => {
      try {
        console.log('[Daily.co] Creating Daily.co room for conversation...');
        await createDailyRoom();
        console.log('[Daily.co] Daily.co room created successfully');

        const flowController = flowControllerRef.current;
        flowController.start();
        setConversationState(flowController.getState());
        executeCurrentStep();
      } catch (error) {
        console.error('[Daily.co] Failed to create Daily.co room:', error);
        handleError('Không thể kết nối. Vui lòng thử lại.');
      }
    };

    initializeConversation();

    return () => {
      flowControllerRef.current.destroy();
    };
  }, []);

  /**
   * Execute the current step's action
   */
  const executeCurrentStep = async () => {
    const controller = flowControllerRef.current;
    const state = controller.getState();

    switch (state.currentStep) {
      case ConversationStep.GREETING:
        await handleGreeting();
        break;
      case ConversationStep.NAME_INPUT:
        await handleNameInput();
        break;
      case ConversationStep.NAME_CONFIRMATION:
        await handleNameConfirmation();
        break;
      case ConversationStep.DATE_INPUT:
        await handleDateInput();
        break;
      case ConversationStep.DATE_CONFIRMATION:
        await handleDateConfirmation();
        break;
      case ConversationStep.CONCERN_INPUT:
        await handleConcernInput();
        break;
      case ConversationStep.CALCULATION:
        await handleCalculation();
        break;
      case ConversationStep.INSIGHT_DELIVERY:
        await handleInsightDelivery();
        break;
      case ConversationStep.FEEDBACK_COLLECTION:
        await handleFeedbackCollection();
        break;
      case ConversationStep.SAVING:
        await handleSaving();
        break;
      case ConversationStep.COMPLETE:
        await handleComplete();
        break;
    }
  };

  /**
   * Handle greeting step
   */
  const handleGreeting = async () => {
    const greeting = 'Chào mừng đến với Numeroly. Tôi sẽ giúp bạn khám phá những con số của bạn. Tên của bạn là gì?';
    setDisplayText(greeting);
    
    try {
      await speakText(greeting);
      // Move to name input step after greeting
      // Note: Actual name input will be handled when user speaks
      // For now, just transition the state to show we're ready for input
      // executeCurrentStep will be called again when voice input is received
    } catch (error) {
      handleError('Lỗi khi phát âm thanh.');
    }
  };

  /**
   * Handle name input step
   */
  const handleNameInput = async () => {
    setDisplayText('Vui lòng nói tên của bạn...');
    setIsProcessing(true);

    try {
      const transcript = await recordAndTranscribeViaDaily();
      const result = flowControllerRef.current.processNameInput(transcript);

      if (!result.valid) {
        const { canRetry, message } = flowControllerRef.current.handleError(result.error!);
        setDisplayText(message);
        await speakText(message);

        if (canRetry) {
          setTimeout(executeCurrentStep, 2000);
        } else {
          handleError(message);
        }
      } else {
        setConversationState(flowControllerRef.current.getState());
        await executeCurrentStep();
      }
    } catch (error) {
      handleError('Không thể ghi âm. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle name confirmation step
   */
  const handleNameConfirmation = async () => {
    const data = flowControllerRef.current.getCollectedData();
    const confirmation = `Cảm ơn ${data.fullName}. Ngày sinh của bạn là gì? Vui lòng nói theo định dạng ngày tháng năm.`;
    
    setDisplayText(confirmation);
    await speakText(confirmation);
    
    // Auto-advance to date input
    flowControllerRef.current.processDateInput('');
    setConversationState(flowControllerRef.current.getState());
    await executeCurrentStep();
  };

  /**
   * Handle date input step
   */
  const handleDateInput = async () => {
    setDisplayText('Vui lòng nói ngày sinh của bạn...');
    setIsProcessing(true);

    try {
      const transcript = await recordAndTranscribeViaDaily();
      const result = flowControllerRef.current.processDateInput(transcript);

      if (!result.valid) {
        const { canRetry, message } = flowControllerRef.current.handleError(result.error!);
        setDisplayText(message);
        await speakText(message);

        if (canRetry) {
          setTimeout(executeCurrentStep, 2000);
        } else {
          handleError(message);
        }
      } else {
        setConversationState(flowControllerRef.current.getState());
        await executeCurrentStep();
      }
    } catch (error) {
      handleError('Không thể ghi âm. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle date confirmation step
   */
  const handleDateConfirmation = async () => {
    const data = flowControllerRef.current.getCollectedData();
    const dateStr = data.birthDate;
    const confirmation = `Bạn sinh ngày ${dateStr}, đúng không? Hiện tại bạn muốn biết điều gì về bản thân?`;
    
    setDisplayText(confirmation);
    await speakText(confirmation);
    
    // Auto-advance to concern input
    flowControllerRef.current.processConcernInput('');
    setConversationState(flowControllerRef.current.getState());
    await executeCurrentStep();
  };

  /**
   * Handle concern input step
   */
  const handleConcernInput = async () => {
    setDisplayText('Vui lòng nói điều bạn muốn biết...');
    setIsProcessing(true);

    try {
      const transcript = await recordAndTranscribeViaDaily();
      const result = flowControllerRef.current.processConcernInput(transcript);

      if (!result.valid) {
        setDisplayText('Vui lòng nói rõ hơn...');
        setTimeout(executeCurrentStep, 1000);
      } else {
        setConversationState(flowControllerRef.current.getState());
        await executeCurrentStep();
      }
    } catch (error) {
      handleError('Không thể ghi âm. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle numerology calculation step
   */
  const handleCalculation = async () => {
    setDisplayText('Đang tính toán...');
    setIsProcessing(true);
    setLoadingProfile(true);

    const data = flowControllerRef.current.getCollectedData();

    try {
      const profile = await fetchNumerologyProfile(data.fullName!, data.birthDate!);
      flowControllerRef.current.setNumerologyProfile(profile);
      setNumerologyProfile(profile);
      setConversationState(flowControllerRef.current.getState());
      await executeCurrentStep();
    } catch (error) {
      const errorMsg = 'Không thể tính toán số học. Vui lòng thử lại.';
      setProfileError(errorMsg);
      handleError(errorMsg);
    } finally {
      setLoadingProfile(false);
      setIsProcessing(false);
    }
  };

  /**
   * Handle insight delivery step
   */
  const handleInsightDelivery = async () => {
    const data = flowControllerRef.current.getCollectedData();
    const profile = data.numerologyProfile!;

    // Generate personalized insight using the service
    const insight = generatePersonalInsight(
      profile,
      data.userConcern,
      data.fullName || 'Bạn'
    );

    flowControllerRef.current.setGeneratedInsight(insight);
    setDisplayText(insight);
    
    try {
      await speakText(insight);
      setConversationState(flowControllerRef.current.getState());
      await executeCurrentStep();
    } catch (error) {
      handleError('Lỗi khi phát âm thanh.');
    }
  };

  /**
   * Handle feedback collection step
   */
  const handleFeedbackCollection = async () => {
    const feedbackPrompt = 'Bạn có thấy điều này hữu ích không?';
    setDisplayText(feedbackPrompt);
    setIsProcessing(true);

    try {
      await speakText(feedbackPrompt);
      const transcript = await recordAndTranscribeViaDaily();
      const result = flowControllerRef.current.processFeedback(transcript);

      if (!result.valid) {
        setDisplayText('Vui lòng trả lời có hoặc không.');
        await speakText('Vui lòng trả lời có hoặc không.');
        setTimeout(executeCurrentStep, 1000);
      } else {
        setConversationState(flowControllerRef.current.getState());
        await executeCurrentStep();
      }
    } catch (error) {
      handleError('Không thể ghi âm. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle saving step
   */
  const handleSaving = async () => {
    setDisplayText('Đang lưu cuộc trò chuyện...');
    setIsProcessing(true);

    try {
      const data = flowControllerRef.current.getCollectedData();
      const profile = data.numerologyProfile!;

      // Only save if user is authenticated and has valid data
      if (user?.id && data.fullName && data.birthDate && profile) {
        await saveConversation(data, getAuthToken());
      }

      // Also save to local storage for offline access
      const { saveConversationToHistory } = await import('../services/session-storage');
      await saveConversationToHistory(data);
      
      flowControllerRef.current.markSaved();
      setConversationState(flowControllerRef.current.getState());
      await executeCurrentStep();
    } catch (error) {
      console.error('Error saving conversation:', error);
      // Don't fail the flow even if save fails - user has already got their insight
      flowControllerRef.current.markSaved();
      setConversationState(flowControllerRef.current.getState());
      await executeCurrentStep();
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle completion step
   */
  const handleComplete = async () => {
    const goodbye = 'Cảm ơn bạn. Hẹn gặp lại!';
    setDisplayText(goodbye);
    await speakText(goodbye);

    if (onConversationComplete) {
      onConversationComplete(flowControllerRef.current.getCollectedData());
    }
  };

  /**
   * Handle errors
   */
  const handleError = (error: string) => {
    setErrorMessage(error);
    setDisplayText(error);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Numeroly</Text>

      {conversationState && (
        <ConversationProgress currentStep={conversationState.currentStep} />
      )}

      {/* Microphone Selection - Allow user to select device before recording */}
      <MicrophoneSelector
        availableMics={voiceInput.availableMics}
        selectedMicId={voiceInput.selectedMicId}
        onMicrophoneChange={voiceInput.changeMicrophone}
        isLoading={voiceInput.isLoading}
      />

      <View style={styles.displayBox}>
        <Text style={styles.displayText}>{displayText}</Text>
      </View>

      {(voiceInput.isRecording || isWaitingForTranscription) && (
        <WaveformVisualizer isActive={voiceInput.isRecording} meterValue={meterValue} />
      )}

      {isProcessing && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD700" />
          <Text style={styles.processingText}>Đang xử lý...</Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      <View style={styles.paddingBottom} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  displayBox: {
    backgroundColor: '#16213e',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    minHeight: 120,
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  displayText: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  processingText: {
    color: '#FFD700',
    marginTop: 10,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(139, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 14,
  },
  paddingBottom: {
    height: 40,
  },
});
