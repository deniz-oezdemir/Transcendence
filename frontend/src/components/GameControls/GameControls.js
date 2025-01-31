import { createComponent } from '@component';

import styles from './GameControls.module.css';

export default function GameControls() {
  return createComponent('div', {
    className: styles.controls || 'controls',
    content: `
      <h4 class="${styles.title}"><i class="fa-solid fa-keyboard"></i> Game Controls</h4>
      <ul class="${styles.keysContainer}">
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-primary);"><i class="fa-solid fa-w"></i></span> Up | Left Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-primary);"><i class="fa-solid fa-s"></i></span> Down | Left Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-orange);">␣</span> Start/Stop Ball
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-secondary);"><i class="fa-solid fa-circle-up"></i></span> Up | Right Player
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-secondary);"><i class="fa-solid fa-circle-down"></i></span> Down | Right Player
        </li>
      </ul>
    `,
  });
}
