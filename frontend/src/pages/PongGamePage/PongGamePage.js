import { createSignal } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';

import Score from '@/components/Score/Score';
import Paddle from '@/components/Paddle/Paddle';
import Ball from '@/components/Ball/Ball';
import GameControls from '@/components/GameControls/GameControls';

import styles from './PongGamePage.module.css';

export default function PongGamePage() {
  const cleanup = createCleanupContext();
  // Signals
  const [positionLeft, setPositionLeft] = createSignal(160);
  const [positionRight, setPositionRight] = createSignal(160);
  const [ballPosition, setBallPosition] = createSignal({ top: 190, left: 290 });
  const [ballMoving, setBallMoving] = createSignal(false);
  const [ballDirection, setBallDirection] = createSignal({ x: 2, y: 2 });
  const [scoreLeft, setScoreLeft] = createSignal(0);
  const [scoreRight, setScoreRight] = createSignal(0);

  let ballInterval = null;

  const startBallMovement = () => {
    if (ballInterval) return;

    setBallMoving(true);
    ballInterval = setInterval(() => {
      setBallPosition(handleball());
    }, 16);
  };

  const stopBallMovement = () => {
    if (!ballInterval) return;
    clearInterval(ballInterval);
    ballInterval = null;
    setBallMoving(false);
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
    const left = positionLeft();
    const right = positionRight();
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
      setScoreRight(scoreRight() + 1);
      resetBallPosition();
      return ballPosition();
    }

    if (newLeft >= 600) {
      setScoreLeft(scoreLeft() + 1);
      resetBallPosition();
      return ballPosition();
    }

    return { top: newTop, left: newLeft };
  };

  // Keydown handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      setPositionRight(Math.max(0, positionRight() - 15));
    } else if (e.key === 'ArrowDown') {
      setPositionRight(Math.min(315, positionRight() + 15));
    } else if (e.key === 'w') {
      setPositionLeft(Math.max(0, positionLeft() - 15));
    } else if (e.key === 's') {
      setPositionLeft(Math.min(315, positionLeft() + 15));
    } else if (e.key === ' ') {
      if (ballMoving()) {
        resetBallPosition();
      } else {
        startBallMovement();
      }
    }
  };

  // Attach event listener
  document.addEventListener('keydown', handleKeyDown);

  // Cleanup listeners and intervals
  onCleanup(() => {
    stopBallMovement();
    document.removeEventListener('keydown', handleKeyDown);
  });

  return createComponent('div', {
    className: `container position-relative`,
    children: [
      Score({ scoreLeft, scoreRight }),
      createComponent('div', {
        className: `${styles.gameContainer}`,
        children: [
          Ball({ position: ballPosition }),
          Paddle({ position: positionLeft, side: 'left' }),
          Paddle({ position: positionRight, side: 'right' }),
        ],
      }),
      GameControls(),
    ],
    cleanup,
  });
}
