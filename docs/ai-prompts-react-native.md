# React Native UI Generation Prompts for Numeroly

**Document Version:** 1.0  
**Last Updated:** 2025-01-14  
**Author:** Sally (UX Expert)  
**Purpose:** AI-assisted React Native component generation

---

## How to Use These Prompts

These prompts are designed for **React Native mobile development** and can be used with:
- **ChatGPT / Claude** (Code mode or Canvas)
- **GitHub Copilot / Cursor** (in your IDE)
- **Any AI coding assistant that supports React Native**

**Instructions:**
1. Copy the entire prompt for the component you want to build
2. Paste into your AI assistant
3. Review and customize the generated code
4. Test on iOS and Android simulators
5. Iterate based on your specific needs

**Tech Stack Reference:**
- React Native with Expo
- TypeScript
- Zustand (state management)
- React Navigation
- React Native Reanimated (animations)
- React Native Gesture Handler

---

## Prompt 1: Voice Button Component (Primary Interaction)

```
Create a React Native voice button component for a Vietnamese numerology mobile app called Numeroly. This is the primary interaction point for voice input.

REQUIREMENTS:

Visual Design:
- Large circular button: 200x200 dp (home screen variant)
- Gradient background: Purple (#6B4CE6) to Blue (#4ECDC4)
- Subtle pulse animation when idle (scale 1.0 to 1.05, 2 second loop)
- Ripple effect when pressed
- Animated waveform border when listening (real-time audio visualization)
- Vietnamese label below: "Chạm để nói" (Tap to speak)

Button States:
1. IDLE: Subtle breathing pulse, gradient background
2. LISTENING: Animated waveform border (blue), solid accent fill, stop icon appears
3. PROCESSING: Rotating shimmer effect, slightly dimmed
4. SPEAKING: Purple waveform animation synced to audio amplitude
5. DISABLED: Greyed out 40% opacity, no animation
6. ERROR: Red accent (#FF3838), shake animation

Technical Requirements:
- Use React Native Reanimated 2 or 3 for performant animations
- Implement using TypeScript with proper type definitions
- Include haptic feedback on press (Haptics.impactAsync from expo-haptics)
- Support three size variants: large (200dp), medium (80dp), small (48dp)
- Minimum touch target 48x48dp even for small variant
- Ensure 60 FPS animation performance

Accessibility:
- VoiceOver/TalkBack label in Vietnamese: "Nút ghi âm. Nhấn để bắt đầu nói."
- Announce state changes to screen readers
- Support for reduced motion (disable decorative animations)

Audio Visualization:
- Use expo-av or react-native-audio for audio input
- Display real-time waveform using react-native-svg (30-60 bars)
- Waveform should respond to voice amplitude in real-time

Props Interface:
interface VoiceButtonProps {
  size?: 'small' | 'medium' | 'large';
  state: 'idle' | 'listening' | 'processing' | 'speaking' | 'disabled' | 'error';
  onPress: () => void;
  audioAmplitude?: number; // 0-1 for waveform visualization
  label?: string; // Override default Vietnamese label
}

Generate complete component with:
1. TypeScript component file (VoiceButton.tsx)
2. Animation logic using Reanimated
3. SVG waveform visualizer sub-component
4. Example usage in a screen
5. Comments explaining key decisions

Style according to Vietnamese spiritual aesthetics - calm, trustworthy, modern yet timeless.
```

---

## Prompt 2: Conversation Transcript Component

