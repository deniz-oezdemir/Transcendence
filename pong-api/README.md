# Pong Game API

## Index
- [Getting Started](#getting-started)
  - [Install and Activate Python Environment](#install-and-activate-python-environment)
  - [Run the Servers](#run-the-servers)
  - [Running Tests](#running-tests)
- [API Endpoints](#api-endpoints)
  - [Create Game](#create-game)
  - [Get Game State](#get-game-state)
  - [Delete Game](#delete-game)
- [WebSocket Communication](#websocket-communication)
  - [Connect to Game](#connect-to-game)
  - [Move Player](#move-player)
  - [Receive Game Updates](#receive-game-updates)
- [Game Board Description](#game-board-description)
- [Example Usage](#example-usage)
  - [Creating a Game](#creating-a-game)
  - [Toggle Game On/Off](#toggle-game-onoff)
  - [Retrieving Game State](#retrieving-game-state)
  - [Deleting a Game](#deleting-a-game)
  - [WebSocket Connection](#websocket-connection)

## Getting Started

### Install and Activate Python Environment

1. **Install Python Environment**:
   - Navigate to the project root directory.
   - Create and activate a virtual environment.

   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

2. **Install Dependencies**:
   - Install the required Python packages.

   ```bash
   pip install -r requirements.txt
   ```

### Run the Servers

1. **Run Django Server**:
   - Open a terminal, navigate to `pong-api`, and start the server.

   ```bash
   cd pong-api
   python manage.py migrate # Only if you see warning about pending migrations
   python manage.py runserver
   ```

2. **Run Frontend Server**:
   - Open another terminal, navigate to `pong-frontend`, and start the server with CORS enabled.

   ```bash
   cd pong-frontend
   npm install -g http-server  # Install http-server if not already installed
   http-server 
   ```

### Running Tests

1. **Run Django Tests**:
   - Navigate to `pong-api` and run the tests.

   ```bash
   cd pong-api
   python manage.py test
   ```

## API Endpoints

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
  ```

### Delete Game

- **Endpoint:** `/api/games/<id>/`
- **Method:** `DELETE`
- **Description:** Deletes a game state from the database and Redis cache.

## WebSocket Communication

### Connect to Game

- **WebSocket URL:** `ws://localhost:8002/ws/game/<game_id>/`

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

## Game Board Description

The game board is a rectangular area where the game takes place. The coordinate system used for the game board is as follows:
- The origin (0, 0) is located at the top-left corner of the game board.
- The x-axis increases to the right.
- The y-axis increases downwards.

Here is a simple diagram for reference:

```
(0,0) ----------------------> x
  |
  |
  |
  |
  v
  y
```

## Example Usage

### Creating a Game

```bash
curl -X POST http://localhost:8002/game/create_game/ -H "Content-Type: application/json" -d '{
  "id": 1,
  "max_score": 3,
  "player_1_id": 1,
  "player_1_name": "PlayerOne",
  "player_2_id": 2,
  "player_2_name": "PlayerTwo"
}'
```

### Toggle Game On/Off

This endpoint will not result in an inmediate stop for websocket matches. Use a message
with "toggle" action within the websocket for better results.

```bash
curl -X PUT http://localhost:8002/game/toggle_game/1/
```

### Retrieving Game State

```bash
curl http://localhost:8002/game/get_game_state/1/
```

### Deleting a Game

```bash
curl -X DELETE http://localhost:8002/game/delete_game/1/
```

### WebSocket Connection

- **WebSocket URL:** `ws://localhost:8002/ws/game/<game_id>/`

### Messages Clients Can Send

- **Move Player:**

  ```json
  {
    "action": "move",
    "player_id": 1,
    "direction": 1
  }
  ```

- **Toggle Game:**

  ```json
  {
    "action": "toggle"
  }
  ```

### Messages Game Sends

- **Game State Update:**

Usually the whole state will be broadcasted everytime a clients joins the channel and when the game ends.

```json
{
"type": "game_state_update",
"state": {
  "id": 1,
  "max_score": 3,
  "is_game_running": true,
  "is_game_ended": false,
  "player_1_id": 1,
  "player_2_id": 2,
  "player_1_name": "PlayerOne",
  "player_2_name": "PlayerTwo",
  "player_1_score": 0,
  "player_2_score": 0,
  "player_1_position": 50,
  "player_2_position": 50,
  "ball_x_position": 400,
  "ball_y_position": 200,
  "ball_speed": 10,
  "ball_x_direction": 1,
  "ball_y_direction": 1,
  "ball_radius": 10,
  "game_height": 1200,
  "game_width": 1600,
  "paddle_height": 100,
  "paddle_width": 20,
  "paddle_offset": 10
}
}
  ```

- **Partial Game State Update:**

`pong-api` will now send only the variables in game_state that have changed, for example:

  ```json
  {
    "type": "game_state_update",
    "state": {
      "ball_x_position": 410,
      "ball_y_position": 210
    }
  }
  ```

The client must join the new partiall game_state with the previous chached game_state it holded.

- **Connection Closed:**

  ```json
  {
    "type": "connection_closed",
    "message": "Connection closed by server."
  }
