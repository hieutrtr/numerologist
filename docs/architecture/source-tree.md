# Source Tree & Project Structure

Complete monorepo structure, directory organization, and development workflow for Numeroly.

**Document Version:** 1.0 | **Last Updated:** January 14, 2025

## Repository Structure Overview

Numeroly uses an **Nx Monorepo** with a shared TypeScript/Python library approach. This enables:
- Single source of truth for shared code
- Atomic commits across frontend/backend changes
- Coordinated dependency management
- Fast incremental builds with Nx caching

```
numerologist/
├── .github/                         # GitHub configuration
│   └── workflows/                   # CI/CD workflows
│       ├── ci.yaml                  # PR testing
│       ├── deploy-api.yaml          # Backend deployment
│       └── deploy-mobile.yaml       # Mobile app deployment
│
├── apps/                            # Application packages (Nx convention)
│   │
│   ├── mobile/                      # React Native Mobile App
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI components
│   │   │   │   ├── voice/           # Voice-related components
│   │   │   │   │   ├── VoiceButton.tsx
│   │   │   │   │   ├── WaveformVisualizer.tsx
│   │   │   │   │   ├── TranscriptionDisplay.tsx
│   │   │   │   │   └── AudioPlayer.tsx
│   │   │   │   ├── conversation/    # Conversation flow components
│   │   │   │   │   ├── ConversationView.tsx
│   │   │   │   │   ├── MessageBubble.tsx
│   │   │   │   │   ├── ConversationList.tsx
│   │   │   │   │   └── ConversationCard.tsx
│   │   │   │   ├── numerology/      # Numerology display components
│   │   │   │   │   ├── NumerologyDashboard.tsx
│   │   │   │   │   ├── NumberCard.tsx
│   │   │   │   │   ├── TimingCycle.tsx
│   │   │   │   │   └── InsightPanel.tsx
│   │   │   │   ├── onboarding/      # Auth & setup flow
│   │   │   │   │   ├── WelcomeScreen.tsx
│   │   │   │   │   ├── PhoneAuthScreen.tsx
│   │   │   │   │   ├── ProfileSetupScreen.tsx
│   │   │   │   │   └── NumerologyIntroScreen.tsx
│   │   │   │   ├── journal/         # Journal entry components
│   │   │   │   │   ├── JournalView.tsx
│   │   │   │   │   ├── JournalEntry.tsx
│   │   │   │   │   └── TagSelector.tsx
│   │   │   │   ├── shared/          # Generic shared components
│   │   │   │   │   ├── Button.tsx
│   │   │   │   │   ├── Card.tsx
│   │   │   │   │   ├── Input.tsx
│   │   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   │   └── ErrorBoundary.tsx
│   │   │   │   └── navigation/      # React Navigation setup
│   │   │   │       ├── RootNavigator.tsx
│   │   │   │       ├── AuthNavigator.tsx
│   │   │   │       └── TabNavigator.tsx
│   │   │   │
│   │   │   ├── screens/             # Full-screen views
│   │   │   │   ├── ConversationScreen.tsx
│   │   │   │   ├── ConversationDetailScreen.tsx
│   │   │   │   ├── DashboardScreen.tsx
│   │   │   │   ├── HistoryScreen.tsx
│   │   │   │   ├── ProfileScreen.tsx
│   │   │   │   └── SettingsScreen.tsx
│   │   │   │
│   │   │   ├── stores/              # Zustand state management
│   │   │   │   ├── authStore.ts     # Authentication state
│   │   │   │   ├── conversationStore.ts  # Active conversation
│   │   │   │   ├── numerologyStore.ts    # Numerology data
│   │   │   │   ├── voiceStore.ts    # Voice playback state
│   │   │   │   └── journalStore.ts  # Journal entries
│   │   │   │
│   │   │   ├── services/            # API client services
│   │   │   │   ├── api-client.ts    # Axios HTTP client
│   │   │   │   ├── authService.ts   # Auth endpoints
│   │   │   │   ├── conversationService.ts
│   │   │   │   ├── numerologyService.ts
│   │   │   │   ├── voiceService.ts  # STT/TTS
│   │   │   │   └── journalService.ts
│   │   │   │
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   │   ├── useAuth.ts       # Auth state hook
│   │   │   │   ├── useConversation.ts
│   │   │   │   ├── useVoiceRecorder.ts
│   │   │   │   └── useVoicePlayer.ts
│   │   │   │
│   │   │   ├── utils/               # Frontend utilities
│   │   │   │   ├── formatters.ts    # Date, number formatting
│   │   │   │   ├── validators.ts    # Input validation
│   │   │   │   ├── errorHandler.ts  # Error handling
│   │   │   │   └── logger.ts        # Client-side logging
│   │   │   │
│   │   │   ├── theme/               # Styling & theming
│   │   │   │   ├── colors.ts        # Color palette
│   │   │   │   ├── typography.ts    # Font definitions
│   │   │   │   └── theme.ts         # Theme provider
│   │   │   │
│   │   │   ├── types/               # TypeScript type definitions
│   │   │   │   ├── index.ts         # Re-export common types
│   │   │   │   ├── user.ts
│   │   │   │   ├── conversation.ts
│   │   │   │   └── numerology.ts
│   │   │   │
│   │   │   └── App.tsx              # Main app component
│   │   │
│   │   ├── assets/                  # Images, fonts, audio
│   │   │   ├── images/
│   │   │   ├── fonts/
│   │   │   └── audio/               # Default sounds
│   │   │
│   │   ├── ios/                     # iOS native code
│   │   ├── android/                 # Android native code
│   │   ├── app.json                 # Expo configuration
│   │   ├── project.json             # Nx project config
│   │   ├── package.json             # Mobile dependencies
│   │   ├── tsconfig.json            # TypeScript config
│   │   ├── jest.config.js           # Jest testing config
│   │   ├── .babelrc                 # Babel config
│   │   └── metro.config.js          # Metro bundler config
│   │
│   └── api/                         # FastAPI Backend Service
│       ├── src/
│       │   ├── main.py              # FastAPI app entry
│       │   ├── config.py            # Settings & environment
│       │   ├── dependencies.py      # FastAPI dependency injection
│       │   │
│       │   ├── routes/              # API endpoint handlers
│       │   │   ├── auth.py          # Auth endpoints
│       │   │   ├── users.py         # User CRUD
│       │   │   ├── conversations.py # Conversation endpoints
│       │   │   ├── voice.py         # STT/TTS endpoints
│       │   │   ├── numerology.py    # Numerology calculation
│       │   │   └── journal.py       # Journal endpoints
│       │   │
│       │   ├── services/            # Business logic
│       │   │   ├── auth_service.py  # Auth orchestration
│       │   │   ├── conversation_service.py  # Conversation logic
│       │   │   ├── voice_service.py # STT/TTS integration
│       │   │   ├── ai_service.py    # GPT-4 integration
│       │   │   ├── numerology_service.py    # Numerology calcs
│       │   │   └── journal_service.py
│       │   │
│       │   ├── repositories/        # Data access layer
│       │   │   ├── user_repository.py
│       │   │   ├── conversation_repository.py
│       │   │   ├── numerology_repository.py
│       │   │   └── journal_repository.py
│       │   │
│       │   ├── models/              # SQLAlchemy ORM models
│       │   │   ├── user.py
│       │   │   ├── conversation.py
│       │   │   ├── numerology.py
│       │   │   └── journal.py
│       │   │
│       │   ├── schemas/             # Pydantic request/response
│       │   │   ├── user.py
│       │   │   ├── conversation.py
│       │   │   ├── numerology.py
│       │   │   ├── auth.py
│       │   │   └── voice.py
│       │   │
│       │   ├── middleware/          # FastAPI middleware
│       │   │   ├── auth_middleware.py   # JWT verification
│       │   │   ├── error_handler.py     # Global error handling
│       │   │   └── rate_limiter.py      # Rate limiting
│       │   │
│       │   ├── websockets/          # WebSocket handlers
│       │   │   └── conversation_ws.py   # Real-time conversation
│       │   │
│       │   └── utils/               # Backend utilities
│       │       ├── database.py      # SQLAlchemy setup
│       │       ├── redis_client.py  # Redis connection
│       │       ├── storage_client.py    # Azure Blob Storage
│       │       ├── logger.py        # Structured logging
│       │       └── validators.py    # Validation helpers
│       │
│       ├── tests/                   # Test suite
│       │   ├── unit/                # Unit tests
│       │   │   ├── services/
│       │   │   ├── repositories/
│       │   │   └── utils/
│       │   ├── integration/         # Integration tests
│       │   │   └── endpoints/
│       │   └── fixtures/            # Test fixtures
│       │       ├── user_fixtures.py
│       │       └── conversation_fixtures.py
│       │
│       ├── alembic/                 # Database migrations
│       │   ├── versions/            # Migration files
│       │   ├── env.py               # Alembic config
│       │   └── script.py.mako       # Migration template
│       │
│       ├── requirements.txt         # Python dependencies
│       ├── Dockerfile               # Container build
│       ├── project.json             # Nx project config
│       ├── pyproject.toml           # Python package config
│       ├── setup.py                 # Python setup
│       ├── pytest.ini               # Pytest config
│       └── .env.example             # Environment template
│
├── libs/                            # Shared libraries (Nx convention)
│   │
│   ├── shared/                      # Shared utilities
│   │   ├── src/
│   │   │   ├── index.ts             # Library entry
│   │   │   ├── types/               # Shared types
│   │   │   │   ├── user.ts
│   │   │   │   ├── conversation.ts
│   │   │   │   ├── numerology.ts
│   │   │   │   └── api.ts
│   │   │   ├── constants/           # Shared constants
│   │   │   │   ├── errors.ts
│   │   │   │   ├── limits.ts
│   │   │   │   └── defaults.ts
│   │   │   ├── validators/          # Validation utilities
│   │   │   │   ├── user.ts
│   │   │   │   ├── phone.ts
│   │   │   │   └── dates.ts
│   │   │   └── utils/               # Common utilities
│   │   │       ├── formatters.ts
│   │   │       └── converters.ts
│   │   ├── project.json
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── numerology/                  # Numerology engine (Python)
│   │   ├── src/
│   │   │   ├── __init__.py
│   │   │   ├── calculator.py        # Core calculations
│   │   │   │   ├── life_path.py
│   │   │   │   ├── destiny.py
│   │   │   │   ├── soul_urge.py
│   │   │   │   ├── personality.py
│   │   │   │   └── personal_cycles.py
│   │   │   └── interpreter.py       # Vietnamese interpretations
│   │   │       └── interpretations.json
│   │   ├── tests/
│   │   │   ├── test_calculator.py
│   │   │   └── fixtures/
│   │   ├── project.json
│   │   └── setup.py
│   │
│   └── ui/                          # Shared React Native components
│       ├── src/
│       │   ├── index.ts
│       │   ├── Button/
│       │   │   ├── Button.tsx
│       │   │   └── Button.styles.ts
│       │   ├── Card/
│       │   │   ├── Card.tsx
│       │   │   └── Card.styles.ts
│       │   ├── Input/
│       │   │   ├── Input.tsx
│       │   │   └── Input.styles.ts
│       │   └── forms/
│       │       ├── FormField.tsx
│       │       └── FormField.styles.ts
│       ├── project.json
│       ├── package.json
│       └── tsconfig.json
│
├── tools/                           # Nx workspace tooling
│   └── generators/                  # Custom Nx generators
│       ├── component-generator/
│       └── service-generator/
│
├── infrastructure/                  # Infrastructure as Code
│   ├── terraform/
│   │   ├── main.tf                  # Azure resources
│   │   ├── variables.tf             # Input variables
│   │   ├── outputs.tf               # Output values
│   │   ├── backend.tf               # Terraform state
│   │   └── dev.tfvars               # Dev environment
│   └── scripts/
│       ├── deploy.sh                # Deployment script
│       └── setup-azure.sh           # Azure setup
│
├── docs/                            # Documentation (THIS DIRECTORY)
│   ├── architecture/                # Architecture documentation shards
│   │   ├── index.md                 # Architecture index
│   │   ├── tech-stack.md            # Technology choices
│   │   ├── source-tree.md           # This file
│   │   └── coding-standards.md      # Development standards
│   ├── architecture.md              # Main unified architecture
│   ├── prd.md                       # Product Requirements
│   ├── front-end-spec.md            # Frontend specifications
│   ├── brief.md                     # Project brief
│   └── api/                         # API documentation
│       ├── openapi.yaml             # OpenAPI spec
│       └── postman-collection.json  # Postman collection
│
├── .github/                         # GitHub configuration
│   ├── workflows/                   # CI/CD pipelines
│   └── ISSUE_TEMPLATE/
│
├── .bmad-core/                      # BMAD framework
│   ├── core-config.yaml             # Project configuration
│   ├── agents/                      # Agent definitions
│   ├── tasks/                       # Task definitions
│   ├── templates/                   # Document templates
│   ├── checklists/                  # Validation checklists
│   ├── data/                        # Reference data
│   └── utils/                       # Framework utilities
│
├── .gitignore                       # Git ignore patterns
├── .env.example                     # Environment template
├── nx.json                          # Nx workspace config
├── package.json                     # Root dependencies
├── tsconfig.base.json               # Base TypeScript config
├── docker-compose.yml               # Local services
├── README.md                        # Project overview
└── DEVELOPMENT_COMPLETE.md          # Development notes
```