```
Create a React Native conversation transcript component for Numeroly, a Vietnamese voice-first numerology app. This displays the dialogue between user and AI.

REQUIREMENTS:

Visual Design:
- Chat bubble interface similar to messaging apps
- User messages: Right-aligned, light blue background (#E3F2FD), dark text
- AI messages: Left-aligned, white background with subtle shadow, purple accent
- System messages: Center-aligned, grey background (#F0F0F5), small text
- Vietnamese timestamp format: "HH:mm - DD/MM/YYYY" (subtle, below messages)
- Auto-scroll to latest message with smooth animation
- Show typing indicator when AI is thinking (3 animated dots)

Message Features:
- Tap any message bubble to replay that voice segment
- Long-press to show options: Copy, Save, Share, Delete
- Highlight active message when voice is playing (subtle glow effect)
- Show small waveform icon for messages that have audio

Technical Requirements:
- Use FlatList for performance (virtualization for long conversations)
- Implement reverse chronological ordering (newest at bottom)
- Lazy load older messages as user scrolls up
- Cache rendered messages to prevent re-renders
- TypeScript with proper interfaces

Animations:
- New message slides in from bottom with fade (200ms)
- User scrolls away: show "New message" floating button
- Smooth scroll-to-bottom animation (300ms)
- Playing message: subtle pulse animation

Props Interface:
interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  text: string;
  timestamp: Date;
  audioUrl?: string; // Optional audio playback
  isPlaying?: boolean;
}

interface ConversationTranscriptProps {
  messages: Message[];
  isAiTyping?: boolean;
  onMessageTap?: (messageId: string) => void;
  onMessageLongPress?: (messageId: string) => void;
  onReplayAudio?: (audioUrl: string) => void;
  maxHeight?: number; // Container height constraint
}

Accessibility:
- Each message announced by screen reader with role and timestamp
- "Cuộc hội thoại" (Conversation) as container label
- Replay button has accessible label: "Phát lại tin nhắn này"

Generate:
1. ConversationTranscript.tsx component
2. MessageBubble.tsx sub-component
3. TypingIndicator.tsx sub-component
4. Example usage with mock data
5. Styling that matches Vietnamese spiritual aesthetic (calm, spacious)

Use Inter font family for Vietnamese text support (diacritics).
```

---

## Prompt 3: Numerology Number Card Component

```
Create a React Native card component to display core numerology numbers for Numeroly app.

REQUIREMENTS:

Visual Design:
- Card dimensions: 160x200 dp (fits 2 per row on mobile)
- Gradient background that matches number's spiritual meaning:
  - Life Path: Purple to Blue gradient (#6B4CE6 to #4ECDC4)
  - Destiny: Gold to Orange gradient (#F7B731 to #FFA502)
  - Soul: Teal to Green gradient (#4ECDC4 to #05C46B)
  - Personality: Purple to Pink gradient (#6B4CE6 to #FF6B9D)
- Border radius: 16dp for soft, welcoming feel
- Subtle shadow: elevation 2 (Android) / shadowOpacity 0.1 (iOS)

Card Content:
- Large number at top: 64pt Poppins Bold (white color)
- Vietnamese title below: 16pt Inter SemiBold (white, e.g., "Số Mệnh")
- English subtitle: 12pt Inter Regular (white 80% opacity, e.g., "Life Path")
- One-line meaning: 14pt Inter Regular (white 90%, e.g., "Con đường cuộc đời")
- Small lotus icon watermark in background (subtle, 20% opacity)

Interaction States:
- Default: Static with subtle gradient
- Hover/Focus: Lift effect (translateY -4, increase shadow)
- Pressed: Scale down to 0.97
- Selected: Thicker border (3pt white), slight glow

Animation on First Reveal:
- Scale from 0 to 1 with slight overshoot (spring animation)
- Fade in gradient background
- Number appears with counting animation (0 to actual number)
- Duration: 800ms total

Technical Requirements:
- Use react-native-linear-gradient for gradient backgrounds
- TypeScript with interfaces
- React Native Reanimated for animations
- Support dark mode (adjust text colors and opacity)

Props Interface:
interface NumerologyCardProps {
  number: number; // 1-9 or 11, 22, 33 (master numbers)
  type: 'lifePath' | 'destiny' | 'soul' | 'personality';
  title: string; // Vietnamese title
  subtitle: string; // English subtitle
  meaning: string; // One-line Vietnamese meaning
  onPress?: () => void; // Navigate to detail screen
  isSelected?: boolean;
  animateOnMount?: boolean; // First-time reveal animation
}

Accessibility:
- Accessible label: "{title}: {number}. {meaning}"
- Announce "Chạm hai lần để xem chi tiết" (Double tap to view details)
- Support VoiceOver/TalkBack

Generate:
1. NumerologyCard.tsx component
2. Gradient configuration utility for each card type
3. Animated reveal logic
4. Example usage in a grid (2x2 layout)
5. Styling that feels spiritual and premium

Match Vietnamese numerology aesthetics - elegant, meaningful, trustworthy.
```

---

## Prompt 4: Onboarding Voice-Guided Flow

