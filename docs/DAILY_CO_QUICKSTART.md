# Daily.co Quick Start Guide - 15 Minutes to Voice Streaming

Get Numeroly's voice streaming running with Daily.co in 15 minutes.

## Prerequisites

- Node.js 16+
- Python 3.11+
- Daily.co account (free tier works for testing)

## Step 1: Get Daily.co API Key (2 minutes)

1. Go to [https://dashboard.daily.co/](https://dashboard.daily.co/)
2. Sign up or log in
3. Navigate to **Developers** → **API Keys**
4. Copy your API key
5. Create `.env` file in `apps/api`:
   ```bash
   DAILY_API_KEY=your_api_key_here
   ```

## Step 2: Backend Setup (5 minutes)

### Install Python Package

```bash
cd apps/api
pip install daily-client
```

### Create Backend Endpoints

Add to `apps/api/src/routes/conversations.py`:

```python
from fastapi import APIRouter, Depends
from daily_client import DailyClient
from datetime import datetime, timedelta

router = APIRouter(prefix="/conversations", tags=["conversations"])
daily_client = DailyClient(api_key="your_api_key")

@router.post("")
async def create_conversation():
    """Create conversation with Daily.co room"""
    # Create room
    room = daily_client.create_room({
        "properties": {
            "max_participants": 2,
            "record_on_start": True
        }
    })

    # Generate token
    token = daily_client.create_meeting_token(
        room_url=room["url"],
        user_name="user",
        expires_in_seconds=3600
    )

    return {
        "room_url": room["url"],
        "token": token,
        "expires_at": (datetime.now() + timedelta(hours=1)).isoformat()
    }
```

### Test Backend

```bash
curl -X POST http://localhost:8000/conversations
# Should return room_url and token
```

## Step 3: Frontend Setup (5 minutes)

### Install Dependencies

```bash
cd apps/mobile
npm install @daily-co/daily-react @daily-co/daily-js jotai
```

### Create Voice Service Hook

Create `apps/mobile/src/hooks/useVoiceSession.ts`:

```typescript
import { useDaily, useDevices } from '@daily-co/daily-react';
import { useState } from 'react';

export const useVoiceSession = () => {
  const callObject = useDaily();
  const { enableMic, disableMic } = useDevices();
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    await enableMic();
    setIsRecording(true);
  };

  const stopRecording = async () => {
    await disableMic();
    setIsRecording(false);
  };

  return { isRecording, startRecording, stopRecording, callObject };
};
```

### Create Conversation Component

Create `apps/mobile/src/components/SimpleConversation.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { DailyProvider } from '@daily-co/daily-react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { api } from '@/services/api';

const ConversationContent = () => {
  const { isRecording, startRecording, stopRecording } = useVoiceSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Voice Chat</Text>

      <Pressable
        onPressIn={startRecording}
        onPressOut={stopRecording}
        style={[
          styles.button,
          isRecording && styles.buttonActive,
        ]}
      >
        <Text style={styles.buttonText}>
          {isRecording ? 'Release to Stop' : 'Hold to Speak'}
        </Text>
      </Pressable>
    </View>
  );
};

export const SimpleConversation = () => {
  const [roomUrl, setRoomUrl] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    // Get room URL and token from backend
    const initConversation = async () => {
      const response = await api.post('/conversations');
      setRoomUrl(response.data.room_url);
      setToken(response.data.token);
    };

    initConversation();
  }, []);

  if (!roomUrl || !token) {
    return <Text>Loading...</Text>;
  }

  return (
    <DailyProvider url={roomUrl} token={token}>
      <ConversationContent />
    </DailyProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonActive: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
```

## Step 4: Test It (3 minutes)

### Backend Test
```bash
# Terminal 1: Start backend
cd apps/api
python main.py

# Terminal 2: Test endpoint
curl -X POST http://localhost:8000/conversations
# You should see room_url and token in response
```

### Frontend Test
```bash
# Terminal 3: Start frontend
cd apps/mobile
npm start

# Open in Expo Go app or simulator
# Press the voice button and speak
```

## What's Happening

1. **Click Voice Button** → Frontend calls `enableMic()` via daily-react
2. **Audio Streams** → Daily.co receives microphone audio via WebRTC
3. **Backend Receives** → Backend can access audio from Daily room
4. **Transcription** → Send audio to Azure Speech Services
5. **AI Response** → GPT-4 generates reply
6. **TTS** → ElevenLabs creates audio response
7. **Remote Audio** → Backend bot participant sends response back
8. **Frontend Plays** → daily-react automatically plays remote audio

## Next Steps

1. **Add Transcription:** Connect Azure Speech Services to receive audio
2. **Add AI:** Integrate GPT-4 for responses
3. **Add TTS:** Use ElevenLabs to generate voice response
4. **Error Handling:** Add error boundaries and retry logic
5. **Recording:** Access recording from Daily webhook

## Troubleshooting

### "Room creation failed"
- Check Daily.co API key is correct
- Check Daily.co dashboard for quota limits
- Network issue? Test with curl first

### "Microphone not working"
- Check browser/app has microphone permissions
- Check `useDevices()` hook is returning mics
- Test with `console.log(mics)`

### "No remote audio"
- Backend needs to send audio back to room
- Check backend is connected as participant
- Verify TTS is generating audio

### "High latency"
- Check network topology: should be 'sfu'
- Check bandwidth stats
- Try different region in Daily.co settings

## Key Concepts

| Concept | What It Does |
|---------|------------|
| **Daily Room** | Virtual space where participants meet |
| **Meeting Token** | Security token granting access to room |
| **useDaily()** | React hook for call object |
| **useDevices()** | Hook for microphone/speaker control |
| **useParticipants()** | Hook for participant data |
| **SFU** | Server-Forwarding Unit (optimal topology) |
| **WebRTC** | Technology for peer-to-peer audio |

## Production Checklist

Before going live:

- [ ] Daily.co API key in secure `.env`
- [ ] Error handling for network failures
- [ ] Microphone permission requests
- [ ] Audio level monitoring
- [ ] Recording verification
- [ ] Monitoring dashboard configured
- [ ] Rate limiting on room creation
- [ ] CORS configured properly
- [ ] Token expiry handling
- [ ] Fallback audio handling

## Common Customizations

### Change Recording Settings

```python
room = daily_client.create_room({
    "properties": {
        "record_on_start": True,  # Auto record
        "lang": "vi",  # Vietnamese UI
        "max_participants": 2,
    }
})
```

### Handle Disconnections

```typescript
import { useDailyEvent } from '@daily-co/daily-react';

useDailyEvent('left-meeting', () => {
  console.log('User left room');
  // Handle cleanup
});
```

### Monitor Network Quality

```typescript
import { useNetwork } from '@daily-co/daily-react';

const { stats } = useNetwork();
console.log('Audio bitrate:', stats.audioSendStats?.bandwidth);
```

## Resources

- **Full Docs:** See `DAILY_CO_INTEGRATION.md`
- **Code Examples:** See `VOICE_SERVICE_EXAMPLES.md`
- **Architecture:** See `docs/architecture.md` lines 852-1044
- **Daily.co Docs:** https://docs.daily.co/

## Support

- Daily.co Support: support@daily.co
- Status: https://status.daily.co/
- GitHub Issues: https://github.com/daily-co/daily-react/issues

---

**That's it!** You now have bidirectional audio streaming with Daily.co.

Next: Connect Azure Speech Services for transcription and GPT-4 for responses.
