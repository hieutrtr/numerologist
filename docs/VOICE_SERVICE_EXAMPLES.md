# Voice Service Implementation Examples

Complete, production-ready implementations for Daily.co voice streaming in Numeroly.

## 1. Backend: Conversation Service with Daily.co

File: `apps/api/src/services/conversation_service.py`

```python
import asyncio
import logging
from typing import Optional
from datetime import datetime, timedelta

from daily_client import DailyClient, DailyApiError
from redis.asyncio import Redis
import httpx

from models import Conversation, ConversationMessage, User
from repositories import ConversationRepository, UserRepository

logger = logging.getLogger(__name__)


class ConversationService:
    """Orchestrates conversations using Daily.co for voice streaming"""

    def __init__(
        self,
        daily_client: DailyClient,
        redis_client: Redis,
        conv_repo: ConversationRepository,
        user_repo: UserRepository,
    ):
        self.daily_client = daily_client
        self.redis = redis_client
        self.conv_repo = conv_repo
        self.user_repo = user_repo

    async def create_conversation_with_daily(
        self,
        user_id: str,
    ) -> dict:
        """
        Create conversation and Daily.co room

        Returns:
            {
                'id': conversation_id,
                'room_url': Daily.co room URL,
                'token': Meeting token,
                'expires_at': Token expiry timestamp
            }
        """
        try:
            # Get user
            user = await self.user_repo.find_by_id(user_id)
            if not user:
                raise ValueError(f"User {user_id} not found")

            # Create Daily room
            room_config = {
                "properties": {
                    "enable_chat": False,
                    "enable_screenshare": False,
                    "max_participants": 2,  # User + Bot
                    "sfu_ui": False,  # Custom UI only
                    "lang": "vi",  # Vietnamese
                    "record_on_start": True,  # Auto-record
                }
            }

            room = self.daily_client.create_room(config=room_config)
            logger.info(f"Created Daily room: {room['name']}")

            # Generate meeting token (1-hour expiry)
            token = self.daily_client.create_meeting_token(
                room_url=room["url"],
                user_name=user.full_name,
                user_id=user_id,
                is_owner=False,
                expires_in_seconds=3600,
            )

            # Create database record
            conversation = await self.conv_repo.create(
                user_id=user_id,
                room_url=room["url"],
                room_id=room["id"],
                session_id=self._generate_session_id(),
            )

            # Store conversation context in Redis
            await self.redis.hset(
                f"conversation:{conversation.id}",
                mapping={
                    "user_id": user_id,
                    "room_id": room["id"],
                    "created_at": datetime.now().isoformat(),
                    "status": "active",
                    "message_count": "0",
                },
            )
            await self.redis.expire(
                f"conversation:{conversation.id}", 86400
            )  # 24-hour TTL

            expires_at = datetime.now() + timedelta(hours=1)

            return {
                "id": str(conversation.id),
                "room_url": room["url"],
                "token": token,
                "expires_at": expires_at.isoformat(),
            }

        except DailyApiError as e:
            logger.error(f"Daily.co API error: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to create conversation: {e}")
            raise

    async def get_daily_token(
        self,
        conversation_id: str,
        user_id: str,
    ) -> dict:
        """Get fresh Daily.co token for existing conversation"""

        conversation = await self.conv_repo.get(conversation_id)

        if not conversation or conversation.user_id != user_id:
            raise ValueError("Conversation not found or unauthorized")

        user = await self.user_repo.find_by_id(user_id)

        # Generate new token
        token = self.daily_client.create_meeting_token(
            room_url=conversation.room_url,
            user_name=user.full_name,
            user_id=user_id,
            is_owner=False,
            expires_in_seconds=3600,
        )

        expires_at = datetime.now() + timedelta(hours=1)

        return {
            "token": token,
            "room_url": conversation.room_url,
            "expires_at": expires_at.isoformat(),
        }

    async def save_user_message(
        self,
        conversation_id: str,
        text: str,
        confidence: float,
    ) -> dict:
        """Save transcribed user message to database"""

        conversation = await self.conv_repo.get(conversation_id)

        message = await self.conv_repo.add_message(
            conversation_id=conversation_id,
            role="user",
            message_type="voice",
            text_content=text,
            metadata={
                "stt_confidence": confidence,
                "source": "daily_co",
            },
        )

        # Update message count in Redis
        await self.redis.hincrby(
            f"conversation:{conversation_id}", "message_count", 1
        )

        return {
            "id": str(message.id),
            "timestamp": message.timestamp.isoformat(),
        }

    async def save_assistant_message(
        self,
        conversation_id: str,
        text: str,
        emotional_tone: str,
    ) -> dict:
        """Save assistant-generated message to database"""

        message = await self.conv_repo.add_message(
            conversation_id=conversation_id,
            role="assistant",
            message_type="voice",
            text_content=text,
            emotional_tone=emotional_tone,
            metadata={
                "source": "gpt4o",
                "generated_at": datetime.now().isoformat(),
            },
        )

        # Update message count in Redis
        await self.redis.hincrby(
            f"conversation:{conversation_id}", "message_count", 1
        )

        return {
            "id": str(message.id),
            "timestamp": message.timestamp.isoformat(),
        }

    async def end_conversation(
        self,
        conversation_id: str,
        user_id: str,
        rating: Optional[int] = None,
    ) -> dict:
        """End conversation and retrieve recording"""

        conversation = await self.conv_repo.get(conversation_id)

        if not conversation or conversation.user_id != user_id:
            raise ValueError("Conversation not found or unauthorized")

        # Get recording info from Daily.co
        try:
            room_info = self.daily_client.get_room(conversation.room_url)
            recording_url = room_info.get("recording_url")
        except DailyApiError:
            recording_url = None
            logger.warning(f"Could not retrieve recording for {conversation_id}")

        # Update conversation in database
        updated = await self.conv_repo.update(
            conversation_id,
            {
                "status": "completed",
                "ended_at": datetime.now(),
                "satisfaction_rating": rating,
                "recording_url": recording_url,
            },
        )

        # Clean up Redis
        await self.redis.delete(f"conversation:{conversation_id}")

        return {
            "id": str(conversation.id),
            "status": updated.status,
            "recording_url": recording_url,
            "rating": rating,
        }

    async def get_conversation_history(
        self,
        conversation_id: str,
        user_id: str,
    ) -> dict:
        """Get conversation with all messages"""

        conversation = await self.conv_repo.get(conversation_id)

        if not conversation or conversation.user_id != user_id:
            raise ValueError("Conversation not found or unauthorized")

        messages = await self.conv_repo.get_messages(
            conversation_id,
            limit=100,
        )

        return {
            "id": str(conversation.id),
            "created_at": conversation.started_at.isoformat(),
            "ended_at": (
                conversation.ended_at.isoformat()
                if conversation.ended_at
                else None
            ),
            "status": conversation.status,
            "rating": conversation.satisfaction_rating,
            "recording_url": conversation.recording_url,
            "messages": [
                {
                    "id": str(m.id),
                    "role": m.role,
                    "text": m.text_content,
                    "timestamp": m.timestamp.isoformat(),
                    "emotional_tone": m.emotional_tone,
                }
                for m in messages
            ],
        }

    async def list_conversations(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0,
    ) -> dict:
        """List user's conversation history"""

        conversations = await self.conv_repo.list_by_user(
            user_id,
            limit=limit,
            offset=offset,
        )

        total = await self.conv_repo.count_by_user(user_id)

        return {
            "conversations": [
                {
                    "id": str(c.id),
                    "created_at": c.started_at.isoformat(),
                    "ended_at": (
                        c.ended_at.isoformat() if c.ended_at else None
                    ),
                    "status": c.status,
                    "rating": c.satisfaction_rating,
                    "duration_seconds": (
                        int((c.ended_at - c.started_at).total_seconds())
                        if c.ended_at
                        else None
                    ),
                }
                for c in conversations
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }

    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        import uuid

        return str(uuid.uuid4())
```

