# Numeroly Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **Numeroly**, a Vietnamese AI voicebot that provides Pythagorean numerology insights through natural voice conversations. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines backend systems, frontend implementation, and their integration, streamlining the development process for this voice-first mobile application where these concerns are tightly coupled.

### Starter Template or Existing Project

**Decision:** Greenfield project with no starter template

**Rationale:** Given the unique requirements of Vietnamese voice processing, numerology calculations, and specialized conversation AI, starting from a clean slate provides maximum flexibility. However, we will leverage proven patterns from FastAPI for backend and React Native for mobile frontend, along with established libraries for voice processing.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-14 | 1.0 | Initial architecture document | Winston (Architect) |

## High Level Architecture

### Technical Summary

Numeroly is built as a **voice-first mobile application** using a **monolithic backend with service-ready components** deployed on **Google Cloud Platform**. The frontend uses **React Native** for cross-platform mobile development with PWA capabilities, while the backend leverages **FastAPI (Python)** for high-performance API services. The architecture integrates **Google Speech-to-Text** for Vietnamese recognition, **ElevenLabs** for natural voice synthesis, and **GPT-4 Turbo** for intelligent conversation management. Data persistence uses **PostgreSQL** with encryption-at-rest for user profiles and conversation history, while **Redis** provides session caching for real-time conversation context. This architecture achieves the PRD goals of sub-3-second voice responses, 95%+ Vietnamese speech accuracy, and secure data handling while supporting the 6-week MVP timeline through simplified deployment and proven technology choices.

### Platform and Infrastructure Choice

**Platform:** Google Cloud Platform (GCP)

**Rationale:** 
- Native integration with Google Speech-to-Text API for Vietnamese language support
- Cost-effective for 6-week MVP prototype with pay-as-you-go pricing
- Excellent auto-scaling capabilities for user testing periods
- Strong security and compliance features for healthcare-adjacent wellness app
- Cloud Run for containerized backend deployment with zero-config scaling

**Key Services:**
- **Cloud Run:** Containerized FastAPI backend with automatic scaling
- **Cloud SQL (PostgreSQL):** Managed database with encryption-at-rest
- **Cloud Storage:** User data backups and conversation audio storage
- **Cloud Speech-to-Text:** Vietnamese speech recognition
- **Cloud Memorystore (Redis):** Session caching and conversation context
- **Cloud CDN:** Frontend asset delivery for PWA
- **Cloud Load Balancing:** Distribution across regions
- **Cloud Monitoring & Logging:** Application observability

**Deployment Host and Regions:**
- Primary: `asia-southeast1` (Singapore) for low latency to Vietnamese users
- Secondary: `asia-east1` (Taiwan) for failover
- Global CDN distribution for static assets

### Repository Structure

**Structure:** Nx Monorepo with src/ layout

**Rationale:** 
- Single repository simplifies 6-week MVP development coordination
- Shared TypeScript types between frontend and backend reduce errors
- Nx provides powerful build orchestration and caching for faster CI/CD
- Dependency graph visualization helps understand project structure
- Easy code sharing for numerology calculation logic
- Atomic commits across frontend/backend changes
- Nx generators speed up scaffolding of new components/services

**Monorepo Tool:** Nx (enterprise-grade monorepo tooling)

**Package Organization:**
```
/apps
  /mobile/src     - React Native mobile app source
  /api/src        - FastAPI backend service source
/libs
  /shared/src     - Shared TypeScript types and utilities
  /numerology/src - Core numerology calculation engine
  /ui/src         - Shared React Native components
```

### High Level Architecture Diagram

```mermaid
graph TB
    subgraph "User Layer"
        U[Vietnamese User]
        M[Mobile Device - iOS/Android]
    end
    
    subgraph "Frontend - GCP Cloud CDN"
        RN[React Native PWA]
        UI[Voice UI Components]
    end
    
    subgraph "API Gateway"
        LB[Cloud Load Balancer]
        API[FastAPI Backend - Cloud Run]
    end
    
    subgraph "AI/ML Services"
        STT[Google Speech-to-Text API]
        TTS[ElevenLabs TTS API]
        GPT[OpenAI GPT-4 Turbo]
    end
    
    subgraph "Core Services"
        NUM[Numerology Engine]
        CONV[Conversation Manager]
        AUTH[Auth Service]
    end
    
    subgraph "Data Layer"
        DB[(Cloud SQL PostgreSQL)]
        CACHE[(Cloud Memorystore Redis)]
        STORAGE[Cloud Storage]
    end
    
    U -->|Voice Input| M
    M --> RN
    RN --> UI
    UI -->|API Calls| LB
    LB --> API
    
    API -->|Vietnamese Audio| STT
    API -->|Generate Voice| TTS
    API -->|Conversation AI| GPT
    
    API --> NUM
    API --> CONV
    API --> AUTH
    
    NUM --> DB
    CONV --> CACHE
    CONV --> DB
    AUTH --> DB
    
    API --> STORAGE
    
    STT -->|Transcribed Text| API
    TTS -->|Audio Stream| API
    GPT -->|Response Text| API
```

### Architectural Patterns

- **Voice-First Architecture:** All UI flows designed around voice interaction as primary input/output - _Rationale:_ Aligns with PRD requirement for natural conversation experience, reduces UI complexity and development time

- **Backend for Frontend (BFF):** FastAPI serves as optimized backend specifically for mobile voice interface needs - _Rationale:_ Simplifies mobile app by handling complex orchestration of multiple AI services server-side

- **Repository Pattern:** Data access abstracted through repository interfaces for User, Conversation, NumerologyProfile - _Rationale:_ Enables unit testing without database dependencies and future migration flexibility

- **Command Query Responsibility Segregation (CQRS) Lite:** Read-optimized conversation history separate from write-heavy real-time interactions - _Rationale:_ Conversation playback (reads) doesn't impact live voice session (writes) performance

- **Event-Driven Session Management:** Redis pub/sub for real-time conversation state updates - _Rationale:_ Maintains sub-3-second latency for voice responses with stateful conversation context

- **Circuit Breaker Pattern:** Fallback mechanisms for external AI service failures (STT, TTS, GPT-4) - _Rationale:_ Ensures graceful degradation when third-party services experience issues

- **Component-Based UI:** Reusable React Native components with TypeScript - _Rationale:_ Maintainability and type safety across the mobile app

## Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe mobile development | Strong typing prevents runtime errors, excellent IDE support, shares types with backend |
| Frontend Framework | React Native | 0.73+ | Cross-platform mobile app | Single codebase for iOS/Android, large community, PWA support via Expo |
| UI Component Library | React Native Elements | 4.0+ | Pre-built mobile UI components | Consistent design patterns, accessibility built-in, customizable themes |
| State Management | Zustand | 4.5+ | Lightweight global state | Simpler than Redux, perfect for voice session state, minimal boilerplate |
| Backend Language | Python | 3.11+ | AI/ML ecosystem compatibility | Best support for GPT-4, numerology calculations, extensive libraries |
| Backend Framework | FastAPI | 0.109+ | High-performance async API | Native async support for voice streaming, automatic OpenAPI docs, fast development |
| API Style | REST + WebSocket | - | Real-time voice and standard CRUD | REST for standard ops, WebSocket for streaming voice/conversation updates |
| Database | PostgreSQL | 15+ | Relational data with JSONB | Strong data integrity, JSONB for flexible conversation storage, native encryption |
| Cache | Redis | 7.2+ | Session state and rate limiting | In-memory speed for conversation context, pub/sub for real-time updates |
| File Storage | Google Cloud Storage | - | Conversation audio archives | Scalable object storage, encryption-at-rest, CDN integration |
| Authentication | Firebase Auth | - | User identity management | Google ecosystem integration, phone auth for Vietnamese users, JWT tokens |
| Frontend Testing | Jest + React Native Testing Library | - | Unit and component tests | Industry standard, snapshot testing, accessibility testing |
| Backend Testing | Pytest + httpx | - | API and unit testing | Async test support, fixture-based, high code coverage tools |
| E2E Testing | Detox | - | Mobile end-to-end flows | React Native native support, reliable gesture testing |
| Monorepo Tool | Nx | 18+ | Enterprise monorepo orchestration | Smart builds with caching, dependency graph, code generation, task runners |
| Build Tool | Expo | 50+ | React Native development platform | Simplified mobile builds, OTA updates, managed workflow for MVP speed |
| Bundler | Metro | - | React Native JavaScript bundling | Default for React Native, optimized for mobile, supports PWA |
| IaC Tool | Terraform | 1.7+ | Infrastructure as Code | GCP provider support, state management, reproducible deployments |
| CI/CD | GitHub Actions | - | Automated testing and deployment | Free for open source, GCP integration, parallel job execution |
| Monitoring | Google Cloud Monitoring + Sentry | - | Application observability | GCP native monitoring, Sentry for error tracking across frontend/backend |
| Logging | Google Cloud Logging + Structured Logging | - | Centralized log aggregation | Query conversation flows, debug voice processing issues, compliance audit trails |
| CSS Framework | NativeWind | 4.0+ | Tailwind for React Native | Rapid UI development, consistent design system, small bundle size |

## Data Models

### User

**Purpose:** Represents a registered user with their personal information needed for numerology calculations and account management.

**Key Attributes:**
- `id`: UUID - Unique identifier
- `phoneNumber`: string - Primary authentication identifier for Vietnamese users
- `fullName`: string - Full name in Vietnamese for Destiny number calculation
- `birthDate`: Date - Date of birth for Life Path and timing calculations
- `email`: string (optional) - Secondary contact
- `createdAt`: Date - Account creation timestamp
- `lastActiveAt`: Date - Last conversation or login time
- `preferences`: JSON - Voice settings, notification preferences, language dialect

#### TypeScript Interface

```typescript
interface User {
  id: string;
  phoneNumber: string;
  fullName: string;
  birthDate: Date;
  email?: string;
  createdAt: Date;
  lastActiveAt: Date;
  preferences: {
    voiceSpeed?: number; // 0.5 to 2.0
    voiceTone?: 'warm' | 'neutral' | 'energetic';
    volume?: number; // 0.0 to 1.0
    notificationsEnabled?: boolean;
    dialectPreference?: 'northern' | 'southern' | 'central';
    interactionStyle?: 'formal' | 'casual';
  };
}
```

#### Relationships
- Has one NumerologyProfile
- Has many Conversations
- Has many JournalEntries

### NumerologyProfile

**Purpose:** Stores calculated numerology numbers and interpretations for a user, cached for performance.

**Key Attributes:**
- `userId`: UUID - Foreign key to User
- `lifePathNumber`: number (1-9, 11, 22, 33) - Core life purpose number
- `destinyNumber`: number - Full name calculation result
- `soulUrgeNumber`: number - Vowels-based inner desire number
- `personalityNumber`: number - Consonants-based outer impression number
- `currentPersonalYear`: number - Year cycle (1-9)
- `currentPersonalMonth`: number - Month cycle (1-9)
- `calculatedAt`: Date - Last calculation timestamp
- `interpretations`: JSON - Cached Vietnamese interpretations

#### TypeScript Interface

```typescript
interface NumerologyProfile {
  userId: string;
  lifePathNumber: number;
  destinyNumber: number;
  soulUrgeNumber: number;
  personalityNumber: number;
  currentPersonalYear: number;
  currentPersonalMonth: number;
  calculatedAt: Date;
  interpretations: {
    lifePathInterpretation: string;
    destinyInterpretation: string;
    soulUrgeInterpretation: string;
    personalityInterpretation: string;
    personalYearGuidance: string;
    personalMonthGuidance: string;
  };
}
```

