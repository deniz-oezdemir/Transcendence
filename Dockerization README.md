# Docker Compose Setup Guide

This guide explains how the Docker Compose files work together in this project and how to setup containerization for a service.

## Table of Contents

- [Example Docker Compose Structure](#example-docker-compose-structure)
  - [Main Compose File: `./docker-compose.yml`](#main-compose-file-docker-composeyml)
  - [Microservice Compose File](#microservice-compose-file)
- [How it Works](#how-it-works)
- [How to Structure Other Services](#how-to-structure-other-services)
- [Benefits](#benefits)
- [Managing Services](#managing-services)
- [Current Port Usage](#current-port-usage)

## Example Docker Compose Structure

### Main Compose File: `./docker-compose.yml`

- Orchestrates all services in the project
- References individual service-specific Docker Compose files using the `extends` keyword
- When using `extends`, Docker Compose merges the referenced service configuration with the current service configuration.

### Microservice Compose File: e.g., `./matchmaking/docker/docker-compose.yml`

- Defines service-specific containers, volumes, environment variables, and other configurations
- Referenced by the main `docker-compose.yml` file

## How it Works

1. When running `make up`, Docker Compose:

   - Reads the main docker-compose.yml
   - For each service with `extends`:
     - Loads the referenced compose file
     - Copies the base configuration
     - Merges any overrides from main file
     - Applies the final configuration

2. Key merge rules:
   - Local settings (main docker-compose.yml) override extended ones (service docker-compose.yml)
   - Lists (like `ports`) are replaced, not merged
   - `networks` and `volumes` are merged
   - Path references are relative to main compose file

## How to Structure Other Services

1. Create a `docker` folder in your service:

```
your-service/
├── docker/
│   ├── docker-compose.yml    # Service-specific compose
│   ├── Dockerfile            # Service Dockerfile
│   ├── entrypoint.sh         # If needed
│   └── requirements.txt      # If needed
```

2. In your service's `docker-compose.yml`:

   - Define all service-specific containers
   - Use proper healthchecks
   - Set up service-specific volumes
   - Configure environment variables
   - Define port mappings

3. In the main `docker-compose.yml` add:

```yaml
services:
  your-service:
    extends:
      file: ./your-service/docker/docker-compose.yml
      service: your-service
    networks:
      - transcendence

  your-service-db: # If needed
    extends:
      file: ./your-service/docker/docker-compose.yml
      service: your-service
    networks:
      - transcendence
```

## Benefits

This structure allows:

- Independent development of each service
- Service-specific Docker configurations
- Shared networking between all services
- Common commands via `Makefile` (`make up`, `make down`)

## Managing Services

The services can be managed using the existing `Makefile` commands:

```bash
make up      # Start all services
make down    # Stop all services
make clean   # Clean up Docker resources
```

## Current Port Usage

| Service      | Port |
| ------------ | ---- |
| Frontend     | 8005 |
| Matchmaking  | 8001 |
| Game engine  | 8002 |
| Game history | tbd  |
| UAM          | 8006 |
| AI messages  | 8003 |
| AI player    | 8004 |
