import { createComponent, Link, createCleanupContext } from '@component';
import styles from './HomePage.module.css';

import CounterExample from '@/components/CounterExample/CounterExample';

export default function HomePage() {
  const cleanup = createCleanupContext();

  return createComponent('div', {
    className: styles.container, // Apply the container class
    children: [
      createComponent('h1', {
        className: styles.title, // Apply the title class
        content: 'Home Page',
      }),
      createComponent('p', {
        content: 'Welcome to the Home Page!',
      }),
      Link({
        href: '/user/username',
        content: 'Go to Profile Page',
        className: `${styles.button} mx-2`, // Apply the button class
        attributes: { type: 'button', role: 'button' },
      }),
      Link({
        href: '/pong-game',
        content: 'Go to Pong Game Page',
        className: 'mx-2 btn btn-secondary',
        attributes: { type: 'button', role: 'button' },
      }),
      //CounterExample(),
    ],
    cleanup,
  });
}
