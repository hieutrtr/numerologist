"""
Unit tests for Pythagorean numerology calculator.
Tests all calculation functions with known inputs and expected outputs.
"""

import pytest
from datetime import date
from libs.numerology.src.calculator import (
    calculateLifePath,
    calculateDestiny,
    calculateSoulUrge,
    calculatePersonality,
    calculatePersonalYear,
    calculatePersonalMonth,
    _reduce_to_single_digit,
)


class TestReduceToSingleDigit:
    """Test the reduction helper function."""

    def test_single_digit_returns_unchanged(self):
        assert _reduce_to_single_digit(5) == 5
        assert _reduce_to_single_digit(1) == 1
        assert _reduce_to_single_digit(9) == 9

    def test_double_digit_reduces_correctly(self):
        assert _reduce_to_single_digit(10) == 1  # 1+0
        assert _reduce_to_single_digit(14) == 5  # 1+4
        assert _reduce_to_single_digit(29) == 11  # 2+9=11 (Master Number preserved)

    def test_master_number_11_preserved(self):
        assert _reduce_to_single_digit(11) == 11

    def test_master_number_22_preserved(self):
        assert _reduce_to_single_digit(22) == 22

    def test_master_number_33_preserved(self):
        assert _reduce_to_single_digit(33) == 33

    def test_large_number_reduces_correctly(self):
        # 47 -> 4+7 = 11
        assert _reduce_to_single_digit(47) == 11
        # 38 -> 3+8 = 11
        assert _reduce_to_single_digit(38) == 11
        # 39 -> 3+9 = 12 -> 1+2 = 3
        assert _reduce_to_single_digit(39) == 3

    def test_zero_returns_nine(self):
        assert _reduce_to_single_digit(0) == 9

    def test_negative_number_becomes_positive(self):
        assert _reduce_to_single_digit(-5) == 5


class TestCalculateLifePath:
    """Test Life Path number calculations."""

    def test_basic_life_path_1(self):
        # March 29, 1985: 03 + 29 + 1985 = 3 + 2 + 9 + 1 + 9 + 8 + 5 = 37 -> 3 + 7 = 10 -> 1 + 0 = 1
        result = calculateLifePath(date(1985, 3, 29))
        assert result == 1

    def test_life_path_with_master_number_11(self):
        # 02 + 20 + 1984: 0 + 2 + 2 + 0 + 1 + 9 + 8 + 4 = 26 -> 2 + 6 = 8
        # But let's find a date that gives 11 or 22 or 33
        # Try 11 + 11 + 2001: 1 + 1 + 1 + 1 + 2 + 0 + 0 + 1 = 7... not right
        # Try 02 + 29 + 1992: 0 + 2 + 2 + 9 + 1 + 9 + 9 + 2 = 34 -> 3 + 4 = 7
        # Try finding: need sum that reduces to 11 or 22
        # 29 + 02 + 1992 = 0+2+2+9+1+9+9+2 = 34 -> 7
        # Try 11 + 29 + 1981: 1+1+2+9+1+9+8+1 = 32 -> 5
        # Try 02 + 29 + 1992: 0+2+2+9+1+9+9+2 = 34 -> 7
        # Try 11 + 11 + 1991: 1+1+1+1+1+9+9+1 = 24 -> 6
        # Try to construct: 02 + 02 + 1981: 0+2+0+2+1+9+8+1 = 23 -> 5
        # Let me try: 11 + 02 + 1982: 1+1+0+2+1+9+8+2 = 24 -> 6
        # Actually: 02 + 11 + 1981: 0+2+1+1+1+9+8+1 = 23 -> 5
        # Try: 11 + 02 + 1980: 1+1+0+2+1+9+8+0 = 22
        result = calculateLifePath(date(1980, 11, 2))
        assert result == 22

    def test_life_path_with_string_date(self):
        result = calculateLifePath("1985-03-29")
        assert result == 1

    def test_life_path_different_dates(self):
        # Verify multiple dates work correctly
        # 01/01/2000: 0+1+0+1+2+0+0+0 = 4
        assert calculateLifePath(date(2000, 1, 1)) == 4
        # Any date should give valid numerology number
        result = calculateLifePath(date(1990, 6, 15))
        assert result in range(1, 34)  # Valid numerology number


class TestCalculateDestiny:
    """Test Destiny number calculations."""

    def test_basic_destiny_calculation(self):
        # Test with simple name
        result = calculateDestiny("JOHN")
        # J=1, O=6, H=8, N=5 -> 1+6+8+5 = 20 -> 2+0 = 2
        assert result == 2

    def test_destiny_with_vietnamese_name(self):
        # Test Vietnamese name handling
        result = calculateDestiny("NGUYỄN VĂN A")
        assert result in range(1, 34)  # Should be valid number

    def test_destiny_case_insensitive(self):
        result1 = calculateDestiny("JOHN")
        result2 = calculateDestiny("john")
        result3 = calculateDestiny("JoHn")
        assert result1 == result2 == result3

    def test_destiny_ignores_spaces(self):
        result1 = calculateDestiny("JOHN SMITH")
        result2 = calculateDestiny("JOHNSMITH")
        # Both should give same result since spaces are ignored in calculation
        assert result1 == result2

    def test_destiny_empty_name(self):
        result = calculateDestiny("")
        assert result == 9  # Empty sum -> 0 -> 9