## 2. Frontend: Voice Input Service

File: `apps/mobile/src/services/voiceInputService.ts`

```typescript
import { useDaily, useDevices, useDailyEvent } from '@daily-co/daily-react';
import { useCallback, useRef, useState } from 'react';

interface VoiceInputServiceOptions {
  onMicrophoneEnabled?: () => void;
  onMicrophoneDisabled?: () => void;
  onError?: (error: Error) => void;
}

export const useVoiceInputService = (options: VoiceInputServiceOptions = {}) => {
  const callObject = useDaily();
  const { enableMic, disableMic, mics, selectMic } = useDevices();

  const [isRecording, setIsRecording] = useState(false);
  const [selectedMicId, setSelectedMicId] = useState<string | null>(null);
  const [availableMics, setAvailableMics] = useState<
    MediaDeviceInfo[] | undefined
  >(mics);

  // Update available mics when device list changes
  const handleDevicesUpdated = useCallback(async () => {
    setAvailableMics(mics);
  }, [mics]);

  // Listen for device changes
  useDailyEvent('devices-updated', handleDevicesUpdated);

  // Listen for errors
  useDailyEvent('error', (event) => {
    if (event.action === 'join-meeting' || event.action === 'receive-settings-updated') {
      const error = new Error(`Daily error: ${event.errorMsg}`);
      options.onError?.(error);
      setIsRecording(false);
    }
  });

  const startRecording = useCallback(async () => {
    try {
      if (isRecording) {
        console.warn('Already recording');
        return;
      }

      await enableMic();
      setIsRecording(true);
      options.onMicrophoneEnabled?.();

      console.log('Microphone enabled and recording started');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to start recording:', err);
      options.onError?.(err);
      setIsRecording(false);
    }
  }, [isRecording, enableMic, options]);

  const stopRecording = useCallback(async () => {
    try {
      if (!isRecording) {
        console.warn('Not recording');
        return;
      }

      await disableMic();
      setIsRecording(false);
      options.onMicrophoneDisabled?.();

      console.log('Microphone disabled and recording stopped');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('Failed to stop recording:', err);
      options.onError?.(err);
    }
  }, [isRecording, disableMic, options]);

  const changeMicrophone = useCallback(
    async (deviceId: string) => {
      try {
        selectMic(deviceId);
        setSelectedMicId(deviceId);
        console.log(`Microphone changed to: ${deviceId}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Failed to change microphone:', err);
        options.onError?.(err);
      }
    },
    [selectMic, options]
  );

  return {
    // State
    isRecording,
    selectedMicId,
    availableMics: availableMics || [],

    // Methods
    startRecording,
    stopRecording,
    changeMicrophone,
  };
};
```

## 3. Frontend: Voice Output Service

File: `apps/mobile/src/services/voiceOutputService.ts`

```typescript
import {
  useParticipants,
  useDevices,
  useDailyEvent,
} from '@daily-co/daily-react';
import { useCallback, useEffect, useState } from 'react';

