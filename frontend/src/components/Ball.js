import { createSignal } from '@signals';
import { createComponent } from '@components';
import styles from './Ball.module.css';

export function Ball() {
  const [position, setPosition] = createSignal({ x: 100, y: 100 });
  const [velocity, setVelocity] = createSignal({ x: 2, y: 2 });

  const element = createComponent('div', {
    className: styles.ball,
  });

  function updatePosition() {
    const pos = position();
    const vel = velocity();

    setPosition({ x: pos.x + vel.x, y: pos.y + vel.y });

    if (pos.x < 0 || pos.x > 300) setVelocity({ x: -vel.x, y: vel.y });
    if (pos.y < 0 || pos.y > 200) setVelocity({ x: vel.x, y: -vel.y });

    element.style.left = `${position().x}px`;
    element.style.top = `${position().y}px`;
  }

  setInterval(updatePosition, 16);

  return element;
}
