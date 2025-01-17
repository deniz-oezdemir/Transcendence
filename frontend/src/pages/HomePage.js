import { createComponent, Link, createCleanupContext } from '@componentSystem';
import { createSignal, createEffect } from '@reactivity';
import styles from './HomePage.module.css';

import CounterExample from '../components/CounterExample';

export default function HomePage() {
  // const [count, setCount] = createSignal(0);

  // createEffect(() => {
  //   console.log(`The count is now: ${count()}`);
  // });

  // const counterComponent = createComponent('div', {
  //   className: styles.container,
  //   children: [
  //     createComponent('h1', {
  //       className: styles.title,
  //       content: '¡Hello, Reactivity!',
  //     }),
  //     createComponent('button', {
  //       className: styles.button,
  //       content: 'Increment',
  //       events: {
  //         click: () => {
  //           setCount(count() + 1);
  //         },
  //       },
  //     }),
  //     createComponent('p', {
  //       className: styles.counter,
  //       content: `Count: `,
  //       children: [
  //         createComponent('span', {
  //           content: count,
  //         }),
  //       ],
  //     }),
  //   ],
  // });

  const cleanup = createCleanupContext();

  return createComponent('div', {
    content: `
      <h1>Home Page</h1>
      <p>Welcome to the Home Page!</p>
    `,
    children: [
      Link({ href: '/about', content: 'Go to About Page' }),
      Link({
        href: '/admin',
        content: 'Go to Admin Page',
        className: 'admin-link',
      }),
      CounterExample(),
      // counterComponent,
    ],
    cleanup,
  });
}
