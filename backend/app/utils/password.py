"""Password hashing and verification utilities using Argon2."""

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

# Initialize Argon2 password hasher with secure defaults
ph = PasswordHasher()


def hash_password(password: str) -> str:
    """
    Hash a plain text password using Argon2.
    
    Args:
        password: The plain text password to hash
        
    Returns:
        The hashed password string
    """
    return ph.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain text password against a hashed password.
    
    Args:
        plain_password: The plain text password to verify
        hashed_password: The hashed password to compare against
        
    Returns:
        True if the password matches, False otherwise
    """
    try:
        ph.verify(hashed_password, plain_password)
        return True
    except VerifyMismatchError:
        return False

