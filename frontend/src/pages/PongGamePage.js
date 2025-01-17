import { createSignal, createEffect } from '@reactivity';
import {
  createComponent,
  onCleanup,
  createCleanupContext,
} from '@componentSystem';

import styles from './PongGamePage.module.css';

export default function PongGamePage() {
  const cleanup = createCleanupContext();
  // Signals
  const [positionLeft, setPositionLeft] = createSignal(160);
  const [positionRight, setPositionRight] = createSignal(160);
  const [ballPosition, setBallPosition] = createSignal({ top: 200, left: 300 });
  const [ballMoving, setBallMoving] = createSignal(false);

  // Ball movement state
  let ballDirection = { x: 2, y: 2 };
  let ballInterval = null;

  const resetBall = () => {
    setBallPosition({ top: 200, left: 300 });
    setBallMoving(false);
    ballDirection = { x: 2, y: 2 };
  };

  const handleball = () => {
    const pos = ballPosition();
    const newTop = pos.top + ballDirection.y;
    const newLeft = pos.left + ballDirection.x;

    // Bounce off top and bottom walls
    if (newTop <= 0 || newTop >= 380) {
      ballDirection.y *= -1;
    }

    // Paddle collision
    if (
      (newLeft <= 40 &&
        newTop >= positionLeft() &&
        newTop <= positionLeft() + 80) ||
      (newLeft >= 560 &&
        newTop >= positionRight() &&
        newTop <= positionRight() + 80)
    ) {
      resetBall();
    }

    // Ball out of bounds
    if (newLeft <= 0 || newLeft >= 600) {
      resetBall();
    }

    return { top: newTop, left: newLeft };
  };

  const startBallMovement = () => {
    console.log('startBallMovement', ballMoving());
    if (ballMoving()) return;

    setBallMoving(true);
    ballInterval = setInterval(() => {
      setBallPosition(handleball());
    }, 16);
  };

  const stopBallMovement = () => {
    clearInterval(ballInterval);
    ballInterval = null;
  };

  // Keydown handler
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      setPositionRight(Math.max(40, positionRight() - 10));
    } else if (e.key === 'ArrowDown') {
      setPositionRight(Math.min(300, positionRight() + 10));
    } else if (e.key === 'w') {
      setPositionLeft(Math.max(40, positionLeft() - 10));
    } else if (e.key === 's') {
      setPositionLeft(Math.min(300, positionLeft() + 10));
    } else if (e.key === ' ') {
      if (!ballMoving()) {
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

  // Ball Component
  const ballComponent = createComponent('div', {
    className: styles.ball,
    attributes: {
      style: `top: ${ballPosition().top}px; left: ${ballPosition().left}px;`,
    },
  });

  // Paddle Components
  const paddleLeftComponent = createComponent('div', {
    className: styles.paddle,
    attributes: {
      style: `top: ${positionLeft()}px; left: 20px;`,
    },
  });

  const paddleRightComponent = createComponent('div', {
    className: styles.paddle,
    attributes: {
      style: `top: ${positionRight()}px; right: 20px;`,
    },
  });

  // Reactive updates for paddle and ball positions
  createEffect(() => {
    console.log('inside paddle effect');
    paddleLeftComponent.element.style.top = `${positionLeft()}px`;
    paddleRightComponent.element.style.top = `${positionRight()}px`;
  });

  createEffect(() => {
    const { top, left } = ballPosition();
    console.log('top', top, 'left', left);
    ballComponent.element.style.top = `${top}px`;
    ballComponent.element.style.left = `${left}px`;
  });

  // Game Container
  return createComponent('div', {
    className: styles.gameContainer,
    children: [
      createComponent('div', {
        className: styles.score,
        content: 'Score: 0',
      }),
      ballComponent,
      paddleLeftComponent,
      paddleRightComponent,
    ],
    cleanup,
  });
}
