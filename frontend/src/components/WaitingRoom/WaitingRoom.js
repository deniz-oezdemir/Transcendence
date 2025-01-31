import { createSignal, createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom() {
  const [matches, setMatches] = createSignal();
  const [socket, setSocket] = createSignal(null);

  createEffect(() => {
    const ws = new WebSocket('ws://localhost:8001/ws/waiting-room/');
  
    ws.onopen = () => {
      console.log('Connected to matchmaking service');
      setSocket(ws);
    };
  
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
  
        if (data.type === 'match_created' || data.type === 'match_updated') {
          if (Array.isArray(data.all_matches)) {
            setMatches(JSON.stringify(data.all_matches, null, 2));
            console.log('Updated matches:', matches());
          } else {
            console.error('Invalid matches format:', JSON.stringify(data.all_matches, null, 2));
          }
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
  
    ws.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };
  
    ws.onclose = (event) => {
      console.warn('WebSocket closed:', event);
      setSocket(null);
    };
  
    return () => {
      ws?.close();
      setSocket(null);
    };
  });
  

  const createMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_match',
      player_1_id: 1
    }));
  };

  const gameList = createComponent("ul");

  createEffect(() => {
    const m = matches();
    console.log('gamelist', gameList, m);
    m && m.forEach((match) => {
      const element = createComponent("li", {
        content: `status: ${match.status}`,
      })
      gameList.element.replaceChild(element.element);
    })
  })



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
            content: matches,
            children: [ gameList]  // Format JSON with indentation
          })
        ]
      })
    ]
  });
}