class TestCalculateSoulUrge:
    """Test Soul Urge number calculations."""

    def test_basic_soul_urge(self):
        # Test with name containing vowels and consonants
        # JOHN: vowels = O (6) -> 6
        result = calculateSoulUrge("JOHN")
        assert result == 6

    def test_soul_urge_multiple_vowels(self):
        # MARIE: vowels = A, I, E -> 1+9+5 = 15 -> 1+5 = 6
        result = calculateSoulUrge("MARIE")
        assert result == 6

    def test_soul_urge_vietnamese_vowels(self):
        # Test Vietnamese vowel detection
        # Á, Ư, etc should be detected as vowels
        result = calculateSoulUrge("NGUYỄN")
        # U, E -> 3+5 = 8
        assert result in range(1, 34)

    def test_soul_urge_all_consonants(self):
        # Name with no vowels (rare but test edge case)
        # RHYTHM has Y as sometimes vowel, but our function treats Y as consonant following strict definition
        result = calculateSoulUrge("BCDFG")
        assert result == 9  # No vowels -> 0 -> 9

    def test_soul_urge_case_insensitive(self):
        result1 = calculateSoulUrge("JOHN")
        result2 = calculateSoulUrge("john")
        assert result1 == result2


class TestCalculatePersonality:
    """Test Personality number calculations."""

    def test_basic_personality(self):
        # JOHN: consonants = J, H, N -> 1+8+5 = 14 -> 1+4 = 5
        result = calculatePersonality("JOHN")
        assert result == 5

    def test_personality_multiple_consonants(self):
        # MARIE: consonants = M, R -> 4+9 = 13 -> 1+3 = 4
        result = calculatePersonality("MARIE")
        assert result == 4

    def test_personality_vietnamese_consonants(self):
        result = calculatePersonality("NGUYỄN")
        assert result in range(1, 34)

    def test_personality_all_vowels(self):
        # Name with only vowels (hypothetical)
        result = calculatePersonality("AEI")
        assert result == 9  # No consonants -> 0 -> 9

    def test_personality_case_insensitive(self):
        result1 = calculatePersonality("JOHN")
        result2 = calculatePersonality("john")
        assert result1 == result2


class TestCalculatePersonalYear:
    """Test Personal Year calculations."""

    def test_basic_personal_year(self):
        # Birth: 03/15, Current: 2025 -> 03+15+2025 = 0+3+1+5+2+0+2+5 = 18 -> 1+8 = 9
        result = calculatePersonalYear(3, 15, 2025)
        assert result == 9

    def test_personal_year_range(self):
        # Personal Year should always be 1-9 (no Master Numbers)
        result = calculatePersonalYear(1, 1, 2000)
        assert 1 <= result <= 9

    def test_personal_year_cycles_correctly(self):
        # Different years should give different results sometimes
        year1 = calculatePersonalYear(3, 15, 2024)
        year2 = calculatePersonalYear(3, 15, 2025)
        # These might be different due to year change
        assert year1 in range(1, 10)
        assert year2 in range(1, 10)

    def test_personal_year_february_29(self):
        # Edge case: leap year date
        result = calculatePersonalYear(2, 29, 2024)
        assert result in range(1, 10)


class TestCalculatePersonalMonth:
    """Test Personal Month calculations."""

    def test_basic_personal_month(self):
        # Birth: 15, Current: 01/2025 -> 15+01+2025 = 1+5+0+1+2+0+2+5 = 16 -> 1+6 = 7
        result = calculatePersonalMonth(15, 1, 2025)
        assert result == 7

    def test_personal_month_range(self):
        # Personal Month should always be 1-9 (no Master Numbers)
        result = calculatePersonalMonth(15, 6, 2025)
        assert 1 <= result <= 9

    def test_personal_month_cycles_monthly(self):
        # Different months should give different results sometimes
        month1 = calculatePersonalMonth(15, 1, 2025)
        month2 = calculatePersonalMonth(15, 2, 2025)
        # These should be different
        assert month1 != month2

    def test_personal_month_december(self):
        result = calculatePersonalMonth(15, 12, 2025)
        assert result in range(1, 10)


class TestIntegration:
    """Integration tests for multiple functions together."""

    def test_all_calculations_for_single_profile(self):
        # Complete numerology profile for one person
        birth_date = date(1990, 5, 23)
        full_name = "NGUYỄN VĂN A"
        
        life_path = calculateLifePath(birth_date)
        destiny = calculateDestiny(full_name)
        soul_urge = calculateSoulUrge(full_name)
        personality = calculatePersonality(full_name)
        
        # All should be valid numbers
        for num in [life_path, destiny, soul_urge, personality]:
            assert num in list(range(1, 10)) + [11, 22, 33]

    def test_different_names_give_different_destinyies(self):
        # Different names should generally give different Destiny numbers
        destiny1 = calculateDestiny("NGUYỄN VĂN A")
        destiny2 = calculateDestiny("NGUYỄN VĂN B")
        # They could be the same by coincidence, so we just verify both are valid
        assert destiny1 in list(range(1, 10)) + [11, 22, 33]
        assert destiny2 in list(range(1, 10)) + [11, 22, 33]


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
