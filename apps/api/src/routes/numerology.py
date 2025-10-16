"""
FastAPI routes for numerology API.
Exposes endpoints for calculating and retrieving numerology profiles.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from datetime import datetime

from ..dependencies import get_db
from ..services.numerology_service import NumerologyService, ValidationError
from ..schemas.numerology import NumerologyProfileRequest, NumerologyProfileResponse, ErrorResponse

router = APIRouter(prefix="/api/v1/numerology", tags=["numerology"])


@router.post(
    "/profile",
    response_model=NumerologyProfileResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Calculate or update numerology profile",
    description="Calculate numerology numbers from name and birth date using Pythagorean system",
)
async def create_numerology_profile(
    request: NumerologyProfileRequest,
    db: AsyncSession = Depends(get_db),
) -> NumerologyProfileResponse:
    """
    Create or update a numerology profile for a user.
    
    Calculates:
    - Life Path number from birth date
    - Destiny number from full name
    - Soul Urge number from vowels
    - Personality number from consonants
    - Personal Year and Month cycles
    - Vietnamese interpretations for all numbers
    
    Args:
        request: Profile request with user_id, full_name, and birth_date
        db: Database session
        
    Returns:
        Complete numerology profile with interpretations
        
    Raises:
        HTTPException 400: If input validation fails
        HTTPException 500: If calculation or database error occurs
    """
    try:
        profile = await NumerologyService.create_profile(db, request)
        return profile
    
    except ValidationError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": e.message,
                "error_code": e.error_code,
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
                "error_code": "INTERNAL_SERVER_ERROR",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )


@router.get(
    "/profile/{user_id}",
    response_model=NumerologyProfileResponse,
    responses={
        404: {"model": ErrorResponse, "description": "Profile not found"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Get numerology profile",
    description="Retrieve calculated numerology profile for a user",
)
async def get_numerology_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> NumerologyProfileResponse:
    """
    Retrieve numerology profile for a user.
    
    Args:
        user_id: UUID of the user
        db: Database session
        
    Returns:
        Numerology profile if found
        
    Raises:
        HTTPException 404: If profile not found
        HTTPException 500: If database error occurs
    """
    try:
        profile = await NumerologyService.get_profile(db, user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "Không tìm thấy hồ sơ numerology.",
                    "error_code": "PROFILE_NOT_FOUND",
                    "timestamp": datetime.utcnow().isoformat() + "Z",
                }
            )
        
        return profile
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
                "error_code": "INTERNAL_SERVER_ERROR",
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
        )


@router.get(
    "/health",
    tags=["health"],
    summary="Health check for numerology service",
    description="Check if numerology service is operational",
)
async def health_check() -> dict:
    """
    Health check endpoint for numerology service.
    
    Returns:
        Status information
    """
    return {
        "status": "healthy",
        "service": "numerology",
        "version": "1.0.0",
    }