interface VoiceOutputServiceOptions {
  onRemoteAudioAvailable?: () => void;
  onRemoteAudioUnavailable?: () => void;
  onError?: (error: Error) => void;
}

export const useVoiceOutputService = (
  options: VoiceOutputServiceOptions = {}
) => {
  const participants = useParticipants();
  const { selectSpeaker, speakers } = useDevices();

  const [remoteAudioAvailable, setRemoteAudioAvailable] = useState(false);
  const [remoteParticipantId, setRemoteParticipantId] = useState<string | null>(
    null
  );
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string | null>(null);
  const [availableSpeakers, setAvailableSpeakers] = useState<
    MediaDeviceInfo[] | undefined
  >(speakers);

  // Update available speakers when device list changes
  useEffect(() => {
    setAvailableSpeakers(speakers);
  }, [speakers]);

  // Monitor for remote participants (assistant/bot)
  useEffect(() => {
    const remoteParticipant = participants.find(
      (p) => p.user_id !== 'local' && p.user_id
    );

    if (remoteParticipant) {
      setRemoteParticipantId(remoteParticipant.session_id);

      const audioState = remoteParticipant.tracks?.audio?.state;
      const audioAvailable = audioState === 'playable';

      if (audioAvailable && !remoteAudioAvailable) {
        console.log('Remote audio now available');
        setRemoteAudioAvailable(true);
        options.onRemoteAudioAvailable?.();
      } else if (!audioAvailable && remoteAudioAvailable) {
        console.log('Remote audio no longer available');
        setRemoteAudioAvailable(false);
        options.onRemoteAudioUnavailable?.();
      }
    } else {
      if (remoteAudioAvailable) {
        setRemoteAudioAvailable(false);
        options.onRemoteAudioUnavailable?.();
      }
      setRemoteParticipantId(null);
    }
  }, [participants, remoteAudioAvailable, options]);

  // Listen for audio track state changes
  useDailyEvent('participant-updated', (event) => {
    const participant = event.participant;

    if (participant.user_id !== 'local') {
      const audioState = participant.tracks?.audio?.state;
      console.log(`Remote audio state: ${audioState}`);
    }
  });

  // Listen for errors
  useDailyEvent('error', (event) => {
    const error = new Error(`Daily error: ${event.errorMsg}`);
    options.onError?.(error);
  });

  const changeSpeaker = useCallback(
    async (deviceId: string) => {
      try {
        selectSpeaker(deviceId);
        setSelectedSpeakerId(deviceId);
        console.log(`Speaker changed to: ${deviceId}`);
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Failed to change speaker:', err);
        options.onError?.(err);
      }
    },
    [selectSpeaker, options]
  );

  return {
    // State
    remoteAudioAvailable,
    remoteParticipantId,
    selectedSpeakerId,
    availableSpeakers: availableSpeakers || [],

    // Methods
    changeSpeaker,
  };
};
```

## 4. Frontend: Conversation Component

File: `apps/mobile/src/components/conversation/ConversationView.tsx`

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useDaily, useAppMessage } from '@daily-co/daily-react';

import { useVoiceInputService } from '@/services/voiceInputService';
import { useVoiceOutputService } from '@/services/voiceOutputService';
import { conversationService } from '@/services/api/conversationService';
import { useConversationStore } from '@/stores/conversationStore';

interface ConversationViewProps {
  conversationId: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
}) => {
  // Daily.co integration
  const callObject = useDaily();

  // Voice services
  const voiceInput = useVoiceInputService({
    onMicrophoneEnabled: () => setStatus('listening'),
    onMicrophoneDisabled: () => setStatus('processing'),
    onError: (err) => console.error('Voice input error:', err),
  });

  const voiceOutput = useVoiceOutputService({
    onRemoteAudioAvailable: () => console.log('Assistant ready to speak'),
    onRemoteAudioUnavailable: () => console.log('Assistant audio stopped'),
    onError: (err) => console.error('Voice output error:', err),
  });

  // App messages for conversation orchestration
  const { sendAppMessage } = useAppMessage({
    onAppMessage: handleAppMessage,
  });

  // Local state
  const [status, setStatus] = useState<
    'idle' | 'listening' | 'processing' | 'responding'
  >('idle');
  const [transcription, setTranscription] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [messages, setMessages] = useState<
    Array<{
      id: string;
      role: 'user' | 'assistant';
      text: string;
      timestamp: string;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  // Handle incoming app messages
  function handleAppMessage(event: any) {
    const { type, data } = event;

    switch (type) {
      case 'transcription_update':
        setTranscription(data.text);
        break;

      case 'assistant_response':
        setAssistantResponse(data.text);
        setStatus('responding');
        setTimeout(() => setStatus('idle'), 2000);
        break;

      case 'processing_status':
        setStatus(
          data.status === 'complete' ? 'idle' : 'processing'
        );
        break;
    }
  }

  // Handle voice button press (hold to speak)
  const handleVoiceButtonStart = useCallback(async () => {
    try {
      setIsLoading(true);
      await voiceInput.startRecording();

      // Notify backend that user started speaking
      sendAppMessage(
        {
          type: 'user_input_started',
          data: { conversationId },
        },
        'all'
      );

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to start voice input:', error);
      setIsLoading(false);
    }
  }, [voiceInput, conversationId, sendAppMessage]);

  const handleVoiceButtonEnd = useCallback(async () => {
    try {
      setIsLoading(true);
      await voiceInput.stopRecording();

      // Notify backend that user stopped speaking (trigger processing)
      sendAppMessage(
        {
          type: 'user_input_ended',
          data: { conversationId },
        },
        'all'
      );

      setIsLoading(false);
    } catch (error) {
      console.error('Failed to stop voice input:', error);
      setIsLoading(false);
    }
  }, [voiceInput, conversationId, sendAppMessage]);

  const handleEndConversation = useCallback(async () => {
    try {
      setIsLoading(true);

      // Leave Daily.co room
      await callObject?.leave();

      // End conversation in backend
      await conversationService.endConversation(conversationId);

      setIsLoading(false);
      // Navigate back
    } catch (error) {
      console.error('Failed to end conversation:', error);
      setIsLoading(false);
    }
  }, [callObject, conversationId]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Trò chuyện với số học</Text>
        <Text style={styles.status}>{getStatusLabel(status)}</Text>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.role === 'user'
                ? styles.userMessage
                : styles.assistantMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
            <Text style={styles.messageTime}>{item.timestamp}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
      />

      {/* Current Transcription */}
      {transcription && (
        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionLabel}>Bạn nói:</Text>
          <Text style={styles.transcriptionText}>{transcription}</Text>
        </View>
      )}

      {/* Current Response */}
      {assistantResponse && (
        <View style={styles.responseBox}>
          <Text style={styles.responseLabel}>Trợ lý:</Text>
          <Text style={styles.responseText}>{assistantResponse}</Text>
          {voiceOutput.remoteAudioAvailable && (
            <Text style={styles.playingIndicator}>🔊 Đang phát...</Text>
          )}
        </View>
      )}

      {/* Voice Button & Controls */}
      <View style={styles.controls}>
        <Pressable
          onPressIn={handleVoiceButtonStart}
          onPressOut={handleVoiceButtonEnd}
          disabled={isLoading}
          style={[
            styles.voiceButton,
            voiceInput.isRecording && styles.recordingButton,
            isLoading && styles.disabledButton,
          ]}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.voiceButtonText}>
                {voiceInput.isRecording ? '🎙️' : '🎤'}
              </Text>
              <Text style={styles.voiceButtonLabel}>
                {voiceInput.isRecording
                  ? 'Thả để dừng'
                  : 'Giữ để nói'}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={handleEndConversation}
          style={styles.endButton}
          disabled={isLoading}
        >
          <Text style={styles.endButtonText}>Kết thúc</Text>
        </Pressable>
      </View>
    </View>
  );
};

function getStatusLabel(
  status: 'idle' | 'listening' | 'processing' | 'responding'
): string {
  switch (status) {
    case 'listening':
      return '🎙️ Đang nghe...';
    case 'processing':
      return '⏳ Đang xử lý...';
    case 'responding':
      return '🗣️ Trợ lý đang nói...';
    default:
      return '✅ Sẵn sàng';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#8B7A6B',
    paddingTop: 48,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  status: {
    fontSize: 12,
    color: '#ddd',
    marginTop: 4,
  },
  messagesList: {
    padding: 12,
  },
  messageBubble: {
    marginVertical: 8,
    padding: 12,
    borderRadius: 12,
  },
  userMessage: {
    backgroundColor: '#E1BEE7',
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  assistantMessage: {
    backgroundColor: '#B2DFDB',
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 14,
    color: '#333',
  },
  messageTime: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
  },
  transcriptionBox: {
    margin: 12,
    padding: 12,
    backgroundColor: 'white',
    borderLeftWidth: 3,
    borderLeftColor: '#FF9800',
    borderRadius: 4,
  },
  transcriptionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF9800',
  },
  transcriptionText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  responseBox: {
    margin: 12,
    padding: 12,
    backgroundColor: 'white',
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    borderRadius: 4,
  },
  responseLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  playingIndicator: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'white',
    gap: 12,
  },
  voiceButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#8B7A6B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#FF5252',
  },
  disabledButton: {
    opacity: 0.5,
  },
  voiceButtonText: {
    fontSize: 32,
  },
  voiceButtonLabel: {
    fontSize: 10,
    color: 'white',
    marginTop: 4,
  },
  endButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  endButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
});
```

## Integration Checklist

- [ ] Daily API key configured in backend `.env`
- [ ] Backend endpoints created (create_conversation, get_token, end_conversation)
- [ ] Daily React provider wraps conversation component
- [ ] Voice input service implemented and tested
- [ ] Voice output service implemented and tested
- [ ] Conversation component integrated with Daily hooks
- [ ] App messages handling working bidirectionally
- [ ] Recording URL captured and stored
- [ ] Error handling for network failures
- [ ] Microphone permissions requested/handled
- [ ] Speaker selection UI implemented
- [ ] Test with actual devices (not just emulator)
