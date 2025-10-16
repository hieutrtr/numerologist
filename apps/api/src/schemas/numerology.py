"""
Pydantic schemas for numerology API requests and responses.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime
from uuid import UUID


class NumerologyProfileRequest(BaseModel):
    """Request schema for creating/updating numerology profile."""
    
    user_id: UUID = Field(..., description="User ID")
    full_name: str = Field(..., min_length=1, max_length=100, description="Full name in Vietnamese")
    birth_date: str = Field(..., description="Birth date in YYYY-MM-DD format")
    
    class Config:
        json_schema_extra = {
            "example": {
                "userId": "550e8400-e29b-41d4-a716-446655440000",
                "fullName": "Nguyễn Văn A",
                "birthDate": "1990-03-15"
            }
        }


class NumerologyNumberResponse(BaseModel):
    """Response for a single numerology number with interpretation."""
    
    value: int = Field(..., description="Numerology number (1-9, 11, 22, 33)")
    interpretation: str = Field(..., description="Vietnamese interpretation")


class NumerologyProfileResponse(BaseModel):
    """Response schema for numerology profile."""
    
    id: UUID = Field(..., description="Profile ID")
    user_id: UUID = Field(..., description="User ID")
    life_path_number: int = Field(..., description="Life Path number")
    destiny_number: int = Field(..., description="Destiny number")
    soul_urge_number: int = Field(..., description="Soul Urge number")
    personality_number: int = Field(..., description="Personality number")
    current_personal_year: int = Field(..., description="Current Personal Year cycle")
    current_personal_month: int = Field(..., description="Current Personal Month cycle")
    interpretations: Dict[str, str] = Field(
        default_factory=dict,
        description="Vietnamese interpretations keyed by number type and value"
    )
    calculated_at: datetime = Field(..., description="Calculation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440001",
                "userId": "550e8400-e29b-41d4-a716-446655440000",
                "lifePathNumber": 3,
                "destinyNumber": 7,
                "soulUrgeNumber": 5,
                "personalityNumber": 2,
                "currentPersonalYear": 8,
                "currentPersonalMonth": 4,
                "interpretations": {
                    "lifePathNumber_3": "Sáng tạo, biểu hiện, giao tiếp...",
                    "destinyNumber_7": "Khám phá và hiểu biết...",
                },
                "calculatedAt": "2025-01-16T10:30:00Z",
                "updatedAt": "2025-01-16T10:30:00Z"
            }
        }


class ErrorResponse(BaseModel):
    """Error response schema."""
    
    error: str = Field(..., description="Error message in Vietnamese")
    error_code: str = Field(..., description="Error code for debugging")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "error": "Ngày sinh không hợp lệ. Vui lòng nhập ngày chính xác.",
                "error_code": "INVALID_BIRTH_DATE",
                "timestamp": "2025-01-16T10:30:00Z"
            }
        }
