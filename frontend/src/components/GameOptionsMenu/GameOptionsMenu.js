import { createComponent } from '@component';
import { createEffect } from '@reactivity';

import styles from './GameOptionsMenu.module.css';

function toggleComponent(id, label, state, setState) {
  const toogle = createComponent('div', {
    className: 'form-check form-switch',
    children: [
      createComponent('input', {
        className: `${styles.checkInput} form-check-input`,
        id,
        attributes: {
          type: 'checkbox',
          role: 'switch',
        },
        events: {
          change: (e) => setState(e.target.checked),
        },
      }),
      createComponent('label', {
        className: `form-check-label`,
        attributes: {
          for: id,
        },
        content: label,
      }),
    ],
  });

  if (state()) toogle.element.querySelector('input').checked = true;

  return toogle;
}

export default function GameOptionsMenu({
  isFullScreen,
  setIsFullScreen,
  aiEnabled,
  setAiEnabled,
  mouseModeEnabled,
  setMouseModeEnabled,
  gameState,
  gameRef,
}) {
  const aiToggle = toggleComponent(
    'aiToggle',
    'AI Enabled',
    aiEnabled,
    setAiEnabled
  );
  const mouseToggle = toggleComponent(
    'mouseToggle',
    'Mouse Mode',
    mouseModeEnabled,
    setMouseModeEnabled
  );

  const toogleSection = createComponent('div', {
    className: `${styles.toogleSection}`,
    children: [mouseToggle],
  });

  const handleFullScreen = () => {
    const element = gameRef?.current;
    if (!isFullScreen()) {
      element?.requestFullscreen?.() || element?.webkitRequestFullscreen?.();
      fullScreenButton.element.innerText = 'Exit Fullscreen';
    } else {
      document.exitFullscreen?.() || document.webkitExitFullscreen?.();
      fullScreenButton.element.innerText = 'Go Fullscreen';
    }
    setIsFullScreen((prevState) => !prevState);
  };

  const fullScreenButton = createComponent('button', {
    content: 'Go Fullscreen',
    className: `btn btn-outline-primary ${styles.fullScreenBtn}`,
    events: {
      click: handleFullScreen,
    },
  });

  createEffect(() => {
    const mode = gameState().mode;
    if (mode == null) {
      aiToggle.element.remove();
    } else if (mode == 'practice') {
      toogleSection.element.insertBefore(aiToggle.element, mouseToggle.element);
    }
  });

  return createComponent('div', {
    className: styles.controlsContainer,
    children: [toogleSection, fullScreenButton],
  });
}
