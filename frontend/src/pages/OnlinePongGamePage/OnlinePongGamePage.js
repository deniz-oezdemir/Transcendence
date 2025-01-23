import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';

import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';

import styles from './OnlinePongGamePage.module.css';

let BASE_GAME_WIDTH;
let BASE_GAME_HEIGHT;
let BASE_PADDLE_WIDTH;
let BASE_PADDLE_HEIGHT;
let BASE_PADDLES_POSITIONS;
let BASE_BALL_SIZE;
let BASE_BALL_POSITION;
let BASE_BALL_DIRECTION;

function getGameScaleFactor(serverGameDimensions) {
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Define base aspect ratio
  const baseAspectRatio = BASE_GAME_WIDTH / BASE_GAME_HEIGHT;

  let gameWidth, gameHeight;

  // Try fitting to window width first
  gameWidth = windowWidth * 0.6; // 60% of window width
  gameHeight = gameWidth / baseAspectRatio;

  // If height exceeds window height, recalculate based on height
  if (gameHeight > windowHeight * 0.8) {
    gameHeight = windowHeight * 0.8; // 80% of window height
    gameWidth = gameHeight * baseAspectRatio;
  }

  // Calculate scale factor
  const scaleFactor = gameWidth / BASE_GAME_WIDTH;

  return {
    // Game dimensions
    gameWidth: Math.floor(gameWidth),
    gameHeight: Math.floor(gameHeight),

    // Paddle calculations
    paddleWidth: Math.floor(BASE_PADDLE_WIDTH * scaleFactor),
    paddleHeight: Math.floor(BASE_PADDLE_HEIGHT * scaleFactor),
    player1Position: Math.floor(BASE_PADDLES_POSITIONS.p1 * scaleFactor),
    player2Position: Math.floor(BASE_PADDLES_POSITIONS.p2 * scaleFactor),

    // Ball calculations
    ballSize: Math.floor(BASE_BALL_SIZE * scaleFactor),
    ballPosition: {
      x: Math.floor(BASE_BALL_POSITION.x * scaleFactor),
      y: Math.floor(BASE_BALL_POSITION.y * scaleFactor),
    },
    ballDirection: {
      x: Math.floor(BASE_BALL_DIRECTION.x * scaleFactor),
      y: Math.floor(BASE_BALL_DIRECTION.y * scaleFactor),
    },

    scaleFactor: scaleFactor,
  };
}

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
  const [ballSize, setBallSize] = createSignal({ x: 20, y: 20 });
  const [playersInfo, setPlayersInfo] = createSignal({
    player1: { id: -1, name: 'Player One' },
    player2: { id: -1, name: 'Player Two' },
  });
  const [positionPlayer1, setPositionPlayer1] = createSignal(160);
  const [positionPlayer2, setPositionPlayer2] = createSignal(160);
  const [paddleSize, setPaddleSize] = createSignal({ x: 10, y: 80 });
  const [paddleOffset, setPaddleOffset] = createSignal(20);
  const [scorePlayer1, setScorePlayer1] = createSignal(0);
  const [scorePlayer2, setScorePlayer2] = createSignal(0);
  const [maxScore, setMaxScore] = createSignal(0);
  const [isGameEnded, setIsGameEnded] = createSignal(false);
  const [gameSize, setGameSize] = createSignal({ x: 600, y: 400 });

  createEffect(async () => {
    if (gameId() < 0) {
      setIsLoading(true);
      const data = await fetchCreateGame();
      if (!data) {
        await fetchDeleteGame(1);
        return;
      }
      BASE_GAME_WIDTH = data.game_width;
      BASE_GAME_HEIGHT = data.game_height;
      BASE_PADDLE_WIDTH = data.paddle_width;
      BASE_PADDLE_HEIGHT = data.paddle_height;
      BASE_PADDLES_POSITIONS = {
        p1: data.player_1_position,
        p2: data.player_2_position,
      };
      BASE_BALL_SIZE = 20;
      BASE_BALL_POSITION = { x: data.ball_x_position, y: data.ball_y_position };
      BASE_BALL_DIRECTION = {
        x: data.ball_x_direction,
        y: data.ball_y_direction,
      };

      // Adapt server dimensions to browser size
      const gameDimensions = getGameScaleFactor({
        x: data.game_width,
        y: data.game_height,
      });

      setGameSize({
        x: gameDimensions.gameWidth,
        y: gameDimensions.gameHeight,
      });
      setPaddleSize({
        x: gameDimensions.paddleWidth,
        y: gameDimensions.paddleHeight,
      });
      setPaddleOffset(gameDimensions.paddleWidth * 2);
      setPositionPlayer1(gameDimensions.player1Position);
      setPositionPlayer2(gameDimensions.player2Position);
      setBallPosition({
        top: gameDimensions.ballPosition.y,
        left: gameDimensions.ballPosition.x,
      });
      setBallDirection({
        x: gameDimensions.ballDirection.x,
        y: gameDimensions.ballDirection.y,
      });
      setBallSize(gameDimensions.ballSize);

      setGameId(data.id);
      setIsGameRunning(data.is_game_running);
      setIsGameEnded(data.is_game_ended);
      setPlayersInfo({
        player1: { id: data.player_1_id, name: data.player_1_name },
        player2: { id: data.player_2_id, name: data.player_2_name },
      });
      setScorePlayer1(data.player_1_score);
      setScorePlayer2(data.player_2_score);
      setMaxScore(data.max_score);
      console.log(`
				gameId: ${gameId()},
				isGameRunning: ${isGameRunning()},
				isGameEnded: ${isGameEnded()},
				ballPosition: top=${ballPosition().top}, left=${ballPosition().left},
				ballDirection: x=${ballDirection().x}, y=${ballDirection().y},
				ballSize: ${ballSize()},
				positionPlayer1: ${positionPlayer1()},
				positionPlayer2: ${positionPlayer2()},
				paddleSize: x=${paddleSize().x}, y=${paddleSize().y},
				paddleOffset: ${paddleOffset()},
				playersInfo: player1=[${playersInfo().player1.id}]${playersInfo().player1.name}, player2=[${playersInfo().player2.id}]${playersInfo().player2.name},
				scorePlayer1: ${scorePlayer1()},
				scorePlayer2: ${scorePlayer2()},
				maxScore: ${maxScore()},
				gameSize: x=${gameSize().x}, y=${gameSize().y},
  	`);
      setIsLoading(false);
    }
  });

  const toogleGame = async () => {
    if (!isLoading()) {
      const data = await fetchToggleGame(gameId());
      console.log(data);
      setIsGameRunning(data.is_game_running);
    }
  };

  // Signals

  let ballInterval = null;

  // const startBallMovement = () => {
  //   if (ballInterval) return;
  //   setIsGameRunning(true);
  //   ballInterval = setInterval(() => {
  //     setBallPosition(handleball());
  //   }, 16);
  // };

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

  // const handleball = () => {
  //   const pos = ballPosition();
  //   const direction = ballDirection();
  //   const newTop = pos.top + direction.y;
  //   const newLeft = pos.left + direction.x;

  //   // Bounce off top and bottom walls
  //   if (newTop <= 0 || newTop >= 380) {
  //     setBallDirection({ x: direction.x, y: direction.y * -1 });
  //   }

  //   // Paddle collision
  //   const left = positionPlayer1();
  //   const right = positionPlayer2();
  //   if (
  //     (newLeft <= 20 && newTop >= left && newTop <= left + 80) ||
  //     (newLeft >= 555 && newTop >= right && newTop <= right + 80)
  //   ) {
  //     const currentDirection = ballDirection();

  //     // Increment or decrement speed
  //     const newDirection = {
  //       x:
  //         currentDirection.x > 0
  //           ? currentDirection.x + 0.333
  //           : currentDirection.x - 0.333,
  //       y:
  //         currentDirection.y > 0
  //           ? currentDirection.y + 0.333
  //           : currentDirection.y - 0.333,
  //     };

  //     // Reverse the x direction to reflect the ball
  //     setBallDirection({ x: newDirection.x * -1, y: newDirection.y });
  //   }

  //   // Out of bounds
  //   if (newLeft <= 0) {
  //     setScorePlayer2(scorePlayer2() + 1);
  //     resetBallPosition();
  //     return ballPosition();
  //   }

  //   if (newLeft >= 600) {
  //     setScorePlayer1(scorePlayer1() + 1);
  //     resetBallPosition();
  //     return ballPosition();
  //   }

  //   return { top: newTop, left: newLeft };
  // };

  // Keydown handler
  const handleKeyDown = (e) => {
    e.preventDefault();
    const gs = gameSize();
    const ps = paddleSize();
    if (e.key === 'ArrowUp') {
      setPositionPlayer2(Math.max(0, positionPlayer2() - 15));
    } else if (e.key === 'ArrowDown') {
      setPositionPlayer2(Math.min(gs.y - ps.y, positionPlayer2() + 15));
    } else if (e.key === 'w') {
      setPositionPlayer1(Math.max(0, positionPlayer1() - 15));
    } else if (e.key === 's') {
      setPositionPlayer1(Math.min(gs.y - ps.y, positionPlayer1() + 15));
    } else if (e.key === ' ') {
      // if (isGameRunning()) {
      //   resetBallPosition();
      // } else {
      toogleGame();
      // startBallMovement();
      // }
    }
  };

  const handleResize = () => {
    const gameDimensions = getGameScaleFactor({
      x: BASE_GAME_WIDTH,
      y: BASE_GAME_HEIGHT,
    });

    setGameSize({
      x: gameDimensions.gameWidth,
      y: gameDimensions.gameHeight,
    });
    setPaddleSize({
      x: gameDimensions.paddleWidth,
      y: gameDimensions.paddleHeight,
    });
    setPaddleOffset(gameDimensions.paddleWidth * 2);
    setPositionPlayer1(gameDimensions.player1Position);
    setPositionPlayer2(gameDimensions.player2Position);
    setBallPosition({
      top: gameDimensions.ballPosition.y,
      left: gameDimensions.ballPosition.x,
    });
    setBallDirection({
      x: gameDimensions.ballDirection.x,
      y: gameDimensions.ballDirection.y,
    });
    setBallSize(gameDimensions.ballSize);
  };

  // Attach event listener
  window.addEventListener('resize', handleResize);
  window.addEventListener('keydown', handleKeyDown);

  // Cleanup listeners and intervals
  onCleanup(async () => {
    await fetchDeleteGame(gameId);
    ws.close();
    stopBallMovement();
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('resize', handleResize);
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
    const board = GameBoard({
      gameSize: gameSize,
      ballSize: ballSize,
      ballPosition: ballPosition,
      positionPlayer1: positionPlayer1,
      positionPlayer2: positionPlayer2,
      paddleSize: paddleSize,
      paddleOffset: paddleOffset,
    });
    const controls = GameControls();
    content.element.appendChild(score.element);
    content.element.appendChild(board.element);
    content.element.appendChild(controls.element);
    return content;
  };

  const [pageContent, setPageContent] = createSignal(loadingElement());

  createEffect(() => {
    if (!isLoading()) {
      setPageContent(gameElement());
    } else {
      setPageContent(loadingElement());
    }
  });

  return createComponent('div', {
    content: pageContent,
    cleanup,
  });
}
