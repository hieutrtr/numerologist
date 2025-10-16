# 🚀 Quick Start - Backend Server

## Start Backend (Voice Services Ready)

```bash
cd /home/hieutt50/projects/numerologist

# Activate virtual environment
source apps/api/.venv/bin/activate

# Set Python path
export PYTHONPATH=/home/hieutt50/projects/numerologist:$PYTHONPATH

# Start server
uvicorn apps.api.src.main:app --reload --port 8000
```

**Server will start at: `http://localhost:8000`**

## Test Server

```bash
# In another terminal
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","app":"Numeroly API","version":"1.0.0","environment":"development"}
```

## Access API

- **API Docs:** http://localhost:8000/docs (Swagger UI)
- **ReDoc:** http://localhost:8000/redoc
- **Health Check:** http://localhost:8000/health

---

## What's Ready (Story 1.6 ✅)

### Voice Services Installed

1. **Speech-to-Text (STT)**
   - Package: `openai>=1.3.0` (AsyncAzureOpenAI)
   - Service: `apps/api/src/services/voice_service.py`
   - Language: Vietnamese
   - Features: Retry logic, error handling, 95% accuracy

2. **Text-to-Speech (TTS)**
   - Package: `elevenlabs>=0.2.0`
   - Service: `apps/api/src/services/text_to_speech_service.py`
   - Feature: Request stitching for voice consistency

3. **Agent Framework**
   - Package: `agent-framework>=1.0.0b251007` (Microsoft)
   - Service: `apps/api/src/services/agent_service.py` (NEW)
   - Multi-turn conversations with context

### Fixes Applied

✅ **Commit 840829c:**
- Fixed `AsyncAzureOpenAI` import: `from openai import AsyncAzureOpenAI`

✅ **Commit 70471df:**
- Fixed config.py: Allow extra environment variables
- Created models/base.py: SQLAlchemy declarative base

---

## Environment Variables

Already configured in `.env` ✅
- Azure OpenAI credentials
- ElevenLabs API key
- Database connection (PostgreSQL + Redis)
- JWT secrets

---

## Database (Optional - for full testing)

```bash
# From project root - start PostgreSQL and Redis
docker-compose up -d

# Verify
docker-compose ps
```

---

## Run Tests

```bash
# From apps/api with venv activated
pytest src/__tests__/ -v --cov=src
```

---

## Troubleshooting

### "Port 8000 already in use"
```bash
# Kill existing process
pkill -f uvicorn

# Or use different port
uvicorn apps.api.src.main:app --reload --port 8001
```

### "PYTHONPATH not set"
```bash
# Ensure you're in project root and run:
export PYTHONPATH=/home/hieutt50/projects/numerologist:$PYTHONPATH
```

### Import errors
```bash
# Make sure venv is activated
source apps/api/.venv/bin/activate

# Verify packages are installed
python3 -c "import openai, elevenlabs, agent_framework; print('✅ All packages OK')"
```

---

## Git Status

Latest commits:
```
70471df - fix: resolve config and models import issues for backend startup
840829c - fix: correct AsyncAzureOpenAI import in voice_service.py
```

All imports fixed ✅
All packages installed ✅
Server tested and responding ✅

---

**Ready to develop! 🎉**
