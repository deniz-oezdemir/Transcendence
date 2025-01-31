import { createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './Score.module.css';

export default function Score({ gameScore }) {
  const { player1, player2, maxScore, players: info } = gameScore();

  const leftScoreComponent = createComponent('div', {
    className: `${styles.score} ${styles.scoreLeft}`,
    content: `
      <span class="${styles.label}">${info.player1.name}</span>
      <span class="${styles.value}">${player1.score} / ${maxScore}</span>
    `,
  });

  const rightScoreComponent = createComponent('div', {
    className: `${styles.score} ${styles.scoreRight}`,
    content: `
      <span class="${styles.label}">${info.player2.name}</span>
      <span class="${styles.value}">${player2.score} / ${maxScore}</span>
    `,
  });

  createEffect(() => {
    const { player1, player2, maxScore } = gameScore();
    leftScoreComponent.element.querySelector(`.${styles.value}`).textContent =
      `${player1.score} / ${maxScore}`;
    rightScoreComponent.element.querySelector(`.${styles.value}`).textContent =
      `${player2.score} / ${maxScore}`;
  });

  return createComponent('div', {
    className: `${styles.scoreContainer}`,
    children: [leftScoreComponent, rightScoreComponent],
  });
}
