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
    let isReady = false;
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
          content: `Match ${match.match_id}: ${match.player_1_name} vs ${match.player_2_name ? match.player_2_name : 'Waiting...'} - ${match.status}`,
        });
        li.element.appendChild(label.element);

        if (
          match.player_1_id === network.userState.userId ||
          match.player_2_id === network.userState.userId
        ) {
          network.userState.match.id = match.match_id;
          network.userState.match.player1Id = match.player_1_id;
          network.userState.match.player1Name = match.player_1_name;
          network.userState.match.player2Id = match.player_2_id;
          network.userState.match.player2Name = match.player_2_name;
          if (match.match_id && match.player_1_id && match.player_2_id)
            isReady = true;
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
    readySignal[1](isReady);
  });

  return listComponent;
}
