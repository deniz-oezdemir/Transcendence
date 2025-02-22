import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';

import WaitingRoom from '@/components/WaitingRoom/WaitingRoom';
import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import { getUser } from '@/auth.js';
import GameManager from './GameManager.js';

import pako from 'pako';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'; // Use HTTP(S) for fetch requests
const port = 8002;
const apiUrl = `${protocol}//${hostname}:${port}`;
let lastMoveTime = 0;

export default function OnlinePongGamePage({ navigate }) {
  const cleanup = createCleanupContext();

  // Game state signals
  const [isWaitingRoom, setWaitingRoom] = createSignal(true);

  const { id } = getUser();
  const gameManager = new GameManager(apiUrl, id);
  gameManager.handleResize();
  gameManager.updateCallbacks.push(() => {
    setWaitingRoom(true);
  });

  /**
   * Ends the game session and cleans up WebSocket connection
   * @param {number} id - Game ID to end
   * @returns {Promise<boolean>} Success status of game deletion
   */
  function endGame() {
    const result = gameManager.endGame();

    if (!isWaitingRoom()) {
      setWaitingRoom(true);
    }
    return result;
  }

  // Cleanup listeners and close connections
  onCleanup(async () => {
    endGame();
  });

  const animate = (delta) => {
    requestAnimationFrame(animate);
    gameManager.update(delta);
  };

  /**
   * Creates main game component with score, board, and controls
   */
  const gameElement = () => {
    let content;
    if (isWaitingRoom()) {
      content = WaitingRoom({
        onStartGame: async () => {
          await gameManager.connectWebSocket();
          gameManager.initializeGame();
          setWaitingRoom(false);
          gameManager.toggleGame();
          requestAnimationFrame(animate);
        },
        setGameId: (id) => gameManager.setGameId(id),
        setCreatorId: (id) => gameManager.setCreatorId(id),
        setCreatorName: (name) => gameManager.setCreatorName(name),
        setPlayerId: (id) => gameManager.setPlayerId(id),
        setPlayerName: (name) => gameManager.setPlayerName(name),
        setGameType: (type) => gameManager.setGameType(type),
      });
    } else {
      content = createComponent('div', {
        children: [
          Score({ gameScore: gameManager.gameScoreSig[0] }),
          GameBoard({
            gameDimensions: gameManager.gameDimensionsSig[0],
            gamePositions: gameManager.gamePositionsSig[0],
          }),
          GameControls(),
        ],
      });
    }
    return content;
  };

  return createComponent('div', {
    className: `container position-relative`,
    content: gameElement,
    cleanup,
  });
}
