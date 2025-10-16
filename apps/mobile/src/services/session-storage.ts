/**
 * Session Storage Service
 * Manages local storage persistence of conversation sessions
 * Enables recovery of in-progress conversations on app restart
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ConversationData, ConversationState } from '../components/conversation/ConversationFlowController';

const SESSION_KEY = 'numeroly_conversation_session';
const SESSION_HISTORY_KEY = 'numeroly_session_history';

/**
 * Save current conversation session to local storage
 */
export async function saveConversationSession(state: ConversationState): Promise<void> {
  try {
    const sessionData = {
      timestamp: new Date().toISOString(),
      currentStep: state.currentStep,
      data: state.data,
      error: state.error,
    };

    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
  } catch (error) {
    console.error('Failed to save conversation session:', error);
    throw new Error('Không thể lưu phiên làm việc. Vui lòng thử lại.');
  }
}

/**
 * Restore conversation session from local storage
 */
export async function restoreConversationSession(): Promise<ConversationState | null> {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    const session = JSON.parse(sessionData);
    
    // Check if session is too old (> 24 hours)
    const sessionTime = new Date(session.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      await clearConversationSession();
      return null;
    }

    return {
      currentStep: session.currentStep,
      data: {
        ...session.data,
        timestamp: new Date(session.data.timestamp),
      },
      isProcessing: false,
      error: null,
      lastPrompt: null,
    };
  } catch (error) {
    console.error('Failed to restore conversation session:', error);
    return null;
  }
}

/**
 * Clear current session from storage
 */
export async function clearConversationSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear conversation session:', error);
  }
}

/**
 * Save completed conversation to history
 */
export async function saveConversationToHistory(data: ConversationData): Promise<void> {
  try {
    const history = await getConversationHistory();
    
    const entry = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      fullName: data.fullName,
      birthDate: data.birthDate,
      userConcern: data.userConcern,
      lifePathNumber: data.numerologyProfile?.lifePathNumber,
      feedback: data.userFeedback,
    };

    history.push(entry);
    
    // Keep only last 50 conversations
    const limitedHistory = history.slice(-50);
    
    await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (error) {
    console.error('Failed to save to history:', error);
  }
}

/**
 * Get conversation history
 */
export async function getConversationHistory(): Promise<any[]> {
  try {
    const history = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
    return history ? JSON.parse(history) : [];
  } catch (error) {
    console.error('Failed to get conversation history:', error);
    return [];
  }
}

/**
 * Clear all session and history data
 */
export async function clearAllSessionData(): Promise<void> {
  try {
    await Promise.all([
      AsyncStorage.removeItem(SESSION_KEY),
      AsyncStorage.removeItem(SESSION_HISTORY_KEY),
    ]);
  } catch (error) {
    console.error('Failed to clear all session data:', error);
  }
}

/**
 * Get session recovery status
 */
export async function getSessionRecoveryOptions(): Promise<{
  hasSession: boolean;
  userName?: string;
  lastStep?: string;
  timestamp?: string;
}> {
  try {
    const sessionData = await AsyncStorage.getItem(SESSION_KEY);
    if (!sessionData) {
      return { hasSession: false };
    }

    const session = JSON.parse(sessionData);
    const sessionTime = new Date(session.timestamp);
    const now = new Date();
    const hoursDiff = (now.getTime() - sessionTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      await clearConversationSession();
      return { hasSession: false };
    }

    return {
      hasSession: true,
      userName: session.data.fullName,
      lastStep: session.currentStep,
      timestamp: session.timestamp,
    };
  } catch (error) {
    console.error('Failed to get session recovery options:', error);
    return { hasSession: false };
  }
}
