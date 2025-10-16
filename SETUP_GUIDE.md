# 🚀 Numeroly Project Setup Guide

## Prerequisites ✅

- **Node.js:** v23.3.0+ 
- **Python:** 3.12.3+
- **Docker:** 28.3.2+
- **Docker Compose:** v2.39.1+

All prerequisites are installed and ready!

---

## Setup Steps

### Step 1: Environment Configuration

Your `.env` file is already configured with:
- ✅ API URLs (http://localhost:8000/v1)
- ✅ Database URL (PostgreSQL)
- ✅ Redis configuration
- ✅ Azure OpenAI credentials
- ✅ ElevenLabs API key

**No action needed** - .env is ready to use!

### Step 2: Backend Setup (Python) - Using `uv` ⚡

```bash
# Navigate to backend
cd apps/api

# Install dependencies with uv (10-100x faster than pip!)
uv pip install -r requirements.txt

# Verify installation
uv run python3 -c "import fastapi, sqlalchemy, openai, elevenlabs; print('✅ All packages ready!')"
```

**Alternative: Using pip (slower)**
```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Expected packages (story 1.6 refactoring):**
- ✅ `agent-framework` - Microsoft Agent Framework (1.0.0b251007)
- ✅ `openai` - Azure OpenAI SDK  
- ✅ `azure-identity` - Azure authentication
- ✅ `elevenlabs` - Text-to-Speech SDK
- ✅ `fastapi` - Web framework
- ✅ `sqlalchemy` - ORM
- ✅ `asyncpg` - PostgreSQL driver

**All packages installed and verified!** 🎉

### Step 3: Start Database Services

```bash
# From project root
docker-compose up -d

# Verify services
docker-compose ps
```

**Services started:**
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`

### Step 4: Database Migration (Optional)

```bash
# Navigate to backend
cd apps/api
source venv/bin/activate

# Run migrations
alembic upgrade head
```

### Step 5: Start Backend Server

**Option 1: Using `uv` (recommended - no activation needed)**
```bash
cd apps/api
uv run uvicorn src.main:app --reload
```

**Option 2: Using pip/venv (traditional)**
```bash
cd apps/api
source .venv/bin/activate  # or venv/bin/activate
uvicorn src.main:app --reload
```

**Server will start at:**
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Step 6: Frontend Setup (Node)

```bash
# Fix npm dependencies issue
npm install --legacy-peer-deps

# Start mobile app
npm start:mobile
```

---

## Verify Setup

Check that everything works:

```bash
# Terminal 1: Backend running?
curl http://localhost:8000/health

# Terminal 2: Database running?
docker-compose ps

# Terminal 3: Backend logs
# You should see: Uvicorn running on http://127.0.0.1:8000
```

Expected responses:
- ✅ Health endpoint returns: `{"status": "healthy"}`
- ✅ PostgreSQL container is running
- ✅ Redis container is running
- ✅ Backend server is listening on port 8000

---

## Story 1.6 - Voice Services (Already Implemented ✅)

The refactoring to use production libraries is complete:

### What's New:

1. **Speech-to-Text (STT)**
   - Service: `apps/api/src/services/voice_service.py`
   - Uses: Azure OpenAI SDK (`openai`)
   - Deployment: `gpt-4o-mini-transcribe`
   - Features: Automatic retry, Vietnamese language support

2. **Text-to-Speech (TTS)**
   - Service: `apps/api/src/services/text_to_speech_service.py`
   - Uses: ElevenLabs SDK
   - **NEW:** Request stitching for voice consistency
   - Features: Streaming, voice settings by tone

3. **Agent Framework Integration**
   - Service: `apps/api/src/services/agent_service.py` (NEW)
   - Orchestration service for multi-turn conversations
   - Ready for story 2.1 tool integration

### Test Coverage:

Three comprehensive test suites included:
- `test_voice_service.py` - 20 tests
- `test_tts_service.py` - 18 tests
- `test_agent_service.py` - 15 tests

Run tests:
```bash
cd apps/api
source venv/bin/activate
pytest src/__tests__/ -v
```

---

## Environment Variables Reference

**Frontend:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000/v1
EXPO_PUBLIC_WS_URL=ws://localhost:8000/ws
```

**Backend - Database:**
```bash
DATABASE_URL=postgresql+asyncpg://numeroly:[password]@localhost:5432/numeroly
REDIS_URL=redis://localhost:6379/0
```

**Backend - Authentication:**
```bash
JWT_SECRET_KEY=[random-32-char-string]
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
```

**Backend - Azure Services:**
```bash
AZURE_OPENAI_KEY=[your-azure-key]
AZURE_OPENAI_ENDPOINT=https://[resource].openai.azure.com/
AZURE_OPENAI_STT_DEPLOYMENT_NAME=gpt-4o-mini-transcribe
AZURE_OPENAI_REASONING_DEPLOYMENT_NAME=gpt-4o-mini
```

**Backend - External APIs:**
```bash
ELEVENLABS_API_KEY=[your-elevenlabs-key]
ELEVENLABS_VOICE_ID=[voice-id]
```

---

## Troubleshooting

### PostgreSQL Connection Error

```bash
# Check if container is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres redis
```

### Port Already in Use (8000)

```bash
# Run on different port
cd apps/api
source venv/bin/activate
uvicorn src.main:app --reload --port 8001
```

### Python Dependencies Issue

```bash
# Clear pip cache
pip cache purge

# Reinstall with legacy peer deps
pip install --legacy-peer-deps -r requirements.txt
```

### Import Errors in Services

```bash
# Verify SDK is installed
python3 -c "from openai import AsyncAzureOpenAI; print('✅ OpenAI SDK')"
python3 -c "from elevenlabs import ElevenLabs; print('✅ ElevenLabs SDK')"
python3 -c "from agent_framework import *; print('✅ Agent Framework')"
```

---

## Next Steps

1. **Verify backend is working:** `curl http://localhost:8000/health`
2. **Review voice services:** Check `README.md` migration guide
3. **Run tests:** `pytest src/__tests__/ -v`
4. **Explore API:** Visit http://localhost:8000/docs

---

## Story 1.6 Completion Status

- ✅ Task 1: Dependencies Updated
- ✅ Task 2: Speech-to-Text Refactored (Azure OpenAI SDK)
- ✅ Task 3: Text-to-Speech Refactored (ElevenLabs SDK)
- ✅ Task 4: Agent Service Created (NEW)
- ✅ Task 5: Configuration Verified
- ✅ Task 6: Backward Compatibility Verified
- ✅ Task 7: Comprehensive Tests Created (53 tests)
- ✅ Task 8: Documentation Updated

**Story Status:** ✅ Ready for Review

**Commit:** `72e3607` - "feat: complete story 1.6 - refactor voice services..."

---

For more details, see:
- [README.md](README.md) - Migration guide & architecture
- [Tech Stack](docs/architecture/tech-stack.md) - Technology choices
- [Story 1.6](docs/stories/1.6.story.md) - Implementation details
