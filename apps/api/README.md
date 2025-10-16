# Numeroly Backend API

FastAPI backend service for Numeroly Vietnamese AI voicebot.

## Quick Start

### Prerequisites

- Python 3.11+
- PostgreSQL 15+
- Redis 7.2+
- Docker (optional)

### Local Development

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your settings
   ```

4. **Start local services:**
   ```bash
   docker-compose up -d postgres redis
   ```

5. **Run migrations:**
   ```bash
   alembic upgrade head
   ```

6. **Start development server:**
   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

   API will be available at `http://localhost:8000`

### Development Commands

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=src

# Type checking
mypy src/

# Code formatting
black src/

# Linting
flake8 src/

# Database migrations
alembic revision --autogenerate -m "Description"
alembic upgrade head
alembic downgrade -1
```

## API Documentation

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Project Structure

```
apps/api/
├── src/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration & settings
│   ├── dependencies.py      # Dependency injection
│   ├── routes/              # API endpoint handlers
│   ├── services/            # Business logic
│   ├── repositories/        # Data access layer
│   ├── models/              # SQLAlchemy ORM models
│   ├── schemas/             # Pydantic request/response schemas
│   ├── middleware/          # FastAPI middleware
│   ├── websockets/          # WebSocket handlers
│   └── utils/               # Utility functions
├── tests/                   # Test suite
│   ├── unit/
│   ├── integration/
│   └── fixtures/
├── alembic/                 # Database migrations
├── requirements.txt         # Python dependencies
├── Dockerfile              # Container image
├── pyproject.toml          # Python package config
├── pytest.ini              # Pytest configuration
└── README.md               # This file
```

## Environment Variables

See `.env.example` for all required environment variables. Key variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens
- `OPENAI_API_KEY`: OpenAI API key for GPT-4 integration
- `AZURE_SPEECH_KEY`: Azure Speech Services key for STT
- `ELEVENLABS_API_KEY`: ElevenLabs API key for TTS

## Docker

### Build Image

```bash
docker build -t numeroly-api:latest .
```

### Run Container

```bash
docker run -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@db:5432/numeroly \
  -e REDIS_URL=redis://redis:6379 \
  -e JWT_SECRET_KEY=your-secret-key \
  numeroly-api:latest
```

## Architecture

See `docs/architecture/` for complete architecture documentation.

### Tech Stack

- **Framework:** FastAPI 0.109+
- **Database:** PostgreSQL 15+ with SQLAlchemy async ORM
- **Cache:** Redis 7.2+ for session state
- **Auth:** Azure AD B2C with JWT tokens
- **AI/ML:**
  - Speech-to-Text: Azure Speech Services
  - Text-to-Speech: ElevenLabs
  - Conversation: OpenAI GPT-4o

## Testing

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/test_example.py

# Run with coverage
pytest --cov=src --cov-report=html

# Run with markers
pytest -m "not integration"  # Skip integration tests
```

## Deployment

See deployment workflow in `.github/workflows/deploy-api.yaml`

## Contributing

1. Create a feature branch
2. Follow coding standards (see `docs/architecture/coding-standards.md`)
3. Write tests for new code
4. Run tests and type checking
5. Create pull request

## License

MIT
