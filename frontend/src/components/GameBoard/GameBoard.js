import { createEffect } from '@reactivity';
import { createComponent } from '@component';
import Paddle from '@/components/Paddle/Paddle';
import Ball from '@/components/Ball/Ball';

import styles from './GameBoard.module.css';

export default function GameBoard({
  gameSize,
  ballSize,
  ballPosition,
  positionPlayer1,
  positionPlayer2,
  paddleSize,
  paddleOffset,
}) {
  const boardComponent = createComponent('div', {
    className: `${styles.gameContainer}`,
    children: [
      Ball({ position: ballPosition, size: ballSize }),
      Paddle({
        position: positionPlayer1,
        size: paddleSize,
        offset: paddleOffset,
        side: 'left',
      }),
      Paddle({
        position: positionPlayer2,
        size: paddleSize,
        offset: paddleOffset,
        side: 'right',
      }),
    ],
    attributes: {
      style: `width: ${gameSize().x}px; height: ${gameSize().y}px;`,
    },
  });

  createEffect(() => {
    const gs = gameSize();
    console.log('gs.x, gs.y', gs.x, gs.y);
    boardComponent.element.style.width = `${gs.x}px`;
    boardComponent.element.style.height = `${gs.y}px`;
  });

  return boardComponent;
}
