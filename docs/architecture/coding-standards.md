# Coding Standards

Development standards, naming conventions, and best practices for Numeroly.

**Document Version:** 1.0 | **Last Updated:** January 14, 2025

## Critical Fullstack Rules

### Type Safety Everywhere

**Frontend:**
- All components must use TypeScript with strict mode: `"strict": true` in `tsconfig.json`
- No `any` types except with explicit `@ts-ignore` comments with rationale
- Use `React.FC<Props>` type for functional components
- Type all hook dependencies and return values

```typescript
// Good
interface VoiceButtonProps {
  onPress: () => void;
  isRecording: boolean;
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({ onPress, isRecording }) => {
  // component code
};

// Bad
export const VoiceButton = ({ onPress, isRecording }: any) => {
  // component code
};
```

**Backend:**
- All functions and variables must have type hints
- Use Python 3.11+ type annotations verified by mypy (`--strict` mode)
- No bare `pass` or untyped functions
- Pydantic models for all request/response validation

```python
# Good
async def create_conversation(
    user_id: UUID,
    db: AsyncSession,
) -> ConversationResponse:
    """Create a new conversation for the user."""
    # function code

# Bad
async def create_conversation(user_id, db):
    # Missing type hints
```

### API Contract Adherence

- Frontend services MUST match backend Pydantic schemas exactly
- Use code generation from OpenAPI spec to prevent drift
- Never hardcode API response field names; always use typed interfaces
- Document API changes in commit messages for contract verification

```typescript
// Frontend service must match backend schema
interface ConversationResponse {
  id: string;
  userId: string;
  startedAt: Date;
  status: 'active' | 'completed' | 'abandoned';
}

// This must exactly match: FastAPI Pydantic model
```

### Error Boundaries

**Frontend:**
- Wrap all screen components in `<ErrorBoundary>`
- Implement fallback UI for error states
- Never let errors crash the app; log to Sentry instead

```typescript
<ErrorBoundary>
  <ConversationScreen />
</ErrorBoundary>
```

**Backend:**
- All endpoints must return consistent error format (see Error Handling section)
- No raw exception messages exposed to frontend
- Always include `requestId` for debugging

### Async Best Practices

**Frontend:**
- Use `async/await` exclusively; avoid `.then()` chains
- Never block main thread with sync operations
- Use React Query for server state, Zustand for client state
- Cancel pending requests when component unmounts

```typescript
// Good
useEffect(() => {
  const controller = new AbortController();
  
  const fetchData = async () => {
    const response = await fetch('/api/data', {
      signal: controller.signal,
    });
  };
  
  return () => controller.abort(); // Cleanup
}, []);

// Bad
.then().catch() chains without proper cancellation
```

**Backend:**
- All I/O operations must use `async/await`
- Database queries must use SQLAlchemy async session
- External API calls must include timeout and retry logic

```python
# Good
async def get_user(user_id: UUID, db: AsyncSession) -> User:
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()

# Bad - Blocking sync operations
user = db.query(User).filter(User.id == user_id).first()
```

### Authentication Flow

**Critical Rules:**
- NEVER store access tokens in AsyncStorage (use `expo-secure-store` only)
- Backend MUST verify JWT on every protected endpoint
- Implement token refresh before expiration
- Logout must clear all stored tokens and state

```typescript
// Frontend: Store tokens securely
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('accessToken', token);
const token = await SecureStore.getItemAsync('accessToken');

// Backend: Always verify
@app.get("/users/me")
async def get_current_user(
    current_user: User = Depends(get_current_user)  # JWT verification
) -> UserResponse:
    return UserResponse.from_orm(current_user)
```

### Voice Processing

- Audio files MUST be cleaned up after conversation ends
- Implement max 10 conversations cached locally
- Set reasonable file size limits (< 50MB per file)
- Delete audio files when conversation is archived (> 30 days old)

```typescript
// Cleanup after conversation
const cleanup = async (conversationId: string) => {
  const audioFiles = await getAudioFiles(conversationId);
  for (const file of audioFiles) {
    await FileSystem.deleteAsync(file.uri);
  }
};
```

### Numerology Calculations

- ALWAYS use shared `@numerologist/numerology` library (libs/numerology)
- NEVER duplicate calculation logic in frontend or backend
- All calculations must be verified against Pythagorean numerology standards
- Include unit tests for all numerology operations

```typescript
// Frontend and Backend both use this
import { calculateLifePath, calculateDestiny } from '@numerologist/numerology';

const lifePathNumber = calculateLifePath(birthDate);
const destinyNumber = calculateDestiny(fullName);
```

### Database Transactions

- Use SQLAlchemy transactions for multi-table operations
- Rollback on any error to maintain consistency
- No partial updates on failure

