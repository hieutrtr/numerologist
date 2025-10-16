"""Numerology calculation engine setup"""

from setuptools import setup, find_packages

setup(
    name="numerologist-numerology",
    version="1.0.0",
    description="Pure Pythagorean numerology calculation engine for Numeroly",
    author="Numeroly Team",
    author_email="dev@numeroly.app",
    packages=find_packages(),
    python_requires=">=3.11",
    install_requires=[],
    extras_require={
        "dev": [
            "pytest>=7.4.3",
            "mypy>=1.7.1",
            "black>=23.12.0",
        ]
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.11",
    ],
)
