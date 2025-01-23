import { createComponent } from '@component';
import { createEffect } from '@reactivity';
import styles from './Ball.module.css';

export default function Ball({ position, size }) {
  const ballComponent = createComponent('div', {
    className: styles.ball || 'ball',
    attributes: {
      style: `width: ${size()}px; height: ${size()}px; top: ${position().top}px; left: ${position().left}px;`,
    },
  });

  // Reactive updates for the ball's position
  createEffect(() => {
    const { top, left } = position();
    console.log('top', top, 'left', left);
    ballComponent.element.style.top = `${top}px`;
    ballComponent.element.style.left = `${left}px`;
    ballComponent.element.style.width = `${size()}px`;
  });

  return ballComponent;
}
