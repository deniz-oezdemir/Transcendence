import { createSignal, createEffect } from '@reactivity';
import { createComponent } from '@component';
import { getUser } from '@/auth.js';
import { isPending, setIsPending } from '@/components/GameState/GameState';
import styles from './WaitingRoom.module.css';

export default function WaitingRoom({ onStartGame, setGameId, setCreatorId, setCreatorName, setPlayerId, setPlayerName, setGameType }) {
  const [matches, setMatches] = createSignal([]);
  const [tournaments, setTournaments] = createSignal([]);
  const [socket, setSocket] = createSignal(null);  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'; // Use 'wss' for HTTPS, 'ws' for HTTP
  const port = 8001;
  const wsUrl = `${protocol}//${hostname}:${port}/ws/waiting-room/`;

  let userData = { id: null, username: null };
  createEffect(async () => {
    const user = await getUser();
    userData.id = user.id;
    userData.name = user.username;
  });

  createEffect(() => {
    const ws = new WebSocket(wsUrl);
  
    ws.onopen = () => {
      console.log('Connected to matchmaking service');
      console.log('username:', userData.name);
      console.log('userId:', userData.id);
      setSocket(ws);
      if (!socket()) return;
      socket().send(JSON.stringify({ type: 'get_games' }));
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
          
          case 'match_finished':
            console.log('Match Finished:', data);
            if (data.tournament_id) {
              console.log('Tournament ID:', data.tournament_id);
              setIsPending(true);
              console.log('isPending:', isPending());
            }
            break;
          
          case 'tournament_round_started':
            console.log('Tournament Round Started:', data);
            const tournamentTBC = data.available_games.tournaments.find(t => t.tournament_id === data.tournament_id);
            if (tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id)) {
                console.log('Tournament to be continued');
                console.log('Match_ID:', tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).match_id);
                setGameId(tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).match_id);
                setCreatorId(tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_1_id);
                setCreatorName(tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_1_name);
                setPlayerId(tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_2_id);
                setPlayerName(tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_2_name);
                setGameType('tournament');
                setIsPending(false);
                onStartGame(data.game, tournamentTBC.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).match_id);
              } else {
                console.log('No match found');
              }
            break;

          case 'match_created':
          case 'tournament_created':
          case 'games_deleted':
            setMatches(data.available_games?.matches || []);
            setTournaments(data.available_games?.tournaments || []);
            console.log('Available Games:', data.available_games);
            if (data.is_local_match === true && userData.id === data.player_1_id) {
              console.log('Local match created:', data);
              setGameId(data.match_id);
              setCreatorId(data.player_1_id);
              setCreatorName(data.player_1_name);
              setPlayerId(data.player_2_id);
              setPlayerName(data.player_2_name);
              setGameType('local_match');
              onStartGame(data.game, data.match_id);
            } else if (data.is_ai_match === true && userData.id === data.player_1_id) {
              console.log('AI match created:', data);
              setGameId(data.match_id);
              setCreatorId(data.player_1_id);
              setCreatorName(data.player_1_name);
              setPlayerId(data.player_2_id);
              setPlayerName(data.player_2_name);
              setGameType('AI_match');
              onStartGame(data.game, data.match_id);
            } else if (data.is_remote_match === true && data.status === 'active' && (userData.id === data.player_1_id || userData.id === data.player_2_id)) {
              console.log('Match created:', data);
              setGameId(data.match_id);
              setCreatorId(data.player_1_id);
              setCreatorName(data.player_1_name);
              setPlayerId(data.player_2_id);
              setPlayerName(data.player_2_name);
              setGameType('remote_match');
              onStartGame(data.game, data.match_id);
            }
            break;
          
            case 'player_joined':
              console.log('Player joined:', data.available_games);
            
              if (data.available_games) {
                if (data.available_games.matches && data.available_games.matches.length > 0) {
                  switch (data.status) {
                    case 'active':
                      if (data.player_1_id === userData.id || data.player_2_id === userData.id) {
                        console.log('Match Started');
                        setGameId(data.match_id);
                        setCreatorId(data.player_1_id);
                        setCreatorName(data.player_1_name);
                        setPlayerId(data.player_2_id);
                        setPlayerName(data.player_2_name);
                        setGameType('match');
                        onStartGame(data.game, data.match_id);
                      }
                      break;
                    case 'pending':
                      console.log('Match Pending');
                      break;
                    default:
                      console.log('Match Status:', data.status);
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
              console.log('Tournament Started:', data);

              const tournament = data.available_games.tournaments.find(t => t.tournament_id === data.tournament_id);
              if (tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id)) {
                console.log('Tournament Match Started');
                setGameId(tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).match_id);
                setCreatorId(tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_1_id);
                setCreatorName(tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_1_name);
                setPlayerId(tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_2_id);
                setPlayerName(tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).player_2_name);
                setGameType('tournament');
                onStartGame(data.game, tournament.matches.find(m => m.player_1_id === userData.id || m.player_2_id === userData.id).match_id);
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
      player_id: userData.id,
      player_name: userData.name,
    }));
  };

  const createLocalMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_local_match',
      player_id: userData.id,
      player_name: userData.name,
    }));
  };

  const createRegularMatch = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      gameType: 'match',
      type: 'create_match',
      player_id: userData.id,
      player_name: userData.name,
    }));
  };

  const createFourTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_tournament',
      max_players: 4,
      player_id: userData.id,
      player_name: userData.name,
    }));
  };

  const createEightTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'create_tournament',
      max_players: 8,
      player_id: userData.id,
      player_name: userData.name,
    }));
  };

  const joinGame = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_match',
      match_id: matches().find(m => m.status === 'pending').match_id,
      player_id: userData.id,
      player_name: userData.name,
    }));
  };

  const joinTournament = () => {
    if (!socket()) return;
    socket().send(JSON.stringify({
      type: 'join_tournament',
      tournament_id: tournaments().find(t => t.status === 'pending').tournament_id,
      player_id: userData.id,
      player_name: userData.name,
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
  const finalComponent = createComponent('div', {
    className: styles.waitingRoom,
  });

  createEffect(() => {
    finalComponent.element.innerHTML = '';
    let content;
    console.log('isnide create effect before if:', isPending());
    if (isPending()) {
      content = createComponent('div', {
        className: styles.waitingRoom,
        children: [
          createComponent('div', {
            className: styles.leftSection,
            children: [
              createComponent('pre', {
                style: { color: 'white' },
                content: 'Waiting for the next round to start...',
              }),
            ],
          }),
        ],
      });
    } else {
    content = createComponent('div', {
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
                  style: { color: 'white' },
                  content: 'Waiting Room',
                }),
                gameList,
              ],
            }),
          ],
        }),
      ],
    });
    }
    finalComponent.element.appendChild(content.element);
  })
 return finalComponent;
}
