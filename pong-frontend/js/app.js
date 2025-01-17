document.addEventListener("DOMContentLoaded", function() {
	const toggleGameBtn = document.getElementById("toggleGameBtn");
	const messagesList = document.getElementById("messagesList");
	let gameId = null; // Initialize gameId as null
	let ws;

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
				if (data && data.id) {
					gameId = data.id;
					console.log("Game exists:", data);
				} else {
					console.error("Invalid game data:", data);
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
			body: JSON.stringify({
				id: 1,
				max_score: 3,
				player_1_id: 1,
				player_1_name: "PlayerOne",
				player_2_id: 2,
				player_2_name: "PlayerTwo"
			}),
		})
			.then((response) => response.json())
			.then((data) => {
				if (data && data.id) {
					gameId = data.id;
					console.log("Game created:", data);
				} else {
					console.error("Invalid game data:", data);
				}
			})
			.catch((error) => console.error("Error:", error));
	}

	// Check if the game exists on page load
	checkGame();

	toggleGameBtn.addEventListener("click", function() {
		if (gameId === null) {
			console.error("Game ID is not set.");
			return;
		}

		console.log("Toggling game state for game ID:", gameId);

		fetch(`http://localhost:8000/game/toggle_game/${gameId}/`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((response) => response.json())
			.then((data) => {
				console.log("Toggle game response:", data);
				if (data && typeof data.is_game_running !== 'undefined') {
					if (data.is_game_running) {
						toggleGameBtn.textContent = "Stop Game";
						connectWebSocket();
					} else {
						toggleGameBtn.textContent = "Start Game";
						if (ws) {
							ws.close();
						}
					}
				} else {
					console.error("Invalid response data:", data);
				}
			})
			.catch((error) => console.error("Error:", error));
	});

	function connectWebSocket() {
		ws = new WebSocket(`ws://localhost:8000/ws/game/${gameId}/`);

		ws.onopen = function() {
			console.log("WebSocket is connected.");
		};

		ws.onmessage = function(event) {
			const message = JSON.parse(event.data);
			console.log("Message from server:", message);
			const listItem = document.createElement("li");
			listItem.className = "list-group-item";
			listItem.textContent = JSON.stringify(message);
			messagesList.appendChild(listItem);
		};

		ws.onclose = function() {
			console.log("WebSocket is closed.");
		};
	}
});

