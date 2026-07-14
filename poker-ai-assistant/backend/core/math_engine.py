from typing import Optional

def calculate_pot_odds(pot_size: float, call_amount: float) -> float:
    """
    Tính toán tỷ lệ Pot Odds để quyết định xem có nên Call hay không.
    
    Công thức: Pot Odds = số tiền phải Call / (kích thước Pot hiện tại + số tiền phải Call)
    
    Args:
        pot_size (float): Kích thước pot hiện tại (trước khi Hero call).
        call_amount (float): Số tiền Hero cần phải call.
        
    Returns:
        float: Tỷ lệ phần trăm Pot Odds (ví dụ: 0.25 tương đương 25%). Trả về 0.0 nếu không cần call.
    """
    if pot_size + call_amount == 0:
        return 0.0
    return call_amount / (pot_size + call_amount)

def monte_carlo_win_rate_stub(hero_cards: str, community_cards: Optional[str] = None, num_simulations: int = 1000) -> float:
    """
    [STUB/MOCK] Khởi tạo bộ khung tính toán tỷ lệ thắng (Win Rate) bằng mô phỏng Monte Carlo.
    
    Hàm này không gọi Database. Chức năng tương lai: 
    Sinh ra ngẫu nhiên các lá bài còn thiếu trong bộ bài 52 lá, so sánh sức mạnh bài (Hand Strength) 
    giữa Hero và các Range dự đoán của đối thủ trong `num_simulations` lần lặp.
    
    Args:
        hero_cards (str): Bài của Hero (ví dụ: "AsKh").
        community_cards (Optional[str]): Các lá bài chung hiện có trên bàn (Flop, Turn, River).
        num_simulations (int): Số lượng ván bài mô phỏng. Default: 1000 (cân bằng tốc độ và độ chính xác).
        
    Returns:
        float: Tỷ lệ thắng ước tính (từ 0.0 đến 1.0).
    """
    # Dữ liệu Mock tạm thời để Frontend có thể lấy kết quả thiết kế UI
    if community_cards:
        # Nếu đã có bài chung (Post-flop), ta trả về win rate ngẫu nhiên hoặc cố định
        return 0.65  # Win rate 65%
    return 0.50      # Pre-flop, chưa có thông tin, tỷ lệ thắng mặc định 50%
