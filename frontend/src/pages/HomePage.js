import { createComponent, Link, createCleanupContext } from '@componentSystem';
import { createSignal, createEffect } from '@reactivity';
import styles from './HomePage.module.css';

import CounterExample from '../components/CounterExample';

export default function HomePage() {
  const cleanup = createCleanupContext();

  return createComponent('div', {
    content: `
      <h1>Home Page</h1>
      <p>Welcome to the Home Page!</p>
    `,
    children: [
      Link({
        href: '/stats',
        content: 'Go to Stats Page',
        className: 'mx-2 btn btn-primary',
        attributes: { type: 'button', role: 'button' },
      }),
      Link({
        href: '/pong-game',
        content: 'Go to Pong Game Page',
        className: 'mx-2 btn btn-primary',
        attributes: { type: 'button', role: 'button' },
      }),
      CounterExample(),
    ],
    cleanup,
  });
}
