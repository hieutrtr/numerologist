"""
SQLAlchemy ORM model for Numerology Profile.
Stores calculated numerology numbers and their Vietnamese interpretations.
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from ..utils.database import Base


class NumerologyProfile(Base):
    """
    Numerology profile for a user.
    
    Stores:
    - Calculated numerology numbers (Life Path, Destiny, Soul Urge, Personality)
    - Current Personal Year and Month cycles
    - Cached Vietnamese interpretations
    - Calculation timestamp
    """
    __tablename__ = "numerology_profiles"

    # Primary key
    id = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    
    # Foreign key to User
    user_id = Column(PG_UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    
    # Calculated numerology numbers
    life_path_number = Column(Integer, nullable=False)  # 1-9, 11, 22, 33
    destiny_number = Column(Integer, nullable=False)    # 1-9, 11, 22, 33
    soul_urge_number = Column(Integer, nullable=False)  # 1-9, 11, 22, 33
    personality_number = Column(Integer, nullable=False)  # 1-9, 11, 22, 33
    
    # Current cycles
    current_personal_year = Column(Integer, nullable=False)  # 1-9
    current_personal_month = Column(Integer, nullable=False)  # 1-9
    
    # Cached Vietnamese interpretations as JSON
    # Format: {
    #   "lifePathNumber_1": "interpretation text...",
    #   "destinyNumber_7": "interpretation text...",
    #   "soulUrgeNumber_5": "interpretation text...",
    #   "personalityNumber_2": "interpretation text..."
    # }
    interpretations = Column(JSON, nullable=True)
    
    # Metadata
    calculated_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self) -> dict:
        """Convert model to dictionary."""
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "lifePathNumber": self.life_path_number,
            "destinyNumber": self.destiny_number,
            "soulUrgeNumber": self.soul_urge_number,
            "personalityNumber": self.personality_number,
            "currentPersonalYear": self.current_personal_year,
            "currentPersonalMonth": self.current_personal_month,
            "interpretations": self.interpretations or {},
            "calculatedAt": self.calculated_at.isoformat() + "Z",
            "updatedAt": self.updated_at.isoformat() + "Z",
        }
