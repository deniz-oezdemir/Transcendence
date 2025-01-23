import { createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './Paddle.module.css';

export default function Paddle({ position, size, offset, side }) {
  console.log('Paddle', position(), size(), offset(), side);
  const paddleComponent = createComponent('div', {
    className: styles.paddle || 'paddle',
    attributes: {
      style: `width: ${size().x}px; height: ${size().y}px; top: ${position()}px; ${side}: ${offset()}; ${side === 'left' ? 'background-color: ' + 'var(--bs-primary)' : 'background-color: ' + 'var(--bs-danger)'}`,
    },
  });

  createEffect(() => {
    const currentSize = size();
    paddleComponent.element.style.top = `${position()}px`;
    paddleComponent.element.style.width = `${currentSize.x}px`;
    paddleComponent.element.style.height = `${currentSize.y}px`;
    if (side === 'left') {
      paddleComponent.element.style.left = `${offset()}px`;
    } else {
      paddleComponent.element.style.right = `${offset()}px`;
    }
  });

  return paddleComponent;
}
