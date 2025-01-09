import styles from './App.module.css';
import { createSignal } from '@signals';
import { createComponent } from '@components';

import { Score } from './components/Score';
import { Paddle } from './components/Paddle';
import { Ball } from './components/Ball';

export default function App() {
  const [count, setCount, subscribe] = createSignal(0);

  subscribe(() => {
    console.log(`The count is now: ${count()}`);
  });

  const element = document.createElement('div');
  element.className = styles.container;
  element.innerHTML = `
        <h1 class="${styles.title}">¡Hola, SPA!</h1>
        <button class="${styles.button}" id="increment">Increment</button>
        <p class="${styles.counter}">Count: <span id="count">${count()}</span></p>
    `;

  const incrementButton = element.querySelector('#increment');
  const countDisplay = element.querySelector('#count');

  incrementButton.addEventListener('click', () => {
    setCount(count() + 1);
    countDisplay.textContent = count();
  });

  const gameContainer = document.createElement('div');
  gameContainer.className = styles.gameContainer;

  gameContainer.appendChild(Score());
  gameContainer.appendChild(Paddle());
  gameContainer.appendChild(Ball());

  element.appendChild(gameContainer);

  return element;
}
