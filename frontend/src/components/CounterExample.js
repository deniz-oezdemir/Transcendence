import { createComponent, onCleanup } from '@componentSystem';
import { createSignal, createEffect } from '@reactivity';
import styles from './CounterExample.module.css';

export default function CounterExample() {
  const [count, setCount] = createSignal(0);

  createEffect(() => {
    console.log(`The count is now: ${count()}`);
  });

  const modCounter = () => {
    setCount(count() + 1);
  };

  onCleanup(() => {
    console.log('cleanup');
  });

  return createComponent('div', {
    className: styles.container,
    children: [
      createComponent('h1', {
        className: styles.title,
        content: '¡Hello, Reactivity!',
      }),
      createComponent('button', {
        className: styles.button,
        content: 'Increment',
        events: {
          click: modCounter,
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
}
