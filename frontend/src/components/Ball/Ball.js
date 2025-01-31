import { createComponent } from '@component';
import { createEffect } from '@reactivity';
import styles from './Ball.module.css';

export default function Ball({ gameDimensions, gamePositions }) {
  const { ball: ballPosition } = gamePositions();
  const { ball: ballDimensions } = gameDimensions();

  const ballComponent = createComponent('div', {
    className: styles.ball || 'ball',
    attributes: {
      style: `width: ${ballDimensions.width}px; height: ${ballDimensions.height}px; top: ${ballPosition.y - ballDimensions.height * 0.5}px; left: ${ballPosition.x - ballDimensions.width * 0.5}px;`,
    },
  });

  // Reactive updates for the ball's position
  createEffect(() => {
    const { ball: ballPosition } = gamePositions();
    const { ball: ballDimensions } = gameDimensions();

    ballComponent.element.style.top = `${ballPosition.y - ballDimensions.height * 0.5}px`;
    ballComponent.element.style.left = `${ballPosition.x - ballDimensions.width * 0.5}px`;
    ballComponent.element.style.width = `${ballDimensions.width}px`;
    ballComponent.element.style.height = `${ballDimensions.height}px`;
  });

  return ballComponent;
}
