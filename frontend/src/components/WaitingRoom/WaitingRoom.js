import { createSignal, createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom() {
  const [matches, setMatches] = createSignal([]);
  const [socket, setSocket] = createSignal(null);

  createEffect(() => {
    const ws = new WebSocket('ws://localhost:8001/ws/waiting-room/');

    ws.onopen = () => {
      console.log('Connected to matchmaking service');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('Received:', data);

      if (data.type === 'match_created' || data.type === 'match_updated') {
        if (Array.isArray(data.all_matches)) {
          setMatches(data.all_matches);
          // Log to verify matches are being set
          console.log('Updated matches:', matches());
        }
      }
    };

    return () => ws?.close();
  });

  const createMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_match',
      player_1_id: 1
    }));
  };

  return createComponent('div', {
    className: styles.waitingRoom,
    children: [
      createComponent('button', {
        className: styles.createButton,
        content: 'Create Match',
        events: { click: createMatch }
      }),
      createComponent('div', {
        className: styles.matchList,
        children: [
          createComponent('pre', {
            style: 'color: white;',  // Make sure text is visible
            content: JSON.stringify(matches(), null, 2)  // Format JSON with indentation
          })
        ]
      })
    ]
  });
}
