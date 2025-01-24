# Matchmaking Microservice

Info: match and game are used synonymously.

## Table of Contents

- [Goals](#goals)
- [Subject Requirements](#subject-requirements)
- [User Stories](#user-stories)
- [Development Steps](#development-steps)
- [Tables](#tables)
- [TODO](#todo)
- [Testing](#testing)
- [Notes](#notes)
	- [Django Admin](#django-admin)
- [Sources](#sources)


## Goals
First version: support only matches - work in progress

Second version: support also tournmanets - TODO

## Subject Requirements

- Players must be able to play against each other.
- It should be possible to propose a tournament.
- The tournament will consist of multiple players taking turns playing against each other.
- The tournament must clearly display who is playing against whom and the order of the players.
- There must be a matchmaking system.
- The tournament system must organize the matchmaking of the participants.
- The tournament system must announce the next fight.

## User Stories

1. As Frontend I want to create a match.
2. As Frontend I want to get the waiting room info with all matches and tournaments.
3. As Frontend I want to join a match.
4. As Frontend I want to get the match result.
5. As AI Player I want to be initiated when necessary.
6. As Game Engine I want to receive game start data (see pongapi/Readme.md).
6. As Game Engine I want to send the match result to Matchmaking.
7. As Game History I want to receive the finished match and/or tournament data.
8. As Matchmaking I want to delete the finished match and/or tournament data.

## Development Steps

1. Learn REST and websocket APIs - done: snapshot vs. realtime data
2. Learn redis, decide whether its necessary or postgres is sufficient - done: redis better here
3. Build only logic for matches first (no tournaments) and add unit tests.
4. Try integration with redis if needed. - done
5. Dockerize. - done
6. Build all other logic as described in User Stories above and add unit test.
7. Integrate with other services.

## Tables

- waiting room
- matches (same as historyDB)
- tournaments (same as historyDB)

## TODO

1. As Frontend I want to create a match. - done
- start with connection to frontend: receive game creation and send game info - done
- check whether it needs to be a websocket or whether rest is sufficient -> websocket for real-time updates of waiting room
- build api to create game from frontend and api to send back info of created game - done
- clean all current matches - done: commented out code in consumers.py
- implement logic that a user can create only one match - done

2. As Frontend I want to get the waiting room info with all matches and tournaments. - done
- implement sending waiting room info every time it changes to all websocket connections - done

3. As Frontend I want to join a match. - done
- create functionality to join an existing match via websocket - done
- implement logic that a user can only join a match if he is not already in a match - done

4. Switch from Sqlite to Postgres. - done

5. As Game Engine I want to send the match result to Matchmaking.
- to create game: use game engine's rest api (done by game engine service) write logic to create game when active - done and to be tested with pong api and to be integrated with pong API: update pong api so it can be run in docker so the services can be on the same network
- to consume game result: expose a rest api for post requests - done and to be integrated with pong API

## Testing

1. **Start Services**:
	```bash
	cd matchmaking/docker
	docker compose up --build
	```

2. **Monitor Databases**:

	- **PostgreSQL**:
		```bash
		# Connect to PostgreSQL container
		docker exec -it docker-postgres-1 psql -U deniz matchmaking_db

		# List all tables
		\dt

		# View matches
		SELECT * FROM "waitingRoom_match";

		# Exit PostgreSQL
		\q
		```

	- **Redis**:
		```bash
		# Connect to Redis container
		docker exec -it docker-redis-1 redis-cli

		# List all keys
		KEYS *

		# Monitor real-time updates
		MONITOR

		# Exit Redis
		exit
		```

3. **WebSocket API**:
	- Open `test_websocket.html` in your browser.
	- Create or join games.

4. **REST API**:
	- Use the following `curl` command to post match results:
	```bash
	curl -X POST http://localhost:8000/api/match/1/result/ \
	-H "Content-Type: application/json" \
	-d '{
		"winner_id": 1,
		"player1_score": 5,
		"player2_score": 3,
		"start_time": "2025-01-17T13:00:00Z",
		"end_time": "2025-01-17T13:15:00Z"
	}'
	```
	- `match_id` is inferred from the URL.

5. **Check Logs**:
	```bash
	# View all container logs
	docker compose logs -f

	# View specific service logs
	docker compose logs -f matchmaking
	docker compose logs -f postgres
	docker compose logs -f redis
	```

6. **Clean Up Matches**:
	- Uncomment the following line in `matchmaking/waitingRoom/consumers.py` to delete all matches for testing purposes:
	```python
	# Delete all matches for testing purposes
	# await self.delete_all_matches()
	```

7. **Clean Up Docker**:
	```bash
	# Stop and remove containers, networks, volumes
	docker compose down -v

	# Remove all unused containers, networks, images
	docker system prune -a

	# Remove all volumes
	docker volume prune
	```

## Notes

### Django Admin
user:	deniz

pw:		admin

### Is Redis not sufficient as a database? Why also use PostgreSQL?

Both PostgreSQL and Redis serve different purposes in the matchmaking service:

 PostgreSQL's Role:
- **Persistent Storage**: Stores `Match` records permanently.
- **Data Integrity**: Enforces database schema and constraints.
- **Complex Queries**: Supports composite indexes on `player_1_id` and `player_2_id`.
- **Transaction Support**: Ensures data consistency.
- **Relationship Management**: Useful when adding tournament support.

Redis's Role:
- **Real-time Communication**: Used by `CHANNEL_LAYERS` for WebSocket communication.
- **In-memory Speed**: Provides fast access for active matches.
- **Pub/Sub**: Handles WebSocket group messaging.
- **Temporary Data**: Manages active connections and game states.

While one could theoretically use only Redis:

1. **Drawbacks**:
	- No data persistence by default.
	- Limited query capabilities.
	- No schema enforcement.
	- No built-in relationship support for tournaments.

2. **Benefits of the current setup**:
	- PostgreSQL handles permanent storage via the `Match` model.
	- Redis handles real-time communication via `CHANNEL_LAYERS`.
	- Clean separation of concerns.

For the matchmaking service's requirements (especially with future tournament support), keeping both databases is recommended.

## Sources

Vincent, W. S. (2022). *Django for APIs: Build web APIs with Python and Django*.

Read the Docs. (n.d.). *Channels documentation*. Retrieved from https://channels.readthedocs.io/en/latest/

Django Software Foundation. (n.d.). *Writing your first Django app, part 1*. Retrieved from https://docs.djangoproject.com/en/5.1/intro/tutorial01/

PostgreSQL Global Development Group. (n.d.). *PostgreSQL release notes*. Retrieved from https://www.postgresql.org/docs/release/
