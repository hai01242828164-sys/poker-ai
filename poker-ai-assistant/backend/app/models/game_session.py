import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime
from sqlalchemy.orm import relationship
from .base import Base, UUID

class GameSession(Base):
    __tablename__ = 'game_sessions'

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    table_format = Column(String, nullable=False)
    hero_position = Column(String, nullable=False)
    small_blind = Column(Float, nullable=False)
    big_blind = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    hand_histories = relationship("HandHistory", back_populates="session", cascade="all, delete-orphan")
