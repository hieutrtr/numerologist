# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Numeroly** is a Vietnamese AI voice-first numerology assistant - an MVP prototype built as a full-stack application within an Nx monorepo. It provides Pythagorean numerology readings through natural Vietnamese voice conversations.

- **Frontend:** React Native 0.81 + TypeScript + Zustand + Expo (daily.co for voice)
- **Backend:** FastAPI (Python 3.11+) + PostgreSQL 15+ + Redis 7.2+
- **AI Services:** Azure OpenAI (STT/LLM), ElevenLabs (TTS)
- **Infrastructure:** Docker, Nx monorepo, GitHub Actions, Azure

## Repository Structure

```
numerologist/
├── apps/
│   ├── mobile/              # React Native frontend (Expo)
│   │   ├── src/components/  # Reusable UI components
│   │   ├── src/screens/     # Screen containers
│   │   ├── src/stores/      # Zustand state management
│   │   ├── src/services/    # API client & voice services
│   │   ├── src/hooks/       # Custom React hooks
│   │   └── src/utils/       # Helpers, formatters
│   └── api/                 # FastAPI backend (Python)
│       ├── src/routes/      # REST API endpoints (/v1)
│       ├── src/services/    # Business logic & AI integration
│       ├── src/middleware/  # Error handling, logging
│       ├── src/models/      # SQLAlchemy ORM models
│       ├── src/schemas/     # Pydantic validation
│       └── src/utils/       # Database, logging, Redis helpers
├── libs/
│   ├── shared/              # Shared TypeScript types & constants
│   ├── numerology/          # Python numerology calculation engine
│   └── ui/                  # Reusable React Native components
├── docs/
│   ├── architecture/        # Architecture documentation (indexed)
│   │   ├── index.md        # Navigation & architecture overview
│   │   ├── tech-stack.md   # Technology choices & rationale
│   │   ├── coding-standards.md # Development standards
│   │   └── source-tree.md  # Detailed structure
│   └── stories/            # Development user stories
├── nx.json                  # Nx workspace configuration
├── docker-compose.yml       # Local PostgreSQL & Redis
└── .env.example            # Environment template
```

## Key Commands

### Development Servers

```bash
# Start all services (API + Mobile with hot reload)
npm start

# Or start individually:
npm run start:api              # FastAPI backend (http://localhost:8000)
npm run start:mobile           # React Native Expo (http://localhost:19006)

# Alternative: Use convenience scripts
bash start-dev.sh             # Start everything with logs
bash stop-dev.sh              # Stop everything
```

### Building & Packaging

```bash
npm run build                  # Build all apps
npm run build:mobile           # React Native build
npm run build:api              # Docker image: numeroly-api:latest
```

### Testing

```bash
npm run test                   # Run all tests
npm run test:mobile            # Jest tests for React Native
npm run test:api               # cd apps/api && pytest tests/

# Backend testing with coverage:
cd apps/api && source venv/bin/activate && pytest tests/ -v --cov=src
```

### Code Quality

```bash
npm run lint                   # Lint all code
npm run type-check             # Type check all TypeScript
npm run format                 # Format & fix all code (prettier + black)

# Backend-specific:
cd apps/api && source venv/bin/activate
  flake8 src/                 # Python linting
  mypy src/                   # Python type checking
  black src/                  # Format Python code
```

### Database

```bash
npm run db:start               # Start PostgreSQL & Redis (docker-compose up -d)
npm run db:stop                # Stop services (docker-compose down)
npm run db:reset               # Reset database (docker-compose down -v && up)

# Migrations (from apps/api):
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1
```

### Nx Utilities

```bash
npm run graph                  # View workspace dependency graph
npm run affected               # Show affected projects
npm run clean                  # Reset Nx cache (nx reset)
```

## Development Setup

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Backend Python setup
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..

# 3. Configure environment
cp .env.example .env
# Edit .env with your Azure OpenAI and ElevenLabs credentials

# 4. Start services
npm run db:start              # PostgreSQL + Redis
npm run start:api             # API on port 8000
npm run start:mobile          # Mobile on port 19006