#### Relationships
- Belongs to User (1:1)

### Conversation

**Purpose:** Represents a single conversation session between user and voicebot, tracking context and emotional state.

**Key Attributes:**
- `id`: UUID - Unique conversation identifier
- `userId`: UUID - Foreign key to User
- `startedAt`: Date - Conversation start time
- `endedAt`: Date (nullable) - Conversation end time
- `status`: enum - 'active' | 'completed' | 'abandoned'
- `emotionalTags`: string[] - ['seeking_guidance', 'stressed', 'curious', etc.]
- `primaryTopic`: string - Main theme discussed
- `satisfactionRating`: number (nullable) - 1-5 user rating
- `sessionId`: string - Redis session key for active conversations

#### TypeScript Interface

```typescript
interface Conversation {
  id: string;
  userId: string;
  startedAt: Date;
  endedAt?: Date;
  status: 'active' | 'completed' | 'abandoned';
  emotionalTags: string[];
  primaryTopic: string;
  satisfactionRating?: number;
  sessionId: string;
  summary?: string; // AI-generated summary post-conversation
}
```

#### Relationships
- Belongs to User
- Has many ConversationMessages

### ConversationMessage

**Purpose:** Individual voice exchanges within a conversation, storing both audio and transcribed text.

**Key Attributes:**
- `id`: UUID - Message identifier
- `conversationId`: UUID - Foreign key to Conversation
- `role`: enum - 'user' | 'assistant'
- `messageType`: enum - 'voice' | 'text' | 'system'
- `textContent`: string - Transcribed or generated text
- `audioUrl`: string (nullable) - Cloud Storage URL for audio file
- `timestamp`: Date - Message creation time
- `emotionalTone`: string (nullable) - Detected emotion (for user) or intended tone (for assistant)
- `metadata`: JSON - STT confidence, TTS latency, etc.

#### TypeScript Interface

```typescript
interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  messageType: 'voice' | 'text' | 'system';
  textContent: string;
  audioUrl?: string;
  timestamp: Date;
  emotionalTone?: string;
  metadata: {
    sttConfidence?: number;
    ttsLatency?: number;
    gptTokens?: number;
    processingTimeMs?: number;
  };
}
```

#### Relationships
- Belongs to Conversation

### JournalEntry

**Purpose:** User's personal reflections and notes added to conversation history.

**Key Attributes:**
- `id`: UUID - Entry identifier
- `userId`: UUID - Foreign key to User
- `conversationId`: UUID (nullable) - Optional link to related conversation
- `entryText`: string - User's journal note
- `createdAt`: Date - Entry creation time
- `tags`: string[] - User-defined tags for organization

#### TypeScript Interface

```typescript
interface JournalEntry {
  id: string;
  userId: string;
  conversationId?: string;
  entryText: string;
  createdAt: Date;
  tags: string[];
}
```

#### Relationships
- Belongs to User
- Optionally belongs to Conversation

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Numeroly API
  version: 1.0.0
  description: Vietnamese AI Voicebot for Pythagorean Numerology - Backend API

servers:
  - url: https://api.numeroly.app/v1
    description: Production API (GCP Cloud Run)
  - url: http://localhost:8000/v1
    description: Local development

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        phoneNumber:
          type: string
        fullName:
          type: string
        birthDate:
          type: string
          format: date
        email:
          type: string
          format: email
        preferences:
          type: object

    NumerologyProfile:
      type: object
      properties:
        userId:
          type: string
          format: uuid
        lifePathNumber:
          type: integer
        destinyNumber:
          type: integer
        soulUrgeNumber:
          type: integer
        personalityNumber:
          type: integer
        currentPersonalYear:
          type: integer
        currentPersonalMonth:
          type: integer
        interpretations:
          type: object

    Conversation:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        startedAt:
          type: string
          format: date-time
        endedAt:
          type: string
          format: date-time
        status:
          type: string
          enum: [active, completed, abandoned]
        emotionalTags:
          type: array
          items:
            type: string
        primaryTopic:
          type: string

    ConversationMessage:
      type: object
      properties:
        id:
          type: string
          format: uuid
        conversationId:
          type: string
          format: uuid
        role:
          type: string
          enum: [user, assistant]
        textContent:
          type: string
        audioUrl:
          type: string
        timestamp:
          type: string
          format: date-time

paths:
  /auth/register:
    post:
      summary: Register new user with phone number
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                phoneNumber:
                  type: string
                verificationCode:
                  type: string
      responses:
        '201':
          description: User registered successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'

  /auth/login:
    post:
      summary: Login with phone number
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                phoneNumber:
                  type: string
                verificationCode:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  accessToken:
                    type: string
                  refreshToken:
                    type: string
                  user:
                    $ref: '#/components/schemas/User'

  /users/me:
    get:
      summary: Get current user profile
      tags: [Users]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: User profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
    
    patch:
      summary: Update user profile
      tags: [Users]
      security:
        - BearerAuth: []
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                fullName:
                  type: string
                birthDate:
                  type: string
                  format: date
                preferences:
                  type: object
      responses:
        '200':
          description: Profile updated successfully

  /numerology/profile:
    get:
      summary: Get user's numerology profile
      tags: [Numerology]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Numerology profile retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NumerologyProfile'
    
    post:
      summary: Calculate or recalculate numerology profile
      tags: [Numerology]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Profile calculated successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NumerologyProfile'

  /numerology/insight:
    post:
      summary: Get personalized numerology insight for a question
      tags: [Numerology]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                question:
                  type: string
                context:
                  type: string
      responses:
        '200':
          description: Insight generated
          content:
            application/json:
              schema:
                type: object
                properties:
                  insight:
                    type: string
                  relevantNumbers:
                    type: array
                    items:
                      type: integer

  /conversations:
    get:
      summary: List user's conversation history
      tags: [Conversations]
      security:
        - BearerAuth: []
      parameters:
        - in: query
          name: limit
          schema:
            type: integer
            default: 20
        - in: query
          name: offset
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Conversation list retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  conversations:
                    type: array
                    items:
                      $ref: '#/components/schemas/Conversation'
                  total:
                    type: integer
    
    post:
      summary: Start new conversation
      tags: [Conversations]
      security:
        - BearerAuth: []
      responses:
        '201':
          description: Conversation started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Conversation'

  /conversations/{conversationId}:
    get:
      summary: Get conversation details with messages
      tags: [Conversations]
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: conversationId
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Conversation retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  conversation:
                    $ref: '#/components/schemas/Conversation'
                  messages:
                    type: array
                    items:
                      $ref: '#/components/schemas/ConversationMessage'
    
    patch:
      summary: Update conversation (e.g., end, rate)
      tags: [Conversations]
      security:
        - BearerAuth: []
      parameters:
        - in: path
          name: conversationId
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  enum: [completed, abandoned]
                satisfactionRating:
                  type: integer
                  minimum: 1
                  maximum: 5
      responses:
        '200':
          description: Conversation updated

  /voice/transcribe:
    post:
      summary: Transcribe Vietnamese audio to text
      tags: [Voice]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                audio:
                  type: string
                  format: binary
                conversationId:
                  type: string
                  format: uuid
      responses:
        '200':
          description: Audio transcribed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  text:
                    type: string
                  confidence:
                    type: number
                  messageId:
                    type: string
                    format: uuid

  /voice/synthesize:
    post:
      summary: Generate Vietnamese voice audio from text
      tags: [Voice]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                text:
                  type: string
                emotionalTone:
                  type: string
                  enum: [warm, neutral, energetic]
                conversationId:
                  type: string
                  format: uuid
      responses:
        '200':
          description: Audio generated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  audioUrl:
                    type: string
                  durationMs:
                    type: integer
                  messageId:
                    type: string
                    format: uuid

  /journal:
    get:
      summary: List user's journal entries
      tags: [Journal]
      security:
        - BearerAuth: []
      responses:
        '200':
          description: Journal entries retrieved
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
    
    post:
      summary: Create journal entry
      tags: [Journal]
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                entryText:
                  type: string
                conversationId:
                  type: string
                  format: uuid
                tags:
                  type: array
                  items:
                    type: string
      responses:
        '201':
          description: Journal entry created
```

### WebSocket Endpoints

**`/ws/conversation/{conversationId}`**

Real-time bidirectional communication for streaming voice conversations.

**Client → Server Messages:**
```typescript
{
  type: 'audio_chunk',
  data: ArrayBuffer, // Audio data chunk
  sequenceNumber: number
}

{
  type: 'end_input',
  conversationId: string
}
```

**Server → Client Messages:**
```typescript
{
  type: 'transcription',
  text: string,
  confidence: number,
  isFinal: boolean
}

{
  type: 'assistant_response',
  text: string,
  audioUrl: string,
  emotionalTone: string
}

{
  type: 'audio_chunk',
  data: ArrayBuffer, // TTS audio chunk for streaming playback
  sequenceNumber: number
}

{
  type: 'processing_status',
  status: 'transcribing' | 'thinking' | 'synthesizing' | 'complete'
}

