import { createSignal, createEffect } from '@reactivity';
import { createComponent, onCleanup, createCleanupContext } from '@component';
import { isPending, setIsPending } from '@/components/GameState/GameState';

import WaitingRoom from '@/components/WaitingRoom/WaitingRoom';
import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import { getUser } from '@/auth.js';
import GameManager from './GameManager.js';

export default function OnlinePongGamePage() {
  const cleanup = createCleanupContext();

  const [isWaitingRoom, setWaitingRoom] = createSignal(true);

  let gameManager = null;

  let userData = { id: null, name: null };

  createEffect(async () => {
    const user = await getUser();
    userData.id = user.id;
    userData.name = user.username;
  });

  gameManager = new GameManager(userData);
  gameManager.handleResize();
  gameManager.onUpdate(() => setWaitingRoom(true));

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
      if (gameManager.ws) {
        gameManager.ws.close();
        gameManager.ws = null;
      }
      await gameManager.connectWebSocket();
      gameManager.initializeGame();
      setWaitingRoom(false);
      // gameManager.toggleGame();
      gameManager.animationId = requestAnimationFrame(animate);
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
