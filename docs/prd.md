# Numeroly Product Requirements Document (PRD)

## Goals and Background Context

### Goals

• Create a functional Vietnamese AI voicebot prototype that provides Pythagorean numerology insights within 6 weeks
• Achieve 80% user satisfaction with empathetic, conversational interactions that help users with self-discovery
• Build a market-testable prototype that can attract investment by demonstrating demand for Vietnamese-language AI wellness assistants
• Deliver core numerology analysis capabilities (Life Path, Destiny, Soul, Personal Year/Month) through natural voice conversations

### Background Context

Numeroly addresses a significant gap in the Vietnamese market for credible, empathetic AI wellness tools. While there's growing interest in self-awareness and mental wellness among Vietnamese audiences, current numerology and fortune-telling apps lack credibility, and there are no Vietnamese-language AI voice assistants that combine numerology-based guidance with emotional support. The solution leverages Pythagorean numerology to provide personalized insights through warm, conversational voice interactions, filling an underserved niche where users seek both spiritual guidance and practical life advice.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| TBD | 1.0 | Initial PRD draft | John (PM) |

## Requirements

### Functional

FR1: The system shall support Vietnamese voice input using speech-to-text recognition for natural conversation flow.
FR2: The system shall generate natural Vietnamese voice responses using text-to-speech with emotional warmth and empathy.
FR3: The system shall calculate and provide Pythagorean numerology readings for Life Path, Destiny, Soul, Personality, Personal Year, and Personal Month based on user input.
FR4: The system shall maintain conversational context and memory of previous interactions within a single session.
FR5: The system shall provide personalized advice and insights based on the user's numerology profile and current timing cycles.
FR6: The system shall offer a simple dashboard for users to view conversation history and maintain an emotional journal.
FR7: The system shall encrypt and securely store user data including personal information and conversation history.
FR8: The system shall support onboarding flows to collect user birth information needed for numerology calculations.

### Non Functional

NFR1: Voice response latency shall be under 3 seconds to maintain natural conversation flow.
NFR2: Speech-to-text accuracy for Vietnamese language shall exceed 95% for standard speech patterns.
NFR3: The system shall maintain availability of 99% during prototype testing to support user feedback collection.
NFR4: User data shall be encrypted at rest and in transit using industry-standard encryption protocols.
NFR5: The application shall load and initialize within 4 seconds on mid-range mobile devices.
NFR6: The system shall support concurrent voice conversations with 100 users during prototype testing phase.
NFR7: Voice synthesis quality shall produce natural-sounding Vietnamese with appropriate emotional tone modulation.
NFR8: The prototype shall be deployable and fully functional within the 6-week development timeline.

## User Interface Design Goals

### Overall UX Vision

Create an intimate, calming digital sanctuary where users feel safe sharing their thoughts and receiving guidance. The interface should feel like a warm, private conversation with a wise friend, using minimal visual elements to focus attention on the voice interaction while providing just enough visual context for comfort and navigation.

### Key Interaction Paradigms

**Voice-First Interaction:** Primary interaction through natural speech with minimal touch input required
**Progressive Disclosure:** Gradually reveal deeper numerology insights as users build trust and share more
**Emotional Resonance:** Interface elements respond to conversation emotional context with subtle animations and color shifts
**Contextual Guidance:** Smart prompts and suggestions based on user's numerology profile and conversation history

### Core Screens and Views

**Welcome Screen:** Simple greeting with voice activation button and brief introduction to Numeroly
**Active Conversation View:** Full-screen voice interface with waveform visualization, subtle ambient animations, and minimal conversation history display
**Numerology Dashboard:** Personal profile showing key numbers (Life Path, Destiny, etc.) with brief explanations and current cycle information
**Conversation History:** Timeline view of past conversations with emotional tags and key insights grouped by theme
**Settings & Profile:** User information management, voice preferences, and privacy controls
**Onboarding Flow:** Step-by-step birth information collection with educational context about each numerology calculation

### Accessibility: WCAG AA