```
Create a React Native onboarding flow for Numeroly, a Vietnamese voice-first numerology app. This flow collects user info via voice with visual fallbacks.

REQUIREMENTS:

Screens Required (7 total):
1. Welcome Screen - Animated logo + voice intro
2. Phone Auth - Vietnamese phone number input (+84)
3. OTP Verification - 6-digit code entry
4. Name Collection - Voice-first name input
5. Birth Date - Voice or date picker
6. Profile Processing - Loading with animation
7. Profile Reveal - Animated Life Path number reveal

Technical Stack:
- React Navigation (Stack Navigator)
- TypeScript
- Expo (expo-auth-session for phone auth)
- Azure AD B2C for authentication (see architecture doc)
- React Native Reanimated for animations

SCREEN 1: WELCOME
- Full-screen animated logo (Lottie or custom)
- Tagline: "Khám phá bản thân qua thần số học"
- Auto-advance after 3 seconds or tap to skip
- Voice plays: "Chào bạn! Welcome to Numeroly..."

SCREEN 2: PHONE AUTH
- Clean phone input with Vietnam flag icon
- Country code +84 pre-selected
- Large touch-friendly number pad (Vietnamese locale)
- Voice prompt: "Nhập số điện thoại của bạn"
- Validate Vietnamese phone format (9-10 digits after +84)
- CTA button: "Tiếp tục" (Continue)

SCREEN 3: OTP
- 6 boxes for digits with auto-focus
- Voice reads back entered digits for accessibility
- Auto-submit when 6 digits entered
- Resend timer: "Gửi lại mã sau {seconds} giây"
- Error handling: Invalid code shows red shake animation

SCREEN 4: NAME COLLECTION (Voice-First)
- Large waveform visualization (listening state)
- Voice prompt: "Tôi nên gọi bạn là gì?" (What should I call you?)
- Show transcription in real-time as user speaks
- Text input keyboard appears after 5 seconds or if user taps
- Skip button if user prefers not to share name

SCREEN 5: BIRTH DATE
- Vietnamese date picker (DD/MM/YYYY format)
- Voice option: "Bạn sinh ngày nào?"
- Parse voice input: "15 tháng 3 năm 1990" → 15/03/1990
- Confirm date with voice playback
- Optional: Birth time and location (skip available)

SCREEN 6: PROCESSING
- Loading animation with numerology-themed visuals
- Progress text: "Đang tính toán số mệnh của bạn..."
- Simulate 3-5 second calculation
- Use shimmer or particle effects

SCREEN 7: REVEAL
- Large animated number (Life Path) scales in
- Voice explains: "Số mệnh của bạn là {number}..."
- Brief meaning text appears below
- CTA: "Bắt đầu trò chuyện" (Start conversation)
- Confetti or celebration animation

Navigation & Progress:
- Progress dots at top (7 dots, current highlighted)
- Back button on each screen (except welcome)
- Skip option where appropriate
- Smooth transitions (300ms slide animation)

Accessibility:
- VoiceOver announces each screen purpose
- All inputs have Vietnamese labels
- Voice prompts have text alternatives
- Support keyboard navigation

Error Handling:
- Network failure: Save progress, resume on reconnect
- Voice permission denied: Fall back to text input gracefully
- Phone already registered: Navigate to login flow
- OTP timeout: Auto-resend with notification

Generate:
1. OnboardingNavigator.tsx (React Navigation setup)
2. Each screen component (7 files)
3. Shared components: ProgressDots.tsx, VoiceInput.tsx
4. Authentication service integration (Azure AD B2C)
5. State management with Zustand (or Context API)
6. Example app entry point

Style: Calm, welcoming, Vietnamese spiritual aesthetic. Use purple primary color (#6B4CE6).
```

---

## Prompt 5: Voice Waveform Visualizer Component

