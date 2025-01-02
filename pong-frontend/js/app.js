document.addEventListener("DOMContentLoaded", function () {
  const toggleGameBtn = document.getElementById("toggleGameBtn");
  const messagesList = document.getElementById("messagesList");
  const gameCanvas = document.getElementById("gameCanvas");
  const ctx = gameCanvas.getContext("2d");
  const player1Name = document.getElementById("player1Name");
  const player2Name = document.getElementById("player2Name");
  const player1Score = document.getElementById("player1Score");
  const player2Score = document.getElementById("player2Score");
  const roundCounter = document.getElementById("roundCounter");
  const maxScore = document.getElementById("maxScore");
  let gameId = null; // Initialize gameId as null
  let ws;

  // Hardcoded game state to test frontend
  const hardcodedGameState = {
    id: 1,
    max_score: 3,
    is_game_running: false,
    is_game_ended: false,
    players: [
      {
        player: 1,
        player_name: "Kaan",
        player_position: 150,
        player_direction: 150,
        player_score: 0
      },
      {
        player: 2,
        player_name: "Seba",
        player_position: 150,
        player_direction: 150,
        player_score: 0
      }
    ],
    ball_x_position: 400,
    ball_y_position: 200,
    ball_x_velocity: 30,
    ball_y_velocity: 30
  };

  // Function to check if the game exists
  function checkGame() {
    fetch(`http://localhost:8000/game/get_game_state/1/`)
      .then((response) => {
        if (response.status === 404) {
          return createGame();
        }
        return response.json();
      })
      .then((data) => {
        if (data) {
          gameId = data.id;
          console.log("Game exists:", data);
        }
      })
      .catch((error) => console.error("Error:", error));
  }

  // Function to create a new game
  function createGame() {
    return fetch("http://localhost:8000/game/create_game/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_score: 3 }),
    })
      .then((response) => response.json())
      .then((data) => {
        gameId = data.id;
        console.log("Game created:", data);
      })
      .catch((error) => console.error("Error:", error));
  }

  // Check if the game exists on page load
  checkGame();

  toggleGameBtn.addEventListener("click", function () {
    if (gameId === null) {
      console.error("Game ID is not set.");
      return;
    }

    fetch(`http://localhost:8000/game/toggle_game/${gameId}/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.is_game_running) {
          toggleGameBtn.textContent = "Stop Game";
          connectWebSocket();
        } else {
          toggleGameBtn.textContent = "Start Game";
          if (ws) {
            ws.close();
          }
        }
      })
      .catch((error) => console.error("Error:", error));
  });

  function connectWebSocket() {
    ws = new WebSocket(`ws://localhost:8000/ws/game/${gameId}/`);

    ws.onopen = function () {
      console.log("WebSocket is connected.");
    };

    ws.onmessage = function (event) {
      const message = JSON.parse(event.data);
      console.log("Message from server:", message);
      const listItem = document.createElement("li");
      listItem.className = "list-group-item";
      listItem.textContent = JSON.stringify(message);
      messagesList.appendChild(listItem);

      if (message.type === "game_state_update") {
        drawGameState(message.state);
      }
    };

    ws.onclose = function () {
      console.log("WebSocket is closed.");
    };
  }

  function drawGameState(state) {
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);

    // Draw ball
    ctx.beginPath();
    ctx.arc(state.ball_x_position, state.ball_y_position, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();

    // Draw players
    state.players.forEach(player => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(10, player.player_position, 10, 100); // Player 1
      ctx.fillRect(gameCanvas.width - 20, player.player_position, 10, 100); // Player 2
    });

    // Update player names and scores if a player scored
    if (state.is_game_ended || state.players.some(player => player.player_score > 0)) {
      updatePlayerInfo(state);
    }
  }

  function updatePlayerInfo(state) {
    player1Name.textContent = state.players[0].player_name;
    player2Name.textContent = state.players[1].player_name;
    player1Score.textContent = `Score: ${state.players[0].player_score}`;
    player2Score.textContent = `Score: ${state.players[1].player_score}`;
    roundCounter.textContent = state.players[0].player_score + state.players[1].player_score + 1;
    maxScore.textContent = state.max_score;
  }

  // Draw the hardcoded game state for testing
  updatePlayerInfo(hardcodedGameState);
  drawGameState(hardcodedGameState);
});