{
  type: 'error',
  code: string,
  message: string
}
```

## Components

### Voice Input Service (Frontend)

**Responsibility:** Capture audio from device microphone, chunk for streaming, and send to backend via WebSocket

**Key Interfaces:**
- `startRecording()`: Begin audio capture
- `stopRecording()`: End audio capture and finalize
- `getAudioStream()`: Access real-time audio chunks
- `setRecordingConfig(config)`: Configure sample rate, codec

**Dependencies:** React Native Audio API, WebSocket connection manager

**Technology Stack:** React Native `react-native-audio-recorder-player`, WebRTC getUserMedia for web, PCM audio encoding

### Voice Output Service (Frontend)

**Responsibility:** Play synthesized Vietnamese voice responses with playback controls

**Key Interfaces:**
- `playAudio(audioUrl)`: Play audio from URL
- `playAudioStream(chunks)`: Stream audio playback
- `pause()`, `resume()`, `stop()`: Playback controls
- `setVolume(level)`: Volume control

**Dependencies:** Device audio player

**Technology Stack:** React Native `react-native-sound`, `react-native-track-player` for advanced controls

### Conversation State Manager (Frontend)

**Responsibility:** Manage active conversation state, message history, and sync with backend

**Key Interfaces:**
- `createConversation()`: Start new conversation session
- `sendMessage(message)`: Add user message
- `receiveMessage(message)`: Handle assistant response
- `getConversationHistory()`: Retrieve message list
- `endConversation(rating)`: Close session

**Dependencies:** Zustand store, API client, WebSocket manager

**Technology Stack:** Zustand for state, React Query for API caching, WebSocket client

### API Client Service (Frontend)

**Responsibility:** HTTP REST client for all backend communication (non-WebSocket)

**Key Interfaces:**
- `auth.login(credentials)`: Authentication
- `users.getProfile()`, `users.updateProfile(data)`: User operations
- `numerology.getProfile()`, `numerology.getInsight(question)`: Numerology ops
- `conversations.list()`, `conversations.get(id)`: Conversation history
- `journal.list()`, `journal.create(entry)`: Journal operations

**Dependencies:** HTTP client library

**Technology Stack:** Axios with TypeScript, automatic retry logic, token refresh interceptor

### Speech-to-Text Service (Backend)

**Responsibility:** Convert Vietnamese audio streams to text using Google Speech-to-Text API

**Key Interfaces:**
- `transcribeAudio(audioBuffer, conversationId)`: Transcribe audio chunk
- `finalizeTranscription(conversationId)`: Get final transcription
- `getConfidenceScore(transcriptionId)`: STT confidence level

**Dependencies:** Google Cloud Speech-to-Text API, Audio processing utilities

**Technology Stack:** FastAPI endpoint, `google-cloud-speech` Python SDK, async audio streaming

### Text-to-Speech Service (Backend)

**Responsibility:** Generate natural Vietnamese voice from text using ElevenLabs API

**Key Interfaces:**
- `synthesizeVoice(text, emotionalTone, voiceId)`: Generate audio
- `streamAudio(text, emotionalTone)`: Stream audio chunks for real-time playback
- `estimateLatency(text)`: Predict TTS processing time

**Dependencies:** ElevenLabs API, Cloud Storage for audio caching

**Technology Stack:** FastAPI endpoint, `elevenlabs` Python SDK, audio format conversion (MP3 → PCM)

### Conversation AI Service (Backend)

**Responsibility:** Manage conversation flow, context, and generate empathetic responses using GPT-4 Turbo

**Key Interfaces:**
- `processUserInput(text, conversationId, userId)`: Generate assistant response
- `updateContext(conversationId, newContext)`: Maintain conversation memory
- `getEmotionalTone(text)`: Detect user emotion
- `generateInsight(numerologyProfile, question)`: Personalized advice

**Dependencies:** OpenAI GPT-4 API, Redis for session context, NumerologyProfile repository

**Technology Stack:** FastAPI endpoint, `openai` Python SDK, custom prompt engineering, Redis session store

### Numerology Calculation Engine (Backend - Shared Package)

**Responsibility:** Core Pythagorean numerology calculations following traditional methods

**Key Interfaces:**
- `calculateLifePath(birthDate)`: Life Path number from date
- `calculateDestiny(fullName)`: Destiny number from name
- `calculateSoulUrge(fullName)`: Soul number from vowels
- `calculatePersonality(fullName)`: Personality from consonants
- `calculatePersonalYear(birthDate, currentYear)`: Year cycle
- `calculatePersonalMonth(birthDate, currentYear, currentMonth)`: Month cycle
- `getInterpretation(numberType, value, language)`: Vietnamese interpretation text

**Dependencies:** None (pure calculation logic)

**Technology Stack:** Python with type hints, Vietnamese character mapping, extensive unit tests

### User Repository (Backend)

**Responsibility:** Data access layer for User entity CRUD operations

**Key Interfaces:**
- `create(userData)`: Create new user
- `findById(userId)`: Get user by ID
- `findByPhoneNumber(phone)`: Get user by phone
- `update(userId, data)`: Update user data
- `delete(userId)`: Soft delete user

**Dependencies:** PostgreSQL database connection, SQLAlchemy ORM

**Technology Stack:** SQLAlchemy async session, PostgreSQL with encryption, query optimization

### Conversation Repository (Backend)

**Responsibility:** Data access layer for Conversation and ConversationMessage entities

**Key Interfaces:**
- `createConversation(userId)`: Start new conversation
- `getConversation(conversationId)`: Get conversation with messages
- `listConversations(userId, limit, offset)`: Paginated history
- `addMessage(conversationId, message)`: Append message
- `updateConversation(conversationId, updates)`: Update status, rating
- `archiveConversation(conversationId)`: Move to cold storage

**Dependencies:** PostgreSQL database, Cloud Storage for audio files

**Technology Stack:** SQLAlchemy ORM, PostgreSQL JSONB for flexible message metadata, Cloud Storage SDK

### Authentication Middleware (Backend)

**Responsibility:** Verify JWT tokens, enforce authentication, and manage sessions

**Key Interfaces:**
- `verifyToken(token)`: Validate JWT and extract user claims
- `requireAuth(endpoint)`: Decorator for protected routes
- `refreshToken(refreshToken)`: Issue new access token
- `revokeToken(token)`: Blacklist token on logout

**Dependencies:** Firebase Auth SDK, Redis for token blacklist

**Technology Stack:** FastAPI dependency injection, `firebase-admin` SDK, JWT library

## External APIs

### Google Cloud Speech-to-Text API

- **Purpose:** Convert Vietnamese voice input to text with high accuracy
- **Documentation:** https://cloud.google.com/speech-to-text/docs
- **Base URL(s):** 
  - REST: `https://speech.googleapis.com/v1`
  - gRPC: Streaming recognition via gRPC
- **Authentication:** Google Cloud Service Account with JSON key
- **Rate Limits:** 1,000 minutes of audio per day (free tier), then pay-as-you-go

**Key Endpoints Used:**
- `POST /v1/speech:recognize` - Synchronous speech recognition
- `POST /v1/speech:longrunningrecognize` - Async for longer audio
- gRPC `StreamingRecognize` - Real-time streaming for live conversation

**Integration Notes:**
- Configure Vietnamese language code: `vi-VN`
- Use enhanced model for better accuracy: `command_and_search`
- Enable automatic punctuation for natural transcription
- Set `single_utterance: false` for continuous conversation
- Handle interim results for real-time UI feedback

### ElevenLabs Text-to-Speech API

- **Purpose:** Generate natural, emotionally modulated Vietnamese voice responses
- **Documentation:** https://docs.elevenlabs.io/
- **Base URL(s):** `https://api.elevenlabs.io/v1`
- **Authentication:** API key in `xi-api-key` header
- **Rate Limits:** 10,000 characters per month (free tier), 30 requests/min

**Key Endpoints Used:**
- `POST /text-to-speech/{voice_id}` - Generate speech from text
- `POST /text-to-speech/{voice_id}/stream` - Stream audio chunks for low latency
- `GET /voices` - List available Vietnamese voice models

**Integration Notes:**
- Use pre-trained Vietnamese voice or clone custom voice for brand consistency
- Configure emotional parameters: `stability`, `similarity_boost`, `style`
- Request MP3 format for smaller file sizes, convert to PCM for mobile playback
- Implement caching strategy for common phrases to reduce API costs
- Monitor latency to stay under 3-second PRD requirement

### OpenAI GPT-4 Turbo API

- **Purpose:** Power intelligent conversation management and personalized numerology insights
- **Documentation:** https://platform.openai.com/docs/api-reference
- **Base URL(s):** `https://api.openai.com/v1`
- **Authentication:** Bearer token with API key
- **Rate Limits:** 10,000 requests/min (tier dependent), 2M tokens/min

**Key Endpoints Used:**
- `POST /chat/completions` - Generate conversation responses with context
- `POST /embeddings` - Convert conversation history to vectors for similarity search (future feature)

**Integration Notes:**
- Use `gpt-4-turbo-preview` model for best Vietnamese language support
- Implement custom system prompt with:
  - Pythagorean numerology knowledge base
  - Vietnamese cultural context and communication style
  - Empathetic conversation patterns
  - User's numerology profile injection
- Set `temperature: 0.7` for warm, varied responses
- Configure `max_tokens: 500` to control response length for voice
- Implement token counting to manage costs (target <1,000 tokens per conversation turn)
- Use conversation history context (last 5-10 messages) for coherent multi-turn dialogs
- Add safety guardrails to avoid inappropriate advice or medical claims

### Firebase Authentication API

- **Purpose:** Manage user authentication with phone number verification (SMS OTP)
- **Documentation:** https://firebase.google.com/docs/auth
- **Base URL(s):** Firebase Admin SDK (server-side), Firebase Auth REST API
- **Authentication:** Service account credentials (server), Firebase config (client)
- **Rate Limits:** 10 SMS per phone number per hour

**Key Operations:**
- Phone number verification flow with SMS OTP
- JWT token generation and validation
- User session management
- Security rules enforcement

**Integration Notes:**
- Enable Phone Authentication provider in Firebase Console
- Configure Vietnamese phone number format: `+84XXXXXXXXX`
- Use reCAPTCHA for web to prevent SMS abuse
- Implement exponential backoff for failed verification attempts
- Store Firebase UID as `firebaseUid` in User table for linkage
- Use Firebase Admin SDK server-side for secure token verification

## Core Workflows

### User Registration and Onboarding Flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant API as FastAPI Backend
    participant FB as Firebase Auth
    participant DB as PostgreSQL
    participant NUM as Numerology Engine

    U->>M: Opens app for first time
    M->>U: Show welcome screen
    U->>M: Tap "Start with Voice"
    M->>U: Request phone number
    U->>M: Enter phone number (+84...)
    M->>FB: Request SMS OTP
    FB->>U: Send SMS code
    U->>M: Enter OTP code
    M->>FB: Verify OTP
    FB->>M: Return Firebase token
    M->>API: POST /auth/register {token, phone}
    API->>FB: Verify Firebase token
    FB->>API: Token valid
    API->>DB: Create User record
    DB->>API: User created (id)
    API->>M: Return JWT + User object
    
    M->>U: Show onboarding: "Let's learn about you"
    U->>M: Speak/type full name
    M->>API: PATCH /users/me {fullName}
    API->>DB: Update User
    U->>M: Speak/select birth date
    M->>API: PATCH /users/me {birthDate}
    API->>DB: Update User
    
    M->>API: POST /numerology/profile
    API->>NUM: Calculate all numbers
    NUM->>API: Return numerology calculations
    API->>DB: Store NumerologyProfile
    DB->>API: Profile saved
    API->>M: Return NumerologyProfile
    
    M->>U: Show personalized welcome with Life Path number
    M->>U: "Ready for your first conversation?"
```

### Voice Conversation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant WS as WebSocket
    participant API as FastAPI Backend
    participant STT as Google Speech-to-Text
    participant GPT as GPT-4 Turbo
    participant TTS as ElevenLabs TTS
    participant REDIS as Redis Cache
    participant DB as PostgreSQL

    U->>M: Tap voice button
    M->>API: POST /conversations (start new)
    API->>DB: Create Conversation record
    API->>REDIS: Create session context
    API->>M: Return conversationId
    M->>WS: Connect to /ws/conversation/{id}
    WS->>M: Connection established
    
    M->>U: Show "Listening..." animation
    U->>M: Speaks in Vietnamese
    M->>WS: Send audio chunks (streaming)
    WS->>STT: Stream audio to Speech-to-Text
    STT->>WS: Return interim transcriptions
    WS->>M: Forward interim text
    M->>U: Display transcription in real-time
    
    U->>M: Stops speaking
    M->>WS: Send end_input signal
    STT->>WS: Final transcription + confidence
    WS->>API: Process complete user message
    API->>DB: Save ConversationMessage (user)
    
    API->>REDIS: Retrieve conversation context
    API->>GPT: Generate response with context + numerology profile
    Note over API,GPT: Includes: user question, last 5 messages,<br/>numerology numbers, emotional tone
    GPT->>API: Return response text
    API->>DB: Save ConversationMessage (assistant)
    API->>REDIS: Update conversation context
    
    API->>TTS: Synthesize Vietnamese voice
    TTS->>API: Return audio URL (or stream)
    API->>WS: Send response {text, audioUrl}
    WS->>M: Forward response
    M->>U: Display text + play audio
    
    U->>M: Tap voice button again (continue)
    Note over M,DB: Repeat cycle with maintained context
    
    U->>M: Tap "End Conversation"
    M->>API: PATCH /conversations/{id} {status: completed}
    API->>DB: Update Conversation status
    M->>U: Request satisfaction rating
    U->>M: Select 1-5 stars
    M->>API: PATCH /conversations/{id} {rating}
    API->>DB: Save rating
    M->>U: Show conversation summary
```