```
Create a real-time audio waveform visualizer for React Native (Numeroly app) that responds to voice amplitude.

REQUIREMENTS:

Visual Design:
- Bar-style waveform (not circular)
- 30-60 vertical bars (adjustable based on device performance)
- Bar width: 3dp, spacing: 2dp
- Height range: 10dp (min) to 60dp (max) based on amplitude
- Gradient colors:
  - Listening (user): Blue gradient (#4ECDC4 to #6B4CE6)
  - Speaking (AI): Purple gradient (#6B4CE6 to #9B82FF)
  - Idle: Subtle grey (#C8C8D8)

Animation:
- Smooth transitions between amplitude values (100ms)
- Each bar animates independently
- 30-60 FPS target (60 preferred)
- Spring physics for natural movement
- Idle state: Gentle ambient wave (breathing pattern)

Technical Implementation:
- Use react-native-svg for rendering bars
- React Native Reanimated for smooth 60 FPS animations
- expo-av for audio input/output
- Get real-time audio amplitude from microphone or playback
- Use useSharedValue and useAnimatedProps for performance

Audio Processing:
- Sample audio amplitude at 30-60 Hz
- Normalize amplitude to 0-1 range
- Apply smoothing filter to prevent jitter
- Handle silence gracefully (return to idle state)

Props Interface:
interface WaveformVisualizerProps {
  mode: 'listening' | 'speaking' | 'idle';
  audioSource?: 'microphone' | 'playback';
  barCount?: number; // Default 40
  height?: number; // Container height, default 60dp
  width?: number; // Container width, default full width
  colors?: {
    start: string; // Gradient start
    end: string; // Gradient end
  };
  amplitudeData?: number[]; // Manual amplitude control (0-1 per bar)
  isActive?: boolean; // Pause/resume animation
}

Performance Optimizations:
- Use worklets for audio processing (Reanimated)
- Limit re-renders with React.memo
- Reduce bar count on low-end devices (detect via Device Info)
- Implement frame skip if FPS drops below 45

Accessibility:
- Decorative only (screen reader should ignore or announce "Voice visualization")
- Does not convey critical information

Responsive:
- Scale bar count based on container width
- Maintain aspect ratio on different screen sizes
- Support both portrait and landscape

Generate:
1. WaveformVisualizer.tsx component
2. AudioProcessor utility (amplitude extraction)
3. Example usage for listening state
4. Example usage for playback state
5. Performance monitoring logic
6. README explaining audio setup

Match Numeroly's aesthetic: calm, fluid, spiritual. Animations should feel organic and peaceful, not mechanical.
```

---

## Prompt 6: Home Screen (Voice Hub)

```
Create the main home screen for Numeroly React Native app - the primary voice interaction hub.

REQUIREMENTS:

Layout Structure (Top to Bottom):
1. Greeting Header (top 10%)
2. Hero Voice Button (center 50%)
3. Quick Insight Cards (bottom 30%)
4. Bottom Tab Navigation (fixed bottom)

GREETING HEADER:
- Time-sensitive greeting:
  - 5am-12pm: "Chào buổi sáng, {Name}!" (Good morning)
  - 12pm-6pm: "Chào buổi chiều, {Name}!" (Good afternoon)
  - 6pm-5am: "Chào buổi tối, {Name}!" (Good evening)
- Small avatar or initial circle (40dp) on left
- Settings icon on right (24dp, subtle)
- Font: 20pt Inter SemiBold, color: #1A1A2E

HERO VOICE BUTTON (see Prompt 1 for details):
- Large 200x200dp circular gradient button
- Centered vertically and horizontally
- Label below: "Chạm để nói" (16pt Inter Medium)
- Subtle pulse animation when idle
- This is the primary interaction point

QUICK INSIGHT CARDS:
- Horizontal scrollable list (snap to interval)
- 3 card types:
  
  1. Today's Personal Day Card:
     - 120x140dp size
     - Show Personal Day number (24pt)
     - Label: "Ngày Cá Nhân" (Personal Day)
     - Brief insight (1 line)
  
  2. Recent Conversation Snippet:
     - 160x140dp size
     - Show last conversation date
     - Preview text (2 lines max)
     - Tap to open full conversation
  
  3. Profile Completion Card (if incomplete):
     - 140x140dp size
     - Progress ring showing completion %
     - Text: "Hoàn thiện hồ sơ" (Complete profile)
     - CTA to finish setup

- Card styling:
  - White background
  - Border radius: 12dp
  - Shadow: elevation 2
  - Padding: 12dp

BOTTOM TAB NAVIGATION:
- 4 tabs: Home (active), Insights, Journal, Profile
- Icons + labels (Vietnamese)
- Active tab: Purple accent (#6B4CE6)
- Inactive: Grey (#8E8EA9)
- Haptic feedback on tab press

Interactions:
- Voice button tap: Navigate to active conversation screen
- Quick insight card tap: Navigate to respective screen
- Swipe down on header: Refresh insights
- Pull up from voice button: Quick actions menu (optional)

Animations:
- Screen enter: Fade in + subtle slide up (400ms)
- Voice button: Continuous subtle pulse
- Insight cards: Slide in staggered on mount
- Tab change: Smooth transition (300ms)

State Management:
- Connect to Zustand store for:
  - User name and profile data
  - Current Personal Day number
  - Recent conversation snippet
  - Profile completion status

Accessibility:
- VoiceOver label for screen: "Trang chủ - Trung tâm giọng nói" (Home - Voice Hub)
- All interactive elements labeled in Vietnamese
- Voice button announced as primary action
- Support for VoiceOver swipe navigation

Background:
- Gradient background: Very subtle, purple tint (#FAFAFA to #F5F0FF)
- Or solid white (#FAFAFA) for simplicity

Technical Requirements:
- React Navigation for screen management
- TypeScript with interfaces
- Zustand for state management
- React Native Reanimated for animations
- expo-haptics for tactile feedback

Props Interface:
interface HomeScreenProps {
  navigation: StackNavigationProp<any>;
  route: RouteProp<any>;
}

Generate:
1. HomeScreen.tsx (main screen component)
2. QuickInsightCard.tsx (reusable card component)
3. Greeting.tsx (time-based greeting logic)
4. Integration with Zustand store (mock store setup)
5. Example navigation setup
6. Styling that matches Vietnamese spiritual aesthetic

The screen should feel welcoming, calm, and centered around the voice interaction. Everything else is secondary context.
```

