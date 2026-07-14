import pytest
import sys
import os

# Định tuyến import thư viện từ thư mục cha
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.pattern_analyzer import predict_opponent_range

def test_ai_predict_polarized_range_on_long_think_and_raise():
    """
    Test Case: Xác minh AI dự đoán đúng Polarized Range khi đối thủ 
    có tiền sử Bluff (bluff_frequency > 0.3) và hành động hiện tại 
    là 'Suy nghĩ lâu' + 'Raise'.
    """
    
    # 1. Giả lập trọng số (Pattern Weights) đã được Model huấn luyện và trích xuất
    test_pattern_weights = {
        "bluff_frequency": 0.35, # Vượt mốc 0.3, cho thấy Player này hay Bluff
        "aggression_factor": 1.5
    }
    
    # 2. Giả lập hành động đầu vào (Input Actions) của ván đang chơi
    current_actions = [
        {
            "player_id": "Villain_01", 
            "action": "Raise", 
            "timing_tell": "Suy nghĩ lâu", 
            "sizing": "All-in"
        }
    ]
    
    # 3. Chạy hàm dự đoán của Core Engine
    predicted_range = predict_opponent_range(current_actions, test_pattern_weights)
    
    # 4. Kiểm chứng (Assert) kết quả
    assert "Polarized Range" in predicted_range
    assert "Bluff" in predicted_range
    print(f"Test Pass! Kết quả dự đoán: {predicted_range}")

if __name__ == "__main__":
    pytest.main([__file__])