### Numerology Insight Generation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as Mobile App
    participant API as FastAPI Backend
    participant DB as PostgreSQL
    participant NUM as Numerology Engine
    participant GPT as GPT-4 Turbo

    U->>M: Voice/text: "What career path suits me?"
    M->>API: POST /numerology/insight {question, context}
    API->>DB: Get User's NumerologyProfile
    DB->>API: Return profile data
    
    API->>NUM: Get current timing (Personal Year/Month)
    NUM->>API: Calculate current cycles
    
    API->>GPT: Generate personalized advice
    Note over API,GPT: Prompt includes:<br/>- User's question<br/>- Life Path, Destiny numbers<br/>- Current Personal Year/Month<br/>- Interpretations<br/>- Conversation context
    GPT->>API: Return tailored insight
    
    API->>M: Return {insight, relevantNumbers}
    M->>U: Display/speak insight
    M->>U: Show related numerology numbers highlighted
```

## Database Schema

### SQL Schema (PostgreSQL)

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    firebase_uid VARCHAR(128) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    preferences JSONB DEFAULT '{}',
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete
    
    CONSTRAINT valid_phone_number CHECK (phone_number ~ '^\+84[0-9]{9,10}$')
);

CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_users_firebase_uid ON users(firebase_uid);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Numerology Profiles table
CREATE TABLE numerology_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    life_path_number INTEGER NOT NULL CHECK (life_path_number BETWEEN 1 AND 33),
    destiny_number INTEGER NOT NULL CHECK (destiny_number BETWEEN 1 AND 33),
    soul_urge_number INTEGER NOT NULL CHECK (soul_urge_number BETWEEN 1 AND 33),
    personality_number INTEGER NOT NULL CHECK (personality_number BETWEEN 1 AND 33),
    current_personal_year INTEGER NOT NULL CHECK (current_personal_year BETWEEN 1 AND 9),
    current_personal_month INTEGER NOT NULL CHECK (current_personal_month BETWEEN 1 AND 9),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    interpretations JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_numerology_calculated_at ON numerology_profiles(calculated_at);

-- Conversations table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    emotional_tags TEXT[] DEFAULT '{}',
    primary_topic VARCHAR(255),
    satisfaction_rating INTEGER CHECK (satisfaction_rating BETWEEN 1 AND 5),
    session_id VARCHAR(128) UNIQUE,
    summary TEXT,
    
    CONSTRAINT valid_ended_at CHECK (ended_at IS NULL OR ended_at > started_at)
);

CREATE INDEX idx_conversations_user ON conversations(user_id, started_at DESC);
CREATE INDEX idx_conversations_status ON conversations(status);
CREATE INDEX idx_conversations_session ON conversations(session_id);

-- Conversation Messages table
CREATE TABLE conversation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    message_type VARCHAR(20) NOT NULL CHECK (message_type IN ('voice', 'text', 'system')),
    text_content TEXT NOT NULL,
    audio_url VARCHAR(512),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    emotional_tone VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    
    CONSTRAINT valid_audio_url CHECK (audio_url IS NULL OR audio_url ~ '^https?://')
);

CREATE INDEX idx_messages_conversation ON conversation_messages(conversation_id, timestamp ASC);
CREATE INDEX idx_messages_timestamp ON conversation_messages(timestamp DESC);

-- Journal Entries table
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    entry_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    tags TEXT[] DEFAULT '{}'
);

CREATE INDEX idx_journal_user ON journal_entries(user_id, created_at DESC);
CREATE INDEX idx_journal_conversation ON journal_entries(conversation_id);
CREATE INDEX idx_journal_tags ON journal_entries USING GIN(tags);

-- Enable Row Level Security for data isolation
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- Encryption for sensitive fields (example for future implementation)
-- Users' full names and birth dates can be encrypted at application level
-- Or using PostgreSQL pgcrypto:
-- UPDATE users SET full_name = pgp_sym_encrypt(full_name, 'encryption_key');
```

### Database Indexes Strategy

**Query Optimization:**
- `idx_users_phone` - Fast user lookup during login
- `idx_conversations_user` - Efficient conversation history retrieval (DESC for most recent first)
- `idx_messages_conversation` - Quick message fetching within conversations (ASC for chronological display)
- `idx_journal_tags` - GIN index for array containment searches on tags

**Performance Considerations:**
- Use `TIMESTAMP WITH TIME ZONE` for proper timezone handling across regions
- JSONB for flexible `preferences`, `interpretations`, and `metadata` allows schema evolution
- Soft delete with `deleted_at` for users (compliance with data retention policies)
- Foreign key cascades configured for data consistency

## Frontend Architecture

### Component Architecture

#### Component Organization

```
apps/mobile/src/components/
├── voice/
│   ├── VoiceButton.tsx            # Main voice activation button
│   ├── WaveformVisualizer.tsx     # Real-time audio waveform
│   ├── TranscriptionDisplay.tsx   # Live transcription text
│   └── AudioPlayer.tsx            # Voice response playback controls
├── conversation/
│   ├── ConversationView.tsx       # Active conversation screen
│   ├── MessageBubble.tsx          # Individual message display
│   ├── ConversationList.tsx       # History list view
│   └── ConversationCard.tsx       # Summary card for list
├── numerology/
│   ├── NumerologyDashboard.tsx    # User's numerology profile display
│   ├── NumberCard.tsx             # Individual number with interpretation
│   ├── TimingCycle.tsx            # Personal Year/Month display
│   └── InsightPanel.tsx           # Detailed numerology insight
├── onboarding/
│   ├── WelcomeScreen.tsx          # Initial landing
│   ├── PhoneAuthScreen.tsx        # Phone number + OTP verification
│   ├── ProfileSetupScreen.tsx     # Name and birthdate collection
│   └── NumerologyIntroScreen.tsx  # Educational numerology overview
├── journal/
│   ├── JournalView.tsx            # Journal list and editor
│   ├── JournalEntry.tsx           # Individual entry card
│   └── TagSelector.tsx            # Tag management UI
├── shared/
│   ├── Button.tsx                 # Branded button component
│   ├── Card.tsx                   # Consistent card container
│   ├── Input.tsx                  # Form input with validation
│   ├── LoadingSpinner.tsx         # Loading state indicator
│   └── ErrorBoundary.tsx          # Error handling wrapper
└── navigation/
    ├── RootNavigator.tsx          # Main app navigation
    ├── AuthNavigator.tsx          # Authentication flow navigation
    └── TabNavigator.tsx           # Bottom tab navigation
```

#### Component Template

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@rneui/themed';
import { useConversationStore } from '@/stores/conversationStore';