## Key Files & Directories

### Root Level

- **`nx.json`** - Nx workspace configuration
  - Defines plugins, caching strategy, task runners
  - Controls `nx serve`, `nx build`, `nx test` behavior

- **`tsconfig.base.json`** - Base TypeScript configuration for entire workspace
  - Path aliases for monorepo imports
  - Strict mode settings
  - Module resolution configuration

- **`package.json`** - Root dependencies
  - Shared dev dependencies (Nx, Jest, Typescript)
  - Workspace scripts (lint, format, etc.)
  - Version management

- **`docker-compose.yml`** - Local development services
  - PostgreSQL database
  - Redis cache
  - Accessible at `localhost:5432` and `localhost:6379`

### Apps Directory

#### Mobile App (`apps/mobile/`)

**Key Configuration Files:**
- `app.json` - Expo app configuration (iOS, Android, web settings)
- `tsconfig.json` - TypeScript config with path aliases
- `jest.config.js` - Jest testing configuration
- `package.json` - Mobile-specific dependencies

**Main Entry:**
- `App.tsx` - Root app component
- `src/` - All source code

**Package Structure:**
```typescript
// Example: Import paths for mobile app
import { VoiceButton } from '@numerologist/mobile/components/voice/VoiceButton';
import { useAuth } from '@numerologist/mobile/hooks/useAuth';
import type { User } from '@numerologist/shared/types';
```

