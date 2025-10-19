# Numeroly - Vietnamese AI Voice Numerology Assistant

An MVP voicebot prototype that provides Pythagorean numerology insights through natural Vietnamese voice conversations. Built with React Native (frontend) and FastAPI (backend) in a monorepo structure.

## Project Overview

**Goal:** Create a functional Vietnamese AI voicebot prototype that delivers numerology readings via voice interaction within 6 weeks.

**Target Users:** Vietnamese audiences interested in self-discovery, numerology, and AI-powered wellness guidance.

**Tech Stack:**
- **Frontend:** React Native + TypeScript + Zustand + Expo
- **Backend:** FastAPI + Python 3.11+ + SQLAlchemy + PostgreSQL
- **Database:** PostgreSQL 15+ with JSONB + Redis 7.2
- **Infrastructure:** Docker, Nx Monorepo, GitHub Actions, Azure

## Project Structure

```
numerologist/
├── apps/
│   ├── mobile/              # React Native frontend (Expo)
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── screens/     # Screen containers
│   │   │   ├── stores/      # Zustand state management
│   │   │   ├── services/    # API client
│   │   │   ├── hooks/       # Custom React hooks
│   │   │   └── utils/       # Helper functions
│   │   ├── App.tsx          # Main app entry
│   │   ├── app.json         # Expo configuration
│   │   └── package.json
│   └── api/                 # FastAPI backend
│       ├── src/
│       │   ├── routes/      # API endpoints
│       │   ├── services/    # Business logic
│       │   ├── repositories/# Data access
│       │   ├── models/      # SQLAlchemy ORM
│       │   ├── schemas/     # Pydantic validation
│       │   ├── middleware/  # Error handling
│       │   ├── websockets/  # WebSocket handlers
│       │   └── utils/       # Database, logging
│       ├── main.py          # FastAPI app
│       ├── config.py        # Configuration
│       ├── requirements.txt # Python dependencies
│       └── Dockerfile       # Container image
├── libs/
│   ├── shared/              # Shared TypeScript utilities
│   │   ├── types/           # Type definitions
│   │   ├── constants/       # Errors, limits, defaults
│   │   ├── validators/      # Input validation
│   │   └── utils/           # Formatters, converters
│   ├── numerology/          # Python numerology engine
│   │   ├── src/
│   │   │   └── calculator.py # Core calculations
│   │   └── setup.py
│   └── ui/                  # React Native components
│       ├── Button
│       ├── Card
│       ├── Input
│       └── ...
├── .github/
│   └── workflows/           # CI/CD pipelines
│       ├── ci.yaml          # PR testing
│       └── deploy-api.yaml  # Backend deployment
├── docs/
│   ├── architecture/        # Sharded architecture docs
│   ├── prd/                 # Product requirements
│   └── stories/             # Development stories
├── nx.json                  # Nx workspace config
├── tsconfig.base.json       # TypeScript config
├── package.json             # Monorepo scripts
├── docker-compose.yml       # Local services
└── .env.example             # Environment template
```

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- Git

### 1. Clone & Install

```bash
git clone <repository>
cd numerologist

# Install Node dependencies
npm install

# Install Python dependencies
cd apps/api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..
```

### 2. Start Local Services

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 3. Run Backend

```bash
cd apps/api
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn src.main:app --reload
```

Backend will start at **http://localhost:8000**
- Health check: http://localhost:8000/health
- OpenAPI docs: http://localhost:8000/docs

### 4. Run Frontend

In a new terminal:

```bash
cd apps/mobile
npm start
```

Frontend will start at **http://localhost:19006**
- Scan the QR code with Expo Go app (iOS/Android)
- Or press `w` to open web version

### 5. Verify Setup

Check that everything is working:

```bash
# Frontend
curl http://localhost:19006  # Should return Expo dev server

# Backend
curl http://localhost:8000/health  # Should return {"status": "healthy"}

# Speech-to-Text endpoint (requires sample WAV file)
curl -X POST \
  -H "x-request-id: quickstart" \
  -F "audio_file=@sample_vi.wav" \
  http://localhost:8000/api/v1/voice/transcriptions

# Database
docker-compose exec postgres psql -U numeroly -d numeroly -c "\dt"
```

## Development

### Monorepo Commands

```bash
# Lint all code
npm run lint

# Type check TypeScript
npm run typecheck

# Run all tests
npm run test

# Build all applications
npm run build

# View dependency graph
npm run graph
```

### Frontend Development

```bash
cd apps/mobile

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Format code
npm run format
```

### Backend Development

```bash
cd apps/api
source venv/bin/activate

# Run development server
uvicorn src.main:app --reload

# Run tests
pytest tests/ -v --cov=src

# Lint code
pylint src/

# Type check
mypy src/
```

### Creating Database Migrations

```bash
cd apps/api
source venv/bin/activate

# After modifying models in src/models/
alembic revision --autogenerate -m "Description of changes"
alembic upgrade head
```

## Architecture Documentation

Complete architecture documentation is available in the `docs/architecture/` directory:

