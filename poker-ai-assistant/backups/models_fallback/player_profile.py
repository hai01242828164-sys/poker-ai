import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from .base import Base

class PlayerProfile(Base):
    __tablename__ = 'player_profiles'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nickname = Column(String, nullable=False)
    vpip = Column(Float, default=0.0)
    pfr = Column(Float, default=0.0)
    pattern_weights = Column(JSONB, default=dict) # Trọng số ML dạng JSON
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
