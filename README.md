# Transcendence: A Pong Web App

Transcendence is a full-stack 3D multiplayer Pong game built with a microservices architecture. Below you can find a quick demo of the program:

https://github.com/user-attachments/assets/44c6fa73-51af-4097-9796-ba48a1bbe2e1

The following features are supported:

- Play real-time multiplayer matches and tournaments.
- Compete against AI opponents.
- Track game statistics.
- Enjoy a server-side game engine.
- Switch to 3D mode for an enhanced experience.
- Access the single-page application for seamless navigation.

## Table of Contents

- [Installation and Usage](#installation-and-usage)
- [Userflow](#userflow)
- [Microservices Architecture](#microservices-architecture)
- [Database Model](#database-model)
- [Further Documentation per Microservice](#further-documentation-per-microservice)
- [Sources](#sources)

## Installation and Usage

1. Clone the repository:

```bash
git clone https://github.com/deniz-oezdemir/Transcendence
cd Transcendence
```

https://github.com/user-attachments/assets/098bcf9d-22a0-4d49-88a3-0a241945e245



2. Build the project:

```bash
make
```

3. Open your browser and go to:

```
http://localhost:8443
```
4. Accept the risk of a self-signed certificate when prompted by your browser.

5. Create a user account.

6. Log in with your new account.

7. Play a match against the AI or a local opponent.

Enjoy the game!

## Userflow

The userflow diagram illustrates how players can interact with the application.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="diagrams/userflow.svg">
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/userflow_dark.svg">
  <img alt="Userflow Diagram" src="diagrams/userflow.svg">
</picture>

## Microservices Architecture

The architecture diagram below explains how the microservices communicate and work together to deliver the application's functionality.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="diagrams/microservices.svg">
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/microservices_dark.svg">
  <img alt="Microservices Architecture Diagram" src="diagrams/microservices_architecture.svg">
</picture>

## Database Model

The database model outlines how data is structured and managed within the application. It ensures efficient storage, retrieval, and relationships between different entities.

<picture>
  <source media="(prefers-color-scheme: light)" srcset="diagrams/databases.svg">
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/databases_dark.svg">
  <img alt="Database Model Diagram" src="diagrams/database_model.svg">
</picture>

## Further Documentation per Microservice

For detailed information about each microservice, refer to the respective documentation:

- [Dockerization](https://github.com/deniz-oezdemir/Transcendence/blob/main/Dockerization%20README.md)
- [Frontend](https://github.com/deniz-oezdemir/Transcendence/blob/main/frontend/README.md)
- [User Access Management](https://github.com/deniz-oezdemir/Transcendence/blob/main/user-access-management/README.md)
- [Matchmaking](https://github.com/deniz-oezdemir/Transcendence/blob/main/matchmaking/README.md)
- [Pong API](https://github.com/deniz-oezdemir/Transcendence/blob/main/pong-api/README.md)
- [AI Opponent](https://github.com/deniz-oezdemir/Transcendence/blob/main/ai-opponent/README.md)
- [Game History](https://github.com/deniz-oezdemir/Transcendence/blob/main/game-history/README.md)

## Sources

- [Django Tutorial](https://docs.djangoproject.com/en/.1/intro/tutorial01/)
- [Bootstrap Introduction](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
