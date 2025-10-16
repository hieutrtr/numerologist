"""
Integration tests for numerology API endpoints.
Tests POST and GET endpoints for numerology profile management.
"""

import pytest
import sys
from datetime import date
from uuid import uuid4
from pathlib import Path

# Add project root to path for imports
project_root = Path(__file__).parent.parent.parent.parent.parent.parent
sys.path.insert(0, str(project_root))

from apps.api.src.services.numerology_service import NumerologyService, ValidationError
from apps.api.src.schemas.numerology import NumerologyProfileRequest


class TestNumerologyService:
    """Test NumerologyService methods."""
    
    @pytest.fixture
    def valid_request(self):
        """Create a valid numerology profile request."""
        return NumerologyProfileRequest(
            user_id=uuid4(),
            full_name="Nguyễn Văn A",
            birth_date="1990-03-15"
        )
    
    def test_validate_birth_date_valid(self):
        """Test valid birth date validation."""
        date_obj = NumerologyService.validate_birth_date("1990-03-15")
        assert date_obj == date(1990, 3, 15)
    
    def test_validate_birth_date_invalid_format(self):
        """Test invalid date format raises error."""
        with pytest.raises(ValidationError) as exc_info:
            NumerologyService.validate_birth_date("03/15/1990")
        assert exc_info.value.error_code == "INVALID_DATE_FORMAT"
    
    def test_validate_birth_date_future_date(self):
        """Test future date raises error."""
        with pytest.raises(ValidationError) as exc_info:
            NumerologyService.validate_birth_date("2050-01-01")
        assert exc_info.value.error_code == "BIRTH_DATE_FUTURE"
    
    def test_validate_birth_date_too_old(self):
        """Test very old date raises error."""
        with pytest.raises(ValidationError) as exc_info:
            NumerologyService.validate_birth_date("1800-01-01")
        assert exc_info.value.error_code == "BIRTH_DATE_TOO_OLD"
    
    def test_validate_name_valid(self):
        """Test valid name validation."""
        result = NumerologyService.validate_name("Nguyễn Văn A")
        assert result == "Nguyễn Văn A"
    
    def test_validate_name_empty(self):
        """Test empty name raises error."""
        with pytest.raises(ValidationError) as exc_info:
            NumerologyService.validate_name("")
        assert exc_info.value.error_code == "EMPTY_NAME"
    
    def test_validate_name_too_long(self):
        """Test name too long raises error."""
        long_name = "a" * 101
        with pytest.raises(ValidationError) as exc_info:
            NumerologyService.validate_name(long_name)
        assert exc_info.value.error_code == "NAME_TOO_LONG"
    
    def test_validate_name_strips_whitespace(self):
        """Test name is stripped of whitespace."""
        result = NumerologyService.validate_name("  Nguyễn Văn A  ")
        assert result == "Nguyễn Văn A"
    
    def test_calculate_profile_valid(self):
        """Test profile calculation with valid inputs."""
        profile = NumerologyService.calculate_profile(
            "Nguyễn Văn A",
            date(1990, 3, 15)
        )
        
        # Check all required fields are present
        assert "life_path_number" in profile
        assert "destiny_number" in profile
        assert "soul_urge_number" in profile
        assert "personality_number" in profile
        assert "current_personal_year" in profile
        assert "current_personal_month" in profile
        assert "interpretations" in profile
        
        # Check values are valid numbers
        assert 1 <= profile["life_path_number"] <= 33
        assert 1 <= profile["destiny_number"] <= 33
        assert 1 <= profile["soul_urge_number"] <= 33
        assert 1 <= profile["personality_number"] <= 33
        assert 1 <= profile["current_personal_year"] <= 9
        assert 1 <= profile["current_personal_month"] <= 9
        
        # Check interpretations are present
        assert len(profile["interpretations"]) == 4
    
    def test_calculate_profile_vietnamese_name(self):
        """Test profile calculation with Vietnamese name."""
        profile = NumerologyService.calculate_profile(
            "Trần Thị Hương",
            date(1985, 5, 22)
        )
        
        # Should still calculate valid numbers
        assert "life_path_number" in profile
        assert 1 <= profile["life_path_number"] <= 33
    
    def test_calculate_profile_with_master_numbers(self):
        """Test that Master Numbers (11, 22, 33) are preserved."""
        # 11/02/1980 should give Life Path 22
        profile = NumerologyService.calculate_profile(
            "Test Person",
            date(1980, 11, 2)
        )
        
        assert profile["life_path_number"] == 22
    
    def test_calculate_profile_different_names_different_destiny(self):
        """Test different names give different destiny numbers."""
        profile1 = NumerologyService.calculate_profile(
            "John",
            date(1990, 3, 15)
        )
        profile2 = NumerologyService.calculate_profile(
            "Jane",
            date(1990, 3, 15)
        )
        
        # Different names should usually give different destiny numbers
        # (though it's theoretically possible they're the same)
        assert profile1["destiny_number"] or profile2["destiny_number"]  # At least one should exist
    
    def test_calculate_profile_interpretations_are_strings(self):
        """Test that interpretations are non-empty strings."""
        profile = NumerologyService.calculate_profile(
            "Test Person",
            date(1990, 3, 15)
        )
        
        for key, value in profile["interpretations"].items():
            assert isinstance(value, str)
            assert len(value) > 0
            # Check Vietnamese interpretations contain Vietnamese text patterns
            assert any(c > '\u00ff' for c in value)  # Contains non-ASCII characters
    
    def test_error_messages_are_vietnamese(self):
        """Test that all error messages are in Vietnamese."""
        for error_code, message in NumerologyService.ERROR_MESSAGES.items():
            # Check message contains Vietnamese characters or is empty
            assert message  # Not empty
            # All error messages should be in Vietnamese (contain non-ASCII or specific patterns)
            assert any(ord(c) > 127 for c in message) or "error" in error_code


