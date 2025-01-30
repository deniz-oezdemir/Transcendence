import { createComponent } from '@component';

import styles from './GameControls.module.css';

export default function GameControls() {
  return createComponent('div', {
    className: styles.controls || 'controls',
    content: `
      <h4 class="${styles.title}">🎮 Game Controls</h4>
      <ul class="${styles.keysContainer}">
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-primary);"><i style="font-size: 2rem;" class="ti ti-circle-letter-w-filled"></i></span> Up | Left Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-primary);"><i style="font-size: 2rem;" class="ti ti-circle-letter-s-filled"></i></span> Down | Left Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-orange);">␣</span> Start/Stop Ball
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-secondary);"><i class="ti ti-arrow-big-up-filled"></i></span> Up | Right Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-secondary);"><i class="ti ti-arrow-big-down-filled"></i></span> Down | Right Player
        </li>
      </ul>
    `,
  });
}