Ensuring WCAG AA compliance to make numerology insights accessible to all Vietnamese users, including those with visual or hearing impairments, through alternative input methods and comprehensive screen reader support.

### Branding

Warm, ethereal aesthetic combining soft golden tones with deep blues, reflecting mysticism and wisdom. Visual elements should evoke traditional Vietnamese artistic sensibilities with modern, clean design principles. Typography uses rounded, friendly characters that convey approachability while maintaining sophistication.

### Target Device and Platforms: Web Responsive

Web-responsive design prioritizing mobile devices (iOS/Android) with tablet and desktop support to maximize accessibility for prototype testing. Progressive Web App capabilities for app-like experience without requiring app store deployment during initial testing phase.

## Technical Assumptions

### Repository Structure: Monorepo

Single repository containing both frontend (React Native/Flutter) and backend (FastAPI Python) components for simplified development coordination and version management during prototype phase.

### Service Architecture

**Monolith with Service-Ready Components:** Initial prototype as a cohesive application using FastAPI for backend services, React Native/Flutter for mobile frontend, and PostgreSQL for data persistence. Architecture designed with clear service boundaries for future microservices migration if needed. Components will be modular (voice processing, numerology engine, conversation management, user management) to support scaling.

### Testing Requirements

**Unit + Integration Focus:** Comprehensive unit testing for numerology calculations and business logic, integration tests for voice processing pipelines, and manual user testing for conversation quality and emotional resonance. Automated API testing for backend services and limited E2E testing for critical user flows during prototype phase.

### Additional Technical Assumptions and Requests

**Voice Technology Stack:** Google Speech-to-Text for Vietnamese recognition, ElevenLabs/OpenAI TTS for natural voice synthesis with emotional tone modulation
**AI/NLP Layer:** GPT-4o mini fine-tuned with Pythagorean numerology knowledge base and conversation patterns empathetic to Vietnamese cultural context
**Database Strategy:** PostgreSQL with encryption-at-rest for user data, Redis for conversation session caching, and potential vector database for conversation similarity search
**Deployment:** Containerized deployment using Docker/Kubernetes with CI/CD pipeline for rapid iteration during 6-week development cycle
**Security:** OAuth 2.0 for potential third-party integrations, JWT tokens for session management, and comprehensive audit logging for data access
**Performance Constraints:** Cloud resources optimized for cost-effectiveness during prototype phase with auto-scaling capabilities for user testing periods
**Localization:** Vietnamese language models prioritized with fallback to English for any edge cases during prototype development

## Epic List

### Epic 1: Foundation & Core Voice Infrastructure
Establish project setup, basic voice interaction capabilities, and core numerology calculation engine while delivering a simple voice-based numerology reading experience.

### Epic 2: Conversation Intelligence & User Personalization
Implement sophisticated conversation context management, user profiling, and personalized advice delivery based on numerology insights.

### Epic 3: User Experience & Interface Polish
Complete user interface design, conversation history management, emotional journaling features, and comprehensive testing refinement.

## Epic 1 Foundation & Core Voice Infrastructure

This epic establishes the technical foundation and delivers a minimal viable voicebot experience where users can receive basic numerology readings through Vietnamese voice interaction. The focus is on proving the core voice-numerology concept while building scalable technical infrastructure.

### Story 1.1 Project Setup & Core Infrastructure
As a developer,
I want to establish the project structure, development environment, and core backend services,
so that the team can efficiently build and deploy the numerology voicebot prototype.

**Acceptance Criteria:**
1. Complete monorepo structure with separate frontend and backend directories
2. FastAPI backend service with basic health check endpoint deployed and accessible
3. React Native/Flutter frontend shell application builds and runs on target devices
4. PostgreSQL database configured with encrypted user data tables
5. CI/CD pipeline configured for automated testing and deployment
6. Basic error handling and logging infrastructure implemented
7. Development environment documentation completed

