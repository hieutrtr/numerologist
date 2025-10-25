# Frontend Architecture & Voice Flow Review (React Native / Expo)

## 1. High-Level App Structure

```mermaid
flowchart TD
    App[App.tsx] --> RootNavigator
    RootNavigator -->|unauthenticated| WelcomeScreen
    RootNavigator -->|unauthenticated| PhoneAuthScreen
    RootNavigator -->|authenticated| TabNavigator
    TabNavigator --> HomeScreen
    TabNavigator --> ProfileScreen
    HomeScreen -->|wraps| DailyProvider
    DailyProvider -->|provides| DailyContext
    HomeScreen -->|uses| ConversationStore
    HomeScreen --> VoiceComponents[Voice UI Components]
```

- `App.tsx` is the Expo entry point; it renders `RootNavigator`.
- `RootNavigator` (React Navigation native stack) chooses onboarding screens or the tab app based on `useAuthStore().isAuthenticated`.
- `TabNavigator` defines the bottom tabs; the Home tab is wrapped by `DailyProvider`, which primes Daily.co device access.
- Zustand stores (`authStore.ts`, `conversationStore.ts`) hold global state for auth and conversations.

## 2. Navigation & State Bootstrapping

```mermaid
sequenceDiagram
    participant App
    participant RootNavigator
    participant AuthStore
    participant NavStack

    App->>RootNavigator: render
    RootNavigator->>AuthStore: loadStoredAuth()
    AuthStore-->>AuthStore: read AsyncStorage
    AuthStore-->>RootNavigator: update isAuthenticated
    alt user not authenticated
        RootNavigator->>NavStack: push Welcome, PhoneAuth
    else user authenticated
        RootNavigator->>NavStack: push Main(TabNavigator)
    end
```

Key files:
- `apps/mobile/src/navigation/RootNavigator.tsx`
- `apps/mobile/src/store/authStore.ts`
- `apps/mobile/src/navigation/TabNavigator.tsx`


## 3. Home Screen Voice Flow

```mermaid
sequenceDiagram
    participant User
    participant VoiceButton
    participant HomeScreen
    participant ConversationStore
    participant DailyProvider
    participant DailySDK
    participant Backend(API)
    participant Pipecat

    User->>VoiceButton: press
    VoiceButton->>HomeScreen: onPress()
    HomeScreen->>ConversationStore: startConversation()
    Note right of ConversationStore: POST /api/v1/conversations/daily/room\nreceive conversation_id, room_url, token
    ConversationStore-->>HomeScreen: conversationId, room info
    HomeScreen->>DailySDK: setLocalAudio(true)\nstartRecording()
    DailyProvider->>DailySDK: preAuth + startCamera\n(on roomUrl/token change)
    DailySDK->>Backend(API): audio stream via Daily SFU
    Backend(API)->>Pipecat: route audio into pipeline
    Pipecat->>Backend(API): transcription + responses
    Backend(API)->>DailySDK: app messages (transcription_update,\nassistant_response, processing_status)
    DailySDK->>HomeScreen: onAppMessage callback
    HomeScreen->>ConversationStore: update messages, transcription, flags
    User->>VoiceButton: release
    VoiceButton->>HomeScreen: stopRecording()
    HomeScreen->>DailySDK: setLocalAudio(false)
```

Relevant files:
- `HomeScreen.tsx`
- `services/voiceInputService.ts` / `voiceOutputService.ts`
- `components/voice/VoiceButton.tsx`, `MicrophoneSelector.tsx`, `WaveformVisualizer.tsx`
- `components/conversation/ConversationTranscript.tsx`
- `store/conversationStore.ts`

## 4. Conversation Store Responsibilities

```mermaid
flowchart LR
    start[startConversation] --> POST_API[POST /api/v1/conversations/daily/room]
    POST_API -->|success| setState{Update store}
    setState --> dailyRoomUrl
    setState --> dailyToken
    setState --> activeConversationId
    setState --> messages[]
    setState --> flags[isRecording, isProcessing, isAiTyping]

    endConversation --> PATCH_API[PATCH /api/v1/conversations/{id}]
    PATCH_API --> resetState[clear store + Daily creds]
    addMessage --> append(messages)
    setRecording --> updateFlag
    setProcessing --> updateFlag
    setTranscription --> updateText
```

- API root comes from `EXPO_PUBLIC_API_URL` (default `http://localhost:8000`).
- Messages list drives `ConversationTranscript`.
- Daily credentials trigger `DailyProvider`’s device initialization.

## 5. Component Composition on Home Screen

```mermaid
flowchart TD
    HomeScreen --> SafeAreaView
    HomeScreen --> Header[Greeting header]
    HomeScreen --> Content[ConversationTranscript or Welcome copy]
    HomeScreen --> VoicePanel

    VoicePanel -->|state idle| MicrophoneSelector
    VoicePanel -->|state listening| WaveformVisualizer
    VoicePanel --> VoiceButton
```

- Greeting uses `VIETNAMESE_GREETINGS` from `utils/constants`.
- `WaveformVisualizer` now renders the real mic level streamed from Daily (`input-level` events in `useVoiceInputService`).
- `VoiceButton` drives the `VoiceButtonState` state machine (`idle` → `listening` → `processing` / `error`).

## 6. Platform Considerations & Warnings

- Web builds log warnings when Daily’s web SDK ignores `audio.processor` settings; Native platforms honor it.
- Expo Haptics maps to `navigator.vibrate()` on web; Chrome warns when vibration is unsupported.
- Both cases degrade gracefully; add platform guards if you want a clean console.

## 7. Suggested Next Steps for Familiarity
1. Run `./start-mobile.sh` and attach Expo Go (iOS/Android) to experience the navigation + voice flow end-to-end.
2. Review `services/voiceInputService.ts` & `voiceOutputService.ts` to understand Daily hook usage.
3. Inspect `conversationStore.ts` network calls; they’re the main link to the backend pipeline.
4. Explore `providers/DailyProvider.tsx` to see how device pre-auth and camera bootstrapping works.
5. Use React DevTools or Expo’s inspector to trace component re-renders while interacting with voice UI.

Feel free to extend with screen-specific deep dives or additional diagrams (e.g., onboarding flow) as you continue the review.
