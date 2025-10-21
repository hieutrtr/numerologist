# Daily.co Backend Async Patterns - Implementation Guide

**Purpose:** Detailed patterns for implementing non-blocking, async-safe backend architecture for Daily.co voice streaming in Story 1.2c.

**Audience:** Python/FastAPI developers implementing conversation service

**Status:** Production Ready

---

## Table of Contents

1. [Overview: Why This Matters](#overview-why-this-matters)
2. [daily_client Async Support](#daily_client-async-support)
3. [Async SQL Operations](#async-sql-operations)
4. [Redis Concurrency Patterns](#redis-concurrency-patterns)
5. [Transaction Safety Patterns](#transaction-safety-patterns)
6. [Load Testing Guidelines](#load-testing-guidelines)
7. [Common Pitfalls](#common-pitfalls)
8. [Complete Service Example](#complete-service-example)

---

## Overview: Why This Matters

### The Problem: Event Loop Blocking

When a synchronous operation runs inside an async function:

```python
# ❌ BAD: This blocks the ENTIRE FastAPI event loop
async def create_conversation(user_id: str):
    # Blocking call - freezes event loop for 2-5 seconds
    room = self.daily_client.create_room(config)  # BLOCKS HERE
    # No other requests can be processed while blocked!
    return {"room_url": room['url']}
```

**Impact:** If 10 users start voice conversations simultaneously:
- User 1's request blocks for 2 seconds
- User 2-10 must wait (they're blocked by User 1's blocking call)
- Total wait time: 20 seconds (10 users × 2 seconds each)
- Users experience "frozen app" feeling
- Server appears to have failed

### The Solution: Async/Await

```python
# ✅ GOOD: Non-blocking - other requests continue
async def create_conversation(user_id: str):
    # If daily_client is async:
    room = await self.daily_client.create_room_async(config)  # Non-blocking

    # If daily_client is sync-only:
    room = await asyncio.to_thread(
        self.daily_client.create_room,
        config
    )  # Runs in thread pool, doesn't block event loop

    return {"room_url": room['url']}
```

**Impact:** Same 10 users:
- All requests start simultaneously
- Each runs concurrently (or in thread pool)
- Total time: ~2 seconds (not 20 seconds)
- Server handles multiple conversations smoothly

---

## daily_client Async Support

### Step 1: Verify Async Capabilities

**Before implementation, check if daily_client is async-capable:**

```bash
pip show daily-client

# Then check the documentation or source:
# Check if these exist:
# - create_room_async()
# - create_meeting_token_async()
# - get_room_async()
# - delete_room_async()
```

### Option A: daily_client is Async-Capable (Preferred)

If methods like `create_room_async()` exist:

```python
from daily_client import DailyClient

class ConversationService:
    def __init__(self, api_key: str):
        self.daily_client = DailyClient(api_key)

    async def create_conversation_with_daily(self, user_id: str) -> dict:
        """
        Using async methods directly - cleanest approach.
        """
        room = await self.daily_client.create_room_async(
            config={
                "properties": {
                    "max_participants": 2,
                    "record_on_start": True,
                    "lang": "vi"
                }
            }
        )

        token = await self.daily_client.create_meeting_token_async(
            room_url=room['url'],
            expires_in_seconds=3600
        )

        return {
            "room_url": room['url'],
            "token": token
        }
```

### Option B: daily_client is Sync-Only (Fallback)

If only sync methods exist, wrap with `asyncio.to_thread()`:

```python
import asyncio
from daily_client import DailyClient

class ConversationService:
    def __init__(self, api_key: str):
        self.daily_client = DailyClient(api_key)

    async def create_conversation_with_daily(self, user_id: str) -> dict:
        """
        Using asyncio.to_thread() to run sync calls without blocking.
        Thread pool prevents blocking the event loop.
        """
        loop = asyncio.get_event_loop()

        # Run sync call in thread pool
        room = await loop.run_in_executor(
            None,  # Use default thread pool
            self.daily_client.create_room,
            {
                "properties": {
                    "max_participants": 2,
                    "record_on_start": True,
                    "lang": "vi"
                }
            }
        )

        # Alternative (Python 3.9+): asyncio.to_thread()
        room = await asyncio.to_thread(
            self.daily_client.create_room,
            {"properties": {"max_participants": 2, "record_on_start": True}}
        )

        token = await asyncio.to_thread(
            self.daily_client.create_meeting_token,
            room['url'],
            3600  # expires_in_seconds
        )

        return {
            "room_url": room['url'],
            "token": token
        }
```

### Option C: Hybrid Approach (If Some Methods are Async)

```python
class ConversationService:
    async def create_conversation_with_daily(self, user_id: str) -> dict:
        # If create_room_async exists, use it
        if hasattr(self.daily_client, 'create_room_async'):
            room = await self.daily_client.create_room_async(config)
        else:
            # Fallback to thread pool
            room = await asyncio.to_thread(
                self.daily_client.create_room,
                config
            )

        # Similarly for token
        if hasattr(self.daily_client, 'create_meeting_token_async'):
            token = await self.daily_client.create_meeting_token_async(...)
        else:
            token = await asyncio.to_thread(
                self.daily_client.create_meeting_token,
                room['url'],
                3600
            )

        return {"room_url": room['url'], "token": token}
```

---

## Async SQL Operations

### Pattern: Async SQLAlchemy with FastAPI

**Setup:**

```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy import Column, String, DateTime, Boolean

# Database setup
DATABASE_URL = "postgresql+asyncpg://user:password@localhost/numeroly"

engine = create_async_engine(DATABASE_URL, echo=False)

async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

Base = declarative_base()

# Models
class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    room_url = Column(String, nullable=False)
    token = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    recording_url = Column(String, nullable=True)
```

### Query Operations

```python
from sqlalchemy import select, update
from datetime import datetime

class ConversationRepository:
    def __init__(self):
        self.async_session = async_session

    async def create_conversation(
        self,
        conversation_id: str,
        user_id: str,
        room_url: str,
        token: str
    ) -> Conversation:
        """✅ GOOD: Async query with proper awaits"""
        async with self.async_session() as session:
            conversation = Conversation(
                id=conversation_id,
                user_id=user_id,
                room_url=room_url,
                token=token,
                created_at=datetime.utcnow()
            )
            session.add(conversation)
            await session.commit()  # Must await!
            await session.refresh(conversation)  # Reload from DB
            return conversation

    async def get_conversation(self, conversation_id: str) -> Conversation:
        """✅ GOOD: Async select with execute"""
        async with self.async_session() as session:
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id
                )
            )
            return result.scalars().first()

    async def update_conversation_recording(
        self,
        conversation_id: str,
        recording_url: str,
        ended_at: datetime
    ) -> Conversation:
        """✅ GOOD: Async update"""
        async with self.async_session() as session:
            await session.execute(
                update(Conversation)
                .where(Conversation.id == conversation_id)
                .values(
                    recording_url=recording_url,
                    ended_at=ended_at
                )
            )
            await session.commit()

            # Fetch updated record
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id
                )
            )
            return result.scalars().first()
```

### ❌ Common Mistakes

```python
# ❌ BAD: Using sync session
from sqlalchemy import create_engine, Session

engine = create_engine("postgresql://...")  # Sync!
session = Session(engine)

async def create_conversation(...):
    # This BLOCKS the event loop!
    conversation = session.query(Conversation).get(conversation_id)
    session.add(new_conversation)
    session.commit()  # BLOCKS HERE

# ❌ BAD: Not awaiting async operations
async with async_session() as session:
    result = session.execute(...)  # Missing await!
    await session.commit()

# ❌ BAD: Using ORM relationships in async context
async def get_conversation_messages(...):
    conv = await repo.get_conversation(...)
    messages = conv.messages  # Lazy load - BLOCKS!
    return messages
```

---

## Redis Concurrency Patterns

### Pattern 1: Distributed Lock (Pessimistic)

**Use when:** You want to prevent concurrent access to conversation state.

```python
import redis.asyncio as redis
import uuid
from datetime import datetime, timedelta

class ConversationService:
    def __init__(self, redis_url: str):
        self.redis = redis.from_url(redis_url)

    async def save_user_message(
        self,
        conversation_id: str,
        text: str,
        confidence: float
    ) -> dict:
        """
        Save message with distributed lock.
        Only one save per conversation at a time.
        """
        lock_key = f"conv:{conversation_id}:lock"
        lock_value = str(uuid.uuid4())
        timeout = 30  # 30 seconds

        # Try to acquire lock
        acquired = await self.redis.set(
            lock_key,
            lock_value,
            px=timeout * 1000,  # milliseconds
            nx=True  # Only set if not exists
        )

        if not acquired:
            # Another request has the lock
            # Retry or fail
            raise ConversationLockedError(
                f"Conversation {conversation_id} is locked"
            )

        try:
            # We have the lock - exclusive access
            async with self.async_session() as session:
                message = Message(
                    conversation_id=conversation_id,
                    user_text=text,
                    confidence=confidence,
                    created_at=datetime.utcnow()
                )
                session.add(message)
                await session.commit()
                await session.refresh(message)

            # Update Redis cache
            await self.redis.incr(f"conv:{conversation_id}:msg_count")

            return {
                "message_id": message.id,
                "created_at": message.created_at
            }

        finally:
            # Always release lock
            # Verify we still own it before releasing
            current_owner = await self.redis.get(lock_key)
            if current_owner == lock_value.encode():
                await self.redis.delete(lock_key)
```

### Pattern 2: Redis WATCH/Multi (Optimistic)

**Use when:** Concurrent access is common but conflicts are rare.

```python
async def save_user_message_optimistic(
    self,
    conversation_id: str,
    text: str,
    confidence: float
) -> dict:
    """
    Save message with optimistic locking (WATCH).
    Retry if another request modified the key.
    """
    max_retries = 3
    retry_count = 0

    while retry_count < max_retries:
        try:
            # Create pipeline with watch
            async with self.redis.pipeline(transaction=False) as pipe:
                # Watch for changes to this key
                await pipe.watch(f"conv:{conversation_id}:state")

                # Read current state
                current_count = await pipe.get(
                    f"conv:{conversation_id}:msg_count"
                )

                # Start transaction
                await pipe.multi()

                # Save to database
                async with self.async_session() as session:
                    message = Message(
                        conversation_id=conversation_id,
                        user_text=text,
                        confidence=confidence
                    )
                    session.add(message)
                    await session.commit()
                    message_id = message.id

                # Update cache in transaction
                await pipe.incr(f"conv:{conversation_id}:msg_count")
                await pipe.execute()

                return {
                    "message_id": message_id,
                    "position": (int(current_count or 0) + 1)
                }

        except redis.WatchError:
            # Another request modified the watched key
            # Retry
            retry_count += 1
            await asyncio.sleep(0.1 * retry_count)  # Exponential backoff
            continue

    raise ConversationConcurrencyError(
        f"Failed to save message after {max_retries} retries"
    )
```

### Pattern 3: Semaphore (Per-Conversation Limiting)

**Use when:** You want to limit concurrent operations per conversation.

```python
class ConversationService:
    def __init__(self):
        # One semaphore per conversation
        self.message_semaphores = {}  # Dict[str, asyncio.Semaphore]

    def get_conversation_semaphore(self, conversation_id: str) -> asyncio.Semaphore:
        """Get or create semaphore for conversation."""
        if conversation_id not in self.message_semaphores:
            # Allow max 3 concurrent messages per conversation
            self.message_semaphores[conversation_id] = asyncio.Semaphore(3)
        return self.message_semaphores[conversation_id]

    async def save_user_message_limited(
        self,
        conversation_id: str,
        text: str,
        confidence: float
    ) -> dict:
        """Save message with concurrency limit."""
        semaphore = self.get_conversation_semaphore(conversation_id)

        async with semaphore:
            # Only 3 concurrent saves for this conversation
            async with self.async_session() as session:
                message = Message(
                    conversation_id=conversation_id,
                    user_text=text,
                    confidence=confidence
                )
                session.add(message)
                await session.commit()
                await session.refresh(message)
                return message.to_dict()
```

---

## Transaction Safety Patterns

### Pattern: Atomic Room + Token Creation

**Problem:** What if room creation succeeds but token generation fails?

**Solution:** Implement rollback logic.

```python
class ConversationService:
    async def create_conversation_with_daily(
        self,
        user_id: str
    ) -> dict:
        """
        Create Daily.co room and token atomically.
        If token fails, delete room (rollback).
        """
        room = None
        db_record = None

        try:
            # Step 1: Create room
            print(f"Creating Daily.co room for user {user_id}")
            room = await asyncio.to_thread(
                self.daily_client.create_room,
                {
                    "properties": {
                        "max_participants": 2,
                        "record_on_start": True,
                        "lang": "vi"
                    }
                }
            )
            print(f"Room created: {room['url']}")

            # Step 2: Create token
            print(f"Creating token for room {room['url']}")
            token = await asyncio.to_thread(
                self.daily_client.create_meeting_token,
                room['url'],
                3600  # 1 hour expiry
            )
            print(f"Token created successfully")

            # Step 3: Save to database
            print(f"Saving conversation to database")
            async with self.async_session() as session:
                db_record = Conversation(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    room_url=room['url'],
                    token=token,
                    created_at=datetime.utcnow()
                )
                session.add(db_record)
                await session.commit()
                await session.refresh(db_record)
            print(f"Database record created: {db_record.id}")

            return {
                "conversation_id": db_record.id,
                "room_url": room['url'],
                "token": token,
                "room_name": room.get('name', 'unknown')
            }

        except Exception as e:
            # Rollback: Delete room if created
            if room and not db_record:
                print(f"Rolling back: deleting room {room['url']}")
                try:
                    await asyncio.to_thread(
                        self.daily_client.delete_room,
                        room['url']
                    )
                    print(f"Room deleted successfully")
                except Exception as delete_error:
                    print(f"Warning: failed to delete room during rollback: {delete_error}")

            # Re-raise the original error
            error_msg = f"Failed to create conversation: {str(e)}"
            print(f"Error: {error_msg}")
            raise ConversationCreationError(error_msg) from e

    async def end_conversation(
        self,
        conversation_id: str,
        rating: int
    ) -> dict:
        """
        End conversation and clean up resources.
        """
        try:
            # Fetch conversation
            async with self.async_session() as session:
                result = await session.execute(
                    select(Conversation).where(
                        Conversation.id == conversation_id
                    )
                )
                conversation = result.scalars().first()

                if not conversation:
                    raise ConversationNotFoundError(
                        f"Conversation {conversation_id} not found"
                    )

                # Delete Daily.co room
                await asyncio.to_thread(
                    self.daily_client.delete_room,
                    conversation.room_url
                )

                # Get room info for recording URL
                room_info = await asyncio.to_thread(
                    self.daily_client.get_room,
                    conversation.room_url
                )
                recording_url = room_info.get('recording_url')

                # Update conversation in database
                conversation.ended_at = datetime.utcnow()
                conversation.recording_url = recording_url
                conversation.rating = rating

                session.add(conversation)
                await session.commit()
                await session.refresh(conversation)

                return {
                    "conversation_id": conversation.id,
                    "ended_at": conversation.ended_at,
                    "recording_url": recording_url
                }

        except Exception as e:
            print(f"Error ending conversation: {str(e)}")
            raise
```

---

## Load Testing Guidelines

### Setup: Locust Load Test

**Install:**

```bash
pip install locust
```

**Create `locustfile.py`:**

```python
from locust import HttpUser, task, between
import random

class ConversationUser(HttpUser):
    wait_time = between(1, 3)

    @task
    def create_conversation(self):
        """Simulate conversation creation."""
        response = self.client.post(
            "/conversations",
            json={
                "user_id": f"user_{random.randint(1, 1000)}"
            }
        )
        assert response.status_code == 200

    @task
    def save_message(self):
        """Simulate message save."""
        response = self.client.post(
            "/conversations/test-conv-123/messages",
            json={
                "text": "Hello, what's my numerology?",
                "confidence": 0.95
            }
        )
        assert response.status_code in [200, 201]

    @task
    def end_conversation(self):
        """Simulate conversation end."""
        response = self.client.patch(
            "/conversations/test-conv-123",
            json={"rating": 5}
        )
        assert response.status_code in [200, 404]  # 404 if not found is ok
```

**Run load test:**

```bash
locust -f locustfile.py --host=http://localhost:8000 --users 100 --spawn-rate 10
```

### Expected Results

With proper async implementation:

| Metric | Result |
|--------|--------|
| Concurrent Users | 100+ |
| Average Response Time | <500ms |
| p95 Response Time | <1000ms |
| Error Rate | <0.1% |
| Throughput | 50+ requests/sec |

### What to Monitor

```python
# In your service logs, you should see:
# ✅ All requests processing concurrently
# ✅ No "event loop blocked" warnings
# ✅ Database connections pooled efficiently
# ✅ Redis operations complete quickly

# ❌ Signs of problems:
# ❌ Response times increase linearly with users
# ❌ "EventLoopBlockedWarning" in logs
# ❌ Database connection pool exhausted
# ❌ Redis timeout errors
```

---

## Common Pitfalls

### Pitfall 1: Forgetting `await` in Async Function

```python
# ❌ BAD
async def create_conversation(...):
    room = self.daily_client.create_room(config)  # Missing await!
    return room

# ✅ GOOD
async def create_conversation(...):
    room = await asyncio.to_thread(
        self.daily_client.create_room,
        config
    )
    return room
```

### Pitfall 2: Mixing Sync and Async Calls

```python
# ❌ BAD: Sync database call in async function
async def save_message(...):
    session = Session(engine)  # Sync session!
    message = session.query(Message).get(msg_id)  # BLOCKS!
    return message

# ✅ GOOD: Async database call
async def save_message(...):
    async with async_session() as session:
        result = await session.execute(...)  # Awaited!
        return result.scalars().first()
```

### Pitfall 3: Creating New Database Connections Per Request

```python
# ❌ BAD: New connection every request
async def get_conversation(conversation_id: str):
    engine = create_async_engine(DATABASE_URL)  # Creates new engine!
    async with AsyncSession(engine) as session:
        ...

# ✅ GOOD: Reuse connection pool
# Create engine once at startup
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession)

# Reuse in requests
async def get_conversation(conversation_id: str):
    async with async_session() as session:
        ...
```

### Pitfall 4: Not Handling Concurrency Properly

```python
# ❌ BAD: Race condition - multiple saves simultaneously
conversations = {}  # Global dict

async def save_message(conversation_id: str, text: str):
    conv = conversations[conversation_id]
    conv['messages'].append(text)  # Race condition!
    conversations[conversation_id] = conv

# ✅ GOOD: Use locks or database
async def save_message(conversation_id: str, text: str):
    async with self.get_conversation_semaphore(conversation_id):
        # Exclusive access
        await db.save_message(conversation_id, text)
```

### Pitfall 5: Long-Running Sync Operations in Event Loop

```python
# ❌ BAD: 30-second sync operation blocks everything
async def process_large_file(...):
    # This large_sync_operation takes 30 seconds!
    result = large_sync_operation(data)  # BLOCKS EVENT LOOP!
    return result

# ✅ GOOD: Run in thread pool
async def process_large_file(...):
    result = await asyncio.to_thread(
        large_sync_operation,
        data
    )
    return result
```

---

## Complete Service Example

Here's a complete, production-ready conversation service:

```python
# File: apps/api/src/services/conversation_service.py

import asyncio
import uuid
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import logging

from fastapi import HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from daily_client import DailyClient
import redis.asyncio as redis

logger = logging.getLogger(__name__)

# Models
from ..models import Conversation, Message


class ConversationService:
    """
    Non-blocking, async-safe conversation service for Daily.co integration.

    Key principles:
    - All I/O operations are async (database, Redis, Daily.co)
    - No blocking calls in async functions
    - Transactions are atomic with rollback support
    - Concurrent access is properly synchronized
    """

    def __init__(
        self,
        daily_api_key: str,
        redis_url: str,
        async_session_factory
    ):
        self.daily_client = DailyClient(api_key=daily_api_key)
        self.redis = redis.from_url(redis_url)
        self.async_session = async_session_factory
        self.message_semaphores: Dict[str, asyncio.Semaphore] = {}

    def get_conversation_semaphore(
        self,
        conversation_id: str
    ) -> asyncio.Semaphore:
        """Get or create semaphore for per-conversation limiting."""
        if conversation_id not in self.message_semaphores:
            self.message_semaphores[conversation_id] = asyncio.Semaphore(5)
        return self.message_semaphores[conversation_id]

    async def create_conversation_with_daily(
        self,
        user_id: str
    ) -> Dict:
        """
        Create Daily.co room and token.
        Atomic: succeeds completely or rolls back room on failure.
        """
        logger.info(f"Creating conversation for user {user_id}")
        room = None

        try:
            # Create room
            logger.debug(f"Creating Daily.co room")
            room = await asyncio.to_thread(
                self.daily_client.create_room,
                {
                    "properties": {
                        "max_participants": 2,
                        "record_on_start": True,
                        "lang": "vi"
                    }
                }
            )
            logger.debug(f"Room created: {room['url']}")

            # Create token
            logger.debug(f"Creating meeting token")
            token = await asyncio.to_thread(
                self.daily_client.create_meeting_token,
                room['url'],
                3600
            )
            logger.debug(f"Token created")

            # Save to database
            logger.debug(f"Saving to database")
            async with self.async_session() as session:
                conversation = Conversation(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    room_url=room['url'],
                    token=token,
                    created_at=datetime.utcnow()
                )
                session.add(conversation)
                await session.commit()
                await session.refresh(conversation)

            logger.info(f"Conversation created: {conversation.id}")

            return {
                "conversation_id": conversation.id,
                "room_url": room['url'],
                "token": token
            }

        except Exception as e:
            # Rollback: delete room if created
            if room:
                logger.warning(f"Rolling back: deleting room {room['url']}")
                try:
                    await asyncio.to_thread(
                        self.daily_client.delete_room,
                        room['url']
                    )
                except Exception as delete_error:
                    logger.error(f"Failed to delete room: {delete_error}")

            logger.error(f"Failed to create conversation: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Failed to create conversation"
            )

    async def get_daily_token(
        self,
        conversation_id: str,
        user_id: str
    ) -> Dict:
        """Get fresh token for existing conversation."""
        logger.info(f"Getting token for conversation {conversation_id}")

        async with self.async_session() as session:
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id
                )
            )
            conversation = result.scalars().first()

            if not conversation:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )

            if conversation.user_id != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Unauthorized"
                )

            # Generate new token
            token = await asyncio.to_thread(
                self.daily_client.create_meeting_token,
                conversation.room_url,
                3600
            )

            return {
                "token": token,
                "room_url": conversation.room_url
            }

    async def save_user_message(
        self,
        conversation_id: str,
        text: str,
        confidence: float
    ) -> Dict:
        """
        Save user message with concurrency limiting.
        """
        logger.debug(
            f"Saving message for conversation {conversation_id}: {text[:50]}"
        )

        semaphore = self.get_conversation_semaphore(conversation_id)

        async with semaphore:
            async with self.async_session() as session:
                message = Message(
                    id=str(uuid.uuid4()),
                    conversation_id=conversation_id,
                    user_text=text,
                    confidence=confidence,
                    created_at=datetime.utcnow()
                )
                session.add(message)
                await session.commit()
                await session.refresh(message)

            # Update Redis cache
            await self.redis.incr(
                f"conv:{conversation_id}:msg_count"
            )

            logger.debug(f"Message saved: {message.id}")
            return {"message_id": message.id}

    async def end_conversation(
        self,
        conversation_id: str,
        user_id: str,
        rating: Optional[int] = None
    ) -> Dict:
        """
        End conversation and clean up resources.
        """
        logger.info(f"Ending conversation {conversation_id}")

        async with self.async_session() as session:
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id
                )
            )
            conversation = result.scalars().first()

            if not conversation:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )

            if conversation.user_id != user_id:
                raise HTTPException(
                    status_code=403,
                    detail="Unauthorized"
                )

            # Delete room
            try:
                await asyncio.to_thread(
                    self.daily_client.delete_room,
                    conversation.room_url
                )
            except Exception as e:
                logger.error(f"Failed to delete room: {e}")

            # Get room info for recording
            try:
                room_info = await asyncio.to_thread(
                    self.daily_client.get_room,
                    conversation.room_url
                )
                recording_url = room_info.get('recording_url')
            except Exception as e:
                logger.error(f"Failed to get room info: {e}")
                recording_url = None

            # Update conversation
            conversation.ended_at = datetime.utcnow()
            conversation.recording_url = recording_url
            conversation.rating = rating

            session.add(conversation)
            await session.commit()
            await session.refresh(conversation)

            # Clean up Redis
            await self.redis.delete(f"conv:{conversation_id}:*")

            logger.info(f"Conversation ended: {conversation_id}")

            return {
                "conversation_id": conversation.id,
                "recording_url": recording_url
            }

    async def get_conversation_history(
        self,
        conversation_id: str,
        user_id: str
    ) -> Dict:
        """Get all messages for a conversation."""
        async with self.async_session() as session:
            # Verify ownership
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id
                )
            )
            conversation = result.scalars().first()

            if not conversation or conversation.user_id != user_id:
                raise HTTPException(
                    status_code=404,
                    detail="Conversation not found"
                )

            # Get messages
            result = await session.execute(
                select(Message).where(
                    Message.conversation_id == conversation_id
                ).order_by(Message.created_at)
            )
            messages = result.scalars().all()

            return {
                "conversation_id": conversation_id,
                "messages": [m.to_dict() for m in messages],
                "count": len(messages)
            }
```

---

## Deployment Checklist

Before deploying to production:

- [ ] Verified daily_client async support
- [ ] All async functions properly await I/O
- [ ] Database uses AsyncSession correctly
- [ ] Redis operations use redis.asyncio
- [ ] Concurrency patterns (semaphores/locks) implemented
- [ ] Transaction rollback tested
- [ ] Load test passed (100+ concurrent users)
- [ ] No "event loop blocked" warnings in logs
- [ ] Error handling covers Daily.co API failures
- [ ] Monitoring/alerting configured
- [ ] Graceful shutdown implemented

---

## References

- [Python asyncio docs](https://docs.python.org/3/library/asyncio.html)
- [FastAPI async patterns](https://fastapi.tiangolo.com/deployment/concepts/#path-operations-and-middleware)
- [SQLAlchemy async support](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)
- [Redis async patterns](https://redis-py.readthedocs.io/en/stable/connections.html#async-support)
- [Daily.co Python SDK](https://docs.daily.co/reference/sdks-and-libraries/python-sdk)

---

**Last Updated:** January 2025
**Status:** Production Ready
**Audience:** Backend Developers

