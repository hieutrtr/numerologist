"""
Vietnamese character mappings for numerology calculations.
Handles letter-to-number mapping and vowel/consonant detection for Vietnamese text.
"""

import unicodedata
from typing import Set

# Pythagorean letter-to-number mapping: A=1, B=2, ... I=9, J=1, K=2, ...
# Pattern: N = ((letter_position - 1) % 9) + 1
LETTER_TO_NUMBER = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 1, 'K': 2, 'L': 3, 'M': 4, 'N': 5, 'O': 6, 'P': 7, 'Q': 8, 'R': 9,
    'S': 1, 'T': 2, 'U': 3, 'V': 4, 'W': 5, 'X': 6, 'Y': 7, 'Z': 8,
}

# Vietnamese vowels (basic + with diacritical marks)
VIETNAMESE_VOWELS: Set[str] = {
    # Basic vowels
    'a', 'e', 'i', 'o', 'u', 'ơ', 'ư', 'â', 'ê', 'ô', 'ơ', 'ư',
    # With tone marks (á, à, ả, ã, ạ, etc.)
    'á', 'à', 'ả', 'ã', 'ạ',  # a with tone marks
    'é', 'è', 'ẻ', 'ẽ', 'ẹ',  # e with tone marks
    'í', 'ì', 'ỉ', 'ĩ', 'ị',  # i with tone marks
    'ó', 'ò', 'ỏ', 'õ', 'ọ',  # o with tone marks
    'ú', 'ù', 'ủ', 'ũ', 'ụ',  # u with tone marks
    'ý', 'ỳ', 'ỷ', 'ỹ', 'ỵ',  # y with tone marks
    # â with tone marks
    'â', 'ấ', 'ầ', 'ẩ', 'ẫ', 'ậ',
    # ê with tone marks
    'ê', 'ế', 'ề', 'ể', 'ễ', 'ệ',
    # ô with tone marks
    'ô', 'ố', 'ồ', 'ổ', 'ỗ', 'ộ',
    # ơ with tone marks
    'ơ', 'ớ', 'ờ', 'ở', 'ỡ', 'ợ',
    # ư with tone marks
    'ư', 'ứ', 'ừ', 'ử', 'ữ', 'ự',
}


def normalize_vietnamese(text: str) -> str:
    """
    Normalize Vietnamese text by decomposing diacritical marks.
    This ensures consistent handling of Vietnamese characters with tone marks.
    
    Args:
        text: Vietnamese text to normalize
        
    Returns:
        Normalized text with consistent character representation
    """
    return unicodedata.normalize('NFD', text)


def get_letter_value(letter: str) -> int:
    """
    Get the numerological value (1-9) for a letter using Pythagorean system.
    
    Args:
        letter: Single letter (case-insensitive)
        
    Returns:
        Numerological value 1-9, or 0 if not a letter
        
    Example:
        get_letter_value('A') -> 1
        get_letter_value('j') -> 1
        get_letter_value('Z') -> 8
    """
    normalized = normalize_vietnamese(letter.upper())
    # Remove diacritical marks by taking base character only
    if normalized and normalized[0] in LETTER_TO_NUMBER:
        return LETTER_TO_NUMBER[normalized[0]]
    
    # Fallback: try the uppercase version directly
    letter_upper = letter.upper()
    if letter_upper in LETTER_TO_NUMBER:
        return LETTER_TO_NUMBER[letter_upper]
    
    return 0


def is_vowel(letter: str) -> bool:
    """
    Check if a letter is a vowel (Vietnamese vowels including diacritical variants).
    
    Args:
        letter: Single letter (case-insensitive)
        
    Returns:
        True if the letter is a vowel, False otherwise
        
    Example:
        is_vowel('a') -> True
        is_vowel('á') -> True  # Vietnamese 'a' with tone mark
        is_vowel('b') -> False
    """
    normalized = normalize_vietnamese(letter.lower())
    if not normalized:
        return False
    
    # Check if base character is a vowel
    base_char = normalized[0]
    return base_char in VIETNAMESE_VOWELS


def is_consonant(letter: str) -> bool:
    """
    Check if a letter is a consonant.
    
    Args:
        letter: Single letter (case-insensitive)
        
    Returns:
        True if the letter is a consonant (not vowel, not digit), False otherwise
    """
    if not letter.isalpha():
        return False
    return not is_vowel(letter)


def extract_letters_only(text: str) -> str:
    """
    Extract only alphabetic characters from text, removing spaces and special characters.
    
    Args:
        text: Text to process
        
    Returns:
        Text containing only alphabetic characters
    """
    return ''.join(char for char in text if char.isalpha())


def extract_vowels(text: str) -> str:
    """
    Extract vowels from text.
    
    Args:
        text: Text to process
        
    Returns:
        String containing only vowels from the input text
    """
    return ''.join(char for char in text if is_vowel(char))


def extract_consonants(text: str) -> str:
    """
    Extract consonants from text.
    
    Args:
        text: Text to process
        
    Returns:
        String containing only consonants from the input text
    """
    return ''.join(char for char in text if is_consonant(char))