#### API Backend (`apps/api/`)

**Key Configuration Files:**
- `pyproject.toml` - Python package metadata
- `requirements.txt` - Python dependencies
- `pytest.ini` - Pytest configuration
- `Dockerfile` - Container image definition

**Database Management:**
- `alembic/` - Database migrations
- Run migrations: `cd apps/api && alembic upgrade head`
- Create new migration: `alembic revision --autogenerate -m "description"`

### Libs Directory

#### Shared (`libs/shared/`)

Contains TypeScript types and utilities used by both frontend and backend.

**Usage:**
```typescript
// Frontend
import { UserResponse } from '@numerologist/shared/types';

// Backend (Python) mirrors these types in Pydantic schemas
```

#### Numerology (`libs/numerology/`)

Pure numerology calculation engine—no dependencies on FastAPI, React, etc.

**Key Files:**
- `calculator.py` - Core calculation functions
- `interpreter.py` - Vietnamese number interpretations
- Tests verify accuracy against Pythagorean standards

**Usage:**
```python
# Backend
from numerologist.numerology import calculate_life_path

# Shared across both systems
life_path = calculate_life_path(birth_date)
```

#### UI (`libs/ui/`)

Shared React Native components for consistent design.

**Usage:**
```typescript
import { Button, Card, Input } from '@numerologist/ui';
```

