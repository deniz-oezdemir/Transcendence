import { createSignal } from '@signals';
import { createComponent } from '@components';
import styles from './Score.module.css';

export function Score() {
  const [score, setScore] = createSignal(0);

  const scoreElement = createComponent('span', {
    content: score,
  });

  const element = createComponent('div', {
    className: styles.score,
    children: [
      createComponent('p', {
        content: 'Score: ',
        children: [scoreElement],
      }),
    ],
  });

  return {
    element,
    increment: () => setScore(score() + 1),
  };
}
