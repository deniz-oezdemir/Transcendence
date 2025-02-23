import { createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './Score.module.css';
import { left } from '@popperjs/core';

export default function Score({ gameScore }) {
  const { player1, player2, maxScore, players: info } = gameScore();

  const rightScoreComponent = createComponent('div', {
    className: `${styles.score} ${styles.scoreLeft}`,
    content: `
      <span class="${styles.label}">${info.player1.name}</span>
      <span class="${styles.value}">${player1.score} / ${maxScore}</span>
    `,
  });

  const leftScoreComponent = createComponent('div', {
    className: `${styles.score} ${styles.scoreRight}`,
    content: `
      <span class="${styles.label}">${info.player2.name}</span>
      <span class="${styles.value}">${player2.score} / ${maxScore}</span>
    `,
  });

  createEffect(() => {
    const { player1, player2, maxScore, players } = gameScore();
    leftScoreComponent.element.querySelector(`.${styles.value}`).textContent =
      `${player2.score} / ${maxScore}`;
    rightScoreComponent.element.querySelector(`.${styles.value}`).textContent =
      `${player1.score} / ${maxScore}`;
    let leftName = (leftScoreComponent.element.querySelector(
      `.${styles.label}`
    ).textContent = `${players.player2.name}`);
    let rightName = (rightScoreComponent.element.querySelector(
      `.${styles.label}`
    ).textContent = `${players.player1.name}`);
    if (leftName === players.player2.name) leftName = `${players.player2.name}`;
    if (rightName === players.player1.name)
      rightName = `${players.player1.name}`;
  });

  return createComponent('div', {
    className: `${styles.scoreContainer}`,
    children: [leftScoreComponent, rightScoreComponent],
  });
}
