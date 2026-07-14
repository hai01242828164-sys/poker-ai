from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from uuid import UUID

class GameSessionCreate(BaseModel):
    table_format: str
    hero_position: str
    small_blind: float
    big_blind: float

class GameSessionResponse(GameSessionCreate):
    id: UUID

    class Config:
        orm_mode = True
        from_attributes = True

class HandHistoryCreate(BaseModel):
    session_id: UUID
    hero_cards: Optional[str] = None
    community_cards: Optional[str] = None
    actions_log: List[Dict[str, Any]] = []
    showdown_ground_truth: List[Dict[str, Any]] = []

class HandHistoryResponse(HandHistoryCreate):
    id: UUID

    class Config:
        orm_mode = True
        from_attributes = True
