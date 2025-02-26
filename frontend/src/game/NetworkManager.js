import { createSignal } from '@reactivity';
import pako from 'pako';

export default class NetworkManager {
  constructor(params) {
    this.hostname = window.location.hostname;
    this.protocol = window.location.protocol === 'htttps:' ? 'wss:' : 'ws:';

    this.params = params;
    this.userState = {
      userId: null,
      username: null,
      match: {
        id: null,
        player1Id: null,
        player1Name: null,
        player2Id: null,
        player2Name: null,
      },
    };
    this.matchmakingSocket = null;
    this.gameEngineSocket = null;
    this.matchmakingState = {
      matches: [],
      tournaments: [],
      connected: false,
    };
    this.gameEngineState = {
      connected: false,
    };

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
    this.matchReady = createSignal(false);
  }

  updateUserData() {
    if (this.userState.userId !== this.params.user.id) {
      this.userState.userId = this.params.user.id;
      this.userState.username = this.params.user.name;
    }
  }

  initMatchmaking(timeout = 5000) {
    this.updateUserData();
    try {
      const nginxPort = 8000;
      const wsUrl = `${this.protocol}//${this.hostname}:${nginxPort}/ws/waiting-room/`;

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
        this.handleError('Error parsing Match Making message', error);
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
        break;
      case 'match_created':
        if (this.userId === data.creator_id) {
          this.currentGameId[1](data.id);
          this.userState.match.id = data.id;
          this.userState.match.player1Id = data.creator_id;
          this.userState.match.player1Name = data.creator_name;
        }
        this.updateGameLists(data.available_games);
        break;
      case 'player_joined':
        this.handlePlayerJoined(data);
        break;
      case 'tournament_created':
        break;
      case 'tournament_started':
        break;
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
    if (
      data.game_type === 'match' &&
      data.game_id === this.userState.match.id
    ) {
      const match = data.available_games.matches.find(
        (match) => match.match_id === this.userState.match.id
      );
      if (!match) this.handleError("On Player Joined, game doesn't exist");
      this.userState.match.id = match.match_id;
      this.userState.match.player2Id = match.player_2_id;
      this.userState.match.player2Name = data.player_2_name;
      this.userState.match.player1Id = match.player_1_id;
      this.userState.match.player1Name = match.player_1_name;
      this.matchReady[1](true);
      this.callbacks.onPlayerJoined?.();
    }
    this.updateGameLists(data.available_games);
  }

  sendMatchMakingMessage(message) {
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
    this.matchmakingState.connected = false;
    if (this.gameEngineSocket) {
      this.gameEngineSocket.close();
      this.gameEngineSocket = null;
    }
    this.gameEngineState.connected = false;
    this.connectionStatus[1]('disconnected');
  }

  createMatch() {
    if (!this.matchmakingSocket) return;
    //console.log(this.userState.username);
    this.sendMatchMakingMessage({
      type: 'create_match',
      player_id: this.userState.userId,
      player_name: this.userState.username,
    });
  }

  joinMatch(matchId) {
    if (!this.matchmakingSocket) return;
    this.sendMatchMakingMessage({
      type: 'join_match',
      match_id: matchId,
      player_id: this.userState.userId,
      player_name: this.userState.username,
    });
  }

  getGames() {
    if (!this.matchmakingSocket) return;
    this.sendMatchMakingMessage({ type: 'get_games' });
  }

  deleteAllGames() {
    if (!this.matchmakingSocket) return;
    this.sendMatchMakingMessage({ type: 'delete_all_games' });
  }

  initGameEngine(timeout = 5000) {
    this.callbacks.onPlayerJoined?.();
    try {
      const nginxPort = 8000;
      const wsUrl = `${this.protocol}//${this.hostname}:${nginxPort}/ws/game/${this.userState.match.id}/`;

      this.gameEngineSocket = new WebSocket(wsUrl);
      this.setupGameEngineListeners();

      return Promise.race([
        new Promise((resolve, reject) => {
          this.gameEngineSocket.onopen = () => {
            this.connectionStatus[1]('connected');
            this.gameEngineState.connected = true;
            resolve();
          };
          this.gameEngineSocket.onerror = reject;
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

  setupGameEngineListeners() {
    this.gameEngineSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleGameEngineMessage(data);
      } catch (error) {
        this.handleError('Error parsing Game Engine message', error);
      }
    };
    this.gameEngineSocket.onclose = () => {
      this.connectionStatus[1]('disconnected');
      this.gameEngineState.connected = false;
      this.callbacks.onStateChange?.({ status: 'disconnected' });
    };
  }

  handleGameEngineMessage(data) {
    switch (data.type) {
      case 'game_state_update':
        const binaryString = atob(data.state);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const partialGameState = JSON.parse(
          pako.inflate(bytes, { to: 'string' })
        );

        this.gameEngineState.state = {
          ...this.gameEngineState.state,
          ...partialGameState,
        };
        //console.log(this.gameEngineState.state);
        break;
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  sendGameEngineMessage(message) {
    if (!this.gameEngineState.connected) {
      this.handleError('Not connected to the game engine server');
      return;
    }
    try {
      //console.log('before send message to Engine:', message);
      this.gameEngineSocket.send(JSON.stringify(message));
    } catch (error) {
      this.handleError('Error sending message', error);
    }
  }

  move(direction) {
    if (!this.gameEngineSocket) return;
    this.sendGameEngineMessage({
      action: 'move',
      player_id: this.userState.userId,
      direction: direction,
    });
  }

  toggle() {
    if (!this.gameEngineSocket) return;
    this.sendGameEngineMessage({
      action: 'toggle',
    });
  }
}
