"""Pythagorean numerology calculation core."""

from datetime import date
from typing import Union


def reduce_to_single_digit(num: int) -> int:
    """
    Reduce a number to a single digit using Pythagorean method.

    Master numbers (11, 22, 33) are preserved.

    Args:
        num: Number to reduce

    Returns:
        Reduced number (1-9 or master numbers 11, 22, 33)
    """
    num = abs(num)

    # Master numbers
    if num == 11 or num == 22 or num == 33:
        return num

    # Reduce until single digit
    while num >= 10:
        num = sum(int(digit) for digit in str(num))

    # Check if result is master number after reduction
    if num == 11 or num == 22 or num == 33:
        return num

    return num if num > 0 else 1


def calculate_life_path(birth_date: Union[date, str]) -> int:
    """
    Calculate Life Path number from birth date.

    Uses Pythagorean method: reduce month + day + year separately, then reduce result.

    Args:
        birth_date: Birth date as date object or string (YYYY-MM-DD)

    Returns:
        Life Path number (1-9 or 11, 22, 33)
    """
    if isinstance(birth_date, str):
        birth_date = date.fromisoformat(birth_date)

    month = birth_date.month
    day = birth_date.day
    year = birth_date.year

    # Sum month, day, year
    total = month + day + year

    return reduce_to_single_digit(total)


def _get_letter_value(letter: str) -> int:
    """Get numeric value of a letter (A=1, B=2, ..., Z=26)."""
    letter = letter.upper()
    if not letter.isalpha():
        return 0
    return ord(letter) - ord('A') + 1


def calculate_destiny(full_name: str) -> int:
    """
    Calculate Destiny number from full name.

    Uses sum of all letters in full name, reduced to single digit.

    Args:
        full_name: Full name of person

    Returns:
        Destiny number (1-9 or 11, 22, 33)
    """
    total = sum(_get_letter_value(letter) for letter in full_name)
    return reduce_to_single_digit(total)


def calculate_soul_urge(full_name: str) -> int:
    """
    Calculate Soul Urge number from vowels in full name.

    Uses sum of vowels only, reduced to single digit.

    Args:
        full_name: Full name of person

    Returns:
        Soul Urge number (1-9 or 11, 22, 33)
    """
    vowels = "AEIOUaeiou"
    total = sum(_get_letter_value(letter) for letter in full_name if letter in vowels)
    return reduce_to_single_digit(total) if total > 0 else 9


def calculate_personality(full_name: str) -> int:
    """
    Calculate Personality number from consonants in full name.

    Uses sum of consonants only, reduced to single digit.

    Args:
        full_name: Full name of person

    Returns:
        Personality number (1-9 or 11, 22, 33)
    """
    consonants = "BCDFGHJKLMNPQRSTVWXYZbcdfghjklmnpqrstvwxyz"
    total = sum(_get_letter_value(letter) for letter in full_name if letter in consonants)
    return reduce_to_single_digit(total) if total > 0 else 9


def calculate_personal_year(birth_date: Union[date, str], current_year: int) -> int:
    """
    Calculate Personal Year number.

    Uses birth month + birth day + current year, reduced to single digit.

    Args:
        birth_date: Birth date as date object or string (YYYY-MM-DD)
        current_year: The year to calculate for

    Returns:
        Personal Year number (1-9)
    """
    if isinstance(birth_date, str):
        birth_date = date.fromisoformat(birth_date)

    month = birth_date.month
    day = birth_date.day

    total = month + day + current_year

    return reduce_to_single_digit(total)


def calculate_personal_month(
    birth_date: Union[date, str],
    current_year: int,
    current_month: int,
) -> int:
    """
    Calculate Personal Month number.

    Uses Personal Year + current month, reduced to single digit.

    Args:
        birth_date: Birth date as date object or string (YYYY-MM-DD)
        current_year: The year
        current_month: The month (1-12)

    Returns:
        Personal Month number (1-9)
    """
    personal_year = calculate_personal_year(birth_date, current_year)
    total = personal_year + current_month

    return reduce_to_single_digit(total)
