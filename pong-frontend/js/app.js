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

	toggleGameBtn.addEventListener("click", function() {
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