# 5. Verify health
curl http://localhost:8000/health    # Should return {"status": "healthy"}
curl http://localhost:8000/docs      # OpenAPI documentation
```

## Critical Architecture Concepts

### Backend Architecture
- **REST API at `/v1` prefix** - All endpoints namespaced under `/v1/`
- **Service Layer Pattern** - Business logic separated from routes (see `src/services/`)
- **Repository Pattern** - Database access abstraction (see `src/repositories/`)
- **Async/await** - Full async FastAPI using asyncpg for database
- **Error Middleware** - Centralized error handling in `src/middleware/error_handler.py`

### Frontend Architecture
- **Zustand State Management** - Global state in `src/stores/`
- **Voice Services** - Abstracted in `src/services/voiceInputService.ts` and `voiceOutputService.ts`
- **Daily.co Integration** - WebRTC voice streaming via `@daily-co/daily-react`
- **Navigation** - React Navigation (stack & tabs) configured in App.tsx

### AI Service Integration
- **Speech-to-Text:** Azure OpenAI SDK with `gpt-4o-mini-transcribe` deployment
- **Text-to-Speech:** ElevenLabs SDK with voice request stitching for consistency
- **LLM Reasoning:** Azure OpenAI `gpt-4o-mini` deployment
- **Services:** Located in `apps/api/src/services/` (voice_service.py, text_to_speech_service.py, agent_service.py)

### Database & Caching
- **PostgreSQL:** Async connection via asyncpg, models in `src/models/`
- **Redis:** For session/cache, client in `src/utils/redis_client.py`
- **Migrations:** Alembic ORM auto-generation from models

## Common Development Tasks

### Adding a New API Endpoint

1. Create route function in `apps/api/src/routes/` with proper Pydantic schemas
2. Use service layer for business logic
3. Add request ID logging and error handling
4. Update OpenAPI docs (auto-generated from docstrings)
5. Test with `pytest` before committing

### Modifying the Voice Pipeline

1. Voice input services in `apps/api/src/services/voice_service.py`
2. For Azure OpenAI changes: update deployment names in `config.py`
3. For ElevenLabs changes: update voice ID and settings in `text_to_speech_service.py`
4. Frontend voice UI in `apps/mobile/src/screens/ConversationScreen.tsx`
5. Test with `npm run test:api` and integration testing

### Adding Numerology Calculations

1. Core logic in `libs/numerology/src/calculator.py`
2. Expose calculations via `apps/api/src/services/`
3. Create route endpoints that call the service
4. Add tests in `apps/api/tests/`

### Running Single Test File

Backend:
```bash
cd apps/api
source venv/bin/activate
pytest tests/test_conversations.py -v
pytest tests/test_conversations.py::test_create_conversation -v  # Single test
```

Frontend:
```bash
cd apps/mobile
npm test -- ConversationView.test.tsx
```

## Environment Configuration

**Required variables** (see `.env.example`):

```bash
# Frontend
EXPO_PUBLIC_API_URL=http://localhost:8000/v1

# Backend Database
DATABASE_URL=postgresql+asyncpg://numeroly:password@localhost:5432/numeroly
REDIS_URL=redis://localhost:6379/0

# Azure OpenAI (for STT + LLM reasoning)
AZURE_OPENAI_KEY=<your-key>
AZURE_OPENAI_ENDPOINT=https://<resource>.openai.azure.com
AZURE_OPENAI_STT_DEPLOYMENT_NAME=gpt-4o-mini-transcribe
AZURE_OPENAI_REASONING_DEPLOYMENT_NAME=gpt-4o-mini

# ElevenLabs (for TTS)
ELEVENLABS_API_KEY=<your-key>
ELEVENLABS_VOICE_ID=<vietnamese-voice-id>

# Security
JWT_SECRET_KEY=<strong-random-32-chars-minimum>
```

For local development, Docker Compose services automatically run at `localhost:5432` (PostgreSQL) and `localhost:6379` (Redis).

## Debugging & Troubleshooting

### Backend (FastAPI)
- **Logs:** Check `apps/api/api.log` or console output
- **API Docs:** `http://localhost:8000/docs` (Swagger UI)
- **Health Check:** `curl http://localhost:8000/health`
- **Request ID Tracking:** All requests include request ID in logs for correlation

