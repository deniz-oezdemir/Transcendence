## Debugging
# Possible Optimizations

Several potential causes for the increasing state update time and jank:

1. **Growing Game State History**
In `GameStateManager`, every update maintains previous state:
```python
async def send_partial_game_state(self, channel_layer, game_group_name):
    self.previous_game_state = copy.deepcopy(self.game_state)  # Accumulating memory
```

2. **Frontend State Processing Bottleneck**
In `OnlinePongGamePage.js`:
```javascript
ws.onmessage = function (event) {
  gameStateQueue.push(event.data);  // Queue keeps growing
  // ...
  currentGameState = { ...currentGameState, ...partialGameState }; // Creates new object each time
  setGamePositions((prevPositions) => ({
    ...prevPositions,  // Creates new object each time
    player1Position: currentGameState.player_1_position * scaleFactor,
    // ...
  }));
```

Fixes:

1. **Backend Optimization**:
```python
async def send_partial_game_state(self, channel_layer, game_group_name):
    # Only send diffs if there are changes
    diffs = self.calculate_diffs(self.game_state, self.previous_game_state)
    if diffs:  # Only send if there are changes
        # Send minimal state
        await channel_layer.group_send(...)
    self.previous_game_state = copy.deepcopy(self.game_state)
```

2. **Frontend Optimization**:
```javascript
function connectWebSocket() {
  const maxQueueSize = 3; // Limit queue size
  const gameStateQueue = [];

  ws.onmessage = function(event) {
    // Drop old updates if queue gets too large
    if (gameStateQueue.length > maxQueueSize) {
      gameStateQueue.shift();
    }

    gameStateQueue.push(event.data);

    // Process update with requestAnimationFrame
    requestAnimationFrame(() => {
      const data = gameStateQueue.shift();
      if (!data) return;

      // Process game state...
    });
  };
}
```

3. **State Management Optimization**:
```javascript
// Use object pooling for positions
const positionPool = {
  current: {ball: {x:0, y:0}, player1: 0, player2: 0},
  next: {ball: {x:0, y:0}, player1: 0, player2: 0}
};

// Update positions in place
function updatePositions(gameState) {
  const pos = positionPool.next;
  pos.ball.x = gameState.ball_x_position * scaleFactor;
  pos.ball.y = gameState.ball_y_position * scaleFactor;
  pos.player1 = gameState.player_1_position * scaleFactor;
  pos.player2 = gameState.player_2_position * scaleFactor;

  // Swap buffers
  [positionPool.current, positionPool.next] = [positionPool.next, positionPool.current];

  return positionPool.current;
}
```

These changes would:
1. Reduce memory allocation/GC pressure
2. Limit queue size to prevent memory growth
3. Use requestAnimationFrame for smoother rendering
4. Reuse objects instead of creating new ones
5. Only send state updates when needed


# Error needs fixing

