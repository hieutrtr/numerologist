# Numeroly Mobile App - Project Summary

## 🎯 Project Overview

**Numeroly** is a voice-first Vietnamese numerology mobile application that enables users to explore Pythagorean numerology through natural voice conversations with an AI assistant.

### Key Features

- 🎤 **Voice-First Interaction** - Primary interface through voice conversations
- 📊 **Numerology Profile** - Life Path, Destiny, Soul Urge, and Personality numbers
- 💬 **AI Conversations** - Intelligent responses powered by GPT-4o
- 🇻🇳 **Vietnamese Language** - Full support for Vietnamese speech and text
- 📱 **Cross-Platform** - iOS and Android from a single codebase

---

## 📁 Project Structure

```
mobile-app/
├── App.tsx                           # App entry point
├── src/
│   ├── components/                   # Reusable UI components
│   │   ├── voice/
│   │   │   ├── VoiceButton.tsx      # Main voice interaction button
│   │   │   └── WaveformVisualizer.tsx # Real-time audio waveform
│   │   ├── conversation/
│   │   │   ├── ConversationTranscript.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── TypingIndicator.tsx
│   │   └── cards/
│   │       └── NumerologyCard.tsx   # Display numerology numbers
│   ├── screens/                     # App screens
│   │   ├── HomeScreen.tsx          # Main conversation screen
│   │   ├── ProfileScreen.tsx       # User profile & numerology
│   │   └── onboarding/
│   │       ├── WelcomeScreen.tsx
│   │       └── PhoneAuthScreen.tsx
│   ├── navigation/                  # Navigation setup
│   │   ├── RootNavigator.tsx       # Root stack navigator
│   │   └── TabNavigator.tsx        # Bottom tab navigation
│   ├── store/                       # State management (Zustand)
│   │   ├── authStore.ts            # Authentication state
│   │   └── conversationStore.ts    # Conversation state
│   ├── types/                       # TypeScript definitions
│   │   └── index.ts                # Core type definitions
│   └── utils/                       # Utilities & constants
│       ├── colors.ts               # Color palette & design tokens
│       └── constants.ts            # App constants
├── package.json                     # Dependencies
└── README.md                        # Comprehensive beginner guide
```

---

## 🛠️ Tech Stack

### Core Framework
- **React Native** (0.73+) - Cross-platform mobile framework
- **Expo** (50+) - Development platform & tooling
- **TypeScript** (5.3+) - Type-safe JavaScript

### UI & Animations
- **React Native Reanimated** - 60 FPS animations
- **React Native Gesture Handler** - Touch interactions
- **Expo Linear Gradient** - Gradient backgrounds
- **React Native SVG** - Vector graphics

### Navigation & State
- **React Navigation** - Screen navigation
  - Native Stack Navigator
  - Bottom Tabs Navigator
- **Zustand** - Lightweight state management
- **AsyncStorage** - Persistent storage

### Voice & Audio
- **Expo AV** - Audio recording & playback
- **Expo Haptics** - Tactile feedback

---

## 🎨 Component Architecture

### Voice Button Component

**File:** `src/components/voice/VoiceButton.tsx`

The primary interaction point with 6 states:
- **Idle:** Subtle breathing pulse animation
- **Listening:** Animated waveform border
- **Processing:** Rotating shimmer effect
- **Speaking:** Purple waveform animation
- **Disabled:** Greyed out
- **Error:** Red accent with shake animation

**Key Features:**
- Three size variants (small/medium/large)
- Gradient backgrounds (purple to blue)
- Haptic feedback on press
- Accessibility support (VoiceOver/TalkBack)

### Waveform Visualizer

**File:** `src/components/voice/WaveformVisualizer.tsx`

Real-time audio visualization with:
- 30-60 animated bars
- Three modes: listening, speaking, idle
- Spring physics for natural movement
- Performance optimizations for 60 FPS

### Conversation Components

**Files:** 
- `src/components/conversation/ConversationTranscript.tsx`
- `src/components/conversation/MessageBubble.tsx`
- `src/components/conversation/TypingIndicator.tsx`

Features:
- Chat bubble interface (user/AI/system messages)
- FlatList with virtualization for performance
- Auto-scroll to latest message
- Tap to replay audio
- Long-press for options
- Typing indicator with animated dots

