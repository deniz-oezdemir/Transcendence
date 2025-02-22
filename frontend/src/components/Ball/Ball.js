import { createComponent } from '@component';
import { createEffect } from '@reactivity';
import styles from './Ball.module.css';

export default function Ball({ gameDimensions, gamePositions }) {
  const { ball: ballPosition } = gamePositions();
  const { ball: ballDimensions } = gameDimensions();

  const ballComponent = createComponent('div', {
    className: styles.ball || 'ball',
    attributes: {
      style: `width: ${ballDimensions.radius * 2}px; height: ${ballDimensions.radius * 2}px; top: ${ballPosition.y - ballDimensions.radius}px; left: ${ballPosition.x - ballDimensions.radius}px;`,
    },
  });

  // Reactive updates for the ball's position
  createEffect(() => {
    const { ball: currentBallPosition } = gamePositions();
    const { ball: ballDimensions } = gameDimensions();

    // console.log('New ball position:', currentBallPosition);

    ballComponent.element.style.top = `${currentBallPosition.y - ballDimensions.radius}px`;
    ballComponent.element.style.left = `${currentBallPosition.x - ballDimensions.radius}px`;
  });

  return ballComponent;
}
