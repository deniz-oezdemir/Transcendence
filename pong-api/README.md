# Pong Game API

Welcome to the Pong Game API! This API allows you to interact with the Pong game server, create games, retrieve game states, and participate in real-time gameplay using WebSockets.

## Table of Contents

- [Getting Started](#getting-started)
- [API Endpoints](#api-endpoints)
  - [Create Game](#create-game)
  - [Get Game State](#get-game-state)
- [WebSocket Communication](#websocket-communication)
  - [Connect to Game](#connect-to-game)
  - [Move Player](#move-player)
  - [Receive Game Updates](#receive-game-updates)

## Getting Started

To get started, you need to have the base URL of the API. For the purpose of this documentation, we'll assume the base URL is `http://localhost:8000`.

## API Endpoints

### Create Game

**Endpoint:** `/game/create_game/`

**Method:** `POST`

**Description:** Creates a new game instance.

**Request:**

```json
{
  "max_score": 3
}
```

**Response:**

```json
{
  "id": 1,
  "max_score": 3,
  "is_game_running": false,
  "is_game_ended": false,
  "players": [],
  "ball_x_position": 400,
  "ball_y_position": 200,
  "ball_x_velocity": 30,
  "ball_y_velocity": 30
}
```

### Get Game State

**Endpoint:** `/game/get_game_state/<int:pk>/`

**Method:** `GET`

**Description:** Retrieves the state of a specific game identified by `pk`.

**Response:**

```json
{
  "id": 1,
  "max_score": 3,
  "is_game_running": false,
  "is_game_ended": false,
  "players": [
    {
      "player": 1,
      "player_position": 150,
      "player_direction": 150,
      "player_score": 0
    },
    {
      "player": 2,
      "player_position": 150,
      "player_direction": 150,
      "player_score": 0
    }
  ],
  "ball_x_position": 400,
  "ball_y_position": 200,
  "ball_x_velocity": 30,
  "ball_y_velocity": 30
}
```

## WebSocket Communication

### Connect to Game

To participate in a game, you need to connect to the WebSocket endpoint for the specific game.

**WebSocket URL:** `ws://localhost:8000/ws/game/<game_id>/`

### Move Player

To move a player, send a JSON message with the action `move`, the `player_id`, and the `direction`.

**Message:**

```json
{
  "action": "move",
  "player_id": 1,
  "direction": 1
}
```

### Receive Game Updates

Once connected to the WebSocket, you will receive real-time updates about the game state. The server will send messages with the updated game state.

**Example Update:**

```json
{
  "type": "game_state_update",
  "state": {
    "ball_x_position": 100,
    "ball_y_position": 100,
    "players": [
      {
        "player": 1,
        "player_position": 150,
        "player_direction": 1,
        "player_score": 0
      },
      {
        "player": 2,
        "player_position": 150,
        "player_direction": -1,
        "player_score": 0
      }
    ]
  }
}
```

## Example Usage

### Creating a Game

```bash
curl -X POST http://localhost:8000/game/create_game/ -H "Content-Type: application/json" -d '{"max_score": 3}'
```

### Toggle Game On/Off

```bash
curl -X PUT http://localhost:8000/game/toggle_game/1/
```

### Retrieving Game State

```bash
curl http://localhost:8000/game/get_game_state/1/
```

### WebSocket Connection

Use a WebSocket client (e.g., JavaScript WebSocket API, `websocat`, etc.) to connect to the game and send/receive messages.

**JavaScript Example:**

```javascript
const socket = new WebSocket('ws://localhost:8000/ws/game/1/');

socket.onopen = function(event) {
  console.log('WebSocket is connected.');
  // Move player 1 to the right
  socket.send(JSON.stringify({
    action: 'move',
    player_id: 1,
    direction: 1
  }));
};

socket.onmessage = function(event) {
  const message = JSON.parse(event.data);
  console.log('Game update:', message);
};

socket.onclose = function(event) {
  console.log('WebSocket is closed.');
};

socket.onerror = function(error) {
  console.error('WebSocket error:', error);
};