interface VoiceButtonProps {
  onPress: () => void;
  isRecording: boolean;
  disabled?: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onPress,
  isRecording,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const conversationId = useConversationStore((state) => state.activeConversationId);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        isRecording && styles.recording,
        disabled && styles.disabled,
      ]}
      accessibilityLabel={isRecording ? 'Stop recording' : 'Start recording'}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        {isRecording ? (
          <StopIcon color={theme.colors.error} size={32} />
        ) : (
          <MicrophoneIcon color={theme.colors.primary} size={32} />
        )}
      </View>
      <Text style={[styles.label, { color: theme.colors.text }]}>
        {isRecording ? 'Đang nghe...' : 'Nhấn để nói'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  recording: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  disabled: {
    opacity: 0.5,
  },
  iconContainer: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
```

### State Management Architecture

#### State Structure

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
}

// stores/conversationStore.ts
interface ConversationState {
  activeConversationId: string | null;
  conversations: Conversation[];
  currentMessages: ConversationMessage[];
  isRecording: boolean;
  isProcessing: boolean;
  transcriptionText: string;
  
  startConversation: () => Promise<string>;
  endConversation: (rating?: number) => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  fetchConversations: (limit?: number) => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
}

// stores/numerologyStore.ts
interface NumerologyState {
  profile: NumerologyProfile | null;
  isLoading: boolean;
  error: Error | null;
  
  fetchProfile: () => Promise<void>;
  recalculateProfile: () => Promise<void>;
  getInsight: (question: string) => Promise<string>;
}

// stores/voiceStore.ts
interface VoiceState {
  isPlaying: boolean;
  currentAudioUrl: string | null;
  volume: number;
  playbackPosition: number;
  
  playAudio: (url: string) => Promise<void>;
  pauseAudio: () => void;
  resumeAudio: () => void;
  stopAudio: () => void;
  setVolume: (level: number) => void;
}
```

#### State Management Patterns

- **Single Source of Truth:** Each domain (auth, conversation, numerology) has one Zustand store
- **Derived State:** Use selectors to compute values from stored state
- **Optimistic Updates:** Update UI immediately, rollback on server error
- **Persistence:** Persist auth tokens and user preferences to device storage (AsyncStorage)
- **Middleware:** Use Zustand middleware for logging, persistence, and devtools

### Routing Architecture

#### Route Organization

```typescript
// navigation/RootNavigator.tsx
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuthStore } from '@/stores/authStore';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  ConversationDetail: { conversationId: string };
  NumerologyDashboard: undefined;
  Journal: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen 
              name="ConversationDetail" 
              component={ConversationDetailScreen}
              options={{ presentation: 'modal' }}
            />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// navigation/TabNavigator.tsx
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Tab = createBottomTabNavigator();

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#D4AF37',
        tabBarInactiveTintColor: '#666',
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Conversation" 
        component={ConversationScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MicIcon color={color} size={size} />,
          tabBarLabel: 'Trò chuyện',
        }}
      />
      <Tab.Screen 
        name="Dashboard" 
        component={NumerologyDashboard}
        options={{
          tabBarIcon: ({ color, size }) => <StarIcon color={color} size={size} />,
          tabBarLabel: 'Số học',
        }}
      />
      <Tab.Screen 
        name="History" 
        component={ConversationListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <HistoryIcon color={color} size={size} />,
          tabBarLabel: 'Lịch sử',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => <ProfileIcon color={color} size={size} />,
          tabBarLabel: 'Tôi',
        }}
      />
    </Tab.Navigator>
  );
};
```

#### Protected Route Pattern

```typescript
// components/ProtectedRoute.tsx
import React from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useNavigation } from '@react-navigation/native';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const navigation = useNavigation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
    }
  }, [isAuthenticated, navigation]);

  if (!isAuthenticated) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
};
```

### Frontend Services Layer

#### API Client Setup

```typescript
// services/api-client.ts
import axios, { AxiosInstance, AxiosError } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import Config from 'react-native-config';

const API_BASE_URL = Config.API_URL || 'http://localhost:8000/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().accessToken;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await useAuthStore.getState().refreshAccessToken();
            const newToken = useAuthStore.getState().accessToken;
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            await useAuthStore.getState().logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  public getInstance(): AxiosInstance {
    return this.client;
  }
}

export const apiClient = new ApiClient().getInstance();
```

#### Service Example

```typescript
// services/conversationService.ts
import { apiClient } from './api-client';
import type { Conversation, ConversationMessage, CreateConversationResponse } from '@/types';

export const conversationService = {
  async startConversation(): Promise<CreateConversationResponse> {
    const response = await apiClient.post<CreateConversationResponse>('/conversations');
    return response.data;
  },

  async getConversations(limit = 20, offset = 0): Promise<Conversation[]> {
    const response = await apiClient.get<{ conversations: Conversation[] }>('/conversations', {
      params: { limit, offset },
    });
    return response.data.conversations;
  },

  async getConversationDetail(conversationId: string): Promise<{
    conversation: Conversation;
    messages: ConversationMessage[];
  }> {
    const response = await apiClient.get(`/conversations/${conversationId}`);
    return response.data;
  },

  async endConversation(conversationId: string, rating?: number): Promise<void> {
    await apiClient.patch(`/conversations/${conversationId}`, {
      status: 'completed',
      satisfactionRating: rating,
    });
  },

  async transcribeAudio(
    audioBlob: Blob,
    conversationId: string
  ): Promise<{ text: string; confidence: number; messageId: string }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');
    formData.append('conversationId', conversationId);

    const response = await apiClient.post('/voice/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async synthesizeVoice(
    text: string,
    emotionalTone: string,
    conversationId: string
  ): Promise<{ audioUrl: string; durationMs: number; messageId: string }> {
    const response = await apiClient.post('/voice/synthesize', {
      text,
      emotionalTone,
      conversationId,
    });
    return response.data;
  },
};

// services/numerologyService.ts
import { apiClient } from './api-client';
import type { NumerologyProfile } from '@/types';

export const numerologyService = {
  async getProfile(): Promise<NumerologyProfile> {
    const response = await apiClient.get<NumerologyProfile>('/numerology/profile');
    return response.data;
  },

  async recalculateProfile(): Promise<NumerologyProfile> {
    const response = await apiClient.post<NumerologyProfile>('/numerology/profile');
    return response.data;
  },

  async getInsight(question: string, context?: string): Promise<{
    insight: string;
    relevantNumbers: number[];
  }> {
    const response = await apiClient.post('/numerology/insight', {
      question,
      context,
    });
    return response.data;
  },
};
```

## Backend Architecture

### Service Architecture - Serverless Functions

#### Function Organization

```
apps/api/src/
├── main.py                        # FastAPI application entry point
├── config.py                      # Configuration management
├── dependencies.py                # FastAPI dependency injection
├── routes/
│   ├── auth.py                    # Authentication endpoints
│   ├── users.py                   # User management endpoints
│   ├── conversations.py           # Conversation CRUD endpoints
│   ├── voice.py                   # Voice processing endpoints
│   ├── numerology.py              # Numerology calculation endpoints
│   └── journal.py                 # Journal entry endpoints
├── services/
│   ├── auth_service.py            # Firebase authentication logic
│   ├── conversation_service.py    # Conversation orchestration
│   ├── voice_service.py           # STT/TTS integration
│   ├── ai_service.py              # GPT-4 conversation AI
│   └── numerology_service.py      # Numerology calculations
├── repositories/
│   ├── user_repository.py         # User data access
│   ├── conversation_repository.py # Conversation data access
│   ├── numerology_repository.py   # Numerology profile data access
│   └── journal_repository.py      # Journal data access
├── models/
│   ├── user.py                    # SQLAlchemy User model
│   ├── conversation.py            # Conversation & Message models
│   ├── numerology.py              # NumerologyProfile model
│   └── journal.py                 # JournalEntry model
├── schemas/
│   ├── user.py                    # Pydantic User schemas
│   ├── conversation.py            # Conversation request/response schemas
│   ├── numerology.py              # Numerology schemas
│   └── auth.py                    # Auth request/response schemas
├── utils/
│   ├── database.py                # SQLAlchemy session management
│   ├── redis_client.py            # Redis connection management
│   ├── storage_client.py          # GCS client for audio storage
│   └── logger.py                  # Structured logging setup
├── middleware/
│   ├── auth_middleware.py         # JWT verification
│   ├── error_handler.py           # Global error handling
│   └── rate_limiter.py            # Rate limiting middleware
└── websockets/
    └── conversation_ws.py         # WebSocket handler for real-time conversation
```

#### Function Template (FastAPI Route Handler)

```python
# routes/conversations.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from ..dependencies import get_current_user, get_db
from ..models.user import User
from ..schemas.conversation import (
    ConversationResponse,
    ConversationListResponse,
    CreateConversationResponse,
    UpdateConversationRequest,
)
from ..services.conversation_service import ConversationService
from ..utils.logger import logger

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.post("", response_model=CreateConversationResponse, status_code=status.HTTP_201_CREATED)
async def start_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new conversation session for the authenticated user.
    Creates a conversation record and initializes Redis session context.
    """
    logger.info(f"Starting conversation for user {current_user.id}")
    
    conversation_service = ConversationService(db)
    conversation = await conversation_service.create_conversation(current_user.id)
    
    return CreateConversationResponse(
        id=str(conversation.id),
        userId=str(conversation.user_id),
        startedAt=conversation.started_at,
        status=conversation.status,
        sessionId=conversation.session_id,
    )

@router.get("", response_model=ConversationListResponse)
async def list_conversations(
    limit: int = 20,
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve paginated list of user's conversation history.
    """
    logger.info(f"Listing conversations for user {current_user.id}")
    
    conversation_service = ConversationService(db)
    conversations, total = await conversation_service.list_conversations(
        current_user.id, limit, offset
    )
    
    return ConversationListResponse(
        conversations=[ConversationResponse.from_orm(c) for c in conversations],
        total=total,
    )

@router.patch("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: str,
    request: UpdateConversationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update conversation status or rating.
    """
    logger.info(f"Updating conversation {conversation_id} for user {current_user.id}")
    
    conversation_service = ConversationService(db)
    conversation = await conversation_service.update_conversation(
        conversation_id, current_user.id, request.dict(exclude_unset=True)
    )
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationResponse.from_orm(conversation)
```

### Database Architecture

#### Schema Design (See Database Schema section above)

The PostgreSQL schema design is already detailed in the **Database Schema** section with full SQL DDL.

#### Data Access Layer (Repository Pattern)

```python
# repositories/conversation_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID

from ..models.conversation import Conversation, ConversationMessage
from ..utils.logger import logger

class ConversationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(self, user_id: UUID, session_id: str) -> Conversation:
        """Create a new conversation record."""
        conversation = Conversation(
            user_id=user_id,
            session_id=session_id,
            status='active',
        )
        self.db.add(conversation)
        await self.db.commit()
        await self.db.refresh(conversation)
        logger.info(f"Created conversation {conversation.id}")
        return conversation

    async def find_by_id(self, conversation_id: UUID) -> Optional[Conversation]:
        """Get conversation by ID with messages."""
        stmt = (
            select(Conversation)
            .options(selectinload(Conversation.messages))
            .where(Conversation.id == conversation_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(
        self, user_id: UUID, limit: int, offset: int
    ) -> tuple[List[Conversation], int]:
        """Get paginated conversation list for user."""
        # Get conversations
        stmt = (
            select(Conversation)
            .where(Conversation.user_id == user_id)
            .order_by(Conversation.started_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self.db.execute(stmt)
        conversations = result.scalars().all()

        # Get total count
        count_stmt = (
            select(func.count(Conversation.id))
            .where(Conversation.user_id == user_id)
        )
        total_result = await self.db.execute(count_stmt)
        total = total_result.scalar_one()

        return list(conversations), total

    async def update_status(
        self, conversation_id: UUID, status: str, ended_at=None, rating=None
    ) -> Optional[Conversation]:
        """Update conversation status and optional fields."""
        update_data = {"status": status}
        if ended_at:
            update_data["ended_at"] = ended_at
        if rating:
            update_data["satisfaction_rating"] = rating

        stmt = (
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(**update_data)
            .returning(Conversation)
        )
        result = await self.db.execute(stmt)
        await self.db.commit()
        return result.scalar_one_or_none()

    async def add_message(
        self,
        conversation_id: UUID,
        role: str,
        message_type: str,
        text_content: str,
        audio_url: Optional[str] = None,
        emotional_tone: Optional[str] = None,
        metadata: dict = None,
    ) -> ConversationMessage:
        """Add a message to a conversation."""
        message = ConversationMessage(
            conversation_id=conversation_id,
            role=role,
            message_type=message_type,
            text_content=text_content,
            audio_url=audio_url,
            emotional_tone=emotional_tone,
            metadata=metadata or {},
        )
        self.db.add(message)
        await self.db.commit()
        await self.db.refresh(message)
        return message
```

### Authentication and Authorization

#### Auth Flow

```mermaid
sequenceDiagram
    participant Client as Mobile App
    participant FB as Firebase Auth
    participant API as FastAPI Backend
    participant DB as PostgreSQL

    Client->>FB: Request phone verification
    FB->>Client: Send SMS OTP
    Client->>FB: Verify OTP code
    FB->>Client: Return Firebase ID token
    
    Client->>API: POST /auth/register {idToken, phoneNumber}
    API->>FB: Verify ID token
    FB->>API: Token valid + Firebase UID
    API->>DB: Check if user exists by Firebase UID
    
    alt User exists
        DB->>API: Return existing user
    else New user
        API->>DB: Create User record
        DB->>API: Return new user
    end
    
    API->>API: Generate JWT access token (15min)
    API->>API: Generate JWT refresh token (7 days)
    API->>DB: Store refresh token hash
    API->>Client: Return {accessToken, refreshToken, user}
    
    Note over Client: Store tokens securely
    
    Client->>API: GET /users/me (with Bearer accessToken)
    API->>API: Verify JWT signature
    API->>API: Check expiration
    API->>DB: Fetch user by JWT subject
    API->>Client: Return user data
    
    Note over Client: Access token expires
    
    Client->>API: POST /auth/refresh {refreshToken}
    API->>API: Verify refresh token signature
    API->>DB: Check refresh token not revoked
    API->>API: Generate new access token
    API->>Client: Return {accessToken}
```

#### Middleware/Guards

```python
# middleware/auth_middleware.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from datetime import datetime
from typing import Optional

from ..config import settings
from ..models.user import User
from ..repositories.user_repository import UserRepository
from ..utils.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    Raises HTTPException if token is invalid or user not found.
    """
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id: str = payload.get("sub")
        exp: int = payload.get("exp")

        if user_id is None:
            raise credentials_exception

        # Check expiration
        if datetime.utcnow().timestamp() > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token expired",
            )

    except JWTError:
        raise credentials_exception

    # Fetch user from database
    user_repo = UserRepository(db)
    user = await user_repo.find_by_id(user_id)

    if user is None or user.deleted_at is not None:
        raise credentials_exception

    return user

def require_auth(func):
    """
    Decorator for route handlers requiring authentication.
    Usage: @require_auth
    """
    async def wrapper(*args, current_user: User = Depends(get_current_user), **kwargs):
        return await func(*args, current_user=current_user, **kwargs)
    return wrapper
```

## Unified Project Structure

```plaintext
numerologist/
├── .github/                         # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml                  # Automated testing on PR
│       ├── deploy-api.yaml          # Deploy backend to GCP Cloud Run
│       └── deploy-mobile.yaml       # Build and deploy mobile app
├── apps/                            # Application packages
│   ├── mobile/                      # React Native mobile app
│   │   ├── src/
│   │   │   ├── components/          # UI components (voice/, conversation/, etc.)
│   │   │   ├── screens/             # Screen components
│   │   │   ├── navigation/          # React Navigation setup
│   │   │   ├── stores/              # Zustand state management
│   │   │   ├── services/            # API client services
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── utils/               # Frontend utilities
│   │   │   ├── theme/               # Theme configuration
│   │   │   ├── types/               # TypeScript type definitions
│   │   │   └── App.tsx              # App entry point
│   │   ├── assets/                  # Images, fonts, audio files
│   │   ├── ios/                     # iOS native project
│   │   ├── android/                 # Android native project
│   │   ├── app.json                 # Expo configuration
│   │   ├── project.json             # Nx project configuration
│   │   ├── package.json             # Mobile dependencies
│   │   └── tsconfig.json            # TypeScript config
│   └── api/                         # FastAPI backend
│       ├── src/
│       │   ├── main.py              # FastAPI app entry
│       │   ├── config.py            # Settings management
│       │   ├── routes/              # API route handlers
│       │   ├── services/            # Business logic services
│       │   ├── repositories/        # Data access layer
│       │   ├── models/              # SQLAlchemy models
│       │   ├── schemas/             # Pydantic schemas
│       │   ├── middleware/          # Auth, error handling
│       │   ├── websockets/          # WebSocket handlers
│       │   └── utils/               # Backend utilities
│       ├── tests/                   # Backend tests
│       │   ├── unit/                # Unit tests
│       │   ├── integration/         # Integration tests
│       │   └── fixtures/            # Test fixtures
│       ├── alembic/                 # Database migrations
│       ├── requirements.txt         # Python dependencies
│       ├── Dockerfile               # Container image for Cloud Run
│       ├── project.json             # Nx project configuration
│       └── pyproject.toml           # Python project config
├── libs/                            # Shared libraries (Nx convention)
│   ├── shared/                      # Shared TypeScript/Python utilities
│   │   ├── src/
│   │   │   ├── index.ts             # Library entry point
│   │   │   ├── types/               # Shared TypeScript interfaces
│   │   │   ├── constants/           # Shared constants
│   │   │   ├── validators/          # Data validation utilities
│   │   │   └── utils/               # Common utilities
│   │   ├── project.json             # Nx project configuration
│   │   ├── package.json             # Library dependencies
│   │   └── tsconfig.json            # TypeScript config
│   ├── numerology/                  # Numerology calculation engine
│   │   ├── src/
│   │   │   ├── calculator.py        # Core calculation logic
│   │   │   ├── interpreter.py       # Vietnamese interpretations
│   │   │   └── __init__.py
│   │   ├── tests/                   # Numerology tests
│   │   ├── project.json             # Nx project configuration
│   │   └── setup.py                 # Python package setup
│   └── ui/                          # Shared React Native components
│       ├── src/
│       │   ├── index.ts             # Component exports
│       │   ├── Button/              # Button component
│       │   ├── Card/                # Card component
│       │   └── Input/               # Input component
│       ├── project.json             # Nx project configuration
│       ├── package.json             # UI library dependencies
│       └── tsconfig.json            # TypeScript config
├── tools/                           # Nx workspace tools and generators
│   └── generators/                  # Custom Nx generators
├── infrastructure/                  # Infrastructure as Code
│   ├── terraform/
│   │   ├── main.tf                  # GCP resource definitions
│   │   ├── variables.tf             # Configuration variables
│   │   ├── outputs.tf               # Output values
│   │   └── backend.tf               # Terraform state config
│   └── scripts/
│       ├── deploy.sh                # Deployment script
│       └── setup-gcp.sh             # GCP project setup
├── docs/                            # Documentation
│   ├── prd.md                       # Product Requirements
│   ├── architecture.md              # This document
│   ├── api/                         # API documentation
│   └── guides/                      # Development guides
├── .env.example                     # Environment variable template
├── .gitignore                       # Git ignore patterns
├── nx.json                          # Nx workspace configuration
├── package.json                     # Root package.json (Nx workspace)
├── tsconfig.base.json               # Base TypeScript config for workspace
├── .bmad-core/                      # BMAD framework configuration
│   └── core-config.yaml             # Project configuration
└── README.md                        # Project overview
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# System requirements
node --version    # >= 18.x
python --version  # >= 3.11
docker --version  # >= 24.x
```

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/your-org/numerologist.git
cd numerologist

# Install all dependencies (Nx workspace)
npm install

# Install backend dependencies
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..

# Copy environment template and configure
cp .env.example .env
# Edit .env with your API keys and configuration

# Start local PostgreSQL and Redis (Docker Compose)
docker-compose up -d postgres redis

# Run database migrations
cd apps/api
alembic upgrade head
cd ../..

# Seed initial data (optional)
cd apps/api
python scripts/seed_data.py
cd ../..
```

#### Development Commands

```bash
# Nx commands for development

# Start all services (from root directory)
nx run-many --target=serve --all --parallel

# Start mobile app only
nx serve mobile

# Start backend API only
cd apps/api
source venv/bin/activate
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
nx run-many --target=test --all          # Run all tests (mobile + backend)
nx test mobile                           # Mobile tests only
nx test shared                           # Shared library tests
cd apps/api && pytest                    # Backend tests only

# Build applications
nx build mobile                          # Build mobile app
nx run-many --target=build --all        # Build all projects

# Linting
nx run-many --target=lint --all         # Lint all code
nx lint mobile                           # Lint mobile app only
nx lint shared                           # Lint shared library

# Type checking
nx run-many --target=type-check --all   # Type check all TypeScript projects

# Dependency graph visualization
nx graph                                 # View project dependency graph

# Nx cache management
nx reset                                 # Clear Nx cache
nx run-many --target=build --all --skip-nx-cache  # Build without cache

# Database operations
cd apps/api
alembic revision --autogenerate -m "Description"  # Create migration
alembic upgrade head                             # Apply migrations
alembic downgrade -1                             # Rollback one migration
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local in apps/mobile)
EXPO_PUBLIC_API_URL=http://localhost:8000/v1
EXPO_PUBLIC_WS_URL=ws://localhost:8000/ws
EXPO_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id

