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
  
    // to be continued
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received:', data);
        if (data.type === 'match_created' || data.type === 'tournament_created') {
          console.log('test test0');
          if (Array.isArray(data.available_games.status)) {
            console.log('test test');
            setMatches(data.available_games);
            console.log('Updated matches:', matches());
          } else {
            console.error('Invalid matches format:', data.available_games);
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

  const deleteGames = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'delete_all_games',
    }));
  };

  const createRegularMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      gameType: 'match',
      type: 'create_match',
      player_id: 1
    }));
  };

  const createFourTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_tournament',
      max_players: 4,
      player_id: 2
    }));
  };

  const createEightTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_tournament',
      max_players: 8,
      player_id: 1
    }));
  };

  const gameList = createComponent("ul");
  createEffect(() => {
    const m = matches();
    console.log('gamelist', gameList, m);
    
    if (Array.isArray(m)) {
      gameList.element.innerHTML = '';

      m.forEach((match) => {
        const element = createComponent("div", {
          content: `Match ID: ${match.match_id}, Player1: ${match.player_id}, Player2: ${match.player_id}, Status: ${match.status}`,
        });
        gameList.element.appendChild(element.element);
      });
    } else {
      console.error('Matches is not an array:', m);
    }
  });

  let selectedGameType = '';
  return createComponent('div', {
    className: styles.waitingRoom,
    children: [
      // Dropdown Container
      createComponent('div', {
        className: styles.dropdownContainer,
        children: [
          createComponent('select', {
            className: styles.dropdown,
            events: {
              change: (event) => {
                selectedGameType = event.target.value;
              }
            },
            children: [
              createComponent('option', { content: 'Select Game Mode', attributes: { value: '' } }),
              createComponent('option', { content: '1v1 Match', attributes: { value: 'match' } }),
              createComponent('option', { content: 'Tournament (4 Players)', attributes: { value: 'tournament4' } }),
              createComponent('option', { content: 'Tournament (8 Players)', attributes: { value: 'tournament8' } }),
            ]
          }),
          createComponent('button', {
            className: styles.createButton,
            content: 'Create Game',
            events: {
              click: () => {
                if (selectedGameType === 'match') {
                  createRegularMatch();
                } else if (selectedGameType === 'tournament4') {
                  createFourTournament();
                } else if (selectedGameType === 'tournament8') {
                  createEightTournament();
                } else {
                  alert('Please select a game type!');
                }
              }
            }
          })
        ]
      }),

      createComponent('button', {
        className: styles.createButton,
        content: 'Delete All Games (to be deleted)',
        events: { click: deleteGames }
      }),

      createComponent('div', {
        className: styles.matchList,
        children: [
          createComponent('pre', {
            style: 'color: white;',
            content: matches() ? JSON.stringify(matches(), null, 2) : '',
          }),
          gameList,
        ]
      }),
    ]
  });  
}