### Frontend (React Native)
- **Logs:** Check Expo console or `apps/mobile/mobile.log`
- **Clear Cache:** `npm run clear-cache` or `expo start --clear`
- **Debugger:** Expo DevTools (press `d` in terminal when running)

### Database Issues
```bash
# Check containers
docker-compose ps

# View logs
docker-compose logs postgres  # or redis

# Connect to database directly
docker-compose exec postgres psql -U numeroly -d numeroly
```

### Port Conflicts
- API port 8000: Change in start script and env
- Mobile port 19006: Expo picks next available if taken
- Database ports: Use different compose file or adjust docker-compose.yml

## Testing Strategy

- **Backend:** pytest with async support (`pytest-asyncio`), mocking (`pytest-mock`), coverage tracking
- **Frontend:** Jest via Expo, component snapshots for UI regression
- **Integration:** Manual voice flow testing via Expo client
- **E2E:** CI/CD pipeline tests on PR and merge to main

See `docs/architecture/coding-standards.md` for detailed testing patterns.

## Code Style & Conventions

**TypeScript:**
- Use strict mode (`tsconfig.base.json` settings)
- Prefer const over let, avoid var
- Use type annotations for function parameters and returns
- Component naming: PascalCase
- File naming: kebab-case for components, camelCase for utilities

**Python:**
- Follow PEP 8 (enforced via `black` and `flake8`)
- Type hints required for all functions
- Docstrings on modules, classes, and public methods
- Async functions prefixed with descriptive names (e.g., `async def fetch_user_profile()`)

**Git:**
- Branches: `feature/description` or `fix/description`
- Commits: Imperative mood ("Add feature" not "Added feature")
- PRs: Must pass CI/CD and code review before merge

## CI/CD Pipeline

**On Pull Request:**
- Lint (eslint, flake8)
- Type check (TypeScript, mypy)
- Run tests (Jest, pytest)

**On Merge to main:**
- Deploy backend to Azure Container Registry
- Mobile builds available via Expo

See `.github/workflows/` for implementation details.

## Important Files & When to Edit

| File | Purpose | Edit When |
|------|---------|-----------|
| `apps/api/src/config.py` | Backend configuration | Adding env vars or defaults |
| `apps/api/src/main.py` | FastAPI app setup | Adding middleware or changing startup |
| `apps/mobile/App.tsx` | React Native entry point | Changing root navigation structure |
| `apps/mobile/src/stores/` | Global state (Zustand) | Adding or modifying app state |
| `nx.json` | Workspace configuration | Changing build targets or plugins |
| `.env.example` | Environment template | Adding new required variables |
| `docs/architecture/*.md` | Reference documentation | Recording decisions or patterns |

## Monorepo & Nx Specifics

- **Shared TypeScript:** `libs/shared/` types imported as `@numerologist/shared`
- **Shared Python:** `libs/numerology/` modules imported directly in backend
- **Cache Invalidation:** Run `npm run clean` if experiencing stale cache issues
- **Build Artifacts:** Located in `dist/` directories per app
- **Watch Mode:** Most commands support `--watch` flag for active development

## Voice Streaming Architecture (Story 1.2c)

The frontend uses **Daily.co WebRTC** for bidirectional audio streaming:

1. **Frontend initiates session** via `voiceInputService.ts`
2. **Daily.co handles audio transport** (UDP-based for low latency)
3. **Backend receives audio chunks** from Daily.co callback or polling
4. **Azure OpenAI STT transcribes** Vietnamese voice to text
5. **Agent service orchestrates** multi-turn conversation
6. **ElevenLabs TTS synthesizes** response text back to speech
7. **Frontend plays audio** via `voiceOutputService.ts`

See `STORY_1.2c_IMPLEMENTATION_COMPLETE.md` for complete implementation details.

## Getting Help

1. **Architecture questions:** Check `docs/architecture/index.md` for navigation
2. **Specific implementation:** Review relevant service files and tests
3. **Build/deploy issues:** Check GitHub Actions workflows in `.github/workflows/`
4. **Development stories:** Read `docs/stories/` for context on recent work
5. **Coding standards:** See `docs/architecture/coding-standards.md`

---

**Last Updated:** October 21, 2025
**Architecture Status:** Stable (v1.2)
**Current Focus:** Voice streaming optimization and numerology calculation refinement
