from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy.orm import Session
from typing import Optional
import re
from app.database import get_db
from app.models import User
from app.auth import create_access_token, verify_token
from app.utils.password import hash_password, verify_password
from datetime import datetime
from jose import jwt

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """
        Validate password meets security requirements:
        - At least 8 characters
        - One uppercase letter
        - One lowercase letter
        - One number
        - One special character
        """
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Regex pattern: at least one uppercase, one lowercase, one digit, one special char
        pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$'
        if not re.match(pattern, v):
            raise ValueError(
                'Password must contain at least one uppercase letter, '
                'one lowercase letter, one number, and one special character (@$!%*?&)'
            )
        
        return v


class SigninRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    token: str

class UserCreatedResponse(BaseModel):
    user_id: int

class DebugTokenRequest(BaseModel):
    token: str

class DebugTokenResponse(BaseModel):
    valid: bool
    reason: Optional[str] = None
    payload: Optional[dict] = None
    decoded_without_verification: Optional[dict] = None

class UserResponse(BaseModel):
    id: int
    email: str


@router.post("/signup", response_model=UserCreatedResponse)
async def signup(request: SignupRequest, db: Session = Depends(get_db)):
    """Create a new user account with email and password"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash the password
    password_hash_str = hash_password(request.password)
    
    # Create new user
    user = User(email=request.email, password_hash=password_hash_str)
    db.add(user)
    db.commit()
    db.refresh(user)

    return UserCreatedResponse(user_id=user.id)


@router.post("/signin", response_model=TokenResponse)
async def signin(request: SigninRequest, db: Session = Depends(get_db)):
    """Sign in with email and password"""
    # Check if user exists
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token
    access_token = create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    
    return TokenResponse(token=access_token)


@router.get("/user", response_model=UserResponse)
async def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    """Get current user information from JWT token"""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>" format
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = authorization[7:]  # Remove "Bearer " prefix
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    # Get user from database
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user_id = int(user_id)  # Convert string to int
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(id=user.id, email=user.email)


@router.post("/debug-token", response_model=DebugTokenResponse)
async def debug_token(request: DebugTokenRequest):
    """Debug endpoint to validate and inspect JWT tokens"""
    token = request.token
    
    if not token:
        return DebugTokenResponse(valid=False, reason="Token is empty")
    
    # Try to verify token properly
    payload = verify_token(token)
    if payload:
        return DebugTokenResponse(
            valid=True,
            reason="Token is valid",
            payload=payload
        )
    
    # If verification failed, try to decode without verification to see what's wrong
    try:
        decoded = jwt.decode(token, options={"verify_signature": False})
        exp = decoded.get("exp")
        if exp:
            exp_datetime = datetime.fromtimestamp(exp)
            now = datetime.utcnow()
            if exp_datetime < now:
                return DebugTokenResponse(
                    valid=False,
                    reason=f"Token expired on {exp_datetime} (current time: {now})",
                    decoded_without_verification=decoded
                )
        
        return DebugTokenResponse(
            valid=False,
            reason="Token failed verification (likely invalid signature or wrong secret key)",
            decoded_without_verification=decoded
        )
    except jwt.DecodeError as e:
        return DebugTokenResponse(
            valid=False,
            reason=f"Token decode error: {str(e)}"
        )
    except Exception as e:
        return DebugTokenResponse(
            valid=False,
            reason=f"Unexpected error: {type(e).__name__}: {str(e)}"
        )

