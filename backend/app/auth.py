from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import logging
import os

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_DAYS = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_DAYS", "7"))

logger = logging.getLogger(__name__)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> Optional[dict]:
    """Verify and decode a JWT token"""
    if not token:
        logger.warning("Token verification failed: token is None or empty")
        return None
    
    # Log token preview (first 10 and last 10 chars for security)
    token_preview = f"{token[:10]}...{token[-10:]}" if len(token) > 20 else token[:10]
    logger.debug(f"Verifying token: {token_preview}")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(f"Token verified successfully. User ID: {payload.get('sub')}, Email: {payload.get('email')}")
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning(f"Token verification failed: Token has expired. Token preview: {token_preview}")
        return None
    except jwt.DecodeError as e:
        logger.warning(f"Token verification failed: Decode error - {str(e)}. Token preview: {token_preview}")
        return None
    except JWTError as e:
        logger.warning(f"Token verification failed: JWT error - {type(e).__name__}: {str(e)}. Token preview: {token_preview}")
        return None
    except Exception as e:
        logger.error(f"Token verification failed: Unexpected error - {type(e).__name__}: {str(e)}. Token preview: {token_preview}")
        return None


def get_user_id_from_token(token: str) -> Optional[int]:
    """Extract user ID from JWT token"""
    payload = verify_token(token)
    if payload:
        user_id = payload.get("sub")
        return int(user_id) if user_id else None
    return None

