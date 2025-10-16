"""Example repository for reference implementation."""

from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional


class ExampleRepository:
    """Example repository demonstrating data access patterns."""

    def __init__(self, db: AsyncSession):
        """Initialize repository with database session."""
        self.db = db

    async def example_operation(self) -> Optional[str]:
        """Example async database operation."""
        return "Example data"
