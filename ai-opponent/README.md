## API Endpoints

### Create AI Player
- **URL:** `/ai_player/create_ai_player/`
- **Method:** `POST`
- **Payload:**
  ```json
  {
    "ai_player_id": 1,
    "target_game_id": 100
  }
  ```
- **Curl Command:**
  ```sh
  curl -X POST http://localhost:8004/ai_player/create_ai_player/ -H "Content-Type: application/json" -d '{"ai_player_id": 1, "target_game_id": 100}'
  ```

### Delete AI Player
- **URL:** `/ai_player/delete_ai_player/<int:id>/`
- **Method:** `DELETE`
- **Curl Command:**
  ```sh
  curl -X DELETE http://localhost:8004/ai_player/delete_ai_player/1/
  ```

## Pong Game API

### Create Game

- **Endpoint:** `/game/create_game/`
- **Method:** `POST`
- **Request:**
  ```json
  {
    "id": 1,
    "max_score": 3,
    "player_1_id": 1,
    "player_1_name": "PlayerOne",
    "player_2_id": 2,
    "player_2_name": "PlayerTwo"
  }
  ```
- **Response:**
  ```json
  {
    "id": 1,
    "max_score": 3,
    "is_game_running": false,
    "is_game_ended": false,
    "player_1_id": 1,
    "player_1_name": "PlayerOne",
    "player_2_id": 2,
    "player_2_name": "PlayerTwo",
    "ball_x_position": 400,
    "ball_y_position": 200,
    "ball_x_direction": 10,
    "ball_y_direction": 10,
    "game_height": 1200,
    "game_width": 1600,
    "paddle_height": 100,
    "paddle_width": 20
  }
  ```

### Get Game State

- **Endpoint:** `/game/get_game_state/<int:pk>/`
- **Method:** `GET`
- **Response:**
  ```json
  {
    "id": 1,
    "max_score": 3,
    "is_game_running": false,
    "is_game_ended": false,
    "player_1_id": 1,
    "player_1_name": "Player 1",
    "player_2_id": 2,
    "player_2_name": "Player 2",
    "player_1_score": 0,
    "player_2_score": 0,
    "player_1_position": 50,
    "player_2_position": 50,
    "ball_x_position": 400,
    "ball_y_position": 200,
    "ball_x_direction": 10,
    "ball_y_direction": 10,
    "game_height": 1200,
    "game_width": 1600,
    "paddle_height": 100,
    "paddle_width": 20
  }
  ```

### Delete Game

- **Endpoint:** `/api/games/<id>/`
- **Method:** `DELETE`
- **Description:** Deletes a game state from the database and Redis cache.

## WebSocket Communication

### Connect to Game

- **WebSocket URL:** `ws://localhost:8004/ws/game/<game_id>/`

### Move Player

- **Message:**
  ```json
  {
    "action": "move",
    "player_id": 1,
    "direction": 1
  }
  ```

### Receive Game Updates

- **Example Update:**
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
      ],
      "game_height": 1200,
      "game_width": 1600,
      "paddle_height": 100,
      "paddle_width": 20
    }
  }
  ```

## Example Usage

### Creating a Game

```bash
curl -X POST http://localhost:8004/game/create_game/ -H "Content-Type: application/json" -d '{
  "id": 1,
  "max_score": 3,
  "player_1_id": 1,
  "player_1_name": "PlayerOne",
  "player_2_id": 2,
  "player_2_name": "PlayerTwo"
}'
```

### Toggle Game On/Off

```bash
curl -X PUT http://localhost:8004/game/toggle_game/1/
```

### Retrieving Game State

```bash
curl http://localhost:8004/game/get_game_state/1/
```

### Deleting a Game

```bash
curl -X DELETE http://localhost:8004/game/delete_game/1/
```

### WebSocket Connection

**JavaScript Example:**

```javascript
const socket = new WebSocket('ws://localhost:8004/ws/game/1/');

socket.onopen = function(event) {
  console.log('WebSocket is connected.');
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

