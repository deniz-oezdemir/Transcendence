# Transcendence: Pong Game Web App (Work in Progress)

We aim to develop a full-stack 3D multiplayer Pong game with a microservices architecture.

Key features:

- Real-time remote multiplayer and tournaments
- AI opponents
- Game statistics
- Cross-device compatibility
- Single-page application

## Table of Contents

- [Installation and Usage](#installation-and-usage)
- [Userflow](#userflow)
- [Microservices Architecture](#microservices-architecture)
- [Database Model](#database-model)
- [Frontend overview](#frontend-overview)
- [Sources](#sources)

## Installation and Usage

The project uses Docker Compose for container orchestration. The following Makefile commands help manage the frontend and backend services efficiently.

### Prerequisites

- Install **Docker** and **Docker Compose** on your system.

### Running the Project

To start the project, use:

```sh
make up
```

This command will:

- Start all necessary containers using Docker Compose.

### Stopping the Project

To stop all running containers, use:

```sh
make down
```

This will gracefully stop all services.

### Cleaning Resources

To remove containers, volumes, and orphaned images:

```sh
make clean
```

For a full cleanup, including removing all Docker resources:

```sh
make fclean
```

### Checking Project Status

To view running containers, images, volumes, and networks:

```sh
make status
```

This will provide a detailed overview of all Docker resources used by the project.

### Viewing Logs

To inspect logs for different services:

```sh
make logs
```

This will display logs for:

- Frontend service
- Pong API service
- Matchmaking service
- AI opponent service
- AI messages service

### Restarting the Project

To fully clean and restart the project:

```sh
make re
```

This is equivalent to running `make fclean` followed by `make all`.

## Userflow

<picture>
  <source media="(prefers-color-scheme: light)" srcset="diagrams/userflow.svg">
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/userflow_dark.svg">
  <img alt="Userflow Diagram" src="diagrams/userflow.svg">
</picture>

## Microservices Architecture

<picture>
  <source media="(prefers-color-scheme: light)" srcset="diagrams/microservices.svg">
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/microservices_dark.svg">
  <img alt="Microservices Architecture Diagram" src="diagrams/microservices_architecture.svg">
</picture>

## Database Model

<picture>
  <source media="(prefers-color-scheme: light)" srcset="diagrams/databases.svg">
  <source media="(prefers-color-scheme: dark)" srcset="diagrams/databases_dark.svg">
  <img alt="Database Model Diagram" src="diagrams/database_model.svg">
</picture>

## Frontend Overview

The frontend of the **Transcendence: Pong Game Web App** is a **single-page application (SPA)** built with the following stack and principles:

- **Vanilla JavaScript**: No frameworks, ensuring lightweight and optimized performance.
- **Rollup.js**: A powerful bundler used to efficiently build the application for production.
- **Bootstrap**: For responsive design and consistent UI components.
- **CSS Modules**: To scope styles locally, preventing global CSS conflicts.
- **3D Graphics**: Three js and WebGPU support for 3D rendering.

### Key Features

SPA api includes:

- **Component-based design**: Reusable components are built with `createComponent` for structured and clean development.
- **Reactivity system**: Powered by `createSignal` and `createEffect` to manage state and side effects efficiently.
- **Event handling and cleanup**: Uses `createCleanupContext()` to ensure proper resource management and event unsubscriptions.
- **Modular styling**: CSS Modules ensure that styles are scoped per component, maintaining code clarity and avoiding style leakage.

Three js:

- **WebGPU**: Utilizes the WebGPU API for high-performance 3D rendering.
- **Dynamic Environment**: Ocean and sky generated with shaders.
- **Simulation of the solar cycle**: Uses the time of day to change the lighting and environment, every 30 seconds the sun position updates as if 30 min have passed.
- **Advance visual Effects**: Ball interaction effect with shaders and glow post-processing effects.

### Documentation

- [How to Start](frontend/docs/HowToStart.md): Project installation, running instructions, and how to start working with the SPA.
- [Settings](frontend/docs/Settings.md): Configuration details and project settings.
- [Reactivity System](frontend/docs/ReactivitySystem.md): Details on `createSignal`, `createEffect`, and more.
- [Component System](frontend/docs/ComponentSystem.md): Usage of `createComponent` and helper methods.
- [Router](frontend/docs/Router.md): Setting up and managing routes in the application.
- [Project Structure](frontend/docs/ProjectStructure.md): Structure of the project and how to organize code.

## Sources

[Django Tutorial](https://docs.djangoproject.com/en/.1/intro/tutorial01/)

- Part 1 to 4: Definitely recommended
- Part 2 to 8: Revisit for automated testing, debugging, etc.

[Bootstrap Introduction](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
