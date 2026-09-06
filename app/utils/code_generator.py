"""Utility functions for the NFC Review Platform."""

import secrets
import string
from datetime import datetime, timezone


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


def generate_order_number() -> str:
    """Generate a human-readable order number.

    Format: ORD-YYYYMMDD-XXXX (e.g. ORD-20260828-A7K2)
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace("0", "").replace("O", "").replace("I", "")
    random_part = "".join(secrets.choice(chars) for _ in range(4))
    return f"ORD-{date_str}-{random_part}"


def generate_shop_order_number() -> str:
    """Generate a human-readable customer shop order number.

    Format: SHOP-YYYYMMDD-XXXX (e.g. SHOP-20260828-B4R9)
    """
    date_str = datetime.now(timezone.utc).strftime("%Y%m%d")
    chars = string.ascii_uppercase + string.digits
    chars = chars.replace("0", "").replace("O", "").replace("I", "")
    random_part = "".join(secrets.choice(chars) for _ in range(4))
    return f"SHOP-{date_str}-{random_part}"