---

## Prompt 7: Bottom Tab Navigator

```
Create a custom bottom tab navigator for Numeroly React Native app with 4 tabs and Vietnamese labels.

REQUIREMENTS:

Tabs Configuration:
1. Home (Trang chủ) - Icon: Home, Screen: HomeScreen
2. Insights (Hồ sơ) - Icon: User/Star, Screen: ProfileScreen  
3. Journal (Nhật ký) - Icon: Book, Screen: JournalScreen
4. Settings (Cài đặt) - Icon: Settings, Screen: SettingsScreen

Visual Design:
- Height: 60dp (safe area insets respected)
- Background: White (#FFFFFF) with top border (#F0F0F5, 1px)
- Active tab:
  - Icon color: Purple (#6B4CE6)
  - Label color: Purple (#6B4CE6)
  - Font: 12pt Inter Medium
  - Icon scale: 1.1 (slightly larger)
- Inactive tab:
  - Icon color: Grey (#8E8EA9)
  - Label color: Grey (#8E8EA9)
  - Font: 12pt Inter Regular
  - Icon scale: 1.0

Animations:
- Tab press: Scale down to 0.9, then back to 1.0 (spring animation, 200ms)
- Active indicator: Subtle glow or dot above icon
- Screen transition: Fade (300ms crossfade between screens)
- Haptic feedback: Light impact on tab press (expo-haptics)

Icons:
- Use react-native-vector-icons (Feather icon set)
- Icon size: 24dp
- Consistent stroke width: 2px
- Icons:
  - Home: "home"
  - Insights: "user" or "star"
  - Journal: "book-open"
  - Settings: "settings"

Voice Navigation Support:
- User can say "Đi đến trang chủ" (Go to home) to navigate
- Announce current tab to screen reader on change
- Support keyboard navigation (optional, for future desktop/web)

Badge Support (Future):
- Show notification badge on tabs (red dot)
- Example: New journal entry suggestion badge on Journal tab

Technical Implementation:
- Use React Navigation Bottom Tabs
- TypeScript with proper typing
- Custom tab bar component for full control
- Zustand store for active tab state (optional)
- React Native Reanimated for smooth animations

Props Interface:
interface CustomTabBarProps {
  state: NavigationState;
  descriptors: any;
  navigation: NavigationHelpers;
}

Accessibility:
- Each tab announces name + "tab" in Vietnamese
- Active tab announces "Đã chọn" (Selected)
- Support for VoiceOver/TalkBack gesture navigation
- Minimum touch target: 48x48dp per tab

Safe Area:
- Use react-native-safe-area-context
- Respect bottom insets (iPhone notch, Android gestures)
- Ensure tab bar doesn't overlap with system UI

Dark Mode Support:
- Detect system theme preference
- Dark mode colors:
  - Background: #1A1A2E
  - Active: #9B82FF (lighter purple)
  - Inactive: #8E8EA9 (same)
  - Border: #2A2A3E

Generate:
1. AppNavigator.tsx (navigation setup with Bottom Tabs)
2. CustomTabBar.tsx (custom tab bar component with animations)
3. TabBarIcon.tsx (animated icon component)
4. Mock screens for each tab (placeholder components)
5. Navigation type definitions (TypeScript)
6. Example of voice navigation integration

Style should feel premium yet accessible, matching Vietnamese spiritual aesthetic (purple accent, calm interactions).
```

---

## Prompt 8: Loading & Skeleton States

