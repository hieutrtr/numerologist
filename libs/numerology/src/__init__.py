"""Numerologist - Pure Pythagorean numerology calculation engine."""

from .calculator import (
    calculate_life_path,
    calculate_destiny,
    calculate_soul_urge,
    calculate_personality,
    calculate_personal_year,
    calculate_personal_month,
    reduce_to_single_digit,
)

__version__ = "1.0.0"
__all__ = [
    "calculate_life_path",
    "calculate_destiny",
    "calculate_soul_urge",
    "calculate_personality",
    "calculate_personal_year",
    "calculate_personal_month",
    "reduce_to_single_digit",
]
