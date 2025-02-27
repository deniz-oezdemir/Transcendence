import { createSignal, createEffect } from '@reactivity';
import pako from 'pako';
import lerp from '@/game/utils/lerp.js';

const BASE_SCALE = 10;
const SEND_INTERVAL_MS = 10;
const originalDimensions = {
  game: { width: 600, height: 400 },
  paddle: { width: 20, height: 50, offset: 10 },
  ball: { radius: 10 },
  scaleFactor: 1,
};
const originalPositions = {
  ball: { x: 300, y: 200 },
  player1Position: 175,
  player2Position: 175,
};

export default class GameManager {
  constructor(userData) {
    // Core game state
    this.gameData = {
      id: null,
      p1Id: null,
      p1Name: null,
      p2Id: null,
      p2Name: null,
      type: null,
    };
    this.userData = userData;
    this.isRunning = false;
    this.updateCallbacks = [];
    this.currentGameState = {};
    this.lastSendTime = 0;
    this.animationId = null;

    // Key stroke
    this.keys = new Set();

    // WebSocket connection
    this.ws = null;

    // Signals for reactive state management
    this.gameDimensionsSig = createSignal({
      ...originalDimensions,
    });
    this.gamePositionsSig = createSignal({
      ...originalPositions,
    });
    this.previousPositions = { ...originalPositions };
    this.targetPositions = { ...originalPositions };

    this.gameScoreSig = createSignal({
      player1: { score: 0 },
      player2: { score: 0 },
      maxScore: 3,
      players: {
        player1: { id: -1, name: 'Player One' },
        player2: { id: -1, name: 'Player Two' },
      },
    });

    // Bind methods
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.connectWebSocket = this.connectWebSocket.bind(this);
    this.updatePlayerPosition = this.updatePlayerPosition.bind(this);

    // Set up event listeners
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('resize', this.handleResize.bind(this));

    // Throttled resize handler
    this.resizeTimeout = null;
  }

  // Setter methods for game configuration
  setGameId(id) {
    this.gameData.id = id;
  }

  setCreatorId(id) {
    this.gameData.p1Id = id;
  }

  setCreatorName(name) {
    this.gameData.p1Name = name;
  }

  setPlayerId(id) {
    this.gameData.p2Id = id;
  }

  setPlayerName(name) {
    this.gameData.p2Name = name;
  }

  setGameType(type) {
    this.gameData.type = type;
  }

  /**
   * Initialize game with player data and connect to WebSocket
   */
  initializeGame() {
    console.log(
      'Game Initialized:',
      this.gameData.id,
      this.gameData.p1Id,
      this.gameData.p1Name,
      this.gameData.p2Id,
      this.gameData.p2Name,
      this.gameData.type
    );

    // Get current scale factor
    const { scaleFactor } = this.gameDimensionsSig[0]();

    // Reset positions with current scale factor
    this.gamePositionsSig[1]({
      player1Position: originalPositions.player1Position * scaleFactor,
      player2Position: originalPositions.player2Position * scaleFactor,
      ball: {
        x: originalPositions.ball.x * scaleFactor,
        y: originalPositions.ball.y * scaleFactor,
      },
    });

    // Set initial game score with player information
    this.gameScoreSig[1]({
      player1: { score: 0 },
      player2: { score: 0 },
      maxScore: 3,
      players: {
        player1: {
          id: parseInt(this.gameData.p1Id),
          name: this.gameData.p1Name,
        },
        player2: {
          id: parseInt(this.gameData.p2Id),
          name: this.gameData.p2Name,
        },
      },
    });
  }

  /**
   * Handles window resize events and recalculates game dimensions
   */
  handleResize() {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }

