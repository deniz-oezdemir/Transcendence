import { createSignal, createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom({ onStartGame }) {
  const [matches, setMatches] = createSignal([]);
  const [tournaments, setTournaments] = createSignal([]);
  const [hasGames, setHasGames] = createSignal(false);
  const [socket, setSocket] = createSignal(null);
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; // Use 'wss' for HTTPS, 'ws' for HTTP
  const port = 8001;
  const wsUrl = `${protocol}//${hostname}:${port}/ws/waiting-room/`;
  const ws = new WebSocket(wsUrl);

  createEffect(() => {
    const ws = new WebSocket(wsUrl);
    //const ws = new WebSocket('ws://matchmaking:8001/ws/waiting-room/');
  
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
          case 'tournament_started':
          case 'games_deleted':
            setMatches(data.available_games?.matches || []);
            setTournaments(data.available_games?.tournaments || []);
            break;
          
            case 'player_joined':
              console.log('Player joined:', data.available_games);
            
              if (data.available_games) {
                if (data.available_games.matches && data.available_games.matches.length > 0) {
                  switch (data.available_games.matches[0].status) {
                    case 'active':
                      console.log('Match Started');
                      onStartGame(data.game);
                      break;
                    case 'pending':
                      console.log('Match Pending');
                      break;
                    default:
                      console.log('Match Status:', data.available_games.matches[0].status);
                  }
                } else {
                  console.log('No matches available');
                }
            
                if (data.available_games.tournaments && data.available_games.tournaments.length > 0) {
                  switch (data.available_games.tournaments[0].status) {
                    case 'active':
                      console.log('Tournament Started');
                      onStartGame(data.game);
                      break;
                    case 'pending':
                      console.log('Tournament Pending');
                      break;
                    default:
                      console.log('Tournament Status:', data.available_games.tournaments[0].status);
                  }
                } else {
                  console.log('No tournaments available');
                }
              } else {
                console.log('No available games data found');
              }
            
              break;

          case 'error':
            alert(data.message);
            console.log('error', data.message);
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

  const joinGame = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_match',
      match_id: matches()[0].match_id,
      player_id: 2
    }));
  };

  const joinTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_tournament',
      tournament_id: tournaments()[0].tournament_id,
      player_id: 4
    }));
  };

  const fetchAvailableGames = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'get_games',
    }));
  }

  const gameList = createComponent("ul");
  createEffect(() => {
    const m = matches();
    const t = tournaments();
  
    gameList.element.innerHTML = '';
  
    // Append match buttons
    m.forEach((match) => {
      const matchButton = createComponent('button', {
        className: styles.createButton,
        content: `Match ${match.match_id}`,
        events: {
          click: () => {
            joinGame();
          }
        }
      });
      gameList.element.appendChild(matchButton.element);
    });
  
    // Append tournament buttons
    t.forEach((tournament) => {
      const tournamentButton = createComponent('button', {
        className: styles.createButton,
        content: `${tournament.max_players}-Player Tournament ${tournament.tournament_id}`,
        events: {
          click: () => {
            joinTournament();
          }
        }
      });
      gameList.element.appendChild(tournamentButton.element);
    });
  });

  const deleteAllGames = createComponent("ul");
  createEffect(() => {
    deleteAllGames.element.innerHTML = '';
    deleteAllGames.element.appendChild(createComponent('button', {
        className: styles.createButton,
        content: 'Delete All Games (to be deleted)',
        events: { click: deleteGames }
      }).element);
  });

  const creatGame = createComponent("ul");
  createEffect(() => {
    creatGame.element.innerHTML = '';
    creatGame.element.appendChild(createComponent('div', {
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
    }).element);
  });

  const checkAvailableGames = createComponent("ul");
  createEffect(() => {
    checkAvailableGames.element.innerHTML = '';
    checkAvailableGames.element.appendChild(createComponent('button', {
      className: styles.createButton,
      content: 'Check Available Games',
      events: { click: fetchAvailableGames }
    }).element);
  });

  let selectedGameType = '';
  return createComponent('div', {
    className: styles.waitingRoom,
    children: [
      creatGame,
      checkAvailableGames,
      deleteAllGames,
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