## Development Workflow

### Setting Up Development Environment

```bash
# 1. Install root dependencies
npm install

# 2. Install backend dependencies
cd apps/api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ../..

# 3. Start local services
docker-compose up -d postgres redis

# 4. Run database migrations
cd apps/api
alembic upgrade head
cd ../..

# 5. Copy environment template
cp .env.example .env
# Edit .env with your API keys
```

### Common Development Commands

#### From Root Directory

```bash
# Serve all apps in development mode (watch for changes)
nx run-many --target=serve --all --parallel

# List all projects in workspace
nx list

# View dependency graph (interactive visualization)
nx graph

# Lint all projects
nx run-many --target=lint --all

# Run all tests
nx run-many --target=test --all

# Format code with Prettier
nx run-many --target=format:write --all

# Type check all TypeScript projects
nx run-many --target=type-check --all
```

#### Mobile App (`apps/mobile/`)

```bash
# Start Expo dev server on port 19006
nx serve mobile
# Or: cd apps/mobile && npm start

# Build iOS/Android release
nx build mobile

# Run tests
nx test mobile

# Lint
nx lint mobile
```

#### Backend API (`apps/api/`)

```bash
# Activate Python environment first
cd apps/api
source venv/bin/activate

# Start development server with auto-reload
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000

# Run tests
pytest tests/

# Run tests with coverage
pytest tests/ --cov=src --cov-report=html

# Type check with mypy
mypy src/

# Run database migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"
```

### Typical Development Session

