"""
Conversation Model - SQLAlchemy ORM model for storing conversation data
Stores complete voice-numerology conversations including user input and generated insights
"""

from datetime import datetime
from uuid import uuid4
from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base


class Conversation(Base):
    """
    Conversation model for storing voice-numerology conversation sessions.
    
    Fields:
    - id: Unique conversation identifier (UUID)
    - user_id: Foreign key to User table
    - user_name: Full name collected during conversation
    - birth_date: Birth date collected (YYYY-MM-DD format)
    - user_question: Primary concern/question asked by user
    - numbers_calculated: JSON object with calculated numerology numbers
    - insight_provided: Complete insight text provided to user
    - satisfaction_feedback: User feedback (yes/no) on insight usefulness
    - created_at: Timestamp of conversation creation
    - updated_at: Timestamp of last update
    """

    __tablename__ = 'conversations'

    # Primary key
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid4)

    # Foreign key
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, index=True)

    # Conversation data
    user_name = Column(String(100), nullable=False)
    birth_date = Column(String(10), nullable=False)  # YYYY-MM-DD format
    user_question = Column(String(500), nullable=True)
    
    # Calculated numerology data (JSON)
    numbers_calculated = Column(JSON, nullable=False)
    # Format: {
    #   "lifePathNumber": 3,
    #   "destinyNumber": 7,
    #   "soulUrgeNumber": 5,
    #   "personalityNumber": 2,
    #   "currentPersonalYear": 8,
    #   "currentPersonalMonth": 4
    # }

    # Insight and feedback
    insight_provided = Column(String(2000), nullable=False)
    satisfaction_feedback = Column(String(10), nullable=True)  # 'yes' or 'no'

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship('User', back_populates='conversations')

    def __repr__(self) -> str:
        return f'<Conversation(id={self.id}, user_id={self.user_id}, user_name={self.user_name})>'

    def to_dict(self) -> dict:
        """Convert conversation to dictionary format"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'user_name': self.user_name,
            'birth_date': self.birth_date,
            'user_question': self.user_question,
            'numbers_calculated': self.numbers_calculated,
            'insight_provided': self.insight_provided,
            'satisfaction_feedback': self.satisfaction_feedback,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
