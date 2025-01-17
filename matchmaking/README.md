# Matchmaking Microservice

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
First version: support only matches - in progress

Second version: support also tournmanets - to do

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
4. Try integration with redis if needed.
5. Dockerize.
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

3. As Frontend I want to join a match.
- create functionality to join an existing match via websocket - done
- implement logic that a user can only join a match if he is not already in a match - done

4. Switch from Sqllite to postgress

## Testing

1. Start all services using Docker:
	```bash
	cd matchmaking/docker
	docker compose up --build
	```

2. Open `test_websocket.html` in your browser to test the matchmaking interface.

3. Monitor the databases:

	Check PostgreSQL:
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

	Check Redis:
	```bash
	# Connect to Redis container
	docker exec -it docker-redis-1 redis-cli

	# List all keys
	KEYS *

	# Monitor real-time updates
	MONITOR

	# View specific match data
	GET game_state_1  # Replace 1 with actual match ID

	# Exit Redis
	exit
	```

4. Check logs:
	```bash
	# View all container logs
	docker compose logs -f

	# View specific service logs
	docker compose logs -f matchmaking
	docker compose logs -f postgres
	docker compose logs -f redis
	```

The `WaitingRoomConsumer` uses:
- PostgreSQL for persistent storage of matches via `Match` model
- Redis for real-time WebSocket communication via `CHANNEL_LAYERS`

## Notes

### Django Admin
user:	deniz

pw:		admin


## Sources

https://docs.djangoproject.com/en/5.1/intro/tutorial01/

https://www.postgresql.org/docs/release/
