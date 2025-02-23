import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';
import { isPending, setIsPending } from '@/components/GameState/GameState';

import WaitingRoom from '@/components/WaitingRoom/WaitingRoom';
import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import { getUser } from '@/auth.js';
import GameManager from './GameManager.js';

const hostname = window.location.hostname;
const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'; // Use HTTP(S) for fetch requests
const port = 8002;
const apiUrl = `${protocol}//${hostname}:${port}`;

export default function OnlinePongGamePage() {
  const cleanup = createCleanupContext();

  const [isWaitingRoom, setWaitingRoom] = createSignal(true);

  const { id } = getUser();

  const gameManager = new GameManager(apiUrl, id);
  gameManager.handleResize();
  gameManager.onUpdate(() => {
    setWaitingRoom(true);
  });

  onCleanup(() => {
    gameManager.endGame();
  });

  const animate = (delta) => {
    requestAnimationFrame(animate);
    gameManager.update(delta);
  };

  const waitingRoom = WaitingRoom({
    onStartGame: async () => {
      // use that in case of bad behavior server side
      // this.ws	=	null;
      await gameManager.connectWebSocket();
      gameManager.initializeGame();
      setWaitingRoom((prev) => (prev = !prev));
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

  const game = createComponent('div', {
    className: 'z-n1',
    children: [
      Score({ gameScore: gameManager.gameScoreSig[0] }),
      GameBoard({
        gameDimensions: gameManager.gameDimensionsSig[0],
        gamePositions: gameManager.gamePositionsSig[0],
      }),
      GameControls(),
    ],
  });

  createEffect(() => {
    if (isWaitingRoom()) {
      waitingRoom.element.style.display = 'block';
    } else {
      waitingRoom.element.style.display = 'none';
    }
  });

  return createComponent('div', {
    className: `container position-relative`,
    children: [waitingRoom, game],
    cleanup,
  });
}
