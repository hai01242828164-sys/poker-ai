from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import game, players
from .models.base import Base
from .api.deps import engine

# Tạo database tables nếu chưa tồn tại
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Poker AI Assistant API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://192.168.1.3:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/game", tags=["Game"])
app.include_router(players.router, prefix="/api/players", tags=["Players"])
