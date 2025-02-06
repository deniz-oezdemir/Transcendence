# Documentation

## Features

- **Only CPU** support.
- **Local Deepseek 1B**
- **FastAPI** service

## To Do

- Test and improve the messages generated - try out different parameters.
- Maybe add emoji as necessity?
- Build a message queue to speed up request handling - this service should prebuffer a bunch of messages.
- Implement automated model downloads from GitHub when running `make` (consider testing on an Ethernet connection due to size and slow download speeds).

## Testing Instructions

### Docker Commands

Remove all containers:
```
docker rm $(docker ps -aq)
```

Build the Docker image:
```
docker build -t ai-messages-china .
```

Run the Docker container and follow logs:
```
docker run -d -p 8000:8000 ai-messages-china && docker logs -f $(docker ps -q --filter ancestor=ai-messages-china)
```

### API Testing

Test the generation endpoints:
```
for type in game_start opponent_scored ai_scored game_victory game_defeat; do
	echo -e "\n=== $type ===";
	curl -s "http://localhost:8000/generate?type=$type" | jq .
done
```