# Backend (.env in apps/api)
DATABASE_URL=postgresql+asyncpg://numeroly:password@localhost:5432/numeroly
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=your_super_secret_jwt_key_change_this_in_production
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Google Cloud
GOOGLE_CLOUD_PROJECT=your_gcp_project_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account-key.json

# External API Keys
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Firebase Admin SDK
FIREBASE_ADMIN_CREDENTIALS=path/to/firebase-admin-key.json

# Storage
CLOUD_STORAGE_BUCKET=numeroly-audio-storage

# Environment
ENVIRONMENT=development  # development | staging | production
LOG_LEVEL=INFO
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Expo EAS (Expo Application Services) for managed builds and OTA updates
- **Build Command:** `eas build --platform all` (iOS + Android)
- **Output Directory:** N/A (managed by Expo)
- **CDN/Edge:** Expo CDN for OTA JavaScript updates, CloudFlare CDN for static assets
- **Web Version:** `expo export:web` to generate static PWA, deployed to GCP Cloud Storage + CDN

**Backend Deployment:**
- **Platform:** Google Cloud Run (containerized serverless)
- **Build Command:** `docker build -t gcr.io/numeroly/api:latest .`
- **Deployment Method:** Automated via GitHub Actions → Cloud Build → Cloud Run
- **Scaling:** Auto-scale from 0 to 10 instances based on CPU/memory utilization
- **Region:** asia-southeast1 (Singapore) with global load balancer

### CI/CD Pipeline

```yaml
# .github/workflows/deploy-api.yaml
name: Deploy API to Cloud Run

on:
  push:
    branches: [main]
    paths:
      - 'apps/api/**'
      - '.github/workflows/deploy-api.yaml'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd apps/api
          pip install -r requirements.txt
          pip install pytest pytest-asyncio pytest-cov
      - name: Run tests
        run: |
          cd apps/api
          pytest tests/ --cov=src --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Build Docker image
        run: |
          cd apps/api
          docker build -t gcr.io/${{ secrets.GCP_PROJECT_ID }}/numeroly-api:${{ github.sha }} .
          docker tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/numeroly-api:${{ github.sha }} \
                     gcr.io/${{ secrets.GCP_PROJECT_ID }}/numeroly-api:latest
      
      - name: Push to Container Registry
        run: |
          gcloud auth configure-docker
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/numeroly-api:${{ github.sha }}
          docker push gcr.io/${{ secrets.GCP_PROJECT_ID }}/numeroly-api:latest
      
      - name: Deploy to Cloud Run
        run: |
          gcloud run deploy numeroly-api \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/numeroly-api:latest \
            --platform managed \
            --region asia-southeast1 \
            --allow-unauthenticated \
            --set-env-vars "ENVIRONMENT=production,LOG_LEVEL=INFO" \
            --set-secrets="DATABASE_URL=DATABASE_URL:latest,OPENAI_API_KEY=OPENAI_API_KEY:latest" \
            --min-instances 1 \
            --max-instances 10 \
            --memory 1Gi \
            --cpu 1 \
            --timeout 60
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | localhost:19006 (Expo) | http://localhost:8000 | Local development with hot reload |
| Staging | https://staging.numeroly.app | https://api-staging.numeroly.app | Pre-production testing with production-like data |
| Production | https://numeroly.app | https://api.numeroly.app | Live environment for end users |

**Environment-Specific Configuration:**
- **Development:** Mock external APIs, relaxed rate limits, verbose logging
- **Staging:** Real external APIs (test credentials), moderate rate limits, structured logging
- **Production:** Real external APIs (production credentials), strict rate limits, error-only logging, monitoring enabled

## Security and Performance

### Security Requirements

**Frontend Security:**
- **CSP Headers:** `Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; connect-src 'self' https://api.numeroly.app wss://api.numeroly.app`
- **XSS Prevention:** React Native inherently safer; sanitize any user-generated content rendered in WebViews, use `dangerouslySetInnerHTML` sparingly
- **Secure Storage:** Use `expo-secure-store` for tokens (iOS Keychain, Android Keystore), never AsyncStorage for sensitive data

**Backend Security:**
- **Input Validation:** Pydantic schemas enforce type validation on all API inputs, reject malformed requests with 422 status
- **Rate Limiting:** 
  - Authentication endpoints: 5 requests per minute per IP
  - Voice transcription: 30 requests per minute per user
  - General API: 100 requests per minute per user
- **CORS Policy:**
  ```python
  origins = [
      "https://numeroly.app",
      "https://staging.numeroly.app",
      "http://localhost:19006",  # Expo development
  ]
  app.add_middleware(
      CORSMiddleware,
      allow_origins=origins,
      allow_credentials=True,
      allow_methods=["GET", "POST", "PATCH", "DELETE"],
      allow_headers=["*"],
  )
  ```

**Authentication Security:**
- **Token Storage:** Access tokens in memory (Zustand), refresh tokens in `expo-secure-store`
- **Session Management:** Redis session store with 24-hour expiration, automatic cleanup of abandoned sessions
- **Password Policy:** N/A (phone number authentication only), but Firebase enforces OTP validity for 5 minutes

**Data Protection:**
- **Encryption at Rest:** PostgreSQL Transparent Data Encryption (TDE) for all user data, Cloud Storage server-side encryption (AES-256)
- **Encryption in Transit:** TLS 1.3 for all API communication, HTTPS-only in production
- **PII Handling:** Full names and birth dates marked as sensitive, audit logging for all access, GDPR-compliant data export and deletion

### Performance Optimization

**Frontend Performance:**
- **Bundle Size Target:** < 5MB for mobile app initial bundle (achieved via code splitting and lazy loading)
- **Loading Strategy:** 
  - Code splitting by route (React Native lazy loading)
  - Image lazy loading with `expo-image` (native caching)
  - Prefetch user's numerology profile on app launch
