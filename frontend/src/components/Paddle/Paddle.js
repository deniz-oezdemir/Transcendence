import { createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './Paddle.module.css';

export default function Paddle({ gameDimensions, gamePositions, side }) {
  const { paddle: paddleDimensions } = gameDimensions();
  let playerPosition;
  if (side === 'left') {
    playerPosition = gamePositions().player1Position;
  } else {
    playerPosition = gamePositions().player2Position;
  }

  const paddleComponent = createComponent('div', {
    className: styles.paddle || 'paddle',
    attributes: {
      style: `width: ${paddleDimensions.width}px; height: ${paddleDimensions.height}px; top: ${playerPosition}px; ${side}: ${paddleDimensions.offset}; ${side === 'left' ? 'background-color: ' + 'var(--bs-primary)' : 'background-color: ' + 'var(--bs-secondary)'}`,
    },
  });

  createEffect(() => {
    const { paddle: paddleDimensions } = gameDimensions();
    let playerPosition;
    if (side === 'left') {
      playerPosition = gamePositions().player1Position;
    } else {
      playerPosition = gamePositions().player2Position;
    }

    paddleComponent.element.style.top = `${playerPosition}px`;
    if (side === 'left') {
      paddleComponent.element.style.left = `${paddleDimensions.offset}px`;
    } else {
      paddleComponent.element.style.right = `${paddleDimensions.offset}px`;
    }
  });

  return paddleComponent;
}
