# Game History API

This API allows you to manage and retrieve game history data, including player statistics and top winners.

## Endpoints

### 1. Create a Finished Game

**URL:** `/api/finished-game/`  
**Method:** `POST`  
**Description:** Create a new finished game record.

**Request Body:**
```json
{
    "player_1_id": 1,
    "player_2_id": 2,
    "player_1_score": 10,
    "player_2_score": 8,
    "winner_id": 1,
    "start_time": "2023-10-01T12:00:00Z",
    "end_time": "2023-10-01T12:30:00Z"
}
```

**Example `curl` Command:**
```sh
curl -X POST http://127.0.0.1:8006/api/finished-game/ \
-H "Content-Type: application/json" \
-d '{
    "player_1_id": 1,
    "player_2_id": 2,
    "player_1_score": 10,
    "player_2_score": 8,
    "winner_id": 1,
    "start_time": "2023-10-01T12:00:00Z",
    "end_time": "2023-10-01T12:30:00Z"
}'
```

### 2. Get Finished Game Details

**URL:** `/api/finished-game/<int:pk>/`  
**Method:** `GET`  
**Description:** Retrieve details of a finished game by its ID.

**Example `curl` Command:**
```sh
curl -X GET http://127.0.0.1:8006/api/finished-game/1/
```

### 3. Get Player Statistics

**URL:** `/api/player/<int:player_id>/`  
**Method:** `GET`  
**Description:** Retrieve statistics for a specific player.

**Example `curl` Command:**
```sh
curl -X GET http://127.0.0.1:8006/api/player/1/
```

### 4. Get Top Ten Winners

**URL:** `/api/top-ten-winners/`  
**Method:** `GET`  
**Description:** Retrieve the top ten players sorted by their win ratio.

**Example `curl` Command:**
```sh
curl -X GET http://127.0.0.1:8006/api/top-ten-winners/
```

## Setup and Run

1. **Clone the repository:**
   ```sh
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```sh
   pip install -r requirements.txt
   ```

3. **Apply migrations:**
   ```sh
   python manage.py makemigrations
   python manage.py migrate
   ```

4. **Run the server:**
   ```sh
   python manage.py runserver 8006
   ```

5. **Access the API:**
   - The API will be available at `http://127.0.0.1:8006/`

