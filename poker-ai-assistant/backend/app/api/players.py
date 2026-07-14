from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from ..models.hand_history import HandHistory
from .deps import get_db

router = APIRouter()

@router.get("/{player_id}/history_patterns")
def get_player_history_patterns(player_id: UUID, db: Session = Depends(get_db)):
    """
    Truy xuất lịch sử actions và showdown của một player.
    (Đã được điều chỉnh lọc bằng Python để tương thích với SQLite)
    """
    all_hands = db.query(HandHistory).all()
    
    patterns = []
    for hand in all_hands:
        player_actions = [act for act in hand.actions_log if act.get("player_id") == str(player_id)]
        
        if player_actions:
            player_showdown = next((sd for sd in hand.showdown_ground_truth if sd.get("player_id") == str(player_id)), None)

            patterns.append({
                "hand_id": hand.id,
                "community_cards": hand.community_cards,
                "actions": player_actions,
                "showdown": player_showdown
            })
        
    return {"player_id": player_id, "history_patterns": patterns}
