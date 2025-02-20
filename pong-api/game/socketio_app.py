import socketio
import asyncio
from .game_state_manager import GameStateManager
import logging

logger = logging.getLogger(__name__)

sio = socketio.AsyncServer(
    async_mode="asgi", cors_allowed_origins=["http://localhost:8005"]
)


@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")


@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")


@sio.event
async def join_game(sid, data):
    logger.info("join_game command received")
    game_id = data["game_id"]
    sio.enter_room(sid, game_id)
    game_state_manager = GameStateManager(game_id)
    await game_state_manager.send_full_game_state(sio, game_id)
    logger.info(f"Client {sid} joined game {game_id}")

    # Start periodic updates if this is the first client
    if len(sio.rooms(sid)) >= 1:
        await game_state_manager.start_periodic_updates(sio, game_id)


@sio.event
async def move(sid, data):
    logger.info("Move command received")
    game_id = data["game_id"]
    player_id = data["player_id"]
    direction = data["direction"]
    logger.info(f"moving player ${player_id} towards ${direction}")
    game_state_manager = GameStateManager(game_id)
    await game_state_manager.move_player(player_id, direction)


@sio.event
async def toggle(sid, data):
    logger.info("Toggle command received")
    game_id = data["game_id"]
    game_state_manager = GameStateManager(game_id)
    await game_state_manager.toggle_game()