```python
async def create_user_with_profile(
    db: AsyncSession,
    user_data: UserCreate,
) -> User:
    try:
        async with db.begin_nested():  # Savepoint
            user = User(**user_data)
            db.add(user)
            await db.flush()  # Validate foreign keys
            
            profile = NumerologyProfile(user_id=user.id)
            db.add(profile)
            await db.flush()
            
        await db.commit()
        return user
    except Exception:
        await db.rollback()
        raise
```

### Logging Strategy

- Log all external API calls (STT, TTS, GPT-4) with request IDs
- Include latency metrics in logs
- Use structured logging (JSON format) for production
- Never log sensitive data (tokens, passwords, PII)

```python
# Backend logging
import logging

logger = logging.getLogger(__name__)

logger.info(
    "STT request completed",
    extra={
        "duration_ms": 1523,
        "confidence": 0.95,
        "request_id": request_id,
    }
)
```

### Rate Limiting

- Respect external API rate limits with exponential backoff
- Cache ElevenLabs responses to reduce costs
- Implement frontend request debouncing for rapid-fire actions

```python
# Exponential backoff for API calls
async def call_with_retry(
    func,
    max_retries: int = 3,
    base_delay: float = 1.0,
) -> Any:
    for attempt in range(max_retries):
        try:
            return await func()
        except RateLimitError:
            if attempt == max_retries - 1:
                raise
            delay = base_delay * (2 ** attempt)  # 1s, 2s, 4s
            await asyncio.sleep(delay)
```

## Naming Conventions

### Consistent Across Codebase

| Element | Pattern | Example | Notes |
|---------|---------|---------|-------|
| **Components** | PascalCase | `VoiceButton.tsx`, `ConversationView.tsx` | React components |
| **Hooks** | camelCase + `use` prefix | `useAuth.ts`, `useConversation.ts` | Custom React hooks |
| **Services** | camelCase + `Service` suffix | `conversationService.ts` | Frontend service classes |
| **API Routes** | kebab-case | `/api/user-profile`, `/voice/transcribe` | REST endpoint paths |
| **Database Tables** | snake_case + plural | `users`, `conversation_messages` | PostgreSQL tables |
| **Database Columns** | snake_case | `user_id`, `created_at`, `is_active` | PostgreSQL columns |
| **Functions** | camelCase | `startConversation()`, `getProfile()` | Both frontend and backend |
| **Constants** | SCREAMING_SNAKE_CASE | `MAX_AUDIO_DURATION_MS`, `DEFAULT_VOICE_TONE` | Global constants |
| **Interfaces/Types** | PascalCase | `ConversationMessage`, `NumerologyProfile` | TypeScript interfaces and Python dataclasses |
| **Python Classes** | PascalCase | `ConversationService`, `UserRepository` | Python classes |
| **Environment Variables** | SCREAMING_SNAKE_CASE | `OPENAI_API_KEY`, `DATABASE_URL` | .env variables |
| **File Names** | depends on content | `useAuth.ts`, `auth-service.ts` | Match naming inside |
| **Directories** | lowercase + kebab-case | `components/`, `services/`, `utils/` | Folder names |

### Frontend Structure

```
src/
├── components/      # PascalCase.tsx files
│   ├── VoiceButton.tsx
│   └── ConversationView.tsx
├── screens/         # PascalCase.tsx files
│   └── ConversationScreen.tsx
├── hooks/           # useXXX.ts files
│   └── useConversation.ts
├── services/        # xxxService.ts files
│   └── conversationService.ts
├── stores/          # useXxxStore.ts (Zustand)
│   └── useConversationStore.ts
└── utils/           # xxxUtils.ts or xxx.ts
    └── formatters.ts
```

### Backend Structure

```
src/
├── routes/          # xxx.py files
│   └── conversations.py
├── services/        # xxx_service.py files
│   └── conversation_service.py
├── repositories/    # xxx_repository.py files
│   └── conversation_repository.py
├── models/          # xxx.py files
│   └── conversation.py
├── schemas/         # xxx.py files
│   └── conversation.py
└── utils/           # xxx.py files
    └── validators.py
```

## Code Organization Best Practices

### Frontend Components

```typescript
// 1. Imports
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';

// 2. Types/Interfaces
interface Props {
  title: string;
  onPress: () => void;
}

// 3. Component
export const MyComponent: React.FC<Props> = ({ title, onPress }) => {
  // hooks
  const [state, setState] = useState(false);
  
  // effects
  useEffect(() => {
    // ...
  }, []);
  
  // handlers
  const handlePress = () => {
    onPress();
  };
  
  // render
  return (
    <View>
      <Text>{title}</Text>
    </View>
  );
};
```

### Backend Services

```python
# routes/conversations.py
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from ..services.conversation_service import ConversationService
from ..dependencies import get_current_user

router = APIRouter(prefix="/conversations", tags=["conversations"])

@router.post("")
async def start_conversation(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ConversationResponse:
    """Start new conversation."""
    service = ConversationService(db)
    conversation = await service.create(current_user.id)
    return ConversationResponse.from_orm(conversation)
```

