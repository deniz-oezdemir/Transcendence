# Matchmaking Service

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
2. As Frontend I want to join a match.
3. As Frontend I want to get the waiting room info with all matches and tournaments.
4. As Frontend I want to get the match result.
5. As AI Player I want to be initiated when necessary.
6. As Game Engine I want to send the match result to Matchmaking.
7. As Game History I want to receive the finished match and/or tournament data.

## Development Steps

1. Learn REST and websocket APIs
2. Learn redis, decide whether its necessary or postgres is sufficient
3. Set up Django project with redis
4. Build only logic for matches first (no tournaments) and add unit tests.
5. Dockerize
6. Build all other logic as described in User Stories above and add unit test.
7. Integrate with other services.

## Tables

- table with matches and tournaments for the waiting room
- same tables as historyDB
