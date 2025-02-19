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
export default function MatchList({ matches, readySignal, network, onJoin }) {
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
      let isReady;
      matchArray.forEach((match) => {
        const li = createComponent('li', {
          className: styles.threeDButtonSet,
        });

        const label = createComponent('span', {
          content: `Match ${match.match_id}: ${match.player_1_name} vs ${match.player_2_name ? match.player_2_name : 'Waiting for player'} - ${match.status}`,
        });
        li.element.appendChild(label.element);

        if (
          match.player_1_id === network.userState.userId ||
          match.player_2_id === network.userState.userId
        ) {
          network.userState.matchId = match.match_id;
          isReady = readySignal[0]();
          if (!isReady) {
            readySignal[1](true);
          }
        }

        if (
          match.status === 'pending' &&
          (match.player_1_id !== network.userState.userId ||
            match.player_2_id !== network.userState.userId)
        ) {
          const joinButton = createComponent('button', {
            content: 'Join',
            events: {
              click: () => onJoin(match.match_id),
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
