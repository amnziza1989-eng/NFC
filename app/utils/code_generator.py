"""Utility functions for the NFC Review Platform."""

import secrets
import string


def generate_card_code(length: int = 8) -> str:
    """Generate a random alphanumeric card code.

    Uses cryptographically secure random generation.
    Excludes ambiguous characters (0, O, I, l) for readability.

    Args:
        length: Length of the code. Default 8 chars provides ~40 bits of entropy.

    Returns:
        Random alphanumeric code like 'a3f7k9m2'.
    """
    # Alphabet excluding ambiguous characters for physical card readability
    alphabet = string.ascii_lowercase + string.digits
    alphabet = alphabet.replace("0", "").replace("o", "").replace("l", "")
    return "".join(secrets.choice(alphabet) for _ in range(length))
