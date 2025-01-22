import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';

import Score from '@/components/Score/Score';
import Paddle from '@/components/Paddle/Paddle';
import Ball from '@/components/Ball/Ball';
import GameControls from '@/components/GameControls/GameControls';

import styles from './OnlinePongGamePage.module.css';

async function fetchCreateGame() {
  try {
    const response = await fetch('http://localhost:8000/game/create_game/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: 1,
        max_score: 3,
        player_1_id: 1,
        player_1_name: 'PlayerOne',
        player_2_id: 2,
        player_2_name: 'PlayerTwo',
      }),
    });

    if (!response.ok) {
      throw new Error(
        `Failure to create game: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('Create Game: Success:', data);
    return data;
  } catch (error) {
    console.error(error);
  }
}

async function fetchDeleteGame(gameId) {
  try {
    const response = await fetch(
      'http://localhost:8000/game/delete_game/' + gameId + '/',
      {
        method: 'DELETE',
      }
    );

    if (response.ok) {
      console.log('Delete Game: Success:', response);
    } else {
      throw new Error(
        `Failure to delete game: ${response.status} ${response.statusText}`
      );
    }
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

// fetch(`http://localhost:8000/game/toggle_game/${gameId}/`, {

async function fetchToggleGame(gameId) {
  try {
    const response = await fetch(
      `http://localhost:8000/game/toggle_game/${gameId}/`,
      {
        method: 'PUT',
      }
    );
    if (!response.ok) {
      throw new Error(
        `Failure to toggle game: ${response.status} ${response.statusText}`
      );
    }
    const data = await response.json();
    console.log('Toggle Game: Success:', data);
    return data;
  } catch (error) {
    console.error(error);
  }
}

function connectWebSocket() {
  const ws = new WebSocket(`ws://localhost:8000/ws/game/${gameId}/`);
  console.log('ws: ', ws);
  ws.onopen = () => {
    console.log('WebSocket is connected.');
  };

  ws.onmessage = function (event) {
    const message = JSON.parse(event.data);
    console.log('Message from server:', message);
  };
  ws.onclose = async () => {
    console.log('WebSocket is closed.');
    await fetchDeleteGame(gameId);
  };
}

export default function OnlinePongGamePage() {
  const cleanup = createCleanupContext();

  const [isLoading, setIsLoading] = createSignal(true);
  const [gameId, setGameId] = createSignal(-1);
  const [isGameRunning, setIsGameRunning] = createSignal(false);
  const [ballPosition, setBallPosition] = createSignal({ top: 192, left: 292 });
  const [ballDirection, setBallDirection] = createSignal({ x: 2, y: 2 });
  const [playersInfo, setPlayersInfo] = createSignal({
    player1: { id: -1, name: 'Player One' },
    player2: { id: -1, name: 'Player Two' },
  });
  const [positionPlayer1, setPositionPlayer1] = createSignal(160);
  const [positionPlayer2, setPositionPlayer2] = createSignal(160);
  const [scorePlayer1, setScorePlayer1] = createSignal(0);
  const [scorePlayer2, setScorePlayer2] = createSignal(0);
  const [maxScore, setMaxScore] = createSignal(0);
  const [isGameEnded, setIsGameEnded] = createSignal(false);

  createEffect(async () => {
    if (gameId() < 0) {
      setIsLoading(true);
      const data = await fetchCreateGame();
      // setIsLoading(false);
      if (!data) return;
      setGameId(data.id);
      setIsGameRunning(data.is_game_running);
      setIsGameEnded(data.is_game_ended);
      setBallPosition({
        top: data.ball_y_position,
        left: data.ball_x_position,
      });
      setBallDirection({ x: data.ball_x_velocity, y: data.ball_y_velocity });
      setPlayersInfo({
        player1: { id: data.player_1_id, name: data.player_1_name },
        player2: { id: data.player_2_id, player_2_name: data.player_2_name },
      });
      setPositionPlayer1(data.player_1_position);
      setPositionPlayer2(data.player_2_position);
      setScorePlayer1(data.player_1_score);
      setScorePlayer2(data.player_2_score);
      setMaxScore(data.max_score);
      console.log(`
  		gameId: ${gameId()},
  		isGameRunning: ${isGameRunning()},
  		isGameEnded: ${isGameEnded()},
  		ballPosition: ${ballPosition()},
  		ballDirection: ${ballDirection()},
  		playersInfo: ${playersInfo()},
  		positionPlayer1: ${positionPlayer1()},
  		positionPlayer2: ${positionPlayer2()},
  		scorePlayer1: ${scorePlayer1()},
  		scorePlayer2: ${scorePlayer2()},
  		maxScore: ${maxScore()}
  	`);
      setIsLoading(false);
    }
  });

  createEffect(async () => {
    if (!isLoading()) {
      const data = await fetchToggleGame(gameId());
      console.log(data);
      setIsGameRunning(data.is_game_running);
    }
  });

  // Signals

  let ballInterval = null;

  const startBallMovement = () => {
    if (ballInterval) return;
    setIsGameRunning(true);
    ballInterval = setInterval(() => {
      setBallPosition(handleball());
    }, 16);
  };

  const stopBallMovement = () => {
    if (!ballInterval) return;
    clearInterval(ballInterval);
    ballInterval = null;
    setIsGameRunning(false);
  };

  const resetBallPosition = () => {
    stopBallMovement();
    setBallPosition({ top: 200, left: 296 });
    setBallDirection({ x: 2, y: 2 });
  };

  const handleball = () => {
    const pos = ballPosition();
    const direction = ballDirection();
    const newTop = pos.top + direction.y;
    const newLeft = pos.left + direction.x;

    // Bounce off top and bottom walls
    if (newTop <= 0 || newTop >= 380) {
      setBallDirection({ x: direction.x, y: direction.y * -1 });
    }

    // Paddle collision
    const left = positionPlayer1();
    const right = positionPlayer2();
    if (
      (newLeft <= 20 && newTop >= left && newTop <= left + 80) ||
      (newLeft >= 555 && newTop >= right && newTop <= right + 80)
    ) {
      const currentDirection = ballDirection();

      // Increment or decrement speed
      const newDirection = {
        x:
          currentDirection.x > 0
            ? currentDirection.x + 0.333
            : currentDirection.x - 0.333,
        y:
          currentDirection.y > 0
            ? currentDirection.y + 0.333
            : currentDirection.y - 0.333,
      };

      // Reverse the x direction to reflect the ball
      setBallDirection({ x: newDirection.x * -1, y: newDirection.y });
    }

    // Out of bounds
    if (newLeft <= 0) {
      setScorePlayer2(scorePlayer2() + 1);
      resetBallPosition();
      return ballPosition();
    }

    if (newLeft >= 600) {
      setScorePlayer1(scorePlayer1() + 1);
      resetBallPosition();
      return ballPosition();
    }

    return { top: newTop, left: newLeft };
  };

  // Keydown handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      setPositionPlayer2(Math.max(0, positionPlayer2() - 15));
    } else if (e.key === 'ArrowDown') {
      setPositionPlayer2(Math.min(315, positionPlayer2() + 15));
    } else if (e.key === 'w') {
      setPositionPlayer1(Math.max(0, positionPlayer1() - 15));
    } else if (e.key === 's') {
      setPositionPlayer1(Math.min(315, positionPlayer1() + 15));
    } else if (e.key === ' ') {
      if (isGameRunning()) {
        resetBallPosition();
      } else {
        startBallMovement();
      }
    }
  };

  // Attach event listener
  document.addEventListener('keydown', handleKeyDown);

  // Cleanup listeners and intervals
  onCleanup(async () => {
    await fetchDeleteGame(gameId);
    ws.close();
    stopBallMovement();
    document.removeEventListener('keydown', handleKeyDown);
  });

  const loadingElement = () => {
    const content = createComponent('div', {
      className: `container position-relative`,
    });
    const loading = createComponent('div', {
      className: 'loading',
      content: 'Loading game...',
    });
    content.element.appendChild(loading.element);
    return content;
  };

  const gameElement = () => {
    const content = createComponent('div', {
      className: `container position-relative`,
    });
    const score = Score({ scoreLeft: scorePlayer1, scoreRight: scorePlayer2 });
    const table = createComponent('div', {
      className: `${styles.gameContainer}`,
      children: [
        Ball({ position: ballPosition }),
        Paddle({ position: positionPlayer1, side: 'left' }),
        Paddle({ position: positionPlayer2, side: 'right' }),
      ],
    });
    const controls = GameControls();
    content.element.appendChild(score.element);
    content.element.appendChild(table.element);
    content.element.appendChild(controls.element);
    return content;
  };

  const [content, setContent] = createSignal(loadingElement());

  createEffect(() => {
    if (!isLoading()) {
      setContent(gameElement());
    }
  });

  return createComponent('div', {
    content: content,
    cleanup,
  });
}