```
matchmaking            | 2025-02-21 18:31:40,963 - waitingRoom.consumers - INFO - Creating local game in pong-api for match 23
matchmaking            | 2025-02-21 18:31:40,963 INFO     Creating local game in pong-api for match 23
pong-api               | INFO Game with ID: 23 created in REDIS.
matchmaking            | 2025-02-21 18:31:40,971 - waitingRoom.consumers - DEBUG - Successfully created game 23 in pong-api
matchmaking            | 2025-02-21 18:31:40,971 DEBUG    Successfully created game 23 in pong-api
pong-api               | INFO Client connected: specific.618327c5bd9e436288b27a31a6973a97!2c50e830a2d6422b9bb76d790ddac261, Total connected clients: 1
pong-api               | INFO Sent full game state to group: game_23 for game_id: 23
pong-api               | INFO Started periodic updates for game: 23
pong-api               | INFO Client connected: specific.618327c5bd9e436288b27a31a6973a97!4ffc22e946dd4321af926a00e1d09a9e, Total connected clients: 2
pong-api               | INFO Sent full game state to group: game_23 for game_id: 23
pong-api               | INFO Client connected: specific.618327c5bd9e436288b27a31a6973a97!ea6819f0ad8645d4a87490f1ede74e9d, Total connected clients: 3
pong-api               | INFO Sent full game state to group: game_23 for game_id: 23
pong-api               | INFO Client connected: specific.618327c5bd9e436288b27a31a6973a97!b2035785b7494afeb7bcc7732a60f85f, Total connected clients: 4
pong-api               | INFO Sent full game state to group: game_23 for game_id: 23
pong-api               | INFO Ending game state for game_id: 23
pong-api               | INFO Preparing to send game result for game 23
matchmaking            | 2025-02-21 18:31:47,420 INFO     Received request to update game result for match_id: 23
matchmaking            | 2025-02-21 18:31:47,437 INFO     Match 23 updated with scores and times
matchmaking            | 2025-02-21 18:31:47,438 INFO     Attempting to send match 23 to history service
game-history           | INFO Creating a new finished game
game-history           | INFO Finished game created successfully
game-history           | INFO "POST /api/finished-game/ HTTP/1.1" 201 190
game-history           | INFO "POST /api/finished-game/ HTTP/1.1" 201 190
matchmaking            | 2025-02-21 18:31:47,453 INFO     Successfully sent match 23 to history service
pong-api               | INFO Game 23 result successfully sent to matchmaking. Response: {"message":"Match result updated"}
pong-api               | INFO Deleted game state from cache with key 23
pong-api               | INFO Game successfully deleted from REDIS after ended
pong-api               | INFO Sent connec ion closed game_23 for game_id: 23
pong-api               | INFO connection_closed message received
pong-api               | INFO Closing all connections
pong-api               | INFO connection_closed message received
pong-api               | INFO Closing all connections
pong-api               | INFO connection_closed message received
pong-api               | INFO Closing all connections
pong-api               | INFO connection_closed message received
pong-api               | INFO Closing all connections
pong-api               | INFO Deleted game state from cache with key 23
pong-api               | INFO Deleted game state from cache with key 23
pong-api               | INFO Deleted game state from cache with key 23
pong-api               | INFO Deleted game state from cache with key 23
pong-api               | ERROR Exception inside application: Attempt to send on a closed protocol
pong-api               | Traceback (most recent call last):
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 48, in __call__
pong-api               |     return await application(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 44, in __call__
pong-api               |     return await self.inner(dict(scope, cookies=cookies), receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 261, in __call__
pong-api               |     return await self.inner(wrapper.scope, receive, wrapper.send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/auth.py", line 185, in __call__
pong-api               |     return await super().__call__(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/middleware.py", line 24, in __call__
pong-api               |     return await self.inner(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 118, in __call__
pong-api               |     return await application(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 95, in app
pong-api               |     return await consumer(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 58, in __call__
pong-api               |     await await_many_dispatch(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/utils.py", line 50, in await_many_dispatch
pong-api               |     await dispatch(result)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 74, in dispatch
pong-api               |     await handler(message)
pong-api               |   File "/app/./game/consumers.py", line 112, in game_state_update
pong-api               |     await self.send(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/generic/websocket.py", line 219, in send
pong-api               |     await super().send({"type": "websocket.send", "text": text_data})
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 82, in send
pong-api               |     await self.base_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 221, in send
pong-api               |     return await self.real_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/server.py", line 240, in handle_reply
pong-api               |     protocol.handle_reply(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 202, in handle_reply
pong-api               |     self.serverSend(message["text"], False)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 256, in serverSend
pong-api               |     self.sendMessage(content.encode("utf8"), binary)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/autobahn/websocket/protocol.py", line 2275, in sendMessage
pong-api               |     raise Disconnected("Attempt to send on a closed protocol")
pong-api               | autobahn.exception.Disconnected: Attempt to send on a closed protocol
pong-api               | ERROR Exception inside application: Attempt to send on a closed protocol
pong-api               | Traceback (most recent call last):
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 48, in __call__
pong-api               |     return await application(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 44, in __call__
pong-api               |     return await self.inner(dict(scope, cookies=cookies), receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 261, in __call__
pong-api               |     return await self.inner(wrapper.scope, receive, wrapper.send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/auth.py", line 185, in __call__
pong-api               |     return await super().__call__(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/middleware.py", line 24, in __call__
pong-api               |     return await self.inner(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 118, in __call__
pong-api               |     return await application(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 95, in app
pong-api               |     return await consumer(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 58, in __call__
pong-api               |     await await_many_dispatch(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/utils.py", line 50, in await_many_dispatch
pong-api               |     await dispatch(result)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 74, in dispatch
pong-api               |     await handler(message)
pong-api               |   File "/app/./game/consumers.py", line 112, in game_state_update
pong-api               |     await self.send(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/generic/websocket.py", line 219, in send
pong-api               |     await super().send({"type": "websocket.send", "text": text_data})
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 82, in send
pong-api               |     await self.base_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 221, in send
pong-api               |     return await self.real_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/server.py", line 240, in handle_reply
pong-api               |     protocol.handle_reply(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 202, in handle_reply
pong-api               |     self.serverSend(message["text"], False)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 256, in serverSend
pong-api               |     self.sendMessage(content.encode("utf8"), binary)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/autobahn/websocket/protocol.py", line 2275, in sendMessage
pong-api               |     raise Disconnected("Attempt to send on a closed protocol")
pong-api               | autobahn.exception.Disconnected: Attempt to send on a closed protocol
pong-api               | ERROR Exception inside application: Attempt to send on a closed protocol
pong-api               | Traceback (most recent call last):
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 48, in __call__
pong-api               |     return await application(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 44, in __call__
pong-api               |     return await self.inner(dict(scope, cookies=cookies), receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 261, in __call__
pong-api               |     return await self.inner(wrapper.scope, receive, wrapper.send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/auth.py", line 185, in __call__
pong-api               |     return await super().__call__(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/middleware.py", line 24, in __call__
pong-api               |     return await self.inner(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 118, in __call__
pong-api               |     return await application(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 95, in app
pong-api               |     return await consumer(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 58, in __call__
pong-api               |     await await_many_dispatch(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/utils.py", line 50, in await_many_dispatch
pong-api               |     await dispatch(result)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 74, in dispatch
pong-api               |     await handler(message)
pong-api               |   File "/app/./game/consumers.py", line 112, in game_state_update
pong-api               |     await self.send(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/generic/websocket.py", line 219, in send
pong-api               |     await super().send({"type": "websocket.send", "text": text_data})
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 82, in send
pong-api               |     await self.base_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 221, in send
pong-api               |     return await self.real_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/server.py", line 240, in handle_reply
pong-api               |     protocol.handle_reply(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 202, in handle_reply
pong-api               |     self.serverSend(message["text"], False)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 256, in serverSend
pong-api               |     self.sendMessage(content.encode("utf8"), binary)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/autobahn/websocket/protocol.py", line 2275, in sendMessage
pong-api               |     raise Disconnected("Attempt to send on a closed protocol")
pong-api               | autobahn.exception.Disconnected: Attempt to send on a closed protocol
pong-api               | ERROR Exception inside application: Attempt to send on a closed protocol
pong-api               | Traceback (most recent call last):
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 48, in __call__
pong-api               |     return await application(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 44, in __call__
pong-api               |     return await self.inner(dict(scope, cookies=cookies), receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 261, in __call__
pong-api               |     return await self.inner(wrapper.scope, receive, wrapper.send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/auth.py", line 185, in __call__
pong-api               |     return await super().__call__(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/middleware.py", line 24, in __call__
pong-api               |     return await self.inner(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/routing.py", line 118, in __call__
pong-api               |     return await application(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 95, in app
pong-api               |     return await consumer(scope, receive, send)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 58, in __call__
pong-api               |     await await_many_dispatch(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/utils.py", line 50, in await_many_dispatch
pong-api               |     await dispatch(result)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 74, in dispatch
pong-api               |     await handler(message)
pong-api               |   File "/app/./game/consumers.py", line 112, in game_state_update
pong-api               |     await self.send(
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/generic/websocket.py", line 219, in send
pong-api               |     await super().send({"type": "websocket.send", "text": text_data})
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/consumer.py", line 82, in send
pong-api               |     await self.base_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/channels/sessions.py", line 221, in send
pong-api               |     return await self.real_send(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/server.py", line 240, in handle_reply
pong-api               |     protocol.handle_reply(message)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 202, in handle_reply
pong-api               |     self.serverSend(message["text"], False)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/daphne/ws_protocol.py", line 256, in serverSend
pong-api               |     self.sendMessage(content.encode("utf8"), binary)
pong-api               |   File "/usr/local/lib/python3.10/site-packages/autobahn/websocket/protocol.py", line 2275, in sendMessage
pong-api               |     raise Disconnected("Attempt to send on a closed protocol")
pong-api               | autobahn.exception.Disconnected: Attempt to send on a closed protocol
```
