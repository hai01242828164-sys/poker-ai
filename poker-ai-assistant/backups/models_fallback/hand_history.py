import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from .base import Base

class HandHistory(Base):
    __tablename__ = 'hand_histories'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey('game_sessions.id'), nullable=False)
    hero_cards = Column(String, nullable=True)
    community_cards = Column(String, nullable=True)
    actions_log = Column(JSONB, default=list) # Mảng actions của ván bài
    showdown_ground_truth = Column(JSONB, default=list) # Mảng thông tin bài lộ
    created_at = Column(DateTime, default=datetime.utcnow)

    # Quan hệ Many-to-1 về GameSession
    session = relationship("GameSession", back_populates="hand_histories")
