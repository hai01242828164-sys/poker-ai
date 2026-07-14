from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from ..models.game_session import GameSession
from ..models.hand_history import HandHistory
from .deps import get_db
from ..schemas import GameSessionCreate, GameSessionResponse, HandHistoryCreate, HandHistoryResponse

router = APIRouter()

@router.post("/sessions/", response_model=GameSessionResponse)
def create_session(session_in: GameSessionCreate, db: Session = Depends(get_db)):
    """Khởi tạo một Game Session mới"""
    new_session = GameSession(**session_in.model_dump())
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.post("/hands/", response_model=HandHistoryResponse)
def record_hand(hand_in: HandHistoryCreate, db: Session = Depends(get_db)):
    """Ghi nhận diễn biến của một ván bài vào HandHistory"""
    new_hand = HandHistory(**hand_in.model_dump())
    db.add(new_hand)
    db.commit()
    db.refresh(new_hand)
    return new_hand
