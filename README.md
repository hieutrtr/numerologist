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