### Story 1.2 Voice Input & Speech Recognition Integration
As a user,
I want to speak Vietnamese into the app and see my words accurately transcribed,
so that I can naturally communicate with the numerology voicebot.

**Acceptance Criteria:**
1. Vietnamese speech-to-text integration using Google Speech API working in real-time
2. Voice activation button with visual feedback showing listening state
3. Text display of transcribed speech with editing capability
4. Network error handling with user-friendly feedback for connectivity issues
5. Voice input works reliably in quiet environments with 95% accuracy
6. Basic conversation flow allowing multiple voice inputs per session

### Story 1.3 Vietnamese Voice Synthesis & Output
As a user,
I want to receive clear, warm-sounding Vietnamese voice responses,
so that I feel comfortable and understood during my numerology consultation.

**Acceptance Criteria:**
1. Vietnamese text-to-speech integration with ElevenLabs/OpenAI TTS
2. Voice response output with warm, empathetic tone configured
3. Response playback controls (pause, replay, volume adjustment)
4. Latency under 3 seconds from text processing to voice playback
5. Natural language Vietnamese pronunciation and emotional modulation
6. Error handling for TTS service failures with fallback messaging

### Story 1.4 Core Numerology Calculation Engine
As a user,
I want to receive accurate Pythagorean numerology calculations based on my personal information,
so that I can get meaningful insights from the voicebot.

**Acceptance Criteria:**
1. Life Path number calculation from birth date with validation
2. Destiny number calculation from full name using Pythagorean system
3. Soul Urge number calculation from vowel letters in name
4. Personality number calculation from consonant letters in name
5. Personal Year and Personal Month calculations with current date
6. Numerology interpretations database in Vietnamese language
7. Input validation and error handling for edge cases

### Story 1.5 Basic Voice-Numerology Integration Flow
As a user,
I want to have a complete voice conversation that collects my information and provides numerology insights,
so that I can experience the core value proposition of the Numeroly voicebot.

**Acceptance Criteria:**
1. Onboarding voice flow collecting name and birth date information
2. Voice interaction flow asking for user's primary concern or question
3. Integration between voice input, numerology calculations, and voice output
4. Complete conversation delivering at least one numerology insight via voice
5. Session management maintaining context across multiple voice exchanges
6. Basic conversation history stored for user reference
7. User satisfaction feedback collection after conversation completion

## Epic 2 Conversation Intelligence & User Personalization

This epic enhances the voicebot with sophisticated conversation management, personalization features, and intelligent advice delivery based on users' numerology profiles and emotional needs during interactions.

### Story 2.1 User Profile Management & Personalization
As a user,
I want the voicebot to remember my numerology profile and conversation preferences,
so that I receive increasingly personalized and relevant guidance over time.

**Acceptance Criteria:**
1. User profile creation storing numerology calculations and personal information
2. Conversation history tracking with timestamp and emotional context tags
3. Personalization engine adapting conversation style based on user preferences
4. Profile data encryption and secure storage compliance
5. User settings management for voice preferences and interaction style
6. Profile recovery and synchronization across devices
7. Privacy controls allowing users to view or delete personal data

### Story 2.2 Conversation Context Management
As a user,
I want the voicebot to remember our previous conversation and provide coherent follow-up,
so that I feel understood and can build upon previous insights.

**Acceptance Criteria:**
1. Session context persistence maintaining conversation threads
2. Memory of recent user concerns and previous numerology insights provided
3. Contextual references to earlier conversations when relevant
4. Conversation summarization capabilities for quick reference
5. Session continuation allowing users to resume previous discussions
6. Emotional context tracking to adapt tone and responses appropriately
7. Graceful handling of context when returning after extended absence

### Story 2.3 Intelligent Advice & Insight Delivery
As a user,
I want to receive personalized advice that considers my numerology profile and current timing,
so that the guidance feels relevant and actionable for my life situation.