- **Caching Strategy:**
  - React Query for API response caching (5-minute stale time for numerology data)
  - Service worker for PWA offline functionality
  - Audio file caching in device storage (last 10 conversations)

**Backend Performance:**
- **Response Time Target:** 
  - API endpoints: < 200ms (p95)
  - Voice transcription: < 2 seconds (p95)
  - Voice synthesis: < 1 second (p95)
  - Total conversation turn (STT → GPT → TTS): < 3 seconds (PRD requirement)
- **Database Optimization:**
  - Connection pooling: 10-20 connections per Cloud Run instance
  - Index on frequently queried columns (see Database Schema)
  - Read replicas for conversation history queries (if needed post-MVP)
  - JSONB columns for flexible metadata without schema migrations
- **Caching Strategy:**
  - Redis for conversation context (10-minute TTL)
  - Redis for numerology interpretations (1-hour TTL, reduces DB load)
  - CDN caching for static audio files (common phrases, 24-hour TTL)
  - ElevenLabs response caching for repeated phrases (7-day TTL in Redis)

**API Optimization:**
- **Async/Await:** All I/O operations (DB, Redis, external APIs) use FastAPI async for non-blocking performance
- **Request Batching:** Batch GPT-4 requests when generating multiple insights (not MVP, future optimization)
- **Compression:** Gzip compression for API responses > 1KB

## Testing Strategy

### Testing Pyramid

```
          E2E Tests (10%)
         /        \
    Integration Tests (30%)
    /            \
Frontend Unit (30%)  Backend Unit (30%)
```

**Philosophy:** Majority of tests at unit and integration levels for speed and reliability, minimal E2E for critical user journeys.

### Test Organization

#### Frontend Tests

```
apps/mobile/tests/
├── unit/
│   ├── components/
│   │   ├── VoiceButton.test.tsx
│   │   ├── ConversationView.test.tsx
│   │   └── NumerologyDashboard.test.tsx
│   ├── stores/
│   │   ├── authStore.test.ts
│   │   ├── conversationStore.test.ts
│   │   └── numerologyStore.test.ts
│   ├── services/
│   │   ├── conversationService.test.ts
│   │   └── numerologyService.test.ts
│   └── utils/
│       └── formatters.test.ts
├── integration/
│   ├── auth-flow.test.tsx
│   ├── conversation-flow.test.tsx
│   └── numerology-flow.test.tsx
└── e2e/
    ├── onboarding.e2e.ts
    ├── voice-conversation.e2e.ts
    └── journal.e2e.ts
```

#### Backend Tests

```
apps/api/tests/
├── unit/
│   ├── services/
│   │   ├── test_conversation_service.py
│   │   ├── test_voice_service.py
│   │   ├── test_ai_service.py
│   │   └── test_numerology_service.py
│   ├── repositories/
│   │   ├── test_user_repository.py
│   │   ├── test_conversation_repository.py
│   │   └── test_numerology_repository.py
│   └── utils/
│       └── test_validators.py
├── integration/
│   ├── test_auth_endpoints.py
│   ├── test_conversation_endpoints.py
│   ├── test_voice_endpoints.py
│   └── test_numerology_endpoints.py
└── fixtures/
    ├── user_fixtures.py
    ├── conversation_fixtures.py
    └── audio_fixtures.py
```

#### E2E Tests

```
tests/e2e/
├── user-registration.spec.ts
├── complete-conversation.spec.ts
└── numerology-insight.spec.ts
```

### Test Examples

#### Frontend Component Test

```typescript
// apps/mobile/tests/unit/components/VoiceButton.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { VoiceButton } from '@/components/voice/VoiceButton';

describe('VoiceButton', () => {
  it('renders with correct initial state', () => {
    const { getByLabelText, getByText } = render(
      <VoiceButton onPress={jest.fn()} isRecording={false} />
    );

    expect(getByLabelText('Start recording')).toBeTruthy();
    expect(getByText('Nhấn để nói')).toBeTruthy();
  });

  it('changes to recording state when pressed', async () => {
    const onPress = jest.fn();
    const { rerender, getByLabelText } = render(
      <VoiceButton onPress={onPress} isRecording={false} />
    );

    const button = getByLabelText('Start recording');
    fireEvent.press(button);

    expect(onPress).toHaveBeenCalledTimes(1);

    // Simulate parent updating isRecording prop
    rerender(<VoiceButton onPress={onPress} isRecording={true} />);

    await waitFor(() => {
      expect(getByLabelText('Stop recording')).toBeTruthy();
    });
  });

  it('is disabled when disabled prop is true', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(
      <VoiceButton onPress={onPress} isRecording={false} disabled={true} />
    );

    const button = getByLabelText('Start recording');
    fireEvent.press(button);

    expect(onPress).not.toHaveBeenCalled();
  });
});
```

#### Backend API Test

```python
# apps/api/tests/integration/test_conversation_endpoints.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from src.main import app
from tests.fixtures.user_fixtures import create_test_user, get_auth_token

@pytest.mark.asyncio
async def test_start_conversation(client: AsyncClient, db: AsyncSession):
    """Test creating a new conversation."""
    # Setup: Create user and get auth token
    user = await create_test_user(db)
    token = await get_auth_token(user)

    # Test: Start conversation
    response = await client.post(
        "/v1/conversations",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["status"] == "active"
    assert "sessionId" in data

@pytest.mark.asyncio
async def test_list_conversations(client: AsyncClient, db: AsyncSession):
    """Test retrieving conversation list."""
    user = await create_test_user(db)
    token = await get_auth_token(user)

    # Create multiple conversations
    for _ in range(3):
        await client.post(
            "/v1/conversations",
            headers={"Authorization": f"Bearer {token}"}
        )

    # Test: List conversations
    response = await client.get(
        "/v1/conversations?limit=10&offset=0",
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["conversations"]) == 3
    assert data["total"] == 3

@pytest.mark.asyncio
async def test_update_conversation_rating(client: AsyncClient, db: AsyncSession):
    """Test updating conversation with satisfaction rating."""
    user = await create_test_user(db)
    token = await get_auth_token(user)

    # Create conversation
    create_response = await client.post(
        "/v1/conversations",
        headers={"Authorization": f"Bearer {token}"}
    )
    conversation_id = create_response.json()["id"]

    # Test: Update with rating
    response = await client.patch(
        f"/v1/conversations/{conversation_id}",
        json={"status": "completed", "satisfactionRating": 5},
        headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["satisfactionRating"] == 5
```

#### E2E Test

```typescript
// tests/e2e/complete-conversation.spec.ts
import { by, device, element, expect } from 'detox';

describe('Complete Voice Conversation Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Assume user is already logged in (handled in beforeAll setup)
  });

  it('should complete a full voice conversation', async () => {
    // Navigate to conversation screen
    await element(by.text('Trò chuyện')).tap();

    // Start voice recording
    await element(by.id('voice-button')).tap();
    await expect(element(by.text('Đang nghe...'))).toBeVisible();

    // Simulate speaking (in real E2E, would use audio input)
    await device.setLocation(10.762622, 106.660172);  // Example mock
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Stop recording
    await element(by.id('voice-button')).tap();

    // Wait for transcription and response
    await waitFor(element(by.id('assistant-message')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify conversation message appeared
    await expect(element(by.id('user-message'))).toBeVisible();
    await expect(element(by.id('assistant-message'))).toBeVisible();

    // End conversation
    await element(by.id('end-conversation-button')).tap();

    // Rate conversation
    await element(by.id('rating-5')).tap();
    await element(by.text('Xong')).tap();

    // Verify returned to conversation list with new entry
    await expect(element(by.id('conversation-card-0'))).toBeVisible();
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Safety Everywhere:** All frontend components must use TypeScript with strict mode (`"strict": true`), all backend functions must use Python type hints verified by mypy
  
- **API Contract Adherence:** Frontend services MUST match backend Pydantic schemas exactly - use code generation from OpenAPI spec to prevent drift

- **Error Boundaries:** Wrap all screen components in `<ErrorBoundary>` to prevent app crashes; backend must return consistent error format (see Error Handling section)

- **Async Best Practices:** Never block main thread with sync operations - use async/await for all network/storage operations; FastAPI routes must be async for I/O operations

- **Authentication Flow:** NEVER store access tokens in AsyncStorage (use expo-secure-store only); backend must verify JWT on every protected endpoint

- **Voice Processing:** Audio files MUST be cleaned up after conversation ends to prevent storage bloat; implement max 10 conversations cached locally

- **Numerology Calculations:** ALWAYS use shared `@numerologist/numerology` library from `libs/numerology` - never duplicate calculation logic in frontend or backend

- **Database Transactions:** Use SQLAlchemy transactions for multi-table operations; rollback on any error to maintain consistency

- **Logging Strategy:** Log all external API calls (STT, TTS, GPT-4) with request IDs for debugging; include latency metrics

- **Rate Limiting:** Respect external API rate limits with exponential backoff; cache ElevenLabs responses to reduce costs

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `VoiceButton.tsx`, `ConversationView.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts`, `useConversation.ts` |
| Services | camelCase suffix 'Service' | snake_case suffix '_service' | `conversationService.ts`, `conversation_service.py` |
| API Routes | - | kebab-case | `/api/user-profile`, `/voice/transcribe` |
| Database Tables | - | snake_case plural | `users`, `conversation_messages`, `numerology_profiles` |
| Environment Variables | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `OPENAI_API_KEY`, `DATABASE_URL` |
| Constants | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `MAX_AUDIO_DURATION_MS`, `DEFAULT_VOICE_TONE` |
| Type/Interface | PascalCase | PascalCase | `ConversationMessage`, `NumerologyProfile` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client as Mobile App
    participant API as FastAPI Backend
    participant ExtAPI as External API (STT/TTS/GPT)
    participant ErrorTracker as Sentry

    Client->>API: POST /voice/transcribe {audio}
    API->>ExtAPI: Google STT API call
    
    alt External API Error
        ExtAPI-->>API: 500 Server Error
        API->>API: Log error with context
        API->>ErrorTracker: Report error to Sentry
        API->>API: Apply circuit breaker logic
        API-->>Client: 503 Service Temporarily Unavailable
        Note over Client: Display user-friendly message
        Note over Client: "Xin lỗi, dịch vụ tạm thời không khả dụng"
    end
    
    alt Validation Error
        Note over API: Invalid audio format detected
        API-->>Client: 422 Unprocessable Entity
        Client->>Client: Display validation error
        Note over Client: "Định dạng audio không hợp lệ"
    end
    
    alt Authentication Error
        Note over API: JWT token expired
        API-->>Client: 401 Unauthorized
        Client->>Client: Clear tokens
        Client->>Client: Navigate to login
    end
    
    alt Success
        ExtAPI-->>API: Transcription result
        API-->>Client: 200 OK + data
        Client->>Client: Update UI with result
    end
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;           // Machine-readable error code (e.g., "VOICE_TRANSCRIPTION_FAILED")
    message: string;        // Human-readable Vietnamese error message
    details?: {             // Optional additional context
      field?: string;       // For validation errors, which field failed
      reason?: string;      // Technical reason for debugging
      retryAfter?: number;  // For rate limit errors, seconds until retry allowed
    };
    timestamp: string;      // ISO 8601 timestamp
    requestId: string;      // Unique ID for request tracking
  };
}
```

**Example Error Responses:**