### Numerology Card

**File:** `src/components/cards/NumerologyCard.tsx`

Displays core numerology numbers with:
- Gradient backgrounds (4 types)
- Scale-in animation on mount
- Counting animation for numbers
- Lotus watermark (spiritual aesthetic)

---

## 🔄 State Management

### Auth Store (`authStore.ts`)

Manages user authentication:
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
}
```

### Conversation Store (`conversationStore.ts`)

Manages active conversations:
```typescript
interface ConversationState {
  messages: Message[];
  isRecording: boolean;
  isProcessing: boolean;
  isAiTyping: boolean;
  startConversation: () => Promise<string>;
  addMessage: (message: Message) => void;
}
```

---

## 🎯 Type System

### Core Types (`src/types/index.ts`)

```typescript
// Voice Button
type VoiceButtonState = 'idle' | 'listening' | 'processing' | 'speaking' | 'disabled' | 'error';
type VoiceButtonSize = 'small' | 'medium' | 'large';

// Messages
type MessageType = 'user' | 'ai' | 'system';
interface Message {
  id: string;
  type: MessageType;
  text: string;
  timestamp: Date;
  audioUrl?: string;
  isPlaying?: boolean;
}

// Numerology
type NumerologyCardType = 'lifePath' | 'destiny' | 'soul' | 'personality';
```

---

## 🎨 Design System

### Color Palette (`src/utils/colors.ts`)

```typescript
Colors = {
  primaryPurple: '#6B4CE6',
  primaryBlue: '#4ECDC4',
  white: '#FFFFFF',
  black: '#1A1A2E',
  grey: '#8E8EA9',
  error: '#FF3838',
  
  gradients: {
    lifePath: ['#6B4CE6', '#4ECDC4'],
    destiny: ['#F7B731', '#FFA502'],
    soul: ['#4ECDC4', '#05C46B'],
    personality: ['#6B4CE6', '#FF6B9D'],
  }
}
```

**Design Philosophy:** Vietnamese spiritual aesthetic - calm, trustworthy, modern yet timeless.

---

## 🚀 Getting Started

### Quick Start (5 minutes)

```bash
# 1. Navigate to project
cd /home/hieutt50/projects/numerologist/mobile-app

# 2. Install dependencies
npm install

# 3. Start development server
npm start

# 4. Scan QR code with Expo Go app on your phone
```

### Development Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator (Mac only)
npm run tsc            # Type check
npm run clear-cache    # Clear cache and restart
```

---

## 📱 Screens Overview

### 1. Welcome Screen

**Path:** `src/screens/onboarding/WelcomeScreen.tsx`

- Animated logo (lotus emoji)
- App name and tagline
- "Start" button to begin

### 2. Phone Auth Screen

**Path:** `src/screens/onboarding/PhoneAuthScreen.tsx`

- Vietnamese phone number input (+84)
- OTP verification (6 digits)
- Currently uses mock auth (TODO: Azure AD B2C)

### 3. Home Screen

**Path:** `src/screens/HomeScreen.tsx`

Main conversation interface featuring:
- Time-based greeting header
- Large voice button (center)
- Conversation transcript
- Waveform visualizer (when listening)

### 4. Profile Screen

**Path:** `src/screens/ProfileScreen.tsx`

User's numerology profile:
- User info (name, phone)
- Grid of numerology cards (2x2)
- Animated card reveals
- Logout button

---

## 🔌 Integration Points (TODO)

### Backend API

**Base URL:** `http://localhost:8000/v1` (development)

**Endpoints to implement:**
- `POST /auth/register` - User registration
- `POST /auth/login` - Phone authentication
- `POST /conversations` - Start conversation
- `POST /voice/transcribe` - STT (Speech-to-Text)
- `POST /voice/synthesize` - TTS (Text-to-Speech)
- `GET /numerology/profile` - Get user profile
- `POST /numerology/insight` - Get numerology insight

### Azure Services

1. **Azure AD B2C** - Phone authentication with SMS OTP
2. **Azure Speech Services** - Vietnamese STT (optional, can use OpenAI)
3. **Azure Blob Storage** - Conversation audio archives

### AI Services

