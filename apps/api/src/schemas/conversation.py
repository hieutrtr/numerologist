"""
Conversation Schemas - Pydantic models for request/response validation
"""

from uuid import UUID
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class NumbersCalculated(BaseModel):
    """Calculated numerology numbers"""
    lifePathNumber: int
    destinyNumber: int
    soulUrgeNumber: int
    personalityNumber: int
    currentPersonalYear: int
    currentPersonalMonth: int


class ConversationCreateRequest(BaseModel):
    """Request to create/save a conversation"""
    user_name: str = Field(..., min_length=1, max_length=100)
    birth_date: str = Field(..., pattern=r'^\d{4}-\d{2}-\d{2}$')  # YYYY-MM-DD
    user_question: Optional[str] = Field(None, max_length=500)
    numbers_calculated: NumbersCalculated
    insight_provided: str = Field(..., max_length=2000)
    satisfaction_feedback: Optional[str] = Field(None)  # 'yes' or 'no'


class ConversationResponse(BaseModel):
    """Response with conversation data"""
    id: UUID
    user_id: UUID
    user_name: str
    birth_date: str
    user_question: Optional[str]
    numbers_calculated: dict
    insight_provided: str
    satisfaction_feedback: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationListResponse(BaseModel):
    """Response for conversation list"""
    total: int
    conversations: list[ConversationResponse]