- **[index.md](docs/architecture/index.md)** - Architecture overview and navigation
- **[tech-stack.md](docs/architecture/tech-stack.md)** - Technology choices and rationale
- **[coding-standards.md](docs/architecture/coding-standards.md)** - Development standards
- **[source-tree.md](docs/architecture/source-tree.md)** - Project structure details

## Voice Services Migration Guide (Story 1.6)

### Overview

Voice services have been refactored to use production-ready libraries instead of direct API calls:

- **Speech-to-Text:** Now uses **Azure AI OpenAI SDK** (`azure-ai-openai`)
- **Text-to-Speech:** Now uses **ElevenLabs Python SDK** (`elevenlabs`)
- **Orchestration:** New **Agent Framework** service for multi-turn conversations

### Key Improvements

#### 1. Automatic Retry & Error Handling
- SDK handles connection retries, timeouts, and errors automatically
- Reduces boilerplate code in service layer
- Better reliability for production use

#### 2. Request Stitching (TTS)
- ElevenLabs SDK now tracks previous request IDs
- Maintains voice consistency across multiple TTS calls
- Seamless multi-turn conversations with same voice

#### 3. Dual Deployment Strategy
- **STT:** `gpt-4o-mini-transcribe` (optimized for speech recognition)
- **Reasoning:** `gpt-4o-mini` (optimized for conversation logic)
- Configurable via environment variables

#### 4. Agent Framework Integration
- New `NumerologyAgentService` provides orchestration
- Enables multi-turn reasoning with context
- Ready for integration with tool use and function calling

### Updated Dependencies

```bash
# Added
agent-framework==1.0.0           # Microsoft orchestration
azure-ai-openai==1.13.0          # STT and embedding models

# Updated
elevenlabs==0.3.0                # TTS with request stitching

# Removed
openai==1.3.8                    # Replaced by agent-framework
azure-cognitiveservices-speech   # Replaced by azure-ai-openai
sentry-sdk==1.39.1               # Observability in agent-framework
```

### Configuration

**Environment Variables:**

```bash
# Azure OpenAI (unchanged)
AZURE_OPENAI_KEY=your-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com

# Deployment Names (NEW)
AZURE_OPENAI_STT_DEPLOYMENT_NAME=gpt-4o-mini-transcribe
AZURE_OPENAI_REASONING_DEPLOYMENT_NAME=gpt-4o-mini

# ElevenLabs (unchanged)
ELEVENLABS_API_KEY=your-api-key
ELEVENLABS_VOICE_ID=your-voice-id
```

### Service Updates

#### Speech-to-Text (voice_service.py)

**Before:** Direct HTTP calls to Azure OpenAI endpoint
```python
# Old approach
response = await session.post(
    f"{endpoint}/openai/deployments/{deployment}/audio/transcriptions",
    headers={"api-key": api_key},
    ...
)
```

**After:** Azure AI OpenAI SDK
```python
# New approach
client = AsyncAzureOpenAI(...)
transcription = await client.audio.transcriptions.create(
    file=audio_file,
    model="whisper-1",
    language="vi"
)
```

**Benefits:**
- Automatic retries on transient failures
- Connection pooling and session management
- Type-safe API

#### Text-to-Speech (text_to_speech_service.py)

**Before:** Direct REST calls to ElevenLabs
```python
# Old approach
response = await session.post(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}",
    headers={"xi-api-key": api_key},
    ...
)
```

**After:** ElevenLabs Python SDK with request stitching
```python
# New approach
client = ElevenLabs(api_key=api_key)
audio = client.text_to_speech.stream(
    text=text,
    voice_id=voice_id,
    previous_request_ids=["req-1", "req-2"],  # NEW: Maintains voice consistency
    model_id="eleven_monolingual_v1"
)
```

**Benefits:**
- Request stitching for voice consistency
- Streaming support built-in
- Automatic error handling
- Voice setting presets (stability, clarity)

#### Agent Framework Integration (agent_service.py)

**New Service:** `NumerologyAgentService`

```python
# Initialize
service = NumerologyAgentService()

# Process voice input with context
result = await service.process_voice_input(
    text="Ngày sinh của tôi là 15/3/1990",
    user_id=uuid.uuid4(),
    context={
        "user_profile": {"name": "Nguyễn Văn A", ...},
        "conversation_history": [...]
    }
)

# Check health
health = await service.health_check()
assert health["status"] == "healthy"
```

**Features:**
- Multi-turn conversation with context
- Automatic system prompt building
- Error handling and retry logic
- Health check endpoint
- Supports tool use (for future enhancements)

### Testing

New test files cover all refactored services:

- `apps/api/src/__tests__/test_voice_service.py` - STT service tests
- `apps/api/src/__tests__/test_tts_service.py` - TTS service tests  
- `apps/api/src/__tests__/test_agent_service.py` - Agent service tests

**Run tests:**
```bash
cd apps/api
pip install pytest-cov  # Required for coverage
pytest src/__tests__/ -v
```

### Backward Compatibility

✅ All refactored services maintain backward-compatible interfaces:

