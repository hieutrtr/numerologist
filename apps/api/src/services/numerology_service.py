"""
Numerology calculation service.
Handles business logic for calculating numerology profiles and managing interpretations.

Uses libs/numerology for core Pythagorean calculations.
"""

import logging
from datetime import date, datetime
from uuid import UUID
from typing import Optional, Dict

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from libs.numerology.src import (
    calculateLifePath,
    calculateDestiny,
    calculateSoulUrge,
    calculatePersonality,
    calculatePersonalYear,
    calculatePersonalMonth,
    getInterpretation,
)
from ..models.numerology_profile import NumerologyProfile
from ..schemas.numerology import NumerologyProfileRequest, NumerologyProfileResponse, ErrorResponse

logger = logging.getLogger(__name__)


class ValidationError(Exception):
    """Validation error with user-friendly Vietnamese message."""
    
    def __init__(self, message: str, error_code: str):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


class NumerologyService:
    """Service for numerology calculations and profile management."""
    
    # Vietnamese error messages
    ERROR_MESSAGES = {
        "INVALID_BIRTH_DATE": "Ngày sinh không hợp lệ. Vui lòng nhập ngày chính xác.",
        "INVALID_DATE_FORMAT": "Định dạng ngày không hợp lệ. Sử dụng YYYY-MM-DD.",
        "BIRTH_DATE_FUTURE": "Ngày sinh không thể là ngày trong tương lai.",
        "BIRTH_DATE_TOO_OLD": "Ngày sinh quá cũ. Vui lòng nhập năm sinh từ 1900 trở lại đây.",
        "EMPTY_NAME": "Tên không được để trống. Vui lòng nhập tên của bạn.",
        "NAME_TOO_LONG": "Tên quá dài. Vui lòng nhập tên ngắn hơn (tối đa 100 ký tự).",
        "INVALID_NAME_FORMAT": "Tên chứa ký tự không hợp lệ.",
        "CALCULATION_ERROR": "Lỗi khi tính toán. Vui lòng thử lại.",
        "DATABASE_ERROR": "Lỗi cơ sở dữ liệu. Vui lòng thử lại.",
        "PROFILE_NOT_FOUND": "Không tìm thấy hồ sơ numerology.",
    }
    
    @staticmethod
    def validate_birth_date(birth_date_str: str) -> date:
        """
        Validate birth date string and convert to date object.
        
        Args:
            birth_date_str: Date string in YYYY-MM-DD format
            
        Returns:
            Validated date object
            
        Raises:
            ValidationError: If date is invalid
        """
        try:
            # Parse date
            birth_date = date.fromisoformat(birth_date_str)
        except (ValueError, TypeError):
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["INVALID_DATE_FORMAT"],
                "INVALID_DATE_FORMAT"
            )
        
        # Check if date is not in the future
        today = date.today()
        if birth_date > today:
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["BIRTH_DATE_FUTURE"],
                "BIRTH_DATE_FUTURE"
            )
        
        # Check if date is not too old (reasonable range: 1900-today)
        if birth_date.year < 1900:
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["BIRTH_DATE_TOO_OLD"],
                "BIRTH_DATE_TOO_OLD"
            )
        
        return birth_date
    
    @staticmethod
    def validate_name(full_name: str) -> str:
        """
        Validate full name.
        
        Args:
            full_name: Full name string
            
        Returns:
            Validated name (stripped of whitespace)
            
        Raises:
            ValidationError: If name is invalid
        """
        # Check not empty
        if not full_name or not full_name.strip():
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["EMPTY_NAME"],
                "EMPTY_NAME"
            )
        
        # Check length
        if len(full_name) > 100:
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["NAME_TOO_LONG"],
                "NAME_TOO_LONG"
            )
        
        # Strip whitespace
        validated_name = full_name.strip()
        
        return validated_name
    
    @staticmethod
    def calculate_profile(
        full_name: str,
        birth_date: date
    ) -> Dict:
        """
        Calculate complete numerology profile for a user.
        
        Args:
            full_name: Full name (Vietnamese supported)
            birth_date: Birth date as date object
            
        Returns:
            Dictionary with all calculated numbers and interpretations
            
        Raises:
            ValidationError: If calculations fail
        """
        try:
            # Get current date for Personal Year/Month calculations
            today = date.today()
            
            # Calculate all numbers
            life_path = calculateLifePath(birth_date)
            destiny = calculateDestiny(full_name)
            soul_urge = calculateSoulUrge(full_name)
            personality = calculatePersonality(full_name)
            personal_year = calculatePersonalYear(birth_date.month, birth_date.day, today.year)
            personal_month = calculatePersonalMonth(birth_date.day, today.month, today.year)
            
            # Get interpretations
            interpretations = {
                f"lifePathNumber_{life_path}": getInterpretation("life_path", life_path, "vi"),
                f"destinyNumber_{destiny}": getInterpretation("destiny", destiny, "vi"),
                f"soulUrgeNumber_{soul_urge}": getInterpretation("soul_urge", soul_urge, "vi"),
                f"personalityNumber_{personality}": getInterpretation("personality", personality, "vi"),
            }
            
            return {
                "life_path_number": life_path,
                "destiny_number": destiny,
                "soul_urge_number": soul_urge,
                "personality_number": personality,
                "current_personal_year": personal_year,
                "current_personal_month": personal_month,
                "interpretations": interpretations,
            }
        
        except Exception as e:
            logger.error(f"Error calculating numerology profile: {str(e)}")
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["CALCULATION_ERROR"],
                "CALCULATION_ERROR"
            )
    
    @staticmethod
    async def create_profile(
        session: AsyncSession,
        request: NumerologyProfileRequest
    ) -> NumerologyProfileResponse:
        """
        Create or update numerology profile for a user.
        
        Args:
            session: AsyncSession for database operations
            request: Request with user ID, name, and birth date
            
        Returns:
            NumerologyProfileResponse with calculated profile
            
        Raises:
            ValidationError: If validation or calculation fails
        """
        try:
            # Validate inputs
            birth_date = NumerologyService.validate_birth_date(request.birth_date)
            full_name = NumerologyService.validate_name(request.full_name)
            
            # Calculate profile
            profile_data = NumerologyService.calculate_profile(full_name, birth_date)
            
            # Check if profile already exists for this user
            stmt = select(NumerologyProfile).where(
                NumerologyProfile.user_id == request.user_id
            )
            result = await session.execute(stmt)
            existing_profile = result.scalar_one_or_none()
            
            if existing_profile:
                # Update existing profile
                existing_profile.life_path_number = profile_data["life_path_number"]
                existing_profile.destiny_number = profile_data["destiny_number"]
                existing_profile.soul_urge_number = profile_data["soul_urge_number"]
                existing_profile.personality_number = profile_data["personality_number"]
                existing_profile.current_personal_year = profile_data["current_personal_year"]
                existing_profile.current_personal_month = profile_data["current_personal_month"]
                existing_profile.interpretations = profile_data["interpretations"]
                existing_profile.updated_at = datetime.utcnow()
                profile = existing_profile
            else:
                # Create new profile
                profile = NumerologyProfile(
                    user_id=request.user_id,
                    life_path_number=profile_data["life_path_number"],
                    destiny_number=profile_data["destiny_number"],
                    soul_urge_number=profile_data["soul_urge_number"],
                    personality_number=profile_data["personality_number"],
                    current_personal_year=profile_data["current_personal_year"],
                    current_personal_month=profile_data["current_personal_month"],
                    interpretations=profile_data["interpretations"],
                )
                session.add(profile)
            
            # Save to database
            await session.commit()
            
            logger.info(f"Created/updated numerology profile for user {request.user_id}")
            
            # Return response
            return NumerologyProfileResponse(
                id=profile.id,
                user_id=profile.user_id,
                life_path_number=profile.life_path_number,
                destiny_number=profile.destiny_number,
                soul_urge_number=profile.soul_urge_number,
                personality_number=profile.personality_number,
                current_personal_year=profile.current_personal_year,
                current_personal_month=profile.current_personal_month,
                interpretations=profile.interpretations,
                calculated_at=profile.calculated_at,
                updated_at=profile.updated_at,
            )
        
        except ValidationError:
            await session.rollback()
            raise
        except Exception as e:
            await session.rollback()
            logger.error(f"Error creating numerology profile: {str(e)}")
            raise ValidationError(
                NumerologyService.ERROR_MESSAGES["DATABASE_ERROR"],
                "DATABASE_ERROR"
            )
    
    @staticmethod
    async def get_profile(
        session: AsyncSession,
        user_id: UUID
    ) -> Optional[NumerologyProfileResponse]:
        """
        Retrieve numerology profile for a user.
        
        Args:
            session: AsyncSession for database operations
            user_id: User ID
            
        Returns:
            NumerologyProfileResponse if found, None otherwise
        """
        try:
            stmt = select(NumerologyProfile).where(
                NumerologyProfile.user_id == user_id
            )
            result = await session.execute(stmt)
            profile = result.scalar_one_or_none()
            
            if not profile:
                return None
            
            return NumerologyProfileResponse(
                id=profile.id,
                user_id=profile.user_id,
                life_path_number=profile.life_path_number,
                destiny_number=profile.destiny_number,
                soul_urge_number=profile.soul_urge_number,
                personality_number=profile.personality_number,
                current_personal_year=profile.current_personal_year,
                current_personal_month=profile.current_personal_month,
                interpretations=profile.interpretations,
                calculated_at=profile.calculated_at,
                updated_at=profile.updated_at,
            )
        
        except Exception as e:
            logger.error(f"Error retrieving numerology profile: {str(e)}")
            return None
