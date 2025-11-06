from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from app.database import get_db
from app.models import Episode
from app.auth import verify_token
from pydantic import BaseModel
import logging

router = APIRouter(prefix="/episodes", tags=["episodes"])
logger = logging.getLogger(__name__)


class EpisodeResponse(BaseModel):
    id: int
    timestamp: datetime
    success: bool
    fuel_used: float
    landing_accuracy: float
    
    class Config:
        from_attributes = True


@router.get("", response_model=List[EpisodeResponse])
async def get_episodes(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Get all episodes for the authenticated user"""
    # Log received authorization header
    if authorization:
        auth_preview = authorization[:20] + "..." if len(authorization) > 20 else authorization
        logger.info(f"Received Authorization header: {auth_preview}")
    else:
        logger.warning("No Authorization header received")
    
    # Extract token from Authorization header
    if not authorization:
        logger.warning("Missing Authorization header")
        raise HTTPException(status_code=401, detail="Missing authorization header")
    
    if not authorization.startswith("Bearer "):
        logger.warning(f"Invalid authorization header format. Header: {authorization[:50]}...")
        raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected 'Bearer <token>'")
    
    token = authorization.split(" ")[1]
    logger.debug(f"Extracted token from header. Token preview: {token[:10]}...{token[-10:]}")
    
    payload = verify_token(token)
    if not payload:
        logger.warning("Token verification failed in get_episodes")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = payload.get("sub")
    if not user_id:
        logger.warning(f"Token payload missing 'sub' field. Payload keys: {payload.keys()}")
        raise HTTPException(status_code=401, detail="Invalid token: missing user ID")
    
    logger.info(f"Fetching episodes for user_id: {user_id}")
    
    # Query episodes for user
    episodes = db.query(Episode).filter(Episode.user_id == user_id).order_by(Episode.timestamp.desc()).all()
    logger.info(f"Found {len(episodes)} episodes for user_id: {user_id}")
    
    return episodes