    this.resizeTimeout = setTimeout(() => {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;

      const aspectRatio =
        originalDimensions.game.width / originalDimensions.game.height;

      let gameWidth = windowWidth * 0.5;
      let gameHeight = gameWidth / aspectRatio;

      if (gameHeight > windowHeight * 0.7) {
        gameHeight = windowHeight * 0.7;
        gameWidth = gameHeight * aspectRatio;
      }

      const scaleFactor = gameWidth / originalDimensions.game.width;

      const newDimensions = {
        game: {
          width: Math.round(gameWidth),
          height: Math.round(gameHeight),
        },
        paddle: {
          width: Math.round(originalDimensions.paddle.width * scaleFactor),
          height: Math.round(originalDimensions.paddle.height * scaleFactor),
          offset: Math.round(originalDimensions.paddle.offset * scaleFactor),
        },
        ball: {
          radius: Math.round(originalDimensions.ball.radius * scaleFactor),
        },
        scaleFactor,
      };

      this.gameDimensionsSig[1](newDimensions);

      const initialPositions = {
        ball: {
          x: originalPositions.ball.x * scaleFactor,
          y: originalPositions.ball.y * scaleFactor,
        },
        player1Position: originalPositions.player1Position * scaleFactor,
        player2Position: originalPositions.player2Position * scaleFactor,
      };

      this.gamePositionsSig[1](initialPositions);

      this.previousPositions = { ...initialPositions };
      this.targetPositions = { ...initialPositions };

      this.resizeTimeout = null;
    }, 100);
  }

  /**
   * Connect to the game WebSocket and set up message handlers
   */
  connectWebSocket() {
    return new Promise((resolve, reject) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) return resolve();

      // Usar URL websocket más eficiente
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      this.ws = new WebSocket(
        `${wsProtocol}//${window.location.hostname}:8443/ws/game/${this.gameData.id}/`
      );

      this.ws.onopen = () => {
        //console.log('Game Engine WebSocket connected.');
        this.isConnected = true;
        resolve();
      };

      this.ws.onmessage = this.handleWebSocketMessage.bind(this);

      this.ws.onerror = (error) => {
        console.error('Game Engine WebSocket error:', error);
        this.isConnected = false;
        this.ws = null;
        reject(error);
      };

      this.ws.onclose = () => {
        //console.log('Game Engine WebSocket Disconnected.');
        this.isConnected = false;
        this.ws = null;
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  handleWebSocketMessage(event) {
    const data = JSON.parse(event.data);

    if (data.type === 'game_state_update') {
      try {
        // Decompress and parse the game state - Optimizar decompresión
        const binaryString = atob(data.state);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const partialState = JSON.parse(pako.inflate(bytes, { to: 'string' }));

        // Detect the state of the game
        if ('is_game_running' in partialState) {
          //console.log('is running:', partialState.is_game_running);
          this.isGameRunning = partialState.is_game_running;
        }

        // Update the current game state
        this.currentGameState = {
          ...this.currentGameState,
          ...partialState,
        };

        // Update game positions with scaling
        if (
          'ball_x_position' in partialState ||
          'ball_y_position' in partialState ||
          'player_1_position' in partialState ||
          'player_2_position' in partialState
        ) {
          const { scaleFactor } = this.gameDimensionsSig[0]();
          this.previousPositions = {
            player1Position: this.gamePositionsSig[0]().player1Position,
            player2Position: this.gamePositionsSig[0]().player2Position,
            ball: { ...this.gamePositionsSig[0]().ball },
          };

          // Update target positions
          this.targetPositions = {
            player1Position:
              this.currentGameState.player_1_position *
              BASE_SCALE *
              scaleFactor,
            player2Position:
              this.currentGameState.player_2_position *
              BASE_SCALE *
              scaleFactor,
            ball: {
              x:
                this.currentGameState.ball_x_position *
                BASE_SCALE *
                scaleFactor,
              y:
                this.currentGameState.ball_y_position *
                BASE_SCALE *
                scaleFactor,
            },
          };
        }

        // Update scores if needed
        if (
          'player_1_score' in partialState ||
          'player_2_score' in partialState ||
          'max_score' in partialState
        ) {
          this.gameScoreSig[1]((prevScore) => ({
            ...prevScore,
            player1: { score: this.currentGameState.player_1_score },
            player2: { score: this.currentGameState.player_2_score },
            maxScore: this.currentGameState.max_score,
          }));
        }
      } catch (error) {
        console.error('Error processing game state update:', error);
      }
    } else if (data.type === 'connection_closed') {
      //console.log(`Connection closed by server for game ${this.gameData.id}.`);
      if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.close();
      this.ws = null;
      this.updateCallbacks.forEach((callback) => callback());
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = null;
      }

      // Reset to the initial positions
      this.handleResize();
    }
  }

  /**
   * Toggle the game state between running and paused
   */
  toggleGame() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          action: 'toggle',
        })
      );
      this.isGameRunning = !this.isGameRunning;
    }
  }

  /**
   * End the current game and clean up resources
   */
  endGame() {
    if (this.gameData.id < 0) return false;

    //console.log('Ending Game:', this.gameData.id);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close();
    }
    this.ws = null;

    // Reset game state
    this.gameData.id = -1;
    this.isRunning = false;
    this.isPaused = false;

    // Reset animation
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    // Clear timeout if exists
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Remove event listeners
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('resize', this.handleResize);

    return true;
  }

  /**
   * Update player position with throttling to prevent message flooding
   */
  updatePlayerPosition(playerId, direction) {
    if (!this.ws || !this.ws.readyState === WebSocket.OPEN) return;

    this.ws.send(
      JSON.stringify({
        action: 'move',
        player_id: playerId,
        direction: direction,
      })
    );
  }

  handleKeyUp(e) {
    this.keys.delete(e.key);
  }

  /**
   * Handle keyboard input for game controls
   */
  handleKeyDown(e) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    // Solo prevenir eventos por defecto para teclas de juego específicas
    if (['ArrowUp', 'ArrowDown', 'w', 's', ' ', 'Escape'].includes(e.key)) {
      e.preventDefault();
    }

    this.keys.add(e.key);

    switch (e.key) {
      case ' ':
        this.toggleGame();
        break;

      case 'Escape':
        this.endGame();
        break;
    }
  }

  /**
   * Register a callback to be called on game state updates
   */
  onUpdate(callback) {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  update(delta) {
    if (!this.isGameRunning) return;

    const interpolationFactor = 0.5;
    for (let i = 0; i < 2; i++) {
      // Update game positions with interpolation
      this.gamePositionsSig[1]({
        player1Position: lerp(
          this.previousPositions.player1Position,
          this.targetPositions.player1Position,
          interpolationFactor
        ),
        player2Position: lerp(
          this.previousPositions.player2Position,
          this.targetPositions.player2Position,
          interpolationFactor
        ),
        ball: {
          x: lerp(
            this.previousPositions.ball.x,
            this.targetPositions.ball.x,
            interpolationFactor
          ),
          y: lerp(
            this.previousPositions.ball.y,
            this.targetPositions.ball.y,
            interpolationFactor
          ),
        },
      });
    }

    if (this.isGameRunning) {
      const now = performance.now();
      if (now - this.lastSendTime >= SEND_INTERVAL_MS) {
        const players = this.gameScoreSig[0]().players;
        const userId = this.userData.id;

        if (this.gameData.type === 'local_match') {
          if (this.keys.has('ArrowUp')) {
            this.updatePlayerPosition(players.player1.id, -1);
          }
          if (this.keys.has('ArrowDown')) {
            this.updatePlayerPosition(players.player1.id, 1);
          }
          if (this.keys.has('w')) {
            this.updatePlayerPosition(players.player2.id, -1);
          }
          if (this.keys.has('s')) {
            this.updatePlayerPosition(players.player2.id, 1);
          }
        } else {
          if (userId == players.player1.id) {
            if (this.keys.has('ArrowUp')) {
              this.updatePlayerPosition(players.player1.id, -1);
            }
            if (this.keys.has('ArrowDown')) {
              this.updatePlayerPosition(players.player1.id, 1);
            }
          } else if (userId == players.player2.id) {
            if (this.keys.has('ArrowUp')) {
              this.updatePlayerPosition(players.player2.id, -1);
            }
            if (this.keys.has('ArrowDown')) {
              this.updatePlayerPosition(players.player2.id, 1);
            }
          }
        }
        this.lastSendTime = now;
      }
    }
  }
}