```
Create loading state components for Numeroly React Native app - shimmer skeletons and loading animations.

REQUIREMENTS:

Components Needed:
1. Shimmer Effect Base Component (reusable)
2. Number Card Skeleton
3. Conversation Transcript Skeleton
4. Profile Screen Skeleton
5. Numerology Calculation Loader (special)

SHIMMER EFFECT BASE:
- Gradient shimmer animation moving left-to-right
- Colors: #F0F0F5 to #FAFAFA to #F0F0F5
- Animation duration: 1500ms (smooth, continuous loop)
- Use react-native-linear-gradient for gradient
- Use Reanimated for smooth 60 FPS translation

NUMBER CARD SKELETON:
- Card shape: 160x200dp rounded rectangle (16dp radius)
- Content skeleton:
  - Circle at top (64dp diameter) - represents number
  - Two lines below (60% and 40% width) - represents text
  - All shapes: #F0F0F5 base color
- Shimmer overlay moves across entire card
- Used while numerology profile is loading

CONVERSATION TRANSCRIPT SKELETON:
- 3-5 message bubbles (alternating left/right alignment)
- User bubbles: 60-80% width, right-aligned
- AI bubbles: 70-90% width, left-aligned
- Each bubble: 2-3 lines of skeleton text
- Staggered appearance animation (100ms delay between bubbles)

PROFILE SCREEN SKELETON:
- Header skeleton (avatar circle + name line)
- Grid of 4 number card skeletons (2x2)
- Bottom section: 2-3 text lines

NUMEROLOGY CALCULATION LOADER (special):
- Full-screen centered animation
- Visual options:
  
  Option A - Number Morphing:
  - Large number (96pt) that morphs through 1-9
  - Purple gradient color (#6B4CE6)
  - Smooth transitions between numbers (200ms each)
  - Loop continuously during calculation
  
  Option B - Lotus Animation:
  - Animated lotus flower opening (Lottie)
  - Purple/teal color scheme
  - Particle effects around lotus
  
  Option C - Sacred Geometry:
  - Rotating geometric patterns (circle, triangle, square)
  - Golden ratio proportions
  - Purple gradient lines

- Progress text below: "Đang tính toán số mệnh của bạn..." (fade in/out)
- Duration: 3-5 seconds typical
- Music note: Consider subtle ambient sound (optional)

Technical Implementation:
- Use React Native Reanimated for all animations
- react-native-linear-gradient for shimmer
- Optional: lottie-react-native for complex animations
- TypeScript with interfaces
- Performance: Target 60 FPS, degrade gracefully on low-end devices

Props Interfaces:
interface ShimmerProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

interface SkeletonCardProps {
  count?: number; // Number of skeleton cards
  layout?: 'grid' | 'list';
}

interface NumerologyLoaderProps {
  message?: string; // Override default loading text
  variant?: 'numbers' | 'lotus' | 'geometry';
}

Accessibility:
- Announce "Đang tải..." (Loading) to screen reader once
- Don't repeatedly announce during animation
- Provide estimated wait time if known

Performance:
- Use worklets for animations (Reanimated)
- Avoid unnecessary re-renders (React.memo)
- Reduce complexity on detected low-end devices
- Consider disabling on "reduce motion" preference

Generate:
1. ShimmerEffect.tsx (base shimmer component)
2. SkeletonCard.tsx (number card skeleton)
3. SkeletonTranscript.tsx (conversation skeleton)
4. NumerologyLoader.tsx (calculation loader with 3 variants)
5. Example usage in screens
6. Performance optimization utilities

Style: Match Vietnamese spiritual aesthetic - calm, elegant, not distracting. Loading states should feel purposeful and reassuring, not frustrating.
```

---

## Prompt 9: Error States & Empty States

```
Create error and empty state components for Numeroly React Native app with Vietnamese copy and appropriate visual design.

REQUIREMENTS:

COMPONENT 1: ERROR STATE (Generic)
- Full-screen centered layout
- Icon: Sad lotus or warning icon (80dp, purple tint)
- Primary text: Error message in Vietnamese (18pt Inter SemiBold)
- Secondary text: Helpful suggestion (14pt Inter Regular)
- CTA button: "Thử lại" (Try again) - purple accent
- Optional: "Báo cáo lỗi" (Report error) link below

Error Scenarios & Copy:

1. Network Error:
   - Icon: Wifi-off icon
   - Primary: "Không có kết nối internet"
   - Secondary: "Vui lòng kiểm tra kết nối và thử lại."
   - CTA: "Thử lại"

2. Voice Permission Error:
   - Icon: Mic-off icon
   - Primary: "Không thể truy cập microphone"
   - Secondary: "Vui lòng cho phép quyền microphone trong Cài đặt."
   -
