import { createComponent, onCleanup, onMount } from '@component';
import { createEffect } from '@reactivity';
import styles from './GameMenu.module.css';

/**
 * Component MatchList
 *
 * @param {Object} props
 * @param {Signal<Array<Object>>} props.matches
 * @param {Function} props.onJoin
 */
export default function MatchList({ matches, onJoin }) {
  const listComponent = createComponent('ul', {
    className: `${styles.threeDButtonSet} ${styles.matchList}`,
  });

  createEffect(() => {
    const matchArray = matches();
    listComponent.element.innerHTML = '';

    if (!matchArray || matchArray.length === 0) {
      const li = createComponent('li', {
        className: styles.threeDButtonSet,
      });
      const label = createComponent('span', {
        content: 'No matches found - Please refresh',
      });
      li.element.appendChild(label.element);
      listComponent.element.appendChild(li.element);
    } else {
      matchArray.forEach((match) => {
        const li = createComponent('li', {
          className: styles.threeDButtonSet,
        });

        const label = createComponent('span', {
          content: `Match ${match.match_id} - ${match.player_1_name} - ${match.status}`,
        });
        li.element.appendChild(label.element);

        if (match.status === 'no active') {
          const joinButton = createComponent('button', {
            content: 'Join',
            events: {
              click: () => onJoin(match),
            },
          });
          li.element.appendChild(joinButton.element);
        }
        listComponent.element.appendChild(li.element);
      });
    }
  });

  return listComponent;
}
