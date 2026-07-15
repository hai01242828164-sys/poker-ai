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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(game.router, prefix="/api/game", tags=["Game"])
app.include_router(players.router, prefix="/api/players", tags=["Players"])
