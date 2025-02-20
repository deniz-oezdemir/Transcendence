import { createComponent, onCleanup, onMount } from '@component';
import { createSignal, createEffect } from '@reactivity';

import MatchList from './MatchList.js';

import { rovingIndex } from 'roving-ux';

import styles from './GameMenu.module.css';

export default function GameMenu({ gameState, setGameState, network }) {
  let gameMenuRef = { current: null };
  let menuRect = null;
  let rafId = null;
  let handleMouseMove;
  let updateMenuRect;

  const [activeMenu, setActiveMenu] = createSignal(null);
  const [currentButton, setCurrentButton] = createSignal(null);
  const matchesSig = network.matches;
  const matchReadySig = network.matchReady;
  const tournamentsSig = network.tournaments;
  const connectionStatusSig = network.connectionStatus;

  const menuOptions = [
    {
      label: 'Practice',
      submenu: [
        {
          label: 'Start',
          action: () => {
            setGameState({ mode: 'practice', player: 'p1', gameId: -1 });
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', updateMenuRect);
            if (rafId) cancelAnimationFrame(rafId);
            if (gameMenuRef.current) {
              gameMenuRef.current.style.display = 'none';
            }
          },
        },
      ],
    },
    {
      label: 'Offline 1 vs 1',
      submenu: [
        {
          label: 'Player vs Player',
          action: () => {
            setGameState({ mode: 'offline', player: 'p1', gameId: -1 });
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', updateMenuRect);
            if (rafId) cancelAnimationFrame(rafId);
            gameMenuRef.current.remove();
          },
        },
      ],
    },
    {
      label: 'Online 1 vs 1',
      action: () => network.getGames(),
      submenu: [
        {
          label: 'Create a Match',
          action: () => {
            network.createMatch();
          },
        },
        {
          label: 'Refresh',
          action: () => network.getGames(),
        },
        {
          label: 'Delete all',
          action: () => network.deleteAllGames(),
        },
        {
          label: 'Start',
          action: () => {
            setGameState({
              mode: 'Online 1 vs 1',
            });
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('resize', updateMenuRect);
            if (rafId) cancelAnimationFrame(rafId);
            if (gameMenuRef.current) {
              gameMenuRef.current.style.display = 'none';
            }
          },
        },
      ],
    },
    {
      label: 'AI vs You',
      submenu: [
        { label: 'Easy', action: () => {} },
        { label: 'Medium', action: () => {} },
        { label: 'Hard', action: () => {} },
      ],
    },
    {
      label: 'Tournament',
      submenu: [
        { label: 'Local', action: () => {} },
        { label: 'Online', action: () => {} },
      ],
    },
    {
      label: 'Quit',
      submenu: [{ label: 'Sure?', action: () => {} }],
    },
  ];

  const handleMenuSetClick = (event, option) => {
    setActiveMenu(option);
    setCurrentButton(event.target);
    const firstButton = submenuSet.element.querySelector('button');
    if (firstButton) firstButton.focus();
  };

  const buttonSet = createComponent('ul', {
    className: `${styles.threeDButtonSet}`,
    children: menuOptions.map((option, index) =>
      createComponent('li', {
        id: index,
        children: [
          createComponent('button', {
            content: option.label,
            events: {
              click: (event) => {
                handleMenuSetClick(event, option);
                option.action ? option.action(event) : null;
              },
            },
          }),
        ],
      })
    ),
  });

  const submenuSet = createComponent('ul', {
    className: `${styles.threeDButtonSet} ${styles.submenu}`,
  });

  rovingIndex({
    element: buttonSet.element,
    target: 'button',
  });

  createEffect(() => {
    const section = activeMenu();
    submenuSet.element.innerHTML = '';
    if (section?.submenu) {
      section.submenu.forEach((option) => {
        const li = createComponent('li', {
          className: `${styles.threeDButtonSet}`,
          children: [
            createComponent('button', {
              id: option.label === 'Start' ? 'Start' : '',
              className:
                section.label === 'Online 1 vs 1' && option.label === 'Start'
                  ? styles.disabledButton
                  : '',
              content: option.label,
              events: {
                click: (event) => option.action(event),
              },
            }),
          ],
        });
        submenuSet.element.appendChild(li.element);
      });

      rovingIndex({ element: submenuSet.element, target: 'button' });

      if (section.label === 'Online 1 vs 1') {
        const handleJoin = (matchId) => {
          network.joinMatch(matchId);
        };

        const matchListComponent = MatchList({
          matches: matchesSig[0],
          readySignal: matchReadySig,
          network: network,
          onJoin: handleJoin,
        });

        submenuSet.element.appendChild(matchListComponent.element);
      }
    }
  });

  createEffect(() => {
    if (matchReadySig[0]() && network.userState.match.id) {
      const startButton = submenuSet.element.querySelector('#Start');
      if (startButton) {
        startButton.classList.remove(styles.disabledButton);
      }
    } else {
      const startButton = submenuSet.element.querySelector('#Start');
      if (startButton) {
        startButton.classList.add(styles.disabledButton);
      }
    }
  });

  const handleKeydown = (event) => {
    if (event.key === 'Backspace') {
      if (submenuSet.element.contains(document.activeElement)) {
        submenuSet.element.classList.add(styles.closing);

        setTimeout(() => {
          submenuSet.element.classList.remove(styles.closing);
          setActiveMenu(null);
        }, 700);

        currentButton().focus();
      }
    }
  };

  onMount(() => {
    const menu = buttonSet.element;
    const firstButton = menu.querySelector('button');
    if (firstButton) firstButton.focus();

    const motionOK = window.matchMedia(
      '(prefers-reduced-motion: no-preference)'
    ).matches;
    if (!motionOK) return;

    updateMenuRect = () => {
      menuRect = gameMenuRef.current.getBoundingClientRect();
    };

    handleMouseMove = (event) => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!menuRect) updateMenuRect();
        const { dx, dy } = getAngles(event.clientX, event.clientY);
        menu.style.setProperty('--x', `${dy * 0.05}deg`);
        menu.style.setProperty('--y', `${dx * 0.05}deg`);
      });
    };

    const getAngles = (clientX, clientY) => {
      const { x, y, width, height } = menuRect;
      return {
        dx: clientX - (x + width * 0.5),
        dy: clientY - (y + height * 0.5),
      };
    };

    gameMenuRef.current?.addEventListener('keydown', handleKeydown);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', updateMenuRect);

    onCleanup(() => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', updateMenuRect);
      if (rafId) cancelAnimationFrame(rafId);
    });
  });

  return createComponent('div', {
    className: `${styles.menu}`,
    children: [buttonSet, submenuSet],
    ref: (element) => (gameMenuRef.current = element),
  });
}