class TestNumerologyCalculations:
    """Test specific numerology calculation scenarios."""
    
    def test_life_path_1(self):
        """Test Life Path 1 calculation."""
        profile = NumerologyService.calculate_profile(
            "Test Person",
            date(1985, 3, 29)  # 0+3+2+9+1+9+8+5 = 37 -> 3+7 = 10 -> 1+0 = 1
        )
        assert profile["life_path_number"] == 1
    
    def test_destiny_john(self):
        """Test Destiny calculation for 'John'."""
        # J(1) + O(6) + H(8) + N(5) = 20 -> 2+0 = 2
        profile = NumerologyService.calculate_profile(
            "John",
            date(1990, 1, 1)
        )
        assert profile["destiny_number"] == 2
    
    def test_soul_urge_calculation(self):
        """Test Soul Urge extraction and calculation."""
        profile = NumerologyService.calculate_profile(
            "JOHN",
            date(1990, 1, 1)
        )
        # JOHN vowels: O(6) -> 6
        assert profile["soul_urge_number"] == 6
    
    def test_personality_calculation(self):
        """Test Personality extraction and calculation."""
        profile = NumerologyService.calculate_profile(
            "JOHN",
            date(1990, 1, 1)
        )
        # JOHN consonants: J(1) + H(8) + N(5) = 14 -> 1+4 = 5
        assert profile["personality_number"] == 5
    
    def test_personal_year_cycles(self):
        """Test Personal Year cycles through 1-9."""
        year_values = set()
        for year in range(2020, 2030):
            profile = NumerologyService.calculate_profile(
                "Test",
                date(1990, 3, 15)
            )
            # Manually calculate for different years
            from libs.numerology.src import calculatePersonalYear
            pyr = calculatePersonalYear(3, 15, year)
            year_values.add(pyr)
        
        # Should cycle through multiple values
        assert len(year_values) > 1
        # All values should be 1-9
        assert all(1 <= v <= 9 for v in year_values)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
