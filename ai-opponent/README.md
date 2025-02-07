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
