# Numeroly Architecture Documentation

This is the complete architecture documentation for **Numeroly**, a Vietnamese AI voicebot that provides Pythagorean numerology insights through natural voice conversations. The documentation is organized into sharded sections for easier navigation and maintenance.

## Overview

Numeroly is built as a **voice-first mobile application** using a **monolithic backend with service-ready components** deployed on **Microsoft Azure**. The frontend uses **React Native** for cross-platform mobile development with PWA capabilities, while the backend leverages **FastAPI (Python)** for high-performance API services.

## Architecture Sections

### Core Documentation

- **[Main Architecture Document](../architecture.md)** - Complete unified architecture with all details

### Architecture Shards

These documents break down specific aspects of the architecture:

- **[Tech Stack](./tech-stack.md)** - Technology choices, versions, and rationale for all components
- **[Source Tree & Project Structure](./source-tree.md)** - Monorepo organization, directory layout, and file conventions
- **[Coding Standards](./coding-standards.md)** - Development standards, naming conventions, and best practices

### Key Architectural Decisions

**Platform:** Microsoft Azure with Southeast Asia (Singapore) as primary region

**Repository Structure:** Nx Monorepo with shared TypeScript types and Python libraries

**Frontend:** React Native 0.73+ with TypeScript, Zustand for state management, Expo for builds

**Backend:** FastAPI (Python 3.11+) with async/await, PostgreSQL 15+ for persistence, Redis 7.2+ for caching

**AI Services:**
- **Speech-to-Text:** Azure Speech Services for Vietnamese recognition
- **Text-to-Speech:** ElevenLabs for natural voice synthesis (with gpt-4o-mini-transcribe as cost alternative)
- **Conversation AI:** GPT-4o for intelligent responses, o3-mini for complex reasoning

**Database:** PostgreSQL with encryption-at-rest, Azure Blob Storage for audio files

## Quick Links

- **[High Level Architecture Diagram](#)** - See main architecture.md for visual overview
- **[Data Models](#)** - User, Conversation, NumerologyProfile, JournalEntry
- **[API Specification](#)** - REST + WebSocket endpoints
- **[Development Workflow](#)** - Local setup and commands
- **[Security & Performance](#)** - Key requirements and optimizations

## Project Structure at a Glance

```
numerologist/
├── apps/                    # Application packages
│   ├── mobile/             # React Native mobile app
│   └── api/                # FastAPI backend service
├── libs/                   # Shared libraries
│   ├── shared/             # Shared TypeScript/Python utilities
│   ├── numerology/         # Numerology calculation engine
│   └── ui/                 # Shared React Native components
├── infrastructure/         # Infrastructure as Code (Terraform)
├── docs/                   # Documentation
│   ├── architecture/       # This directory - architecture documentation
│   ├── architecture.md     # Main unified architecture document
│   ├── prd.md             # Product Requirements Document
│   ├── front-end-spec.md  # Frontend specifications
│   └── brief.md           # Project brief
└── .bmad-core/            # BMAD framework configuration
```

## Development Getting Started

### Prerequisites
- Node.js >= 18.x
- Python >= 3.11
- Docker >= 24.x

### Quick Start

```bash
# Clone and install
git clone https://github.com/your-org/numerologist.git
cd numerologist
npm install

# Backend setup
cd apps/api
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
cd ../..

# Environment configuration
cp .env.example .env
# Edit .env with your settings

# Start development servers
docker-compose up -d postgres redis
nx run-many --target=serve --all --parallel
```

### Development Commands

See **[Source Tree & Project Structure](./source-tree.md)** for detailed development commands.

## Architecture Principles

1. **Voice-First Design** - All interactions optimized for voice input/output
2. **Type Safety** - TypeScript frontend, Python type hints on backend
3. **Scalability** - Serverless containers, caching layers, CDN distribution
4. **Security** - Encryption at rest/transit, JWT authentication, role-based access
5. **Performance** - Sub-3-second response times, optimized voice processing, caching strategies
6. **Reliability** - Circuit breakers, graceful degradation, comprehensive error handling
7. **Maintainability** - Clear separation of concerns, shared libraries, consistent patterns

## Related Documentation

- **[Product Requirements Document (PRD)](../prd.md)** - Feature specifications and user stories
- **[Frontend UI Specification](../front-end-spec.md)** - UI/UX design and component specifications
- **[Project Brief](../brief.md)** - High-level project overview

## Status

- **Architecture Version:** 1.2 (as of Jan 14, 2025)
- **Last Updated:** January 14, 2025
- **Status:** Stable - Ready for MVP development
- **Framework:** Built with BMAD-METHOD - See `.bmad-core/` for agent definitions

## Key Contacts & Ownership

- **Architecture Owner:** Winston (Architect Agent)
- **Development Lead:** James (Full Stack Developer Agent)
- **Product Owner:** Sarah
- **Quality Assurance:** Quinn

---

**Note:** This is a sharded architecture documentation. All sections maintain consistency with the unified architecture document. When making changes, ensure consistency across all referenced sections.
