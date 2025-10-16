/**
 * Conversation API Client
 * Handles all backend communication for conversation management
 */

import type { ConversationData } from '../components/conversation/ConversationFlowController';
import type { NumerologyProfile } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

interface ConversationPayload {
  user_name: string;
  birth_date: string;
  user_question?: string;
  numbers_calculated: {
    lifePathNumber: number;
    destinyNumber: number;
    soulUrgeNumber: number;
    personalityNumber: number;
    currentPersonalYear: number;
    currentPersonalMonth: number;
  };
  insight_provided: string;
  satisfaction_feedback?: string;
}

/**
 * Save a completed conversation to backend
 */
export async function saveConversation(
  data: ConversationData,
  authToken: string,
): Promise<{ id: string; created_at: string }> {
  if (!data.fullName || !data.birthDate || !data.numerologyProfile || !data.generatedInsight) {
    throw new Error('Dữ liệu cuộc trò chuyện không đầy đủ.');
  }

  const payload: ConversationPayload = {
    user_name: data.fullName,
    birth_date: data.birthDate,
    user_question: data.userConcern || undefined,
    numbers_calculated: {
      lifePathNumber: data.numerologyProfile.lifePathNumber,
      destinyNumber: data.numerologyProfile.destinyNumber,
      soulUrgeNumber: data.numerologyProfile.soulUrgeNumber,
      personalityNumber: data.numerologyProfile.personalityNumber,
      currentPersonalYear: data.numerologyProfile.currentPersonalYear,
      currentPersonalMonth: data.numerologyProfile.currentPersonalMonth,
    },
    insight_provided: data.generatedInsight,
    satisfaction_feedback: data.userFeedback || undefined,
  };

  try {
    const response = await fetch(`${API_BASE_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Lỗi khi lưu cuộc trò chuyện.');
    }

    const result = await response.json();
    return {
      id: result.id,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Failed to save conversation:', error);
    throw new Error('Không thể lưu cuộc trò chuyện. Vui lòng kiểm tra kết nối mạng.');
  }
}

/**
 * Retrieve a specific conversation
 */
export async function getConversation(
  conversationId: string,
  authToken: string,
): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Cuộc trò chuyện không được tìm thấy.');
      }
      throw new Error('Lỗi khi lấy cuộc trò chuyện.');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get conversation:', error);
    throw new Error('Không thể lấy cuộc trò chuyện. Vui lòng thử lại.');
  }
}

/**
 * List user's conversations with pagination
 */
export async function listConversations(
  authToken: string,
  skip: number = 0,
  limit: number = 10,
): Promise<{
  total: number;
  conversations: any[];
}> {
  try {
    const params = new URLSearchParams({
      skip: skip.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(`${API_BASE_URL}/conversations?${params}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Lỗi khi lấy danh sách cuộc trò chuyện.');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to list conversations:', error);
    throw new Error('Không thể lấy danh sách cuộc trò chuyện. Vui lòng thử lại.');
  }
}

/**
 * Get most recent conversation
 */
export async function getRecentConversation(authToken: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE_URL}/conversations/user/recent`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // No conversations yet
      }
      throw new Error('Lỗi khi lấy cuộc trò chuyện gần đây.');
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get recent conversation:', error);
    throw new Error('Không thể lấy cuộc trò chuyện gần đây. Vui lòng thử lại.');
  }
}
