# Documentation

## Features

- **Only CPU** support.
- **Local Deepseek 1B**
- **FastAPI** service

## TODO

- Test and improve the messages generated - try out different parameters.
- Maybe add emoji as necessity in message?
- Change endpoint to only respond with the message.
- Build a message queue to speed up request handling - if this service should prebuffer a bunch of messages.

### API Testing

Test the generation endpoints:
```
for type in game_start opponent_scored ai_scored game_victory game_defeat; do
	echo -e "\n=== $type ===";
	curl -s "http://localhost:8000/generate?type=$type" | jq .
done
```
