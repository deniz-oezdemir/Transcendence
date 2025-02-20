import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';
import WaitingRoom from '@/components/WaitingRoom/WaitingRoom';
import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import pako from 'pako';
import io from 'socket.io-client';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'; // Use HTTP(S) for fetch requests
const port = 8002;
const apiUrl = `${protocol}//${hostname}:${port}`;

export default function OnlinePongGamePage({ navigate }) {
  const cleanup = createCleanupContext();

  // Game state signals
  const [isWaitingRoom, setWaitingRoom] = createSignal(true);
  const [isLoading, setIsLoading] = createSignal(true);
  const [isGameRunning, setIsGameRunning] = createSignal(false);
  const [gameId, setGameId] = createSignal(-1);
  const [CreatorId, setCreatorId] = createSignal(-1);
  const [playerId, setPlayerId] = createSignal(-1);
  const [CreatorName, setCreatorName] = createSignal('');
  const [playerName, setPlayerName] = createSignal('');
  const [gameType, setGameType] = createSignal('');
  const [gameDimensions, setGameDimensions] = createSignal({
    game: { width: 60, height: 40 },
    paddle: { width: 1, height: 5, offset: 2 },
    ball: { radius: 1 },
    scaleFactor: 10,
  });
  const [gamePositions, setGamePositions] = createSignal({
    ball: { x: 30, y: 20 },
    ballDirection: { x: 0.3, y: 0.3 },
    player1Position: 15,
    player2Position: 15,
  });
  const [gameScore, setGameScore] = createSignal({
    player1: { score: 0 },
    player2: { score: 0 },
    maxScore: 3,
    players: {
      player1: { id: -1, name: 'Player One' },
      player2: { id: -1, name: 'Player Two' },
    },
  });
  const [socket, setSocket] = createSignal(null);
  const [pageContent, setPageContent] = createSignal(null);

  /**
   * Initializes the game by creating a new game session on the server
   * Sets up initial game state and dimensions
   */
  function initializeGame() {
    console.log('Initializing Game...');
    setGameScore({
      player1: { score: 0 },
      player2: { score: 0 },
      maxScore: 3,
      players: {
        player1: { id: parseInt(CreatorId()), name: CreatorName() },
        player2: { id: parseInt(playerId()), name: playerName() },
      },
    });
    console.log(
      'Game Initialized:',
      gameId(),
      CreatorId(),
      CreatorName(),
      playerId(),
      playerName(),
      gameType()
    );
  }

  /**
   * Toggles game state between running and paused
   * Establishes Socket.IO connection when game starts
   */
  function toggleGame() {
    try {
      console.log('Toggling Game...', gameId());
      if (socket() === null) connectSocket();
      const sock = socket();
      if (sock === null) return;

      sock.emit('toggle', {
        game_id: gameId(),
      });
      console.log('Toggle Game: Success:', sock);
    } catch (error) {
      console.error('Toggle game failed:', error);
    }
  }

  /**
   * Ends the game session and cleans up Socket.IO connection
   * @param {number} id - Game ID to end
   * @returns {Promise<boolean>} Success status of game deletion
   */
  function endGame(id) {
    if (id < 0) return false;
    console.log('Ending Game:', id);
    if (socket()) {
      socket().disconnect();
      setSocket(null);
    }
    console.log('End Game Is Waiting Room:', isWaitingRoom());
    if (!isWaitingRoom()) {
      setWaitingRoom(true);
    }
    return true;
  }

  /**
   * Establishes Socket.IO connection for real-time game updates
   * Handles game state updates and score changes
   */
  function connectSocket() {
    const sock = io(`${apiUrl}`);
    sock.on('connect', () => {
      console.log('Socket.IO connected.');
      setSocket(sock);
      sock.emit('join_game', { game_id: gameId() });
    });

    let currentGameState = {}; // Maintain the current game state

    sock.on('game_state_update', (data) => {
      console.log('game_state updated with:', data);
      try {
        currentGameState = { ...currentGameState, ...data };
        const { scaleFactor } = gameDimensions();
        setGamePositions((prevPositions) => ({
          ...prevPositions,
          player1Position: currentGameState.player_1_position * scaleFactor,
          player2Position: currentGameState.player_2_position * scaleFactor,
          ball: {
            x: currentGameState.ball_x_position * scaleFactor,
            y: currentGameState.ball_y_position * scaleFactor,
          },
          ballDirection: {
            x: currentGameState.ball_x_direction * scaleFactor,
            y: currentGameState.ball_y_direction * scaleFactor,
          },
        }));
        setGameDimensions((prevDimensions) => ({
          ...prevDimensions,
          game: {
            width: currentGameState.game_width * scaleFactor,
            height: currentGameState.game_height * scaleFactor,
          },
          paddle: {
            width: currentGameState.paddle_width * scaleFactor,
            height: currentGameState.paddle_height * scaleFactor,
            offset: currentGameState.paddle_offset * scaleFactor,
          },
          ball: {
            radius: currentGameState.ball_radius * scaleFactor,
          },
        }));
        const currentScore = gameScore();
        if (
          currentGameState.player_1_score !== currentScore.player1.score ||
          currentGameState.player_2_score !== currentScore.player2.score
        ) {
          setGameScore((prevScore) => ({
            ...prevScore,
            player1: { score: currentGameState.player_1_score },
            player2: { score: currentGameState.player_2_score },
          }));
        }
      } catch (error) {
        console.error('Error processing game state update:', error);
      }
    });

    sock.on('disconnect', async () => {
      console.log('Socket.IO Disconnected.');
      setSocket(null);
      await endGame(gameId());
    });

    sock.on('error', (error) => {
      console.error('Socket.IO error:', error);
      setSocket(null);
    });

    onCleanup(() => {
      sock.disconnect();
    });
  }

  // Game Initialization Effect
  createEffect(() => {
    if (gameId() >= 0) return;
    setIsLoading(true);
    //initializeGame();
    setIsLoading(false);
  });

  let lastSentTime = 0;
  const sendRate = 33; // 30fps

  /**
   * Handles keyboard input for player movement and game controls
   * w/s: Player 1 movement
   * Arrow Up/Down: Player 2 movement
   * Space: Toggle game state
   * Escape: End game
   */
  const handleKeyDown = (e) => {
    const now = performance.now();
    if (now - lastSentTime < sendRate) return;
    lastSentTime = now;

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const sock = socket();
      if (sock === null) return;
      sock.emit('move', {
        game_id: gameId(),
        player_id: gameScore().players.player2.id,
        direction: e.key === 'ArrowUp' ? -1 : 1,
      });
    }
    if (e.key === 'w' || e.key === 's') {
      e.preventDefault();
      const sock = socket();
      if (sock === null) return;
      sock.emit('move', {
        game_id: gameId(),
        player_id: gameScore().players.player1.id,
        direction: e.key === 'w' ? -1 : 1,
      });
    }
    if (e.key === ' ') {
      e.preventDefault();
      const sock = socket();
      if (sock === null) {
        toggleGame();
      } else {
        sock.emit('toggle', {
          game_id: gameId(),
        });
      }
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      endGame(gameId());
      navigate('/');
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  // Cleanup listeners and close connections
  onCleanup(async () => {
    await endGame(gameId());
    window.removeEventListener('keydown', handleKeyDown);
  });

  /**
   * Creates loading screen component
   */
  const loadingElement = () => {
    const content = createComponent('div', {
      className: `container position-relative`,
    });
    const loading = createComponent('div', {
      className: 'loading',
      content: 'Loading game...',
    });
    content.element.appendChild(loading.element);
    return content;
  };

  /**
   * Creates main game component with score, board, and controls
   */
  const gameElement = () => {
    const content = createComponent('div', {
      className: `container position-relative`,
    });
    console.log('Is Waiting Room:', isWaitingRoom());
    if (isWaitingRoom()) {
      const waitingroom = WaitingRoom({
        onStartGame: () => {
          setWaitingRoom(false);
          initializeGame();
          toggleGame();
        },
        setGameId,
        setCreatorId,
        setCreatorName,
        setPlayerId,
        setPlayerName,
        setGameType,
      });
      content.element.appendChild(waitingroom.element);
    } else {
      const score = Score({ gameScore });
      const board = GameBoard({
        gameDimensions: gameDimensions,
        gamePositions: gamePositions,
      });
      const controls = GameControls();
      content.element.appendChild(score.element);
      content.element.appendChild(board.element);
      content.element.appendChild(controls.element);
    }
    return content;
  };

  // Update page content based on loading state
  createEffect(() => {
    if (!isLoading()) {
      setPageContent(gameElement());
    } else {
      setPageContent(loadingElement());
    }
  });

  return createComponent('div', {
    content: pageContent,
    cleanup,
  });
}
