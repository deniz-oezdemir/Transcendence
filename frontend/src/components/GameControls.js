import { createComponent } from '@componentSystem';

import styles from './GameControls.module.css';

export default function GameControls() {
  return createComponent('div', {
    className: styles.controls || 'controls',
    content: `
      <h4 class="${styles.title}">🎮 Game Controls</h4>
      <ul class="${styles.keysContainer}">
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-primary);">W</span> Up | Left Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-primary);">S</span> Down | Left Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-warning);">␣</span> Start/Stop Ball
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-danger);">↑</span> Up | Right Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-danger);">↓</span> Down | Right Player
        </li>
      </ul>
    `,
  });
}
