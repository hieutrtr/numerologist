# Tech Stack

Complete technology stack for Numeroly with versions, rationale, and integration notes.

**Document Version:** 1.1 | **Last Updated:** January 16, 2025 | **Versions Updated to Latest Stable**

## Tech Stack Summary

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.7 | Type-safe mobile development | Strong typing prevents runtime errors, excellent IDE support, shares types with backend |
| Frontend Framework | React Native | 0.76 | Cross-platform mobile app | Single codebase for iOS/Android, large community, PWA support via Expo |
| UI Component Library | React Native Elements | 4.1 | Pre-built mobile UI components | Consistent design patterns, accessibility built-in, customizable themes |
| State Management | Zustand | 5.0 | Lightweight global state | Simpler than Redux, perfect for voice session state, minimal boilerplate |
| Backend Language | Python | 3.13 | AI/ML ecosystem compatibility | Best support for GPT-4o, numerology calculations, extensive libraries, latest stable |
| Backend Framework | FastAPI | 0.115 | High-performance async API | Native async support for voice streaming, automatic OpenAPI docs, fast development |
| API Style | REST + WebSocket | - | Real-time voice and standard CRUD | REST for standard ops, WebSocket for streaming voice/conversation updates |
| Database | PostgreSQL | 17 | Relational data with JSONB | Strong data integrity, JSONB for flexible conversation storage, native encryption, latest stable |
| Cache | Redis | 7.4 | Session state and rate limiting | In-memory speed for conversation context, pub/sub for real-time updates, latest stable |
| File Storage | Azure Blob Storage | - | Conversation audio archives | Scalable object storage, encryption-at-rest, Azure CDN integration |
| Authentication | Azure AD B2C | - | User identity management | Consumer identity platform, phone auth with SMS OTP for Vietnamese users, JWT tokens |
| Frontend Testing | Jest + React Native Testing Library | - | Unit and component tests | Industry standard, snapshot testing, accessibility testing |
| Backend Testing | Pytest + httpx | - | API and unit testing | Async test support, fixture-based, high code coverage tools |
| E2E Testing | Detox | - | Mobile end-to-end flows | React Native native support, reliable gesture testing |
| Monorepo Tool | Nx | 20 | Enterprise monorepo orchestration | Smart builds with caching, dependency graph, code generation, task runners, latest stable |
| Build Tool | Expo | 52 | React Native development platform | Simplified mobile builds, OTA updates, managed workflow for MVP speed, latest SDK |
| Bundler | Metro | 0.80 | React Native JavaScript bundling | Default for React Native, optimized for mobile, supports PWA |
| IaC Tool | Terraform | 1.9 | Infrastructure as Code | Azure provider support, state management, reproducible deployments, latest stable |
| CI/CD | GitHub Actions | - | Automated testing and deployment | Free for open source, Azure integration, parallel job execution |
| Monitoring | Azure Monitor + Application Insights + Sentry | - | Application observability | Azure native monitoring, AI-powered insights, Sentry for error tracking |
| Logging | Azure Monitor Logs (Log Analytics) | - | Centralized log aggregation | KQL queries, conversation flow tracking, compliance audit trails |
| CSS Framework | NativeWind | 4.1 | Tailwind for React Native | Rapid UI development, consistent design system, small bundle size, latest stable |

## Frontend Tech Stack Details

### Languages & Frameworks

**TypeScript 5.7**
- Strict mode enabled across entire frontend
- Target: ES2020 for broad device compatibility
- Module: ESNext with bundler-based resolution
- Strict type checking required for all components
- Use type-only imports where possible: `import type { User } from './types'`
- Improved type inference and performance

**React Native 0.76**
- Managed by Expo for simplified builds
- Async rendering for smooth 60fps animations
- Native module linking via Expo modules
- Platform-specific code: `.ios.tsx`, `.android.tsx` suffixes
- Web support via React Native Web (PWA deployment)
- Latest stable version with improved performance and compatibility

