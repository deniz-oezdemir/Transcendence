import { createComponent } from '@component';

import styles from './GameControls.module.css';

export default function GameControls() {
  return createComponent('div', {
    className: styles.controls || 'controls',
    content: `
      <h4 class="${styles.title}"><i class="fa-solid fa-keyboard"></i> Game Controls</h4>
      <ul class="${styles.keysContainer}">
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-orange);">␣</span> Start/Stop Ball        </li>
        <li class="${styles.keyGroup}">
           <span class="${styles.key}" style="background-color: var(--bs-primary);">W</span> Left Player <br> Up | Down
          <span class="${styles.key}" style="background-color: var(--bs-primary);">S</span>
        </li>
        <li class="${styles.keyGroup}">
          <span class="${styles.key}" style="background-color: var(--bs-success);">↑</span> Right Player <br> Up | Down
          <span class="${styles.key}" style="background-color: var(--bs-success);">↓</span>
        </li>
      </ul>
    `,
  });
}
