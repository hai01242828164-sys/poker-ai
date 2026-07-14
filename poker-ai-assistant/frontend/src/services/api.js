const API_BASE_URL = 'http://127.0.0.1:8000/api';

export const startSession = async (sessionData) => {
    const response = await fetch(`${API_BASE_URL}/game/sessions/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
    });
    return response.json();
};

export const sendAction = async (handData) => {
    // Ghi nhận diễn biến 1 ván bài vào DB
    const response = await fetch(`${API_BASE_URL}/game/hands/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handData)
    });
    return response.json();
};

export const getAIPrediction = async (playerId) => {
    // Lấy dự đoán từ Core Engine (qua API Player Pattern)
    const response = await fetch(`${API_BASE_URL}/players/${playerId}/history_patterns`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    return response.json();
};

export const submitShowdown = async (handData) => {
    // Nạp Ground Truth vào DB học máy
    const response = await fetch(`${API_BASE_URL}/game/hands/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(handData)
    });
    return response.json();
};
