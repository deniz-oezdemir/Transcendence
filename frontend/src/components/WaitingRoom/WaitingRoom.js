import { createSignal, createEffect } from '@reactivity';
import { createComponent } from '@component';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom({ onStartGame, setGameId, setCreatorId, setCreatorName, setPlayerId, setPlayerName, setGameType }) {
  const [matches, setMatches] = createSignal([]);
  const [tournaments, setTournaments] = createSignal([]);
  const [socket, setSocket] = createSignal(null);
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; // Use 'wss' for HTTPS, 'ws' for HTTP
  const port = 8001;
  const wsUrl = `${protocol}//${hostname}:${port}/ws/waiting-room/`;

  createEffect(() => {
    const ws = new WebSocket(wsUrl);
  
    ws.onopen = () => {
      console.log('Connected to matchmaking service');
      console.log('username:', localStorage.getItem('username'));
      console.log('userId:', localStorage.getItem('userId'));
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
          case 'games_deleted':
            setMatches(data.available_games?.matches || []);
            setTournaments(data.available_games?.tournaments || []);
            if (data.is_local_match === true) {
              console.log('Local match created:', data);
              setGameId(data.id);
              setCreatorId(data.creator_id);
              setCreatorName(data.creator_name);
              setPlayerId(data.guest_id);
              setPlayerName(data.guest_name);
              setGameType('local_match');
              onStartGame(data.game, data.id);
            } else if (data.is_ai_match === true) {
              console.log('AI match created:', data);
              setGameId(data.id);
              setCreatorId(data.available_games.matches[0].player_1_id);
              setCreatorName(data.available_games.matches[0].player_1_name);
              setPlayerId(data.available_games.matches[0].player_2_id);
              setPlayerName(data.available_games.matches[0].player_2_name);
              setGameType('AI_match');
              onStartGame(data.game, data.id);
            }
            break;
          
            case 'player_joined':
              console.log('Player joined:', data.available_games);
            
              if (data.available_games) {
                if (data.available_games.matches && data.available_games.matches.length > 0) {
                  switch (data.available_games.matches[0].status) {
                    case 'active':
                      console.log('Match Started');
                      setGameId(data.game_id);
                      setCreatorId(data.available_games.matches[0].player_1_id);
                      setCreatorName(data.available_games.matches[0].player_1_name);
                      setPlayerId(data.available_games.matches[0].player_2_id);
                      setPlayerName(data.available_games.matches[0].player_2_name);
                      setGameType('match');
                      onStartGame(data.game, data.game_id);

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
            
            case 'tournament_started':
              console.log('Tournament Started TEST');
              
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

    const handlekeydown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        console.log('Escape key disabled');
      }
    }
    document.addEventListener('keydown', handlekeydown);
  
    return () => {
      ws?.close();
      setSocket(null);
      document.removeEventListener('keydown', handlekeydown);
    };
  });

  const deleteGames = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'delete_all_games',
    }));
  };

  const aiGame = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_AI_match',
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
    }));
  };

  const createLocalMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_local_match',
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
    }));
  };

  const createRegularMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      gameType: 'match',
      type: 'create_match',
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
    }));
  };

  const createFourTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_tournament',
      max_players: 4,
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
    }));
  };

  const createEightTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_tournament',
      max_players: 8,
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
    }));
  };

  const joinGame = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_match',
      match_id: matches()[0].match_id,
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
    }));
  };

  const joinTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_tournament',
      tournament_id: tournaments()[0].tournament_id,
      player_id: localStorage.getItem('userId'),
      player_name: localStorage.getItem('username'),
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

  // dropdown for game creation type
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

  const botMatch = createComponent("ul");
  createEffect(() => {
    botMatch.element.innerHTML = '';
    botMatch.element.appendChild(createComponent('button', {
      className: styles.createButton,
      content: 'Bot Match',
      events: { click: aiGame }
    }).element);
  });

  const localGame = createComponent("ul");
  createEffect(() => {
    localGame.element.innerHTML = '';
    localGame.element.appendChild(createComponent('button', {
      className: styles.createButton,
      content: 'Local Game',
      events: { click: createLocalMatch }
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
    // Left Section
    createComponent('div', {
      className: styles.leftSection,
      children: [
        creatGame,
        localGame,
        botMatch,
        checkAvailableGames,
        deleteAllGames,
      ],
    }),
    // Right Section (Match List)
    createComponent('div', {
      className: styles.matchListContainer,
      children: [
        createComponent('div', {
          className: styles.matchList,
          children: [
            createComponent('pre', {
              style: { color: 'white' }, // Ensure text is white
              content: 'Waiting Room', // Add your content here
            }),
            gameList,
          ],
        }),
      ],
    }),
  ],
});
}