```json
{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
    "timestamp": "2025-01-14T10:30:00Z",
    "requestId": "req_abc123"
  }
}
```

```json
{
  "error": {
    "code": "VOICE_TRANSCRIPTION_FAILED",
    "message": "Không thể chuyển đổi giọng nói. Vui lòng thử lại.",
    "details": {
      "reason": "Google STT API timeout after 5 seconds",
      "retryAfter": 30
    },
    "timestamp": "2025-01-14T10:35:00Z",
    "requestId": "req_def456"
  }
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Dữ liệu không hợp lệ",
    "details": {
      "field": "birthDate",
      "reason": "Date must be in the past"
    },
    "timestamp": "2025-01-14T10:40:00Z",
    "requestId": "req_ghi789"
  }
}
```

### Frontend Error Handling

```typescript
// utils/errorHandler.ts
import { AxiosError } from 'axios';
import { Alert } from 'react-native';
import * as Sentry from '@sentry/react-native';

export const handleApiError = (error: unknown) => {
  if (error instanceof AxiosError && error.response) {
    const apiError = error.response.data.error;

    // Log to Sentry with context
    Sentry.captureException(error, {
      contexts: {
        apiError: {
          code: apiError.code,
          message: apiError.message,
          requestId: apiError.requestId,
        },
      },
    });

    // Handle specific error codes
    switch (apiError.code) {
      case 'AUTHENTICATION_FAILED':
        // Clear tokens and navigate to login
        useAuthStore.getState().logout();
        break;

      case 'VOICE_TRANSCRIPTION_FAILED':
      case 'VOICE_SYNTHESIS_FAILED':
        // Show retry option with delay
        Alert.alert(
          'Lỗi kết nối',
          apiError.message,
          [
            { text: 'Hủy', style: 'cancel' },
            {
              text: 'Thử lại',
              onPress: () => {
                // Retry after specified delay
                setTimeout(() => {
                  // Retry logic here
                }, (apiError.details?.retryAfter || 1) * 1000);
              },
            },
          ]
        );
        break;

      case 'VALIDATION_ERROR':
        // Show inline validation error on form
        return {
          field: apiError.details?.field,
          message: apiError.message,
        };

      case 'RATE_LIMIT_EXCEEDED':
        Alert.alert(
          'Quá nhiều yêu cầu',
          `Vui lòng chờ ${apiError.details?.retryAfter || 60} giây trước khi thử lại.`
        );
        break;

      default:
        // Generic error message
        Alert.alert('Lỗi', apiError.message || 'Đã xảy ra lỗi. Vui lòng thử lại.');
    }
  } else {
    // Network error or unexpected error
    Sentry.captureException(error);
    Alert.alert('Lỗi kết nối', 'Không thể kết nối với máy chủ. Vui lòng kiểm tra kết nối internet.');
  }
};
```

### Backend Error Handling

```python
# middleware/error_handler.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from openai import OpenAIError
import sentry_sdk
import uuid
from datetime import datetime

async def api_error_handler(request: Request, exc: Exception) -> JSONResponse:
    """
    Global error handler for all API exceptions.
    Converts exceptions to standardized error response format.
    """
    request_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat() + 'Z'

    # Log to Sentry with context
    with sentry_sdk.push_scope() as scope:
        scope.set_context("request", {
            "url": str(request.url),
            "method": request.method,
            "headers": dict(request.headers),
        })
        scope.set_tag("request_id", request_id)
        sentry_sdk.capture_exception(exc)

    # Handle specific exception types
    if isinstance(exc, RequestValidationError):
        # Pydantic validation error
        error_details = exc.errors()[0]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "Dữ liệu không hợp lệ",
                    "details": {
                        "field": ".".join(str(loc) for loc in error_details["loc"]),
                        "reason": error_details["msg"],
                    },
                    "timestamp": timestamp,
                    "requestId": request_id,
                }
            },
        )

    elif isinstance(exc, OpenAIError):
        # OpenAI API error (GPT-4, embeddings)
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={
                "error": {
                    "code": "AI_SERVICE_ERROR",
                    "message": "Dịch vụ AI tạm thời không khả dụng. Vui lòng thử lại sau.",
                    "details": {
                        "reason": str(exc),
                        "retryAfter": 30,
                    },
                    "timestamp": timestamp,
                    "requestId": request_id,
                }
            },
        )

    elif isinstance(exc, SQLAlchemyError):
        # Database error
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "Lỗi hệ thống. Vui lòng thử lại sau.",
                    "timestamp": timestamp,
                    "requestId": request_id,
                }
            },
        )

    # Generic unhandled exception
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Lỗi hệ thống. Vui lòng thử lại sau.",
                "timestamp": timestamp,
                "requestId": request_id,
            }
        },
    )

# Register error handler in main.py
from src.middleware.error_handler import api_error_handler

app.add_exception_handler(Exception, api_error_handler)
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Sentry for React Native (error tracking, performance monitoring, session replay)
- **Backend Monitoring:** Google Cloud Monitoring (metrics, uptime), Cloud Logging (structured logs), Cloud Trace (distributed tracing)
- **Error Tracking:** Sentry for both frontend and backend (unified error dashboard)
- **Performance Monitoring:** 
  - Frontend: Sentry Performance + custom instrumentation for voice latency
  - Backend: Cloud Trace for request tracing, custom metrics for STT/TTS/GPT-4 latency

### Key Metrics

**Frontend Metrics:**
- **App Launch Time:** Time from app open to first interactive screen (target: < 3 seconds)
- **Voice Button Responsiveness:** Time from tap to recording start (target: < 300ms)
- **API Response Times:** P50, P95, P99 latencies for each endpoint
- **JavaScript Errors:** Count and types of React errors, network errors
- **User Interactions:** Voice button taps, conversation completions, satisfaction ratings
- **Crash Rate:** App crashes per session (target: < 0.1%)

**Backend Metrics:**
- **Request Rate:** Requests per second by endpoint
- **Error Rate:** 4xx and 5xx errors per endpoint (target: < 1%)
- **Response Time:** P50, P95, P99 latencies by endpoint
  - `/voice/transcribe`: Target < 2s (P95)
  - `/voice/synthesize`: Target < 1s (P95)
  - `/numerology/insight`: Target < 500ms (P95)
- **External API Latency:** Time spent in Google STT, ElevenLabs TTS, OpenAI GPT-4 calls
- **Database Query Performance:** Slow queries (> 100ms)
- **Redis Hit Rate:** Cache effectiveness (target: > 80%)
- **WebSocket Connections:** Active real-time conversation connections

**Business Metrics:**
- **Conversation Completion Rate:** % of started conversations that end with rating
- **Average Conversation Duration:** Minutes per conversation
- **Satisfaction Score:** Average rating (1-5 scale)
- **Daily Active Users (DAU):** Unique users per day
- **Voice Recognition Accuracy:** % of transcriptions edited by users (proxy metric)

### Instrumentation Examples

**Frontend (React Native + Sentry):**

```typescript
// utils/monitoring.ts
import * as Sentry from '@sentry/react-native';

// Initialize Sentry
Sentry.init({
  dsn: Config.SENTRY_DSN,
  environment: Config.ENVIRONMENT,
  enableAutoSessionTracking: true,
  sessionTrackingIntervalMillis: 30000,
  tracesSampleRate: 1.0, // 100% for MVP, reduce in production
});

// Custom performance instrumentation
export const trackVoiceLatency = (eventName: string, startTime: number) => {
  const duration = Date.now() - startTime;
  
  Sentry.addBreadcrumb({
    category: 'voice',
    message: eventName,
    data: { durationMs: duration },
    level: 'info',
  });

  if (duration > 3000) {
    // Alert if exceeds PRD requirement
    Sentry.captureMessage(`Slow voice processing: ${eventName}`, {
      level: 'warning',
      extra: { durationMs: duration },
    });
  }
};

// Usage in voice service
const startTime = Date.now();
await conversationService.transcribeAudio(audioBlob, conversationId);
trackVoiceLatency('audio_transcription', startTime);
```

**Backend (FastAPI + Cloud Monitoring):**

```python
# utils/monitoring.py
from google.cloud import monitoring_v3
from google.cloud.monitoring_v3 import TimeInterval
from google.protobuf.timestamp_pb2 import Timestamp
import time
from functools import wraps

client = monitoring_v3.MetricServiceClient()
project_name = f"projects/{settings.GCP_PROJECT_ID}"

def track_latency(metric_name: str):
    """Decorator to track endpoint latency to Cloud Monitoring."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                status = "success"
                return result
            except Exception as e:
                status = "error"
                raise e
            finally:
                latency_ms = (time.time() - start_time) * 1000
                
                # Send custom metric to Cloud Monitoring
                series = monitoring_v3.TimeSeries()
                series.metric.type = f"custom.googleapis.com/numeroly/{metric_name}"
                series.resource.type = "global"
                
                now = time.time()
                seconds = int(now)
                nanos = int((now - seconds) * 10**9)
                interval = TimeInterval(
                    {"end_time": {"seconds": seconds, "nanos": nanos}}
                )
                
                point = monitoring_v3.Point(
                    {"interval": interval, "value": {"double_value": latency_ms}}
                )
                series.points = [point]
                series.metric.labels["status"] = status
                
                client.create_time_series(name=project_name, time_series=[series])
        
        return wrapper
    return decorator

# Usage in route handler
@router.post("/voice/transcribe")
@track_latency("voice_transcription_latency")
async def transcribe_audio(...):
    # Implementation
    pass
```

**Alerting Configuration (Cloud Monitoring):**

```yaml
# infrastructure/terraform/monitoring.tf (Terraform)
resource "google_monitoring_alert_policy" "high_error_rate" {
  display_name = "High API Error Rate"
  combiner     = "OR"
  conditions {
    display_name = "Error rate > 5%"
    condition_threshold {
      filter          = "metric.type=\"cloudrun.googleapis.com/request_count\" AND resource.type=\"cloud_run_revision\" AND metric.label.response_code_class=\"5xx\""
      duration        = "60s"
      comparison      = "COMPARISON_GT"
      threshold_value = 5
      aggregations {
        alignment_period   = "60s"
        per_series_aligner = "ALIGN_RATE"
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.email.name]
}

resource "google_monitoring_alert_policy" "slow_voice_processing" {
  display_name = "Voice Processing Latency > 3s"
  combiner     = "OR"
  conditions {
    display_name = "P95 latency exceeds PRD requirement"
    condition_threshold {
      filter          = "metric.type=\"custom.googleapis.com/numeroly/voice_transcription_latency\""
      duration        = "300s"
      comparison      = "COMPARISON_GT"
      threshold_value = 3000
      aggregations {
        alignment_period     = "60s"
        per_series_aligner   = "ALIGN_PERCENTILE_95"
      }
    }
  }
  notification_channels = [google_monitoring_notification_channel.pagerduty.name]
}
```

---

## Checklist Results Report

Before finalizing this architecture document, the Architect Checklist should be executed to validate completeness and quality. Once complete, results will be appended here.

**Next Steps:**
1. Review this architecture document with the team
2. Execute `*execute-checklist architect-checklist` to validate architecture completeness
3. Address any gaps identified by the checklist
4. Obtain sign-off from stakeholders (PM, UX, Dev leads)
5. Begin Epic 1 implementation starting with Story 1.1 (Project Setup)

---

**Document Version:** 1.0  
**Last Updated:** 2025-01-14  
**Author:** Winston (Architect)  
**Status:** Draft - Pending Review
