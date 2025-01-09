import { createSignal } from '@signals';
import { createComponent } from '@components';
import styles from './Paddle.module.css';

export function Paddle() {
  const [position, setPosition] = createSignal(100);

  const element = createComponent('div', {
    className: styles.paddle,
  });

  function updatePaddlePosition() {
    element.style.top = `${position()}px`;
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      setPosition(Math.max(0, position() - 10));
    } else if (e.key === 'ArrowDown') {
      setPosition(Math.min(200, position() + 10));
    }
    updatePaddlePosition();
  });

  updatePaddlePosition();
  return element;
}
