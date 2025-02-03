import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';

import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';

export default function OnlinePongGamePage({ navigate }) {
  const cleanup = createCleanupContext();

  // Game state signals
  const [isLoading, setIsLoading] = createSignal(true);
  const [isGameRunning, setIsGameRunning] = createSignal(false);
  const [gameId, setGameId] = createSignal(-1);
  const [gameDimensions, setGameDimensions] = createSignal({
    game: { width: 600, height: 400 },
    paddle: { width: 15, height: 80, offset: 20 },
    ball: { width: 20, height: 20 },
    scaleFactor: 1,
  });
  const [gamePositions, setGamePositions] = createSignal({
    ball: { x: 290, y: 190 },
    ballDirection: { x: 3, y: 3 },
    player1Position: 160,
    player2Position: 160,
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
  const [websocket, setWebsocket] = createSignal(null);
  const [pageContent, setPageContent] = createSignal(null);

  /**
   * Calculates responsive game dimensions based on window size
   * @param {Object} originalDimensions - Initial game dimensions
   * @returns {Object} Scaled dimensions maintaining aspect ratio
   */
  function calculateResponsiveDimensions(originalDimensions) {
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

    return {
      game: {
        width: Math.floor(gameWidth),
        height: Math.floor(gameHeight),
      },
      paddle: {
        width: Math.floor(originalDimensions.paddle.width * 0.5 * scaleFactor),
        height: Math.floor(originalDimensions.paddle.height * scaleFactor),
        offset: Math.floor(originalDimensions.paddle.offset * scaleFactor),
      },
      ball: {
        width: Math.floor(originalDimensions.ball.width * scaleFactor),
        height: Math.floor(originalDimensions.ball.height * scaleFactor),
      },
      scaleFactor: scaleFactor,
    };
  }

  /**
   * Initializes the game by creating a new game session on the server
   * Sets up initial game state and dimensions
   */
  async function initializeGame() {
    try {
      const response = await fetch('http://localhost:8002/game/create_game/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          max_score: 3,
          player_1_id: 1,
          player_1_name: 'Player One',
          player_2_id: 2,
          player_2_name: 'Player Two',
        }),
      });

      if (!response.ok) {
        await endGame(1);
        throw new Error(
          `Failure to create game: ${response.status} ${response.statusText}`
        );
      }

      const gameData = await response.json();

      // Calculate Responsive Dimensions
      // const responsiveDimensions = calculateResponsiveDimensions({
      //   game: {
      //     width: gameData.game_width,
      //     height: gameData.game_height,
      //   },
      //   paddle: {
      //     width: gameData.paddle_width,
      //     height: gameData.paddle_height,
      //     offset: gameData.paddle_width,
      //   },
      //   ball: {
      //     width: 20,
      //     height: 20,
      //   },
      //   scaleFactor: 1,
      // });

      // Update Game State
      setGameId(gameData.id);
      // setGameDimensions(responsiveDimensions);
      //
      // setGamePositions({
      //   ball: {
      //     x: Math.floor(
      //       gameData.ball_x_position * responsiveDimensions.scaleFactor
      //     ),
      //     y: Math.floor(
      //       gameData.ball_y_position * responsiveDimensions.scaleFactor
      //     ),
      //   },
      //   ballDirection: {
      //     x: gameData.ball_x_direction,
      //     y: gameData.ball_y_direction,
      //   },
      //   player1Position: Math.floor(
      //     gameData.player_1_position * responsiveDimensions.scaleFactor
      //   ),
      //   player2Position: Math.floor(
      //     gameData.player_2_position * responsiveDimensions.scaleFactor
      //   ),
      // });

      setGameScore({
        player1: { score: 0 },
        player2: { score: 0 },
        maxScore: gameData.max_score,
        players: {
          player1: {
            id: gameData.player_1_id,
            name: gameData.player_1_name,
          },
          player2: {
            id: gameData.player_2_id,
            name: gameData.player_2_name,
          },
        },
      });
      console.log('Create Game: Success:', gameData);
    } catch (error) {
      console.error('Game initialization failed:', error);
      navigate('/');
    }
  }

  /**
   * Toggles game state between running and paused
   * Establishes WebSocket connection when game starts
   */
  async function toogleGame() {
    try {
      const response = await fetch(
        `http://localhost:8002/game/toggle_game/${gameId()}/`,
        {
          method: 'PUT',
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failure to toggle game: ${response.status} ${response.statusText}`
        );
      }

      const updatedGameState = await response.json();
      setIsGameRunning(updatedGameState.is_game_running);
      console.log('Toggle Game: Success:', updatedGameState);

      if (updatedGameState.is_game_running) {
        if (websocket() === null) connectWebSocket();
      }
    } catch (error) {
      console.error('Toggle game failed:', error);
    }
  }

  /**
   * Ends the game session and cleans up WebSocket connection
   * @param {number} id - Game ID to end
   * @returns {Promise<boolean>} Success status of game deletion
   */
  async function endGame(id) {
    try {
      const response = await fetch(
        'http://localhost:8002/game/delete_game/' + id + '/',
        {
          method: 'DELETE',
        }
      );
      if (response.ok) {
        console.log('Delete Game: Success:', response);
      } else {
        throw new Error(
          `Failure to delete game: ${response.status} ${response.statusText}`
        );
      }

      if (websocket()) {
        websocket().close();
        setWebsocket(null);
      }
      console.log('WebSocket closed.');

      return true;
    } catch (error) {
      console.error('Game deletion failed:', error);
      return false;
    }
  }

  /**
   * Establishes WebSocket connection for real-time game updates
   * Handles game state updates and score changes
   */
  function connectWebSocket() {
    const ws = new WebSocket(`ws://localhost:8002/ws/game/${gameId()}/`);
    ws.onopen = () => {
      console.log('WebSocket connected.');
      setWebsocket(ws);
    };

    ws.onmessage = function (event) {
      const data = JSON.parse(event.data);
      // console.log('Data from server:', data);
      if (data.type === 'game_state_update') {
        const { scaleFactor } = gameDimensions();
        setGamePositions((prevPositions) => ({
          ...prevPositions,
          player1Position: data.state.player_1_position * scaleFactor,
          player2Position: data.state.player_2_position * scaleFactor,
          ball: {
            x: data.state.ball_x_position * scaleFactor,
            y: data.state.ball_y_position * scaleFactor,
          },
        }));
        const currentGameScore = gameScore();
        if (
          data.state.player_1_score !== currentGameScore.player1.score ||
          data.state.player_2_score !== currentGameScore.player2.score
        ) {
          setGameScore((prevScore) => ({
            ...prevScore,
            player1: { score: data.state.player_1_score },
            player2: { score: data.state.player_2_score },
          }));
        }
      }
    };

    ws.onclose = async () => {
      console.log('WebSocket Disconnected.');
      setWebsocket(null);
      await endGame(gameId());
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWebsocket(null);
    };

    onCleanup(() => {
      ws.close();
    });
  }

  // Game Initialization Effect
  createEffect(() => {
    if (gameId() >= 0) return;
    setIsLoading(true);
    initializeGame();
    setIsLoading(false);
  });

  /**
   * Handles keyboard input for player movement and game controls
   * w/s: Player 1 movement
   * Arrow Up/Down: Player 2 movement
   * Space: Toggle game state
   * Escape: End game
   */
  const handleKeyDown = (e) => {
    e.preventDefault();
    if (e.key === 'ArrowUp') {
      const ws = websocket();
      if (ws === null) return;
      console.log('player2 up');
      ws.send(
        JSON.stringify({
          action: 'move',
          player_id: gameScore().players.player2.id,
          direction: -1,
        })
      );
    } else if (e.key === 'ArrowDown') {
      const ws = websocket();
      if (ws === null) return;
      console.log('player 2 down');
      ws.send(
        JSON.stringify({
          action: 'move',
          player_id: gameScore().players.player2.id,
          direction: 1,
        })
      );
    } else if (e.key === 'w') {
      const ws = websocket();
      if (ws === null) return;
      console.log('player 1 up');
      ws.send(
        JSON.stringify({
          action: 'move',
          player_id: gameScore().players.player1.id,
          direction: -1,
        })
      );
    } else if (e.key === 's') {
      const ws = websocket();
      if (ws === null) return;
      console.log('player 1 down');
      ws.send(
        JSON.stringify({
          action: 'move',
          player_id: gameScore().players.player1.id,
          direction: 1,
        })
      );
    } else if (e.key === ' ') {
      const ws = websocket();
      if (ws === null) {
        toogleGame();
      } else {
        console.log('toggle via websocket');
        ws.send(
          JSON.stringify({
            action: 'toggle',
          })
        );
      }
    } else if (e.key === 'Escape') {
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
    const score = Score({ gameScore });
    const board = GameBoard({
      gameDimensions: gameDimensions,
      gamePositions: gamePositions,
    });
    const controls = GameControls();
    content.element.appendChild(score.element);
    content.element.appendChild(board.element);
    content.element.appendChild(controls.element);
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