**Acceptance Criteria:**
1. Advice generation engine combining numerology insights with user questions
2. Personal Year/Month timing considerations integrated into suggestions
3. Context-aware advice responding to specific user concerns and emotional state
4. Actionable guidance with practical steps and considerations
5. Cross-referencing of multiple numerology aspects for comprehensive insights
6. Advice quality validation aligning with Pythagorean numerology principles
7. Fallback mechanisms when personalized advice cannot be generated

### Story 2.4 Enhanced Emotional Intelligence & Empathy
As a user,
I want the voicebot to recognize my emotional state and respond with appropriate empathy,
so that I feel genuinely supported and understood during our conversations.

**Acceptance Criteria:**
1. Emotional sentiment analysis of user speech and text input
2. Adaptive response tone based on detected emotional state
3. Empathy patterns integrated into conversation responses
4. Supportive language for various emotional situations (confusion, stress, excitement)
5. Cultural sensitivity in emotional responses aligned with Vietnamese norms
6. Escalation protocols for distress detection with appropriate resources
7. Positive reinforcement and encouragement woven throughout interactions

## Epic 3 User Experience & Interface Polish

This epic focuses on creating a polished, accessible user interface with comprehensive features for conversation management, journaling, and overall user satisfaction during the prototype testing phase.

### Story 3.1 Conversation History & Journal Interface
As a user,
I want to review my previous conversations and maintain an emotional journal,
so that I can track my personal growth and reflect on insights over time.

**Acceptance Criteria:**
1. Timeline view displaying all conversation history with summaries
2. Emotional tagging system for categorizing conversation themes
3. Search functionality to find specific insights or topics discussed
4. Export capabilities for conversation history and key insights
5. Journal notes feature allowing users to add personal reflections
6. Progress tracking showing numerology pattern awareness over time
7. Privacy controls for conversation history access and deletion

### Story 3.2 User Settings & Personalization Interface
As a user,
I want to customize my experience and manage my preferences,
so that the app feels personalized and comfortable for my needs.

**Acceptance Criteria:**
1. Voice setting controls for speed, tone, and volume preferences
2. Notification preferences for insights and check-ins
3. Language settings for Vietnamese dialect preferences
4. Interaction style preferences (formal vs. casual communication)
5. Privacy and data management settings with clear explanations
6. Account management including profile editing and deletion
7. Help and FAQ section integrated into settings interface

### Story 3.3 Onboarding Optimization & User Education
As a user,
I want a smooth introduction to numerology and the app's features,
so that I feel confident and informed when using the voicebot.

**Acceptance Criteria:**
1. Step-by-step onboarding explaining numerology concepts simply
2. Interactive tutorial demonstrating voice interaction features
3. Progress indicators showing setup completion
4. Educational content about Pythagorean numerology accessible on-demand
5. Example conversations demonstrating typical usage patterns
6. Support resources and help documentation readily available
7. First conversation guidance to ensure positive initial experience

### Story 3.4 Performance Optimization & Bug Fixes
As a user,
I want the app to run smoothly without technical issues,
so that I can focus on meaningful interactions without frustration.

**Acceptance Criteria:**
1. Response time optimization achieving under 3-second voice response latency
2. Memory usage optimization for smooth performance on mid-range devices
3. Network connectivity improvements handling poor connection scenarios
4. Voice recognition accuracy improvements for Vietnamese language nuances
5. Battery usage optimization for extended conversation sessions
6. Comprehensive error handling with user-friendly recovery options
7. Performance monitoring and analytics for ongoing improvements

## Checklist Results Report

*(This section will be populated after running the PM checklist)*

## Next Steps

### UX Expert Prompt

As UX Expert, please create comprehensive UI/UX specifications and design guidelines for the Numeroly voicebot, focusing on creating an intimate, calming interface that prioritizes voice interaction while providing essential visual support for Vietnamese users exploring numerology insights.

### Architect Prompt

As Architect, please design the technical architecture for the Numeroly Vietnamese AI voicebot, including voice processing pipelines, numerology calculation engine, conversation management system, and secure user data infrastructure suitable for a 6-week MVP prototype with scalability for future growth.