## Comments and Documentation

### Frontend JSDoc

```typescript
/**
 * Records user voice input and sends to backend for transcription.
 * 
 * @param conversationId - ID of active conversation
 * @returns Promise resolving to transcribed text and confidence score
 * @throws {Error} If microphone permission denied
 */
async function recordAudio(conversationId: string): Promise<TranscriptionResult> {
  // implementation
}
```

### Backend Docstrings

```python
async def create_conversation(
    user_id: UUID,
    db: AsyncSession,
) -> Conversation:
    """
    Create a new conversation session for a user.
    
    Initializes conversation record and Redis session context
    for managing real-time conversation state.
    
    Args:
        user_id: UUID of authenticated user
        db: SQLAlchemy async session for database operations
        
    Returns:
        Created Conversation object with session ID
        
    Raises:
        ValueError: If user not found
        SQLAlchemyError: On database operation failure
    """
    # implementation
```

### Inline Comments

Use sparingly—code should be self-documenting through clear naming.

```typescript
// Good: Explains non-obvious logic
const delay = baseDelay * (2 ** attempt);  // Exponential backoff: 1s, 2s, 4s

// Bad: Obvious from code
const x = 5;  // Set x to 5
```

## Testing Standards

### Frontend Testing

- Unit test all business logic utilities
- Component tests for complex interactive components
- E2E tests for critical user journeys only
- Aim for 70%+ code coverage on business logic

```typescript
// Unit test example
describe('calculatePersonalYear', () => {
  it('returns correct personal year for given date', () => {
    const result = calculatePersonalYear(new Date('1990-05-15'), 2025);
    expect(result).toBe(5);
  });
});
```

### Backend Testing

- Unit tests for all services and repositories
- Integration tests for API endpoints
- Fixtures for test data setup
- Aim for 80%+ code coverage

```python
@pytest.mark.asyncio
async def test_create_conversation(db: AsyncSession):
    """Test conversation creation."""
    user = await create_test_user(db)
    service = ConversationService(db)
    
    conversation = await service.create(user.id)
    
    assert conversation.status == 'active'
    assert conversation.user_id == user.id
```

## Error Handling

### Frontend

```typescript
// Always handle and log errors
try {
  const response = await apiClient.post('/conversations');
  setConversationId(response.data.id);
} catch (error) {
  logger.error('Failed to start conversation', { error });
  showErrorAlert('Could not start conversation. Please try again.');
}
```

### Backend

```python
# Return consistent error format
@router.post("/conversations")
async def start_conversation(...) -> ConversationResponse:
    try:
        service = ConversationService(db)
        conversation = await service.create(current_user.id)
        return ConversationResponse.from_orm(conversation)
    except Exception as e:
        logger.error(f"Conversation creation failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to start conversation"
        )
```

## Performance Guidelines

### Frontend

- Use React.memo() for components that don't need frequent re-renders
- Implement lazy loading for routes
- Cache API responses with React Query (5-minute stale time)
- Debounce rapid user inputs

```typescript
const MemoizedComponent = React.memo(MyComponent);
```

### Backend

- Use database indexes on frequently queried columns
- Cache numerology interpretations (1-hour TTL)
- Use connection pooling for database
- Implement query result pagination

```python
# Use indexes
CREATE INDEX idx_conversations_user 
ON conversations(user_id, created_at DESC);
```

## Security Guidelines

### Frontend

- No sensitive data in Redux/Zustand stores
- Use `expo-secure-store` for tokens only
- Validate all user inputs before sending to server
- Use HTTPS in production only

### Backend

- Validate all inputs with Pydantic schemas
- Implement rate limiting on sensitive endpoints
- Hash passwords if used (use Azure AD B2C instead)
- Log all security-relevant events

```python
# Rate limiting example
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/auth/login")
@limiter.limit("5/minute")
async def login(request: Request, credentials: LoginRequest):
    # implementation
```

## Version Control & Commits

### Commit Message Format

```
<type>: <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Example:**
```
feat: add voice-to-text transcription for conversation input

Integrate Azure Speech Services for Vietnamese audio processing.
Implements WebSocket streaming for real-time transcription with
confidence scoring.

Fixes #42
```

### Code Review Checklist

- [ ] Types are properly annotated
- [ ] No secrets or sensitive data committed
- [ ] Tests pass and coverage maintained
- [ ] Documentation updated if needed
- [ ] Follows naming conventions
- [ ] Error handling implemented
- [ ] No console.logs in production code

---

**See Also:** [Tech Stack](./tech-stack.md) | [Source Tree & Project Structure](./source-tree.md) | [Main Architecture](../architecture.md)
