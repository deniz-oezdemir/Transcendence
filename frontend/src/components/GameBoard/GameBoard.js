import { createEffect } from '@reactivity';
import { createComponent } from '@component';
import Paddle from '@/components/Paddle/Paddle';
import Ball from '@/components/Ball/Ball';

import styles from './GameBoard.module.css';

export default function GameBoard({ gameDimensions, gamePositions }) {
  const { game } = gameDimensions();

  const boardComponent = createComponent('div', {
    className: `${styles.gameContainer}`,
    children: [
      Ball({ gameDimensions: gameDimensions, gamePositions: gamePositions }),
      Paddle({
        gameDimensions: gameDimensions,
        gamePositions: gamePositions,
        side: 'left',
      }),
      Paddle({
        gameDimensions: gameDimensions,
        gamePositions: gamePositions,
        side: 'right',
      }),
    ],
    attributes: {
      style: `width: ${game.width}px; height: ${game.height}px;`,
    },
  });

  createEffect(() => {
    const { game } = gameDimensions();

    boardComponent.element.style.width = `${game.width}px`;
    boardComponent.element.style.height = `${game.height}px`;
  });

  return boardComponent;
}
