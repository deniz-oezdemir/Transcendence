# Transcendence (Work in Progress)

We aim to develop a multiplayer Pong game with a Django backend and a modern frontend. The project will evolve through several versions, starting from experiments, to a basic MVP to a fully-featured application with database integration, authentication, and a single-page application interface.

## Table of Contents
- [Versions](#versions)
  - [Hacky MVP](#hacky-mvp)
  - [MVP](#mvp)
  - [V0.1](#v01)
- [Research](#research)
  - [Databases](#databases)
  - [Microservices](#microservices)
  - [User and Game Stats](#user-and-game-stats)
- [Sources](#sources)
  - [Useful Resources](#useful-resources)
  - [Similar Projects](#similar-projects)

## Versions

### Hacky MVP
**Goal:** Simple game engine on Django backend and frontend with minimal Bootstrap.

**Status:** Functional but experiences some lag. To start the server, run `python manage.py runserver` and navigate to `localhost` in your browser. Use the `w` and `s` keys, or the `up` and `down` arrow keys, to control the game.

### MVP
**Goal:** Dockerized frontend and backend. Communicate via WebSockets. Fluid gameplay experience.

**Status:** Not started.

<img src="./mvp_plan.jpg" alt="MVP Plan" width="50%">

### V0.1
**Goal:** Added Database, Authentication, and Single Page App.

**Status:** Not started.

## Research

### Databases
[PostgreSQL](https://www.youtube.com/watch?v=n2Fluyr3lbc)

### Microservices
Good if we want to build a functional MVP first and iteratively add new features.

An MVP could consist of the three services:
- Front-end
- Pong server (game engine, GE)
- Dockerization

### User and Game Stats
Not MVP relevant and can be integrated as a service later.

## Sources

### Useful Resources
[Django Tutorial](https://docs.djangoproject.com/en/5.1/intro/tutorial01/)
- Part 1 to 4: Definitely recommended
- Part 2 to 8: Revisit for automated testing, debugging, etc.

[Bootstrap Introduction](https://getbootstrap.com/docs/5.3/getting-started/introduction/)

### Similar Projects
[Best looking, well documented, microservice architecture](https://github.com/tdameros/42-transcendence)

[Good AI opponent documentation](https://github.com/Linuswidmer/42_transcendence)