```bash
# Terminal 1: Start backend
cd apps/api
source venv/bin/activate
uvicorn src.main:app --reload

# Terminal 2: Start frontend
cd apps/mobile
npm start
# Then select 'i' for iOS or 'a' for Android

# Terminal 3: Optional - Run tests in watch mode
nx test mobile --watch
```

## Path Aliases

The monorepo uses path aliases for clean imports:

```json
{
  "compilerOptions": {
    "paths": {
      "@numerologist/mobile/*": ["apps/mobile/src/*"],
      "@numerologist/api/*": ["apps/api/src/*"],
      "@numerologist/shared/*": ["libs/shared/src/*"],
      "@numerologist/numerology/*": ["libs/numerology/src/*"],
      "@numerologist/ui/*": ["libs/ui/src/*"]
    }
  }
}
```

**Examples:**

```typescript
// Good: Use aliases
import { VoiceButton } from '@numerologist/mobile/components/voice';
import type { User } from '@numerologist/shared/types';

// Avoid: Relative imports
import { VoiceButton } from '../../../../components/voice';
```

## CI/CD Workflows

### GitHub Actions Workflows

Located in `.github/workflows/`:

1. **ci.yaml** - Runs on PR
   - Lint code
   - Type check
   - Run tests
   - Build projects

2. **deploy-api.yaml** - Runs on `main` branch, `apps/api/**` changes
   - Build Docker image
   - Push to Azure Container Registry
   - Deploy to Azure Container Apps

3. **deploy-mobile.yaml** - Runs on tags
   - Build iOS/Android with EAS Build
   - Submit to app stores

### Triggering Deployments

```bash
# Backend deploys automatically when changes pushed to apps/api/ on main
git push origin main

# Manual backend deployment (if needed)
gh workflow run deploy-api.yaml

# Mobile deployment via tag
git tag -a v1.0.0 -m "Release 1.0.0"
git push origin v1.0.0
```

## Environment Management

### Environment Variables

Copy `.env.example` to `.env` and fill in all required values for frontend and backend services.
See the `.env.example` file in the project root for the complete list of environment variables needed.

### Environment-Specific Configs

**Development:** `localhost` connections, mock data, verbose logging

**Staging:** Production services (test credentials), rate limiting enabled

**Production:** Real services, optimized settings, error-only logging

## Build & Deployment

### Building Applications

```bash
# Build mobile app for distribution
nx build mobile
# Generates: apps/mobile/dist/ for web, managed by Expo for iOS/Android

# Build backend Docker image
cd apps/api
docker build -t numeroly-api:latest .
```

### Local Testing Build

```bash
# Test production build locally
cd apps/mobile
npm run build:web
npm run start:web  # Serves on localhost:3000

# Backend
cd apps/api
gunicorn -w 4 -b 0.0.0.0:8000 src.main:app
```

## Performance Optimization

### Nx Caching

Nx caches build outputs and test results:

```bash
# Clear cache if needed
nx reset

# Build with cache disabled (for troubleshooting)
nx build mobile --skip-nx-cache
```

### Code Splitting

**Frontend:**
- Route-based code splitting automatically applied
- Components lazy-loaded on demand

**Backend:**
- No code splitting needed (monolithic FastAPI)
- Database query optimization instead

## Troubleshooting

### Port Already in Use

```bash
# Find process on port 8000
lsof -i :8000
# Kill process
kill -9 <PID>

# Or use different port
uvicorn src.main:app --port 8001
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres redis
```

### Node Modules Issues

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Errors

```bash
# Type check all projects
nx run-many --target=type-check --all

# Check specific project
nx type-check mobile
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Component | `PascalCase.tsx` | `VoiceButton.tsx` |
| Style | `PascalCase.styles.ts` | `VoiceButton.styles.ts` |
| Hook | `useCamelCase.ts` | `useVoiceRecorder.ts` |
| Service | `camelCaseService.ts` | `conversationService.ts` |
| Store | `useCamelCaseStore.ts` | `useConversationStore.ts` |
| Utility | `camelCase.ts` or `camelCaseUtils.ts` | `formatters.ts` |
| Test | `*.test.ts` or `*.spec.ts` | `VoiceButton.test.tsx` |
| Type Definition | `camelCase.ts` | `user.ts` |
| Python Module | `snake_case.py` | `voice_service.py` |
| Python Class | `PascalCase` in `snake_case.py` | `ConversationService` in `conversation_service.py` |

---

**See Also:** [Tech Stack](./tech-stack.md) | [Coding Standards](./coding-standards.md) | [Main Architecture](../architecture.md)
