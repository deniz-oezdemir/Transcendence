import styles from './PongGamePage.module.css';
import { createSignal } from '@signals';
import { createComponent } from '@components';

import { Score } from '@/components/Score';
import { Paddle } from '@/components/Paddle';
import { Ball } from '@/components/Ball';

export default function PongGamePage() {
  const [count, setCount, subscribe] = createSignal(0);

  subscribe(() => {
    console.log(`The count is now: ${count()}`);
  });

  const appContent = createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h1', {
        className: styles.title,
        content: '¡Hola, SPA!',
      }),
      createComponent('button', {
        className: styles.button,
        content: 'Increment',
        events: {
          click: () => {
            setCount(count() + 1);
          },
        },
      }),
      createComponent('p', {
        className: styles.counter,
        content: `Count: `,
        children: [
          createComponent('span', {
            content: count,
          }),
        ],
      }),
    ],
  });

  const score = Score();

  const gameContainer = createComponent('div', {
    className: styles.gameContainer,
    children: [score.element, Paddle(), Ball()],
  });

  setInterval(() => {
    score.increment();
  }, 1000);

  appContent.appendChild(gameContainer);

  return appContent;
}
