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
 
  const user = getUser();
  userData.id = user.id;
  userData.name = user.name;


  //createEffect(() => {
    const socketConnection = () => {
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
              if (data.winner_id == userData.id) {
                const popup = createComponent('div', {
                  className: styles.popup,
                  children: [
                    createComponent('h2', {
                      content: '🎉 Congratulations! 🎉',
                      style: {
                        fontSize: '2rem',
                        marginBottom: '1rem',
                        color: '#ffd700'
                      }
                    }),
                    createComponent('p', {
                      content: 'You won the match!',
                      style: {
                        fontSize: '1.5rem',
                        color: '#fff'
                      }
                    })
                  ]
                });
              
                // Create fireworks
                for (let i = 0; i < 30; i++) {
                  const angle = (i * 12) * Math.PI / 180;
                  const velocity = 50 + Math.random() * 50;
                  const hue = Math.random() * 360;

                  const particle = createComponent('div', {
                    className: styles.fireworkParticle,
                    style: {
                      background: `hsl(${hue}, 100%, 50%)`,
                      left: '50%',
                      top: '50%',
                      transform: `translate(-50%, -50%) rotate(${angle}rad)`,
                      animation: `firework ${1 + Math.random() * 0.5}s ease-out forwards`
                    }
                  });

                  popup.element.appendChild(particle.element);
                }
              
                document.body.appendChild(popup.element);
              
                // Remove popup after 3 seconds
                setTimeout(() => {
                  document.body.removeChild(popup.element);
                }, 3000);
              } else {
                alert('You lost the match!');
              }
              break;
            
            case 'tournament_round_started':
              console.log('Tournament Round Started:', data);
              setIsPending(false);
              const tournamentTBC = data.available_games.tournaments.find(t => t.tournament_id == data.tournament_id);
              if (tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id)) {
                  console.log('Tournament to be continued');
                  console.log('Match_ID:', tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).match_id);
                  setGameId(tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).match_id);
                  setCreatorId(tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_1_id);
                  setCreatorName(tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_1_name);
                  setPlayerId(tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_2_id);
                  setPlayerName(tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_2_name);
                  setGameType('tournament');
                  onStartGame(data.game, tournamentTBC.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).match_id);
                } else {
                  console.log('No match found');
                }
              break;
            
            case 'tournament_finished':
                alert('Tournament Finished! Winner:', data.winner_id);
                setIsPending(false);
                break;

            case 'match_created':
            case 'tournament_created':
            case 'games_deleted':
              setMatches(data.available_games?.matches || []);
              setTournaments(data.available_games?.tournaments || []);
              console.log('Available Games:', data.available_games);
              if (data.is_local_match == true && userData.id == data.player_1_id) {
                console.log('Local match created:', data);
                setGameId(data.match_id);
                setCreatorId(data.player_1_id);
                setCreatorName(data.player_1_name);
                setPlayerId(data.player_2_id);
                setPlayerName(data.player_2_name);
                setGameType('local_match');
                onStartGame(data.game, data.match_id);
              } else if (data.is_ai_match == true && userData.id == data.player_1_id) {
                console.log('AI match created:', data);
                setGameId(data.match_id);
                setCreatorId(data.player_1_id);
                setCreatorName(data.player_1_name);
                setPlayerId(data.player_2_id);
                setPlayerName(data.player_2_name);
                setGameType('AI_match');
                onStartGame(data.game, data.match_id);
              } else if (data.is_remote_match == true && data.status == 'active' && (userData.id == data.player_1_id || userData.id == data.player_2_id)) {
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
                        console.log('Plyer joined Match Active');
                        if (data.player_1_id == userData.id || data.player_2_id == userData.id) {
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
  
                const tournament = data.available_games.tournaments.find(t => t.tournament_id == data.tournament_id);
                if (tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id)) {
                  console.log('Tournament Match Started');
                  setGameId(tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).match_id);
                  setCreatorId(tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_1_id);
                  setCreatorName(tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_1_name);
                  setPlayerId(tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_2_id);
                  setPlayerName(tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).player_2_name);
                  setGameType('tournament');
                  onStartGame(data.game, tournament.matches.find(m => m.player_1_id == userData.id || m.player_2_id == userData.id).match_id);
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
        if (event.key == 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          console.log('Escape key disabled');
        }
      }
      document.addEventListener('keydown', handlekeydown);
    }
   
    socketConnection();
    /*return () => {
      //ws?.close();
      //setSocket(null);
      document.removeEventListener('keydown', handlekeydown);
    };*/

  //});

  const createFireworks = (container) => {
    const colors = ['#ff0', '#ff3', '#f62', '#f24', '#f6f', '#63f', '#36f', '#2ff'];
    const particleCount = 40;
  
    for (let i = 0; i < particleCount; i++) {
      const angle = (i * (360 / particleCount)) * Math.PI / 180;
      const velocity = 200 + Math.random() * 100;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      const particle = createComponent('div', {
        className: styles.fireworkParticle,
        style: {
          background: color,
          '--tx': `${tx}px`,
          '--ty': `${ty}px`
        }
      });
      
      container.element.appendChild(particle.element);
    }
  };

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

  const remoteMatchGameList = createComponent("ul");
  createEffect(() => {
    const m = matches();

  
    remoteMatchGameList.element.innerHTML = '';
  
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
      remoteMatchGameList.element.appendChild(matchButton.element);
    });
  });

  const tournamentGameList = createComponent("ul");
  createEffect(() => {
    const t = tournaments();

    tournamentGameList.element.innerHTML = '';
    
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
      tournamentGameList.element.appendChild(tournamentButton.element);
    });
  });

  const deleteAllGames = createComponent("ul");
  createEffect(() => {
    deleteAllGames.element.innerHTML = '';
    deleteAllGames.element.appendChild(createComponent('button', {
        className: styles.createButton,
        content: 'DAG(TBdeleted)',
        events: { click: deleteGames }
      }).element);
  });

  const remoteMatch = createComponent("ul");
  createEffect(() => {
    remoteMatch.element.innerHTML = '';
    remoteMatch.element.appendChild(createComponent('button', {
      className: styles.createButton,
      content: '1v1 Match',
      events: { click: createRegularMatch }
    }).element);
  });

  const tournament = createComponent("ul");
  createEffect(() => {
    tournament.element.innerHTML = '';
    tournament.element.appendChild(createComponent('button', {
      className: styles.createButton,
      content: 'Tournament',
      events: { click: createFourTournament }
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
    if (isPending()) {
      content = createComponent('div', {
        className: styles.container,
        children: [
          createComponent('h1', {
            content: 'Waiting for next round to start...',
          }),
        ],
      });
      finalComponent.element.appendChild(content.element);
    }
    content = createComponent('div', {
      className: styles.container,
      children: [
        // Left Section
        createComponent('div', {
          className: styles.leftSection,
          children: [
            remoteMatch,
            createComponent('div', {
              className: styles.matchList,
              children: [
                createComponent('pre', {
                  style: { color: 'white' },
                  content: '',
                }),
                remoteMatchGameList,
              ],
            }),
            localGame,
            botMatch,
          ],
        }),
        // Right Section
        createComponent('div', {
          className: styles.rightSection,
          children: [
            tournament,
            createComponent('div', {
              className: styles.matchList,
              children: [
                createComponent('pre', {
                  style: { color: 'white' },
                  content: '',
                }),
                tournamentGameList,
              ],
            }),
            checkAvailableGames,
            deleteAllGames,
          ],
        }),
      ],
    });
    finalComponent.element.appendChild(content.element);
  })
 return finalComponent;
}
