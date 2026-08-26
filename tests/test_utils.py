"""Tests for utility functions."""

import pytest
from app.utils.code_generator import generate_card_code


def test_code_length():
    """Default code length is 8."""
    code = generate_card_code()
    assert len(code) == 8


def test_code_custom_length():
    """Custom length works."""
    code = generate_card_code(length=12)
    assert len(code) == 12


def test_code_uniqueness():
    """Generated codes should be unique (statistical test)."""
    codes = {generate_card_code() for _ in range(1000)}
    assert len(codes) == 1000


def test_code_no_ambiguous_chars():
    """Codes should not contain ambiguous characters."""
    for _ in range(100):
        code = generate_card_code()
        assert "0" not in code
        assert "o" not in code
        assert "l" not in code


def test_code_alphanumeric():
    """Codes should be lowercase alphanumeric."""
    for _ in range(100):
        code = generate_card_code()
        assert code.isalnum()
        assert code == code.lower()
