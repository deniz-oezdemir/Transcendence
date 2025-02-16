import { createComponent, onCleanup, onMount } from '@component';
import { createSignal, createEffect } from '@reactivity';

import { rovingIndex } from 'roving-ux';

import styles from './GameMenu.module.css';

export default function GameMenu({ gameState, setGameState }) {
  let gameMenuRef = { current: null };
  let menuRect = null;
  let rafId = null;
  let handleMouseMove;
  let updateMenuRect;

  const [activeMenu, setActiveMenu] = createSignal(null);
  const [currentButton, setCurrentButton] = createSignal(null);

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
            gameMenuRef.current.remove();
          },
        },
      ],
    },
    {
      label: 'Offline 1 vs 1',
      submenu: [
        { label: 'Player vs Player', action: () => {} },
        { label: 'Tournament Mode', action: () => {} },
      ],
    },
    {
      label: 'Online 1 vs 1',
      submenu: [
        { label: 'Ranked Match', action: () => {} },
        { label: 'Friendly Match', action: () => {} },
        { label: 'Custom Room', action: () => {} },
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
    setActiveMenu(option.submenu);
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
              click: (event) => handleMenuSetClick(event, option),
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
    const submenu = activeMenu();
    submenuSet.element.innerHTML = '';
    if (submenu) {
      submenu.forEach((option) => {
        const li = createComponent('li', {
          children: [
            createComponent('button', {
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
    }
  });

  const handleKeydown = (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'Backspace') {
      if (submenuSet.element.contains(document.activeElement)) {
        submenuSet.element.classList.add(styles.closing);

        setTimeout(() => {
          submenuSet.element.classList.remove(styles.closing);
          setActiveMenu(null);
        }, 400);

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
