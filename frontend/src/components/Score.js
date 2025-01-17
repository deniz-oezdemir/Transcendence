import { createEffect } from '@reactivity';
import { createComponent } from '@componentSystem';
import styles from './Score.module.css';

export default function Score({ scoreLeft, scoreRight }) {
  const leftScoreComponent = createComponent('div', {
    className: `${styles.score} ${styles.scoreLeft}`,
    content: `
      <span class="${styles.label}">Player 1</span>
      <span class="${styles.value}">${scoreLeft()}</span>
    `,
  });

  const rightScoreComponent = createComponent('div', {
    className: `${styles.score} ${styles.scoreRight}`,
    content: `
      <span class="${styles.label}">Player 2</span>
      <span class="${styles.value}">${scoreRight()}</span>
    `,
  });

  createEffect(() => {
    leftScoreComponent.element.querySelector(`.${styles.value}`).textContent =
      `${scoreLeft()}`;
    rightScoreComponent.element.querySelector(`.${styles.value}`).textContent =
      `${scoreRight()}`;
  });

  return createComponent('div', {
    className: `${styles.scoreContainer}`,
    children: [leftScoreComponent, rightScoreComponent],
  });
}
