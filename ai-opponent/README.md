# AI Opponent Django Service

## Setup

1. **Clone the repository:**
   ```sh
   git clone <repository_url>
   cd ai-opponent
   ```

2. **Build and run the Docker container:**
   ```sh
   docker build -t ai-opponent .
   docker run -p 8000:8000 ai-opponent
   ```

3. **Run migrations:**
   ```sh
   docker exec -it <container_id> python manage.py migrate
   ```

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
  curl -X POST http://localhost:8000/ai_player/create_ai_player/ -H "Content-Type: application/json" -d '{"ai_player_id": 1, "target_game_id": 100}'
  ```

### Delete AI Player
- **URL:** `/ai_player/delete_ai_player/<int:id>/`
- **Method:** `DELETE`
- **Curl Command:**
  ```sh
  curl -X DELETE http://localhost:8000/ai_player/delete_ai_player/1/
  ```

## Project Structure

- **AIOpponent/**: Main Django project directory.
  - `__init__.py`
  - `asgi.py`
  - `settings.py`
  - `urls.py`
  - `wsgi.py`
- **player/**: App directory.
  - `__init__.py`
  - `admin.py`
  - `apps.py`
  - `managers.py`
  - `models.py`
  - `serializers.py`
  - `tests.py`
  - `urls.py`
  - `views.py`
  - **migrations/**: Database migrations.
    - `0001_initial.py`
    - `__init__.py`
- **Dockerfile**: Docker configuration.
- **manage.py**: Django management script.
- **requirements.txt**: Python dependencies.
- **README.md**: Project documentation.
- **main.py**: Entry point for the application (currently empty).

## Important Notes

- Ensure Redis is running on `127.0.0.1:6379` for caching.
- The service uses Django Channels for handling WebSockets.
- Update `ALLOWED_HOSTS` in `settings.py` for production use.

