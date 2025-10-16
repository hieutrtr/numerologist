"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import settings
from .middleware.error_handler import setup_error_handlers
from .utils.logger import setup_logging

# Import routers when they're created
# from .routes import auth, users, conversations, voice, numerology, journal


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup/shutdown."""
    # Startup
    setup_logging(settings.log_level)
    print(f"Starting {settings.app_name} v{settings.app_version}")
    yield
    # Shutdown
    print("Shutting down application")


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    app = FastAPI(
        title=settings.api_title,
        description=settings.api_description,
        version=settings.app_version,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:19006",  # Expo dev
            "http://localhost:3000",   # Web dev
            "https://numeroly.app",
            "https://staging.numeroly.app",
        ] if settings.environment == "development" else [
            "https://numeroly.app",
            "https://staging.numeroly.app",
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE"],
        allow_headers=["*"],
    )

    # Error handlers
    setup_error_handlers(app)

    # Health check endpoint
    @app.get("/health", tags=["Health"])
    async def health_check():
        """Health check endpoint."""
        return {
            "status": "healthy",
            "app": settings.app_name,
            "version": settings.app_version,
            "environment": settings.environment,
        }

    # Register route groups
    # app.include_router(auth.router)
    # app.include_router(users.router)
    # app.include_router(conversations.router)
    # app.include_router(voice.router)
    # app.include_router(numerology.router)
    # app.include_router(journal.router)

    return app


app = create_app()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.debug,
        log_level=settings.log_level.lower(),
    )
