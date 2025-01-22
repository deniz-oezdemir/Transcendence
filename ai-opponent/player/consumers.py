import asyncio
import websockets
import json
import logging
from threading import Thread

logger = logging.getLogger(__name__)


class WebSocketClient:
    def __init__(self, uri):
        self.uri = uri

    async def connect(self):
        async with websockets.connect(self.uri) as websocket:
            await self.listen(websocket)

    async def listen(self, websocket):
        try:
            async for message in websocket:
                data = json.loads(message)
                logger.info(f"Received message: {data}")
                # Handle the received message here
        except websockets.ConnectionClosed:
            logger.warning("Connection closed")

    def run(self):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(self.connect())

    def start(self):
        thread = Thread(target=self.run)
        thread.start()
