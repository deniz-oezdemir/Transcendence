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

export default function OnlinePongGamePage({ navigate }) {
  const cleanup = createCleanupContext();

  const [isLoading, setIsLoading] = createSignal(true);
  const [isGameRunning, setIsGameRunning] = createSignal(false);
  const [gameId, setGameId] = createSignal(-1);
  const [gameDimensions, setGameDimensions] = createSignal({
    game: { width: 600, height: 400 },
    paddle: { width: 10, height: 80, offset: 20 },
    ball: { width: 20, height: 20 },
    scaleFactor: 1,
  });
  const [gamePositions, setGamePositions] = createSignal({
    ball: { x: 290, y: 190 },
    ballDirection: { x: 3, y: 3 },
    player1Position: 160,
    player2Position: 160,
  });
  const [gameScore, setGameScore] = createSignal({
    player1: { score: 0 },
    player2: { score: 0 },
    maxScore: 3,
    players: {
      player1: { id: -1, name: 'Player One' },
      player2: { id: -1, name: 'Player Two' },
    },
  });
  const [websocket, setWebsocket] = createSignal(null);
  const [isGameEnded, setIsGameEnded] = createSignal(false);

  // Responsive Dimension Calculation
  function calculateResponsiveDimensions(originalDimensions) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const aspectRatio =
      originalDimensions.game.width / originalDimensions.game.height;

    let gameWidth = windowWidth * 0.6;
    let gameHeight = gameWidth / aspectRatio;

    if (gameHeight > windowHeight * 0.8) {
      gameHeight = windowHeight * 0.8;
      gameWidth = gameHeight * aspectRatio;
    }

    const scaleFactor = gameWidth / originalDimensions.game.width;

    return {
      game: {
        width: Math.floor(gameWidth),
        height: Math.floor(gameHeight),
      },
      paddle: {
        width: Math.floor(originalDimensions.paddle.width * scaleFactor),
        height: Math.floor(originalDimensions.paddle.height * scaleFactor),
        offset: Math.floor(originalDimensions.paddle.offset * scaleFactor),
      },
      ball: {
        width: Math.floor(originalDimensions.ball.width * scaleFactor),
        height: Math.floor(originalDimensions.ball.heght * scaleFactor),
      },
      scaleFactor: scaleFactor,
    };
  }

  // Setup Responsive Resize Listener
  function setupResizeListener() {
    const handleResize = () => {
      setGameDimensions((prevDimensions) =>
        calculateResponsiveDimensions(prevDimensions)
      );
    };

    window.addEventListener('resize', handleResize);

    onCleanup(() => {
      window.removeEventListener('resize', handleResize);
    });
  }

  async function initializeGame() {
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
        await endGame(1);
        throw new Error(
          `Failure to create game: ${response.status} ${response.statusText}`
        );
      }

      const gameData = await response.json();

      // Calculate Responsive Dimensions
      const responsiveDimensions = calculateResponsiveDimensions({
        game: {
          width: gameData.game_width,
          height: gameData.game_height,
        },
        paddle: {
          width: gameData.paddle_width,
          height: gameData.paddle_height,
          offset: gameData.paddle_offset,
        },
        ball: {
          width: 20,
          height: 20,
        },
        scaleFactor: 1,
      });

      // Update Game State
      setGameId(gameData.id);
      setGameDimensions(responsiveDimensions);

      setGamePositions({
        ball: {
          x: Math.floor(
            gameData.ball_x_position * responsiveDimensions.scaleFactor
          ),
          y: Math.floor(
            gameData.ball_y_position * responsiveDimensions.scaleFactor
          ),
        },
        ballDirection: {
          x: gameData.ball_x_direction,
          y: gameData.ball_y_direction,
        },
        player1Position: Math.floor(
          gameData.player_1_position * responsiveDimensions.scaleFactor
        ),
        player2Position: Math.floor(
          gameData.player_2_position * responsiveDimensions.scaleFactor
        ),
      });

      setGameScore({
        player1: { score: 0 },
        player2: { score: 0 },
        maxScore: gameData.max_score,
        players: {
          player1: {
            id: gameData.player_1_id,
            name: gameData.player_1_name,
          },
          player2: {
            id: gameData.player_2_id,
            name: gameData.player_2_name,
          },
        },
      });
      console.log('Create Game: Success:', gameData);

      setupResizeListener();
    } catch (error) {
      console.error('Game initialization failed:', error);
    }
  }

  async function toogleGame() {
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

      const updatedGameState = await response.json();
      setIsGameRunning(updatedGameState.is_game_running);
      console.log('Toggle Game: Success:', updatedGameState);

      if (updatedGameState.isRunning) {
        if (!websocket()) connectWebSocket();
      }
    } catch (error) {
      console.error('Toggle game failed:', error);
    }
  }

  async function endGame(id) {
    try {
      const response = await fetch(
        'http://localhost:8000/game/delete_game/' + id + '/',
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

      if (websocket()) {
        websocket().close();
        setWebsocket(null);
      }
      console.log('WebSocket closed.');

      navigate('/');
      return true;
    } catch (error) {
      console.error('Game deletion failed:', error);
      return false;
    }
  }

  // WebSocket Connection
  function connectWebSocket() {
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${gameId()}/`);
    console.log('ws: ', ws);
    ws.onopen = () => {
      console.log('WebSocket connected.');
      setWebsocket(ws);
    };

    ws.onmessage = function (event) {
      const data = JSON.parse(event.data);
      console.log('Data from server:', data);
    };

    ws.onclose = async () => {
      console.log('WebSocket Disconnected.');
      setWebsocket(null);
      await fetchDeleteGame(gameId());
    };

    onCleanup(() => {
      ws.close();
    });
  }

  // Game Initialization Effect
  createEffect(() => {
    setIsLoading(true);
    initializeGame();
    setIsLoading(false);
  });

  // createEffect(async () => {
  //   if (gameId() < 0) {
  //     setIsLoading(true);
  //     const data = await fetchCreateGame();
  //     if (!data) {
  //       await fetchDeleteGame(1);
  //       return;
  //     }
  //     BASE_GAME_WIDTH = data.game_width;
  //     BASE_GAME_HEIGHT = data.game_height;
  //     BASE_PADDLE_WIDTH = data.paddle_width;
  //     BASE_PADDLE_HEIGHT = data.paddle_height;
  //     BASE_PADDLES_POSITIONS = {
  //       p1: data.player_1_position,
  //       p2: data.player_2_position,
  //     };
  //     BASE_BALL_SIZE = 20;
  //     BASE_BALL_POSITION = { x: data.ball_x_position, y: data.ball_y_position };
  //     BASE_BALL_DIRECTION = {
  //       x: data.ball_x_direction,
  //       y: data.ball_y_direction,
  //     };

  //     // Adapt server dimensions to browser size
  //     const gameDimensions = getGameScaleFactor({
  //       x: data.game_width,
  //       y: data.game_height,
  //     });

  //     setGameSize({
  //       x: gameDimensions.gameWidth,
  //       y: gameDimensions.gameHeight,
  //     });
  //     setPaddleSize({
  //       x: gameDimensions.paddleWidth,
  //       y: gameDimensions.paddleHeight,
  //     });
  //     setPaddleOffset(gameDimensions.paddleWidth * 2);
  //     setPositionPlayer1(gameDimensions.player1Position);
  //     setGamePositions(gameDimensions.player2Position);
  //     setBallPosition({
  //       top: gameDimensions.ballPosition.y,
  //       left: gameDimensions.ballPosition.x,
  //       C,
  //     });
  //     setBallDirection({
  //       x: gameDimensions.ballDirection.x,
  //       y: gameDimensions.ballDirection.y,
  //     });
  //     setBallSize(gameDimensions.ballSize);

  //     setGameId(data.id);
  //     setIsGameRunning(data.is_game_running);
  //     setIsGameEnded(data.is_game_ended);
  //     setPlayersInfo({
  //       player1: { id: data.player_1_id, name: data.player_1_name },
  //       player2: { id: data.player_2_id, name: data.player_2_name },
  //     });
  //     setScorePlayer1(data.player_1_score);
  //     setScorePlayer2(data.player_2_score);
  //     setMaxScore(data.max_score);
  //     console.log(`
  // 		gameId: ${gameId()},
  // 		isGameRunning: ${isGameRunning()},
  // 		isGameEnded: ${isGameEnded()},
  // 		ballPosition: top=${ballPosition().top}, left=${ballPosition().left},
  // 		ballDirection: x=${ballDirection().x}, y=${ballDirection().y},
  // 		ballSize: ${ballSize()},
  // 		positionPlayer1: ${positionPlayer1()},
  // 		positionPlayer2: ${positionPlayer2()},
  // 		paddleSize: x=${paddleSize().x}, y=${paddleSize().y},
  // 		paddleOffset: ${paddleOffset()},
  // 		playersInfo: player1=[${playersInfo().player1.id}]${playersInfo().player1.name}, player2=[${playersInfo().player2.id}]${playersInfo().player2.name},
  // 		scorePlayer1: ${scorePlayer1()},
  // 		scorePlayer2: ${scorePlayer2()},
  // 		maxScore: ${maxScore()},
  // 		gameSize: x=${gameSize().x}, y=${gameSize().y},
  // 	`);
  //     setIsLoading(false);
  //   }
  // });

  // const toogleGame = async () => {
  //   if (!isLoading()) {
  //     const data = await fetchToggleGame(gameId());
  //     console.log(data);
  //     setIsGameRunning(data.is_game_running);
  //   }
  // };

  // Signals

  // let ballInterval = null;

  // const startBallMovement = () => {
  //   if (ballInterval) return;
  //   setIsGameRunning(true);
  //   ballInterval = setInterval(() => {
  //     setBallPosition(handleball());
  //   }, 16);
  // };

  // const stopBallMovement = () => {
  //   if (!ballInterval) return;
  //   clearInterval(ballInterval);
  //   ballInterval = null;
  //   setIsGameRunning(false);
  // };

  // const resetBallPosition = () => {
  //   stopBallMovement();
  //   setBallPosition({ top: 200, left: 296 });
  //   setBallDirection({ x: 2, y: 2 });
  // };

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
    const d = gameDimensions();
    if (e.key === 'ArrowUp') {
      setGamePositions((prevPositions) => ({
        ...prevPositions,
        player2Position: Math.max(0, prevPositions.player2Position - 15),
      }));
    } else if (e.key === 'ArrowDown') {
      setGamePositions((prevPositions) => ({
        ...prevPositions,
        player2Position: Math.min(
          d.game.height - d.paddle.height,
          prevPositions.player2Position + 15
        ),
      }));
    } else if (e.key === 'w') {
      setGamePositions((prevPositions) => ({
        ...prevPositions,
        player1Position: Math.max(0, prevPositions.player1Position - 15),
      }));
    } else if (e.key === 's') {
      setGamePositions((prevPositions) => ({
        ...prevPositions,
        player1Position: Math.min(
          d.game.height - d.paddle.height,
          prevPositions.player1Position + 15
        ),
      }));
    } else if (e.key === ' ') {
      // if (isGameRunning()) {
      //   resetBallPosition();
      // } else {
      toogleGame();
      // startBallMovement();
      // }
    } else if (e.key === 'Escape') {
      endGame(gameId());
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Cleanup listeners and intervals
  onCleanup(async () => {
    await endGame(gameId());
    window.removeEventListener('keydown', handleKeyDown);
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
    const score = Score({ gameScore });
    const board = GameBoard({
      gameDimensions: gameDimensions,
      gamePositions: gamePositions,
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
