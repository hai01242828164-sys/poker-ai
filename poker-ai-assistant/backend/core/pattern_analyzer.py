from typing import List, Dict, Any

def extract_behavioral_patterns(history_data: List[Dict[str, Any]]) -> Dict[str, float]:
    """
    Phân tích dữ liệu JSONB (lịch sử các ván bài) để trích xuất các trọng số hành vi (pattern weights).
    Hàm này độc lập hoàn toàn với Database, đóng vai trò như một Data Transformer & Feature Extractor 
    trong quy trình Học máy có giám sát.
    
    Args:
        history_data (List[Dict[str, Any]]): Mảng chứa lịch sử các actions và showdown của đối thủ 
            được API truy xuất và truyền vào.
            Định dạng: [{"hand_id": ..., "community_cards": ..., "actions": [...], "showdown": {...}}, ...]
            
    Returns:
        Dict[str, float]: Từ điển chứa các trọng số hành vi đã được chuẩn hóa.
    """
    # Khởi tạo ma trận trọng số cơ bản
    patterns = {
        "bluff_frequency": 0.0,
        "aggression_factor": 0.0,
        "fast_play_strong_hand": 0.0
    }
    
    total_hands = len(history_data)
    if total_hands == 0:
        return patterns

    # [STUB LOGIC - AI FEATURE EXTRACTION] 
    # Thuật toán thực tế sẽ duyệt qua từng hand, đối chiếu (Mapping) giữa chuỗi hành động 
    # (ví dụ: Call ở Flop, Raise ở Turn) với kết quả bài lộ ở showdown.
    # Nếu đối thủ thường xuyên có hành vi "Suy nghĩ lâu" (Timing) + "Bet 2/3 Pot" (Sizing) 
    # nhưng cuối cùng lại Showdown bài yếu (Air), AI sẽ tăng trọng số "bluff_frequency".
    
    # Dữ liệu Mock để test Frontend
    patterns["bluff_frequency"] = 0.25
    patterns["aggression_factor"] = 1.2
    return patterns

def predict_opponent_range(current_actions: List[Dict[str, Any]], pattern_weights: Dict[str, float]) -> str:
    """
    [PATTERN RECOGNITION] Dự đoán dải bài (Hand Range) hiện tại của đối thủ.
    
    Thuật toán sẽ đối chiếu chuỗi hành động (Action Sequence) kết hợp với các chỉ số Timing/Sizing 
    hiện tại của ván bài với ma trận `pattern_weights` lịch sử để đưa ra dự đoán.
    
    Args:
        current_actions (List[Dict[str, Any]]): Các hành động của đối thủ trong ván bài hiện tại.
        pattern_weights (Dict[str, float]): Hồ sơ trọng số của đối thủ này (đã được tính từ hàm trên).
        
    Returns:
        str: Chuỗi nhãn biểu diễn dải bài ước tính (Ví dụ: "Top 15%", "Any Two Cards", "Polarized").
    """
    if not current_actions:
        return "Unknown Range"
        
    latest_action = current_actions[-1]
    action_type = latest_action.get("action")
    timing = latest_action.get("timing_tell")
    
    # Cây quyết định AI đơn giản (Decision Tree Mock):
    if action_type == "Raise" and timing == "Suy nghĩ lâu":
        if pattern_weights.get("bluff_frequency", 0.0) > 0.3:
            return "Polarized Range (Nuts or Air) - Cẩn thận Bluff"
        else:
            return "Premium Hands (Value) - Bài mạnh"
            
    if action_type == "Call" and timing == "Quyết định ngay":
        return "Drawing Hands / Mid-pair (Đang mua bài hoặc bài trung bình)"
        
    return "Standard Range (Top 25%)"