1. **OpenAI GPT-4o** - Conversation AI
2. **ElevenLabs** - Vietnamese TTS (or OpenAI)
3. **OpenAI Whisper** - Vietnamese STT alternative

---

## 🎯 Current Status

### ✅ Completed (MVP Phase 1)

- [x] Project initialization with Expo + TypeScript
- [x] Navigation setup (Stack + Bottom Tabs)
- [x] Authentication flow (Welcome → Phone Auth → Home)
- [x] Voice Button component with 6 states
- [x] Waveform Visualizer component
- [x] Conversation Transcript UI
- [x] Numerology Card component
- [x] State management with Zustand
- [x] Type definitions for core entities
- [x] Design system (colors, spacing, typography)
- [x] Comprehensive README for beginners

### 🚧 TODO (MVP Phase 2)

- [ ] Integrate real voice recording (Expo AV)
- [ ] Connect to FastAPI backend
- [ ] Implement Azure AD B2C phone auth
- [ ] Add Azure Speech Services for STT
- [ ] Add ElevenLabs for TTS
- [ ] Implement WebSocket for real-time conversation
- [ ] Add numerology calculation logic
- [ ] Create Journal feature
- [ ] Add onboarding screens (Name, Birth Date, Profile Processing)
- [ ] Implement audio playback controls
- [ ] Add error handling & loading states
- [ ] Add offline support (AsyncStorage caching)

### 📋 Nice-to-Have Features

- [ ] Dark mode support
- [ ] Voice settings (speed, tone)
- [ ] Conversation history search
- [ ] Share numerology profile
- [ ] Daily numerology notifications
- [ ] Tutorial/Help screen
- [ ] Accessibility improvements
- [ ] Performance monitoring
- [ ] Analytics integration

---

## 🧪 Testing Strategy

### Unit Tests (Jest)
```bash
npm test
```
Test individual components in isolation.

### Component Tests (React Native Testing Library)
Test user interactions and component behavior.

### E2E Tests (Detox)
Test complete user flows on real devices.

---

## 📈 Performance Considerations

### Animations
- Use `react-native-reanimated` for 60 FPS animations
- Run animations on UI thread (worklets)
- Avoid unnecessary re-renders with `React.memo`

### Lists
- Use `FlatList` with `virtualization` for long lists
- Implement `getItemLayout` for known item sizes
- Use `keyExtractor` for stable keys

### State
- Minimize state updates
- Use `useCallback` and `useMemo` appropriately
- Batch related state updates

### Images & Assets
- Use optimized image formats (WebP)
- Implement lazy loading
- Cache images appropriately

---

## 🔐 Security Considerations

### Authentication
- Store tokens in AsyncStorage (encrypted)
- Implement token refresh logic
- Clear tokens on logout
- Use HTTPS only for API calls

### Voice Data
- Ensure audio is transmitted securely
- Clear audio buffers after processing
- Respect microphone permissions

### User Data
- Encrypt sensitive data at rest
- Follow GDPR/privacy regulations
- Provide data export/deletion

---

## 📚 Resources

### Documentation
- React Native: https://reactnative.dev/
- Expo: https://docs.expo.dev/
- React Navigation: https://reactnavigation.org/
- Zustand: https://github.com/pmndrs/zustand
- Reanimated: https://docs.swmansion.com/react-native-reanimated/

### Design Reference
- Architecture Doc: `/docs/architecture.md`
- Frontend Spec: `/docs/front-end-spec.md`
- AI Prompts: `/docs/ai-prompts-react-native.md`

---

## 🤝 Contributing

1. Follow TypeScript strict mode
2. Use functional components with hooks
3. Follow naming conventions:
   - Components: PascalCase (`VoiceButton.tsx`)
   - Files: camelCase (`authStore.ts`)
   - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
4. Add TypeScript types for all props and state
5. Comment complex logic
6. Test on both iOS and Android

---

## 📞 Support

For questions or issues:
1. Check the README troubleshooting section
2. Review the architecture documentation
3. Consult React Native/Expo documentation
4. Search Stack Overflow for specific errors

---

**Project Status:** MVP Phase 1 Complete ✅  
**Last Updated:** January 2025  
**Version:** 1.0.0  
**Maintainer:** Development Team
