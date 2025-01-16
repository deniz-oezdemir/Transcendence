import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup } from '@componentSystem';

import styles from './PongGamePage.module.css';

import { Score } from '@/components/Score';
import { Paddle } from '@/components/Paddle';
import { Ball } from '@/components/Ball';

export default function PongGamePage() {
  // Create the game container with paddles on both sides
  const gameContainer = createComponent('div', {
    className: styles.gameContainer,
    children: [
      // Display the static score header
      createComponent('div', {
        className: styles.score,
        content: 'Score: 0',
      }),
      // Create the ball as a static element
      createComponent('div', {
        className: styles.ball,
        attributes: {
          style: 'top: 200px; left: 300px;', // Positioning the ball at the center
        },
      }),
      // Create the left paddle
      createComponent('div', {
        className: styles.paddle,
        attributes: {
          style: 'top: 160px; left: 20px;', // Positioning the paddle on the left side
        },
      }),
      // Create the right paddle
      createComponent('div', {
        className: styles.paddle,
        attributes: {
          style: 'top: 160px; right: 20px;', // Positioning the paddle on the right side
        },
      }),
    ],
  });

  return gameContainer;
}