**Expo 52 SDK**
- Managed workflow (no EAS prebuild needed for MVP)
- Development server on port 19006
- EAS Build for production iOS/Android builds
- EAS Submit for app store submissions
- OTA updates via Expo's update service
- Latest SDK with enhanced stability and features

### State Management

**Zustand 5.0**
- Simple store-based state management
- No boilerplate compared to Redux
- Perfect for voice session state and conversation context
- Integrates with React dev tools
- Major version 5 with improved TypeScript support and performance

```typescript
// Example store structure
import { create } from 'zustand';

interface ConversationState {
  activeConversationId: string | null;
  messages: ConversationMessage[];
  isRecording: boolean;
  setActiveConversation: (id: string) => void;
  addMessage: (msg: ConversationMessage) => void;
}

export const useConversationStore = create<ConversationState>((set) => ({
  activeConversationId: null,
  messages: [],
  isRecording: false,
  setActiveConversation: (id) => set({ activeConversationId: id }),
  addMessage: (msg) => set((state) => ({ messages: [...state.messages, msg] })),
}));
```

### Component Library

**React Native Elements 4.1**
- Pre-built components with consistent theming
- Accessibility features built-in (ARIA labels, keyboard navigation)
- Customizable via theme provider
- Includes: Button, Card, Input, Icon, Avatar, Badge, etc.
- Latest stable with improved TypeScript support

### UI/CSS Framework

**NativeWind 4.1**
- Tailwind CSS utility classes for React Native
- Rapid prototyping with familiar class names
- Responsive design with breakpoints
- Dark mode support via class-based toggling
- Latest stable with enhanced compatibility

```typescript
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View, 'px-4 py-2 bg-white rounded-lg');
const StyledText = styled(Text, 'text-lg font-semibold text-gray-900');

export const Card = () => (
  <StyledView>
    <StyledText>Hello World</StyledText>
  </StyledView>
);
```

### Testing Stack

**Jest + React Native Testing Library**
- Unit tests for utilities and hooks
- Component snapshot tests for UI regression detection
- React Testing Library queries for accessible component testing
- Mock native modules with jest.mock()

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { VoiceButton } from './VoiceButton';

it('renders and responds to touch', () => {
  const onPress = jest.fn();
  const { getByTestId } = render(<VoiceButton onPress={onPress} />);
  
  fireEvent.press(getByTestId('voice-button'));
  expect(onPress).toHaveBeenCalled();
});
```

**Detox (E2E Testing)**
- E2E testing for critical user journeys
- Gray box testing approach (can mock network)
- Synchronization with React Native app state
- Video recording of test failures

```typescript
describe('Voice Conversation Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('records and plays back audio', async () => {
    await element(by.id('voice-button')).multiTap(2);
    await expect(element(by.text('Recording...'))).toBeVisible();
  });
});
```

## Backend Tech Stack Details

### Languages & Frameworks

**Python 3.11+**
- Type hints required for all functions and variables
- Minimum Python 3.11 for performance improvements and better error messages
- Verified with mypy (`strict` mode enabled)
- Use modern async/await patterns exclusively

**FastAPI 0.109+**
- High-performance async web framework
- Automatic OpenAPI documentation generation
- Built-in data validation with Pydantic
- Dependency injection system for testability
- WebSocket support for real-time voice streaming

```python
from fastapi import FastAPI, Depends
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(title="Numeroly API", version="1.0.0")

@app.post("/conversations")
async def start_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """Start a new conversation session."""
    conversation_service = ConversationService(db)
    conversation = await conversation_service.create_conversation(current_user.id)
    return ConversationResponse.from_orm(conversation)
