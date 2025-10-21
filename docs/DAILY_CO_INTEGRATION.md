# Daily.co Integration Guide for Numeroly

## Overview

This guide covers the complete integration of Daily.co voice streaming using `daily-react` library for Numeroly's voice-first AI numerology bot.

**Latest Version:** `@daily-co/daily-react@latest` (Context7 verified)

## Installation

```bash
# Install Daily.co dependencies
npm install @daily-co/daily-react @daily-co/daily-js jotai

# Or with yarn
yarn add @daily-co/daily-react @daily-co/daily-js jotai
```

**Peer Dependencies:**
- `@daily-co/daily-js`: Core Daily.co WebRTC library
- `jotai`: State management (used internally by daily-react)

## Setup

### 1. Backend: Daily.co Room Configuration

#### Environment Variables
```bash
# .env or .env.local
DAILY_API_KEY=your_daily_api_key_here
DAILY_DOMAIN=numeroly.daily.co
```

Retrieve your API key from [Daily.co Dashboard](https://dashboard.daily.co/)

#### Backend API Endpoints

**Create Conversation with Daily Room:**
```python
# apps/api/src/routes/conversations.py
from fastapi import APIRouter, Depends
from daily_client import DailyClient
from typing import Optional

router = APIRouter(prefix="/conversations", tags=["conversations"])
daily_client = DailyClient(api_key=settings.DAILY_API_KEY)

@router.post("")
async def create_conversation(
    current_user: User = Depends(get_current_user)
) -> ConversationResponse:
    """Start new conversation with Daily.co room"""

    # Create Daily room
    room_config = {
        "properties": {
            "enable_chat": False,
            "enable_screenshare": False,
            "max_participants": 2,  # User + Bot
            "sfu_ui": False,
            "lang": "vi",
            "record_on_start": True  # Auto-record
        }
    }

    room = daily_client.create_room(config=room_config)

    # Generate meeting token
    token = daily_client.create_meeting_token(
        room_url=room["url"],
        user_name=current_user.full_name,
        user_id=str(current_user.id),
        is_owner=False,
        expires_in_seconds=3600
    )

    # Create conversation record
    conversation = await conversation_repo.create(
        user_id=current_user.id,
        room_url=room["url"],
        room_id=room["id"],
        session_id=generate_session_id()
    )

    return ConversationResponse(
        id=str(conversation.id),
        room_url=room["url"],
        token=token,
        expires_at=(datetime.now() + timedelta(hours=1)).isoformat()
    )
```

**Generate Daily Token for Existing Conversation:**
```python
@router.post("/token")
async def get_daily_token(
    conversation_id: str,
    current_user: User = Depends(get_current_user)
) -> TokenResponse:
    """Get fresh Daily.co meeting token"""

    conversation = await conversation_repo.get(conversation_id)

    if not conversation or conversation.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    token = daily_client.create_meeting_token(
        room_url=conversation.room_url,
        user_name=current_user.full_name,
        user_id=str(current_user.id),
        is_owner=False,
        expires_in_seconds=3600
    )

    return TokenResponse(
        token=token,
        room_url=conversation.room_url,
        expires_at=(datetime.now() + timedelta(hours=1)).isoformat()
    )
```

#### Webhook Handler (Optional: for recording events)
```python
# apps/api/src/routes/webhooks.py
@router.post("/daily/events")
async def handle_daily_webhook(event: dict):
    """Handle Daily.co webhook events (recording started/completed, etc.)"""

    event_type = event.get("type")
    room_id = event.get("room_id")

    if event_type == "recording.finished":
        recording_url = event.get("recording_url")

        # Find conversation by room_id
        conversation = await conversation_repo.find_by_room_id(room_id)

        # Update recording URL in database
        await conversation_repo.update(
            conversation.id,
            {"recording_url": recording_url}
        )

    return {"status": "ok"}
```

### 2. Frontend: React Component Setup

#### Provider Wrapper
```typescript
// apps/mobile/src/providers/DailyProvider.tsx
import React from 'react';
import { DailyProvider as DailyReactProvider } from '@daily-co/daily-react';

interface DailyProviderWrapperProps {
  roomUrl: string;
  token: string;
  userName: string;
  children: React.ReactNode;
}

export const DailyProviderWrapper: React.FC<DailyProviderWrapperProps> = ({
  roomUrl,
  token,
  userName,
  children,
}) => {
  return (
    <DailyReactProvider
      url={roomUrl}
      token={token}
      userName={userName}
    >
      {children}
    </DailyReactProvider>
  );
};
```

#### Conversation Component with Daily React Hooks
```typescript
// apps/mobile/src/components/conversation/ConversationView.tsx
import React, { useState, useEffect } from 'react';
import {
  useDaily,
  useDevices,
  useParticipants,
  useAppMessage,
  useDailyEvent,
} from '@daily-co/daily-react';

interface ConversationViewProps {
  conversationId: string;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  conversationId,
}) => {
  const callObject = useDaily();
  const { enableMic, disableMic, mics, selectMic } = useDevices();
  const participants = useParticipants();
  const { sendAppMessage } = useAppMessage({
    onAppMessage: handleAppMessage,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [processingStatus, setProcessingStatus] = useState<
    'transcribing' | 'thinking' | 'synthesizing' | 'complete'
  >('complete');

  // Listen for error events
  useDailyEvent('error', (ev) => {
    console.error('Daily error:', ev);
  });

  // Listen for participant changes (e.g., bot joins with assistant voice)
  useDailyEvent('participant-updated', (ev) => {
    console.log('Participant updated:', ev);
  });

  const handleAppMessage = (event: any) => {
    const { type, data } = event;

    switch (type) {
      case 'transcription_update':
        setTranscription(data.text);
        break;
      case 'assistant_response':
        setAssistantResponse(data.text);
        break;
      case 'processing_status':
        setProcessingStatus(data.status);
        break;
    }
  };

  const startVoiceInput = async () => {
    try {
      setIsRecording(true);
      await enableMic();

      // Notify backend that recording started
      sendAppMessage(
        {
          type: 'user_input',
          data: {
            conversationId,
            emotionalTags: [],
          },
        },
        'all'
      );
    } catch (error) {
      console.error('Failed to start microphone:', error);
      setIsRecording(false);
    }
  };

  const stopVoiceInput = async () => {
    try {
      setIsRecording(false);
      await disableMic();

      // Notify backend that recording stopped (triggering processing)
      sendAppMessage(
        {
          type: 'user_input_ended',
          data: { conversationId },
        },
        'all'
      );
    } catch (error) {
      console.error('Failed to stop microphone:', error);
    }
  };

  const selectMicrophone = async (deviceId: string) => {
    selectMic(deviceId);
  };

  // Get remote participant (bot/assistant)
  const remoteParticipant = participants.find(
    (p) => p.session_id !== callObject?.participants?.local?.session_id
  );

  const remoteAudioAvailable =
    remoteParticipant?.tracks?.audio?.state === 'playable';

  return (
    <div className="conversation-container">
      {/* Microphone Selection */}
      <div className="mic-selector">
        <select onChange={(e) => selectMicrophone(e.target.value)}>
          {mics.map((mic) => (
            <option key={mic.deviceId} value={mic.deviceId}>
              {mic.label}
            </option>
          ))}
        </select>
      </div>

      {/* Voice Recording Button */}
      <button
        onMouseDown={startVoiceInput}
        onMouseUp={stopVoiceInput}
        onTouchStart={startVoiceInput}
        onTouchEnd={stopVoiceInput}
        className={`voice-button ${isRecording ? 'recording' : ''}`}
      >
        {isRecording ? '🎙️ Listening...' : '🎤 Press to speak'}
      </button>

      {/* Real-time Transcription */}
      {transcription && (
        <div className="transcription-display">
          <p>{transcription}</p>
          {processingStatus !== 'complete' && (
            <span className="processing-indicator">
              {processingStatus}...
            </span>
          )}
        </div>
      )}

      {/* Assistant Response */}
      {assistantResponse && (
        <div className="assistant-response">
          <p>{assistantResponse}</p>
          {remoteAudioAvailable && <span>🔊 Playing response...</span>}
        </div>
      )}

      {/* Participant Info */}
      <div className="participants-info">
        <p>Local: {callObject?.participants?.local?.user_name}</p>
        {remoteParticipant && (
          <p>Remote: {remoteParticipant.user_name || 'Bot'}</p>
        )}
      </div>
    </div>
  );
};
```

## Advanced Features

### App Messages for Conversation Orchestration

**Sending Messages (Frontend):**
```typescript
import { useAppMessage } from '@daily-co/daily-react';

const { sendAppMessage } = useAppMessage({
  onAppMessage: (event) => {
    console.log('Received message:', event);
  },
});

// Send transcription request to backend
sendAppMessage(
  {
    type: 'transcription_update',
    data: {
      text: 'User said: hello',
      confidence: 0.95,
      isFinal: true,
    },
  },
  'all' // Send to all participants
);
```

**Receiving Messages (Backend via webhook or direct connection):**
```python
# Backend connects to Daily room as bot participant
# and receives app messages

def handle_incoming_app_message(message):
    """Process incoming app message from frontend"""
    msg_type = message.get("type")

    if msg_type == "user_input":
        # User started speaking
        conversation_id = message.get("conversationId")
        # Start transcription process

    elif msg_type == "user_input_ended":
        # User stopped speaking
        # Process final transcription + generate response
```

### Network Monitoring

```typescript
import { useNetwork } from '@daily-co/daily-react';

export const NetworkMonitor = () => {
  const { stats, topology } = useNetwork({
    onNetworkQualityChange: (event) => {
      console.log('Network quality:', event.quality);
    },
  });

  return (
    <div>
      <p>Topology: {topology}</p>
      <p>Video Send: {stats.videoSendStats?.bandwidth}</p>
      <p>Video Recv: {stats.videoRecvStats?.bandwidth}</p>
      <p>Audio Send: {stats.audioSendStats?.bandwidth}</p>
      <p>Audio Recv: {stats.audioRecvStats?.bandwidth}</p>
    </div>
  );
};
```

### Recording Management

```typescript
import { useRecording } from '@daily-co/daily-react';

export const RecordingControl = () => {
  const {
    isRecording,
    startRecording,
    stopRecording,
  } = useRecording({
    onRecordingStarted: () => console.log('Recording started'),
    onRecordingStopped: () => console.log('Recording stopped'),
    onRecordingUploadCompleted: (event) => {
      console.log('Recording uploaded:', event);
    },
  });

  return (
    <>
      <button onClick={startRecording} disabled={isRecording}>
        Start Recording
      </button>
      <button onClick={stopRecording} disabled={!isRecording}>
        Stop Recording
      </button>
      <p>Recording: {isRecording ? 'ON' : 'OFF'}</p>
    </>
  );
};
```

## Migration from Custom WebSocket

### Before (Custom WebSocket)
```typescript
// Old approach - manual audio handling
const ws = new WebSocket(`wss://api.numeroly.app/ws/conversation/${id}`);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'audio_chunk') {
    audioPlayer.playChunk(msg.data);
  }
};

