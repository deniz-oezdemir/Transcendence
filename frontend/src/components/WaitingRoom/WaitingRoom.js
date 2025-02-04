import { createSignal, createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom() {
  const [matches, setMatches] = createSignal([]);
  const [tournaments, setTournaments] = createSignal([]);
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
        
        switch (data.type) {
          case 'initial_games':
            setMatches(data.games.matches || []);
            setTournaments(data.games.tournaments || []);
            break;

          case 'match_created':
          case 'tournament_created':
          case 'player_joined':
          case 'tournament_started':
          case 'games_deleted':
            setMatches(data.available_games?.matches || []);
            setTournaments(data.available_games?.tournaments || []);
            break;

          case 'error':
            console.log('error');
            break;

          default:
            console.warn('Unknown message type:', data.type);
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

  const joinRegularMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      gameType: 'match',
      type: 'join_match',
      player_id: 2
    }));
  };

  const joinFourTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_tournament',
      tournament_id: tournaments()[0].tournament_id,
      player_id: 4
    }));
  };

  const joinEightTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_tournament',
      tournament_id: tournaments()[1].tournament_id,
      player_id: 8
    }));
  };

  const gameList = createComponent("ul");
  createEffect(() => {
    const m = matches();
    const t = tournaments();
    gameList.element.innerHTML = '';

    // Render matches
    m.forEach((match) => {
      const element = createComponent('div', {
        content: `Match ${match.match_id} (Created by Player ${match.player_id})`,
      });
      gameList.element.appendChild(element.element);
    });

    // Render tournaments
    t.forEach((tournament) => {
      const element = createComponent('div', {
        content: `${tournament.max_players}-Player Tournament ${tournament.tournament_id} (${tournament.players.length}/${tournament.max_players} players)`,
      });
      gameList.element.appendChild(element.element);
    });
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
            content: 'Join Game',
            events: {
              click: () => {
                if (selectedGameType === 'match') {
                  joinRegularMatch();
                } else if (selectedGameType === 'tournament4') {
                  joinFourTournament();
                } else if (selectedGameType === 'tournament8') {
                  joinEightTournament();
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
            content: 'Waiting Room', tournaments, matches,
          }),
          gameList,
        ],
      }),
    ]
  });  
}
