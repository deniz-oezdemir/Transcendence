import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';

import WaitingRoom from '@/components/WaitingRoom/WaitingRoom';
import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';

import styles from './PongGamePage.module.css';

export default function PongGamePage() {
  const cleanup = createCleanupContext();

  // Game State Signals
  const [isGameRunning, setIsGameRunning] = createSignal(false);
  const [gameDimensions, setGameDimensions] = createSignal({
    game: { width: 600, height: 400 },
    paddle: { width: 10, height: 80, offset: 20 },
    ball: { width: 20, height: 20 },
    scaleFactor: 1,
  });
  const [gamePositions, setGamePositions] = createSignal({
    ball: { x: 290, y: 190 },
    ballDirection: { x: 2, y: 2 },
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

  let gameLoop = null;

  // Responsive Dimension Calculation
  function calculateResponsiveDimensions(originalDimensions) {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const aspectRatio =
      originalDimensions.game.width / originalDimensions.game.height;

    let gameWidth = windowWidth * 0.5;
    let gameHeight = gameWidth / aspectRatio;

    if (gameHeight > windowHeight * 0.7) {
      gameHeight = windowHeight * 0.7;
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
        height: Math.floor(originalDimensions.ball.height * scaleFactor),
      },
      scaleFactor,
    };
  }

  function updateBallPosition() {
    const positions = gamePositions();
    const dimensions = gameDimensions();
    const { game, paddle } = dimensions;

    const newX = positions.ball.x + positions.ballDirection.x;
    const newY = positions.ball.y + positions.ballDirection.y;

    // Bounce off top and bottom walls
    if (newY <= 0 || newY >= game.height - dimensions.ball.height) {
      setGamePositions((prev) => ({
        ...prev,
        ballDirection: { ...prev.ballDirection, y: prev.ballDirection.y * -1 },
      }));
    }

    // Paddle collision
    const paddleWidth = paddle.width;
    const paddleHeight = paddle.height;
    const paddleOffset = paddle.offset;

    // Left paddle collision
    if (
      newX <= paddleOffset + paddleWidth &&
      newY >= positions.player1Position &&
      newY <= positions.player1Position + paddleHeight
    ) {
      handlePaddleHit('left');
    }

    // Right paddle collision
    if (
      newX >= game.width - paddleOffset - paddleWidth - dimensions.ball.width &&
      newY >= positions.player2Position &&
      newY <= positions.player2Position + paddleHeight
    ) {
      handlePaddleHit('right');
    }

    // Score points
    if (newX <= 0) {
      handleScore('player2');
      return;
    }

    if (newX >= game.width - dimensions.ball.width) {
      handleScore('player1');
      return;
    }

    // Update ball position
    setGamePositions((prev) => ({
      ...prev,
      ball: { x: newX, y: newY },
    }));
  }

  function handlePaddleHit(side) {
    setGamePositions((prev) => ({
      ...prev,
      ballDirection: {
        x: prev.ballDirection.x * -1.2, // Increase speed slightly
        y: prev.ballDirection.y * 1.2,
      },
    }));
  }

  function handleScore(scorer) {
    setGameScore((prev) => ({
      ...prev,
      [scorer]: { score: prev[scorer].score + 1 },
    }));
    resetBall();
  }

  function resetBall() {
    const { width, height } = gameDimensions().game;
    setGamePositions((prev) => ({
      ...prev,
      ball: { x: width / 2 - 10, y: height / 2 - 10 },
      ballDirection: { x: 2, y: 2 },
    }));
  }

  function startGame() {
    if (gameLoop) return;
    setIsGameRunning(true);
    gameLoop = setInterval(updateBallPosition, 16);
  }

  function stopGame() {
    if (!gameLoop) return;
    clearInterval(gameLoop);
    gameLoop = null;
    setIsGameRunning(false);
  }

  function toggleGame() {
    if (isGameRunning()) {
      stopGame();
    } else {
      startGame();
    }
  }

  // Handle keyboard input
  const handleKeyDown = (e) => {
    const { paddle, game } = gameDimensions();
    const moveAmount = 15;

    switch (e.key) {
      case 'ArrowUp':
        setGamePositions((prev) => ({
          ...prev,
          player2Position: Math.max(0, prev.player2Position - moveAmount),
        }));
        break;
      case 'ArrowDown':
        setGamePositions((prev) => ({
          ...prev,
          player2Position: Math.min(
            game.height - paddle.height,
            prev.player2Position + moveAmount
          ),
        }));
        break;
      case 'w':
        setGamePositions((prev) => ({
          ...prev,
          player1Position: Math.max(0, prev.player1Position - moveAmount),
        }));
        break;
      case 's':
        setGamePositions((prev) => ({
          ...prev,
          player1Position: Math.min(
            game.height - paddle.height,
            prev.player1Position + moveAmount
          ),
        }));
        break;
      case ' ':
        e.preventDefault();
        toggleGame();
        break;
    }
  };

  // Initialize responsive dimensions
  // createEffect(() => {
  //   const responsiveDimensions =
  //     calculateResponsiveDimensions(gameDimensions());
  //   setGameDimensions(responsiveDimensions);
  // });

  // Setup event listeners
  window.addEventListener('keydown', handleKeyDown);

  // Cleanup
  onCleanup(() => {
    stopGame();
    window.removeEventListener('keydown', handleKeyDown);
  });

  return createComponent('div', {
    className: `container position-relative`,
    children: [
      Score({ gameScore }),
      GameBoard({
        gameDimensions,
        gamePositions,
      }),
      GameControls(),
    ],
    cleanup,
  });
}