// Manual microphone management
navigator.mediaDevices.getUserMedia({ audio: true });
```

### After (Daily React)
```typescript
// New approach - Daily.co handles everything
import { useDaily, useDevices, useParticipants } from '@daily-co/daily-react';

export const ConversationComponent = () => {
  const callObject = useDaily();
  const { enableMic, disableMic } = useDevices();
  const participants = useParticipants();

  // Daily.co automatically:
  // ✅ Streams microphone audio
  // ✅ Plays remote audio
  // ✅ Handles codec negotiation
  // ✅ Manages network reconnection
  // ✅ Records conversation
};
```

**Benefits:**
- 40% less code
- No custom audio pipeline maintenance
- Better reliability and uptime
- Built-in recording
- Automatic quality adaptation

## Troubleshooting

### Issue: Audio not streaming
**Solution:** Check Daily.co dashboard for room status
```typescript
import { useDailyEvent } from '@daily-co/daily-react';

useDailyEvent('error', (ev) => {
  console.error('Daily error:', ev.error);
  // Check: network connectivity, microphone permissions, token expiry
});
```

### Issue: Transcription not updating
**Solution:** Verify app messages are being sent/received
```typescript
const { sendAppMessage } = useAppMessage({
  onAppMessage: (event) => {
    console.log('App message received:', event); // Debug logging
  },
});
```

### Issue: High latency (>2s)
**Solution:** Check network topology and bandwidth
```typescript
const { stats, topology } = useNetwork();
console.log('Topology:', topology); // Should be 'sfu' for best latency
console.log('Bandwidth:', stats.networkStats);
```

## Performance Optimization

### Recommended Settings
```typescript
const UseDailyConfig = {
  audioSource: true, // Enable microphone
  videoSource: false, // Disable video (voice-only)
  subscribeToTracksAutomatically: true,
  receiveSettings: {
    video: { isSubscribed: false }, // Don't receive video
    audio: { isSubscribed: true }, // Receive audio
  },
};
```

### Cost Optimization
- **Recording:** Automatically enabled, billed per minute
- **Bandwidth:** Voice-only (no video) reduces costs ~90%
- **Room Lifespan:** Rooms expire after 24 hours of inactivity

## Resources

- [Daily.co Documentation](https://docs.daily.co/)
- [daily-react API Reference](https://github.com/daily-co/daily-react)
- [Daily.co Dashboard](https://dashboard.daily.co/)
- [WebRTC Best Practices](https://webrtc.org/)

## Support

For issues:
1. Check Daily.co status page: https://status.daily.co/
2. Review network tab in DevTools (check signaling connections)
3. Enable Daily.co debug logging: `window.DailyDebug = true`
4. Contact Daily.co support: support@daily.co
