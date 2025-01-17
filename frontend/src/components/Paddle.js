import { createEffect } from '@reactivity';
import { createComponent } from '@componentSystem';
import styles from './Paddle.module.css';

export default function Paddle({ position, side }) {
  const paddleComponent = createComponent('div', {
    className: styles.paddle || 'paddle',
    attributes: {
      style: `top: ${position()}px; ${side}: 20px; ${side === 'left' ? 'background-color: ' + 'var(--bs-primary)' : 'background-color: ' + 'var(--bs-danger)'}`,
    },
  });

  createEffect(() => {
    paddleComponent.element.style.top = `${position()}px`;
  });

  return paddleComponent;
}
