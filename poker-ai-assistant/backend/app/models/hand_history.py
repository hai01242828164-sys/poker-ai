import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .base import Base, UUID, JSONB

class HandHistory(Base):
    __tablename__ = 'hand_histories'

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID, ForeignKey('game_sessions.id'), nullable=False)
    hero_cards = Column(String, nullable=True)
    community_cards = Column(String, nullable=True)
    actions_log = Column(JSONB, default=list)
    showdown_ground_truth = Column(JSONB, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("GameSession", back_populates="hand_histories")