- `AzureOpenAISpeechToTextService.transcribe_audio_stream()` - Unchanged signature
- `ElevenLabsTextToSpeechService.synthesize_text()` - Unchanged signature
- `TranscriptionResult` and `TextToSpeechResult` - Unchanged structure

**Migration Path:** Replace old implementations without changing calling code.

### Next Steps

1. **Install Dependencies:**
   ```bash
   pip install -r apps/api/requirements.txt
   ```

2. **Run Tests:**
   ```bash
   pytest apps/api/src/__tests__/ -v
   ```

3. **Verify Configuration:**
   - Check environment variables are set
   - Verify dual deployment names in config.py
   - Test with: `curl http://localhost:8000/health`

4. **Deploy:**
   - Update Docker image
   - Set environment variables in deployment
   - Monitor logs for any integration issues

### Troubleshooting

**"ModuleNotFoundError: No module named 'agent_framework'"**
```bash
pip install agent-framework==1.0.0
```

**"Azure authentication failed"**
- Check `AZURE_OPENAI_KEY` and `AZURE_OPENAI_ENDPOINT` are set
- Verify deployment names match Azure resource

**"ElevenLabs API error"**
- Check `ELEVENLABS_API_KEY` is valid
- Verify `ELEVENLABS_VOICE_ID` exists in your account

**"Request stitching not working"**
- Ensure `elevenlabs>=0.3.0` is installed
- Verify `use_request_stitching=True` is passed to `synthesize_text()`

### Support

See story [1.6 - Voice Services Refactoring](docs/stories/1.6.story.md) for implementation details.

## Development Stories

Development is organized by user stories in `docs/stories/`:

- **[1.1](docs/stories/1.1.story.md)** - Project Setup & Core Infrastructure (Current)
- 1.2 - Voice Input & Speech Recognition Integration
- 1.3 - Vietnamese Voice Synthesis & Output
- 1.4 - Core Numerology Calculation Engine
- 1.5 - Basic Voice-Numerology Integration Flow

## Environment Configuration

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

**Frontend:**
- `EXPO_PUBLIC_API_URL` - Backend API URL
- `EXPO_PUBLIC_AZURE_AD_B2C_*` - Azure B2C credentials

**Backend:**
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing credential
- `AZURE_*` - Azure service credentials
- `OPENAI_KEY` - OpenAI API credential

See `.env.example` for complete list.

## Testing

### Unit & Integration Tests

**Backend:**
```bash
cd apps/api
pytest tests/ -v --cov=src
```

**Frontend:**
```bash
cd apps/mobile
npm test
```

### Manual Testing Checklist

- [ ] Backend health check responds: `curl http://localhost:8000/health`
- [ ] Frontend loads on http://localhost:19006
- [ ] Can send voice input (when implemented)
- [ ] Receives voice response (when implemented)
- [ ] Error boundaries display correctly on errors

## CI/CD Pipeline

GitHub Actions workflows automatically run on:

- **Pull Requests:** Lint, type-check, test
- **Merge to main:** Deploy backend to Azure Container Registry

### Workflow Files

- `.github/workflows/ci.yaml` - Continuous integration
- `.github/workflows/deploy-api.yaml` - Backend deployment

## Deployment

### Local Docker Build

```bash
# Build backend image
docker build -t numeroly-api:latest apps/api/

# Run in container
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e REDIS_URL=redis://localhost:6379 \
  numeroly-api:latest
```

### Cloud Deployment

See deployment guide in `docs/architecture/` for Azure Container Apps setup.

## Troubleshooting

### Frontend Issues

**"Expo dev server not responding"**
```bash
# Clear cache and restart
cd apps/mobile
npm start -- --clear
```

**"Cannot connect to backend"**
- Check backend is running: `curl http://localhost:8000/health`
- Verify `EXPO_PUBLIC_API_URL` in `.env`

### Backend Issues

**"Database connection failed"**
```bash
# Check Docker containers
docker-compose ps

# Restart services
docker-compose restart postgres redis
```

**"Port 8000 already in use"**
```bash
# Run on different port
uvicorn src.main:app --reload --port 8001
```

### Docker Issues

**"Cannot connect to database container"**
```bash
# Check container is running
docker-compose logs postgres

# Check network
docker network ls
```

## Contributing

1. Create a feature branch from `develop`
2. Implement changes following [coding-standards.md](docs/architecture/coding-standards.md)
3. Add tests for new functionality
4. Run linting and type checks locally
5. Push branch and create pull request
6. CI pipeline must pass before merge

## Performance Targets

- **Voice Response Latency:** <3 seconds
- **Speech-to-Text Accuracy:** >95% for Vietnamese
- **System Availability:** 99% during testing
- **App Load Time:** <4 seconds on mid-range devices
- **Concurrent Users:** 100+ during prototype phase

## Support

For issues or questions:

1. Check [Troubleshooting](#troubleshooting) section
2. Review relevant documentation in `docs/architecture/`
3. Check development story in `docs/stories/`
4. File an issue on GitHub

## License

TBD

## Team

- **Product Manager:** John
- **Scrum Master:** Bob
- **Architect:** Winston
- **Developer:** James
- **QA:** Quinn