```

### Database

**PostgreSQL 15+**
- JSONB columns for flexible schema evolution
- Native encryption with pgcrypto extension
- UUID primary keys for distributed systems
- Row-level security (RLS) for multi-tenant data isolation
- Connection pooling via PgBouncer (20-30 connections per app instance)

```sql
-- Example schema with JSONB
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    metadata JSONB DEFAULT '{}', -- Flexible metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversations_user ON conversations(user_id, created_at DESC);
```

**Alembic for Migrations**
- Database version control
- Auto-generate migrations from SQLAlchemy models
- Rollback support for safe deployments

```bash
# Create migration
alembic revision --autogenerate -m "Add conversation metadata"

# Apply migrations
alembic upgrade head

# Rollback last migration
alembic downgrade -1
```

### Caching

**Redis 7.2+**
- In-memory session caching for conversation context
- Pub/Sub for real-time updates
- Rate limiting counters
- Cache invalidation with TTL

```python
from redis.asyncio import Redis

redis = Redis.from_url("redis://localhost:6379")

# Cache conversation context
await redis.setex(
    f"conversation:{conversation_id}:context",
    3600,  # 1-hour TTL
    json.dumps(conversation_context)
)

# Retrieve cached context
context = await redis.get(f"conversation:{conversation_id}:context")
```

### File Storage

**Azure Blob Storage**
- Scalable object storage for conversation audio files
- Encryption at rest (AES-256)
- CDN integration for global distribution
- Automatic cleanup policies for archived data

### Testing Stack

**Pytest + httpx**
- Async-aware testing framework
- Fixture-based setup and teardown
- Code coverage with pytest-cov
- Mock external APIs with pytest-mock

```python
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
async def test_create_conversation(client: AsyncClient, db: AsyncSession):
    """Test conversation creation endpoint."""
    user = await create_test_user(db)
    token = await get_auth_token(user)
    
    response = await client.post(
        "/conversations",
        headers={"Authorization": f"Bearer {token}"}
    )
    
    assert response.status_code == 201
    assert response.json()["status"] == "active"
