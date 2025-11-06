from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    episodes = relationship("Episode", back_populates="user")


class Episode(Base):
    __tablename__ = "episodes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    success = Column(Boolean, nullable=False)
    fuel_used = Column(Float, nullable=False)
    landing_accuracy = Column(Float, nullable=False)
    trajectory_data = Column(JSON, nullable=True)  # Full state/action history
    
    user = relationship("User", back_populates="episodes")

