const canvas = document.getElementById('pongCanvas');
const context = canvas.getContext('2d');

let gameState = {};

async function fetchGameState() {
    try {
        const response = await fetch('/update/');
        const data = await response.json();
        gameState = data;
        console.log('Game state fetched:', gameState);
    } catch (error) {
        console.error('Error fetching game state:', error);
    }
}

function draw() {
    // Clear the canvas
    context.clearRect(0, 0, canvas.width, canvas.height);

    // Draw paddles and ball
    context.fillStyle = 'black';
    context.fillRect(10, gameState.player1_y, 10, 100); // Player 1 paddle
    context.fillRect(canvas.width - 20, gameState.player2_y, 10, 100); // Player 2 paddle
    context.beginPath();
    context.arc(gameState.ball_x, gameState.ball_y, 10, 0, Math.PI * 2); // Ball
    context.fill();
}

document.addEventListener('keydown', (event) => {

    let player1_y = gameState.player1_y;
    let player2_y = gameState.player2_y;

    if (event.key === 'w') {
        player1_y = Math.max(0, gameState.player1_y - 10);
    } else if (event.key === 's') {
        player1_y = Math.min(canvas.height - 100, gameState.player1_y + 10);
    } else if (event.key === 'ArrowUp') {
        player2_y = Math.max(0, gameState.player2_y - 10);
    } else if (event.key === 'ArrowDown') {
        player2_y = Math.min(canvas.height - 100, gameState.player2_y + 10);
    }

    // Send updated player positions to the server
    fetch('/update/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            player1_y: player1_y,
            player2_y: player2_y
        }),
    });
});

setInterval(fetchGameState, 40);
setInterval(draw, 1000 / 24);