```

## External APIs & Services

### Cloud Platform

**Microsoft Azure**
- **Region:** Southeast Asia (Singapore) primary, East Asia (Hong Kong) secondary
- **Services:** Container Apps, App Gateway, CDN, Application Insights, Monitor
- **Cost Optimization:** Reserved instances for predictable workloads, spot instances for background jobs

### AI/ML Services

**Azure Speech Services (Cognitive Services)**
- Vietnamese speech recognition: `vi-VN` locale
- WebSocket streaming for sub-2-second latency
- Custom speech models available for accents
- Fallback: `gpt-4o-mini-transcribe` (10x cheaper, released March 2025)

**OpenAI GPT-4o**
- Latest multimodal model (May 2024)
- Excellent Vietnamese language support
- 128K context window
- Fallback: `gpt-4o-mini` for cost optimization
- Advanced reasoning: `o3-mini` for complex numerology analysis (Jan 2025)

**ElevenLabs Text-to-Speech**
- Vietnamese voices (or custom voice clones)
- Emotional modulation: warmth, stability settings
- Cost: ~$50-150 per million characters
- Fallback: OpenAI `tts-1` ($15/million chars, but English voices only)

### Cost-Effective Alternatives

**Speech-to-Text: gpt-4o-mini-transcribe**
- Pricing: $0.003/minute = **$0.18/hour** (12x cheaper than Azure Speech)
- Better accuracy: 54% better than Whisper
- Vietnamese support: Excellent (86+ languages)

**Text-to-Speech: OpenAI TTS-1**
- Pricing: $0.015/1K characters = **$15/million** (3-10x cheaper)
- Limitation: English voices only, no Vietnamese voices
- Quality: Natural but less expressive than ElevenLabs

**Recommendation:**
- **STT:** Switch to `gpt-4o-mini-transcribe` post-MVP (12x savings)
- **TTS:** Keep ElevenLabs for MVP (Vietnamese voice critical), consider OpenAI for future expansion

### Authentication

**Azure AD B2C**
- Phone number + SMS OTP authentication
- JWT token generation and validation
- Refresh token rotation (7-day expiry)
- MSAL Python SDK for server-side verification

### Infrastructure

**GitHub Actions for CI/CD**
- Automated testing on pull requests
- Docker image builds and pushes to Azure Container Registry
- Automated deployments to Azure Container Apps
- Parallel job execution for fast feedback

## Dependencies Management

### Frontend (`apps/mobile/package.json`)

Key dependencies:
- `react-native`: 0.73+
- `react-navigation`: 6.x (routing)
- `axios`: 1.x (HTTP client)
- `zustand`: 4.5+ (state management)
- `react-native-elements`: 4.x (UI components)
- `nativewind`: 4.x (utility CSS)
- `expo`: 50+ (build tool)
- `expo-secure-store`: (token storage)
- `react-native-audio-recorder-player`: (voice recording)

### Backend (`apps/api/requirements.txt`)

Key dependencies:
- `fastapi`: 0.109+
- `sqlalchemy[asyncio]`: 2.x (ORM)
- `alembic`: 1.x (migrations)
- `pydantic`: 2.x (validation)
- `python-jose[cryptography]`: (JWT)
- `pytest`: 7.x + `pytest-asyncio` (testing)
- `redis`: 5.x (caching)
- `aiohttp`: 3.x (async HTTP client)
- `openai`: 1.x (GPT-4 integration)
- `azure-cognitiveservices-speech`: (Azure Speech)
- `elevenlabs`: (TTS)

## Version Management Strategy

### Pinning Policy

**Production Dependencies:**
- Pin to minor version: `fastapi==0.109.*`
- Allows patch updates (bug fixes) automatically
- Prevents breaking changes from minor/major upgrades

**Development Dependencies:**
- Pin to major version: `pytest>=7.0`
- Allows flexibility during development

### Security Updates

- Weekly dependency scanning via Dependabot
- Automated PRs for security patches
- Fast-tracked review and deployment for critical vulnerabilities

## Performance Requirements by Tech Stack

| Component | Target | Actual Approach |
|-----------|--------|-----------------|
| API Response Time | < 200ms (P95) | Async handlers, connection pooling, query optimization |
| Voice Transcription | < 2 seconds | WebSocket streaming, concurrent processing |
| Voice Synthesis | < 1 second | Response caching, ElevenLabs streaming |
| Total Conversation Turn | < 3 seconds | Parallel processing, Redis context caching |
| App Bundle Size | < 5MB initial | Code splitting, lazy loading, tree-shaking |
| Database Query | < 100ms | Proper indexing, query optimization, read replicas |

## Technology Selection Rationale

### Why This Stack?

1. **Type Safety:** TypeScript + Python type hints catch errors at development time
2. **Performance:** FastAPI async + React Native native performance meets < 3sec voice requirement
3. **Developer Experience:** Familiar frameworks (React, FastAPI) accelerate 6-week MVP timeline
4. **Cost Efficiency:** Azure pay-as-you-go, open-source tools, Nx for build optimization
5. **Scalability:** Serverless Container Apps auto-scales, Nx monorepo supports growth
6. **Reliability:** JSONB flexibility, Redis caching, Azure redundancy reduce operational risk

### Trade-offs Considered

| Considered | Chosen | Reason |
|-----------|--------|--------|
| Next.js | Expo | Mobile-first app, native performance needed |
| Redux | Zustand | Less boilerplate, simpler API state management |
| Django | FastAPI | Async-first, better for voice streaming WebSockets |
| Firebase | Azure AD B2C + PostgreSQL | Better phone auth for Vietnamese users, cost predictability |
| Socket.io | WebSocket (native) | Lighter implementation, faster voice streaming |

---

**See Also:** [Source Tree & Project Structure](./source-tree.md) | [Coding Standards](./coding-standards.md) | [Main Architecture](../architecture.md)
