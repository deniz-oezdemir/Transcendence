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
    const { ball: ballPosition } = gamePositions();
    const { ball: ballDimensions } = gameDimensions();

    ballComponent.element.style.top = `${ballPosition.y - ballDimensions.radius}px`;
    ballComponent.element.style.left = `${ballPosition.x - ballDimensions.radius}px`;
  });

  return ballComponent;
}
