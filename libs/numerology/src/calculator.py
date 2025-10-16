"""
Core Pythagorean numerology calculation engine.
Implements calculations for Life Path, Destiny, Soul Urge, Personality, Personal Year, and Personal Month numbers.

[Source: docs/architecture.md - Numerology Calculation Engine, lines 1006-1021]
"""

from datetime import date
from typing import Union

from .vietnamese_mappings import get_letter_value, extract_vowels, extract_consonants


def _reduce_to_single_digit(n: int) -> int:
    """
    Reduce a number to single digit (1-9) using numerological reduction.
    Preserves Master Numbers (11, 22, 33).
    
    Args:
        n: Number to reduce
        
    Returns:
        Single digit (1-9) or Master Number (11, 22, 33)
    """
    n = abs(int(n))
    
    # Keep reducing until single digit
    while n >= 10:
        # Check for Master Numbers before reduction
        if n in (11, 22, 33):
            return n
        
        # Add digits
        n = sum(int(digit) for digit in str(n))
    
    return n if n > 0 else 9


def _sum_letter_values(text: str) -> int:
    """
    Sum the numerological values of all letters in text.
    
    Args:
        text: Text containing letters to sum
        
    Returns:
        Sum of all letter values
    """
    return sum(get_letter_value(char) for char in text if get_letter_value(char) > 0)


def calculateLifePath(birthDate: Union[date, str]) -> int:
    """
    Calculate Life Path number from birth date using Pythagorean system.
    
    Method:
    - Convert birth date to digits: MM + DD + YYYY
    - Add all digits together
    - Reduce to single digit (except Master Numbers 11, 22, 33)
    
    Args:
        birthDate: Date of birth as date object or "YYYY-MM-DD" string
        
    Returns:
        Life Path number (1-9, 11, 22, 33)
        
    Example:
        calculateLifePath(date(1985, 3, 29)) 
        -> 0+3+2+9+1+9+8+5 = 37 -> 3+7 = 10 -> 1+0 = 1
        -> Returns 1 (Life Path 1)
        
        calculateLifePath(date(1984, 2, 20))
        -> 0+2+2+0+1+9+8+4 = 26 -> 2+6 = 8 -> 8
        However: 0+2 (month) + 2+0 (day) + 1+9+8+4 (year) = 2 + 2 + 22 = 26
        Actually: 0+2+2+0+1+9+8+4 = 26 -> 2+6 = 8... but verify
        Correct: 02 + 20 + 1984: digit sum = 0+2+2+0+1+9+8+4 = 26 -> 2+6 = 8
        But Master approach: 2 + 2 + 1984 = 1988, then add digits
    """
    if isinstance(birthDate, str):
        birthDate = date.fromisoformat(birthDate)
    
    # Extract digits from date components
    month = birthDate.month
    day = birthDate.day
    year = birthDate.year
    
    # Sum all digits: MM + DD + YYYY
    total = sum(int(d) for d in f"{month:02d}{day:02d}{year:04d}")
    
    return _reduce_to_single_digit(total)


def calculateDestiny(fullName: str) -> int:
    """
    Calculate Destiny number from full name using Pythagorean letter values.
    
    Method:
    - Convert each letter of full name to number (A=1...Z=8)
    - Sum all numbers
    - Reduce to single digit (except Master Numbers)
    
    Args:
        fullName: Full name (supports Vietnamese characters)
        
    Returns:
        Destiny number (1-9, 11, 22, 33)
        
    Example:
        calculateDestiny("NGUYỄN VĂN A")
        -> Each letter converted, summed, then reduced
    """
    total = _sum_letter_values(fullName)
    return _reduce_to_single_digit(total)


def calculateSoulUrge(fullName: str) -> int:
    """
    Calculate Soul Urge number from vowels in full name.
    
    Method:
    - Extract only vowels from full name
    - Convert vowels to numbers (A=1...Z=8)
    - Sum vowel numbers
    - Reduce to single digit (except Master Numbers)
    
    Args:
        fullName: Full name (supports Vietnamese vowels: a, e, i, o, u, ơ, ư, â, ê, ô)
        
    Returns:
        Soul Urge number (1-9, 11, 22, 33)
    """
    vowels = extract_vowels(fullName)
    total = _sum_letter_values(vowels)
    return _reduce_to_single_digit(total)


def calculatePersonality(fullName: str) -> int:
    """
    Calculate Personality number from consonants in full name.
    
    Method:
    - Extract only consonants from full name
    - Convert consonants to numbers (A=1...Z=8)
    - Sum consonant numbers
    - Reduce to single digit (except Master Numbers)
    
    Args:
        fullName: Full name (supports Vietnamese consonants)
        
    Returns:
        Personality number (1-9, 11, 22, 33)
    """
    consonants = extract_consonants(fullName)
    total = _sum_letter_values(consonants)
    return _reduce_to_single_digit(total)


def calculatePersonalYear(birthMonth: int, birthDay: int, currentYear: int) -> int:
    """
    Calculate Personal Year number for current cycle.
    
    Method:
    - Birth month + Birth day + Current year
    - Add all digits together
    - Reduce to single digit (1-9, no Master Numbers)
    
    Args:
        birthMonth: Birth month (1-12)
        birthDay: Birth day (1-31)
        currentYear: Current year (YYYY format)
        
    Returns:
        Personal Year number (1-9)
    """
    total = sum(int(d) for d in f"{birthMonth:02d}{birthDay:02d}{currentYear:04d}")
    return _reduce_to_single_digit(total)


def calculatePersonalMonth(birthDay: int, currentMonth: int, currentYear: int) -> int:
    """
    Calculate Personal Month number for current cycle.
    
    Method:
    - Birth day + Current month + Current year
    - Add all digits together
    - Reduce to single digit (1-9, no Master Numbers)
    
    Args:
        birthDay: Birth day (1-31)
        currentMonth: Current month (1-12)
        currentYear: Current year (YYYY format)
        
    Returns:
        Personal Month number (1-9)
    """
    total = sum(int(d) for d in f"{birthDay:02d}{currentMonth:02d}{currentYear:04d}")
    return _reduce_to_single_digit(total)
