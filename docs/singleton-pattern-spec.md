# Singleton Pattern Specification

## Purpose
- Provide a consistent approach for objects that must have exactly one shared instance per process or execution context.
- Centralize cross-cutting resources (configuration, connection pools, background runners) while keeping lifecycle and cleanup explicit.
- Offer guidance that avoids common singleton anti-patterns (hidden globals, implicit dependencies, difficult testing).

## Core Requirements
1. **Single Instance Guarantee**  
   - Enforce creation through a controlled constructor or factory.  
   - Prevent accidental instantiation via direct class calls or module-level globals.

2. **Explicit Access**  
   - Consumers call a clearly named accessor (`get_instance()`, `Service.instance()`, etc.).  
   - Avoid implicit import-time side effects.

3. **Lifecycle Management**  
   - Support deterministic initialization, teardown, and optional reconfiguration.  
   - Provide `close()` / `shutdown()` hooks for releasing external resources.

4. **Thread/Async Safety**  
   - Guard initialization with locks (threads) or async primitives (asyncio).  
   - Ensure internal state is safe for concurrent access, or document restrictions.

5. **Testability**  
   - Allow dependency injection or temporary overrides for tests.  
   - Provide reset/clear utilities in non-production builds when necessary.

## Design Principles
- **Lazy Initialization**: Defer instantiation until first requested to reduce startup cost and avoid unused work.
- **Idempotent Access**: Multiple access attempts should return the same instance without re-running initialization side effects.
- **Separation of Concerns**: Keep singleton responsibilities narrow; compose collaborating services rather than embedding them.
- **Visibility**: Document invariants (what the singleton represents, its lifetime, threading assumptions) near the accessor.
- **Error Handling**: Fail fast if construction cannot complete; surface initialization errors rather than masking them.

## Recommended Implementation Patterns

### 1. Class-Based Singleton (Python Example)
```python
import asyncio
from typing import Optional

class ServiceSingleton:
    _instance: Optional["ServiceSingleton"] = None
    _lock = asyncio.Lock()  # use threading.Lock() for sync code

    def __new__(cls):
        raise RuntimeError("Call ServiceSingleton.instance() instead")

    @classmethod
    async def instance(cls) -> "ServiceSingleton":
        if cls._instance is None:
            async with cls._lock:
                if cls._instance is None:
                    obj = super().__new__(cls)
                    await obj._initialize()
                    cls._instance = obj
        return cls._instance

    async def _initialize(self) -> None:
        # Perform expensive setup once (connections, runners, caches)
        ...

    async def shutdown(self) -> None:
        # Close resources and optionally reset _instance for tests
        ...
        type(self)._instance = None
```

### 2. Module-Level Factory
- Maintain a private module-level variable (`_singleton: Optional[Service] = None`).
- Expose `get_service()` that lazily constructs and returns the cached object.
- Use this variant when initialization is synchronous or minimal.

## Usage Guidelines
- Call the accessor during request handling or startup hooks, not at import time.
- Coordinate shutdown via application lifecycle hooks (`atexit`, FastAPI lifespan, signal handlers).
- When integrating with dependency injection, register the accessor as a singleton provider.
- Avoid storing request-scoped data inside the singleton; use parameters or dedicated stores.

## Anti-Patterns to Avoid
- **Global Mutation**: Hiding stateful singletons behind plain module globals makes testing and lifecycle management difficult.
- **Implicit Resets**: Re-initializing the singleton without teardown can leak resources or produce inconsistent state.
- **Overloaded Responsibilities**: Catch-all singletons quickly become god objects; break down concerns.
- **Tight Coupling**: Passing the singleton directly everywhere inhibits modular testing—prefer interfaces and injection when possible.

## Testing Strategy
- Provide utilities (`reset_instance()`), guarded so they are only available in tests.
- Use dependency inversion to swap the singleton with fakes or in-memory implementations.
- Verify thread/async safety with stress tests if the singleton handles concurrent workloads.

## Observability
- Log creation and teardown events with context (environment, configuration hashes).
- Emit health metrics (alive, pool sizes, queue depths) for long-lived singleton services.

