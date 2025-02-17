import { createSignal } from '@reactivity';

export default class NetworkManager {
  constructor() {
    this.matchmakingSocket = null;
    this.gameEngineSocket = null;
    this.matchmakingState = {
      matches: [],
      tournaments: [],
      connected: false,
    };
    this.gameId = null;

    this.createSignals();

    // Callbacks for external events
    this.callbacks = {
      onMatchFound: null,
      onTournamentFound: null,
      onGameStart: null,
      onGameEnd: null,
      onPlayerJoined: null,
      onPlayerLeft: null,
      onError: null,
      onStateChange: null,
    };
  }

  createSignals() {
    this.matches = createSignal([]);
    this.tournaments = createSignal([]);
    this.connectionStatus = createSignal('disconnected');
    this.currentGameId = createSignal(null);
  }

  initMatchmaking(timeout = 5000) {
    try {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol === 'htttps:' ? 'wss:' : 'ws:';
      const port = 8801;
      const wsUrl = `${protocol}//${hostname}:${port}/ws/waiting-room/`;

      this.matchmakingSocket = new WebSocket(wsUrl);
      this.setupMatchmakingListeners();

      return Promise.race([
        new Promise((resolve, reject) => {
          this.matchmakingSocket.onopen = () => {
            this.connectionStatus[1]('connected');
            this.matchmakingState.connected = true;
            resolve();
          };
          this.matchmakingSocket.onerror = reject;
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Connection timeout')), timeout)
        ),
      ]);
    } catch (error) {
      this.handleError('afailed to initialize matchmaking', error);
      throw error;
    }
  }

  setupMatchmakingListeners() {
    this.matchmakingSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMatchmakingMessage(data);
      } catch (error) {
        this.handleError('Error parsing message', error);
      }
    };

    this.matchmakingSocket.onclose = () => {
      this.connectionStatus[1]('disconnected');
      this.matchmakingState.connected = false;
      this.callbacks.onStateChange?.({ status: 'disconnected' });
    };
  }

  handleMatchmakingMessage(data) {
    switch (data.type) {
      case 'initial_games':
        this.updateGameLists(data.games);
      case 'match_created':
      case 'player_joined':
        this.handlePlayerJoined(data);
        break;
      case 'tournament_created':
      case 'tournament_started':
      case 'games_deleted':
        this.updateGameLists(data.available_games);
        break;
      case 'error':
        this.handleError(data.message);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  updateGameLists(games) {
    if (!games) return;

    const { matches = [], tournaments = [] } = games;
    this.matches[1](matches);
    this.tournaments[1](tournaments);
    this.matchmakingState.matches = matches;
    this.matchmakingState.tournaments = tournaments;

    this.callbacks.onStateChange?.({ status: 'updated', matches, tournaments });
  }

  handlePlayerJoined(data) {
    if (!data.available_games) return;

    const { matches, tournaments } = data.available_games;
    const activeMatch = matches?.find((m) => m.status === 'active');
    const activeTournament = tournaments?.find((t) => t.status === 'active');

    if (activeMatch) {
      this.currentGameId[1](activeMatch.match_id);
      this.callbacks.onMatchFound?.({
        gameId: activeMatch.match_id,
        gameType: 'match',
        creatorId: localStorage.getItem('userId'),
        creatorName: localStorage.getItem('username'),
      });
    }

    if (activeTournament) {
      this.currentGameId[1](activeTournament.tournament_id);
      this.callbacks.onTournamentFound?.({
        gameId: activeTournament.tournament_id,
        gameType: 'tournament',
        maxPlayers: activeTournament.max_players,
      });
    }

    this.updateGameLists(data.available_games);
  }

  sendMessage(message) {
    if (!this.matchmakingState.connected) {
      this.handleError('Not connected to matchmaking server');
      return;
    }
    try {
      this.matchmakingSocket.send(JSON.stringify(message));
    } catch (error) {
      this.handleError('Error sending message', error);
    }
  }

  handleError(message, error = null) {
    const errorInfo = { message, timestamp: new Date(), error: error?.message };
    console.error('NetworkManager Error:', errorInfo);
    this.callbacks.onError?.(errorInfo);
  }

  disconnect() {
    if (this.matchmakingSocket) {
      this.matchmakingSocket.close();
      this.matchmakingSocket = null;
    }
    this.connectionStatus[1]('disconnected');
    this.matchmakingState.connected = false;
  }

  initGameEngine(gameId) {
    // Initialize connection to game engine with specific gameId
  }

  createMatch(type, playerId) {
    if (!this.matchmakingSocket) return;
    this.sendMessage({
      type: 'create_match',
      gameType: type,
      player_id: playerId,
    });
  }

  joinMatch(gameId, playerId) {
    if (!this.matchmakingSocket) return;
    this.sendMessage({
      type: 'join_match',
      match_id: gameId,
      player_id: playerId,
    });
  }

  getGames() {
    if (!this.matchmakingSocket) return;
    this.sendMessage({ type: 'get_games' });
  }
}
