import { createSignal, createEffect } from '@reactivity';
import {
  createComponent,
  onCleanup,
  createCleanupContext,
  onMount,
  createMountContext,
} from '@component';

import {
  WebGPURenderer,
  PerspectiveCamera,
  Scene,
  Clock,
  Vector2,
  Vector3,
  ACESFilmicToneMapping,
  VSMShadowMap,
  FogExp2,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import Game from '@/game/Game.js';

import styles from './PongGame3DPage.module.css';

export default function PongGame3DPage({ navigate }) {
  const cleanup = createCleanupContext();
  const mount = createMountContext();
  const gameRef = { current: null };
  const clock = new Clock();
  const container = window.document.querySelector('.container');

  // Config params
  const params = {
    environment: {
      backgroundColor: 0xb499ff, //0x9e7aff,
      fog: {
        color: 0xeefcfb, //0x9e7aff,
        near: 96,
        far: 2000,
      },
    },
    colors: {
      plane: 0xb994ff, //0x9b71ea, //0x6966ff,
      paddleP1: 0x14d9c5, // 0x3633ff, //0x3633ff,
      paddleP2: 0xd90da2, // 0x363300, //0x3633ff,
      scoreP1: 0x14d9c5, // 0x3633ff, //0x3633ff,
      scoreP2: 0xd90da2, // 0x363300, //0x3633ff,
      ball: 0xfffbeb, // 0xce47ff, //0xe63d05,
      hologram: 0x00d5ff,
      bloomIntensity: 1.0,
      sun: 0xfffbf9,
      water: 0x1d4e51,
    },
    dimensions: {
      game: new Vector2(
        window.innerWidth,
        container.getBoundingClientRect().height
      ),
      fov: 75,
      boundaries: new Vector2(20, 30),
      paddle: new Vector2(5, 1),
      ballRadius: 1,
      world: new Vector2(10000, 10000),
    },
    positions: {
      ball: new Vector3(0, 0, 0),
      ballDirection: new Vector3(1, 0, 1),
      paddleP1: new Vector3(0, 0, 28),
      paddleP2: new Vector3(0, 0, -28),
    },
    score: {
      p1: 0,
      p2: 0,
      max: 3,
      info: {
        p1: { id: -1, name: 'Player One' },
        p2: { id: -1, name: 'Player Two' },
      },
    },
    bloom: {
      threshold: 0.0,
      strength: 3.0,
      radius: 0.9,
    },
  };

  const scene = new Scene();
  scene.fog = new FogExp2(params.environment.fog.color, 0.001);
  // scene.fog = new Fog(
  //   params.environment.fog.color,
  //   params.environment.fog.near * 0.5,
  //   params.environment.fog.far * 2
  // );

  // scene.add(...lights);

  const camera = new PerspectiveCamera(
    params.dimensions.fov,
    params.dimensions.game.x / params.dimensions.game.y,
    1,
    20000
  );
  camera.position.set(0, 30, 50);
  camera.lookAt(new Vector3(0, 5, 0));

  const renderer = new WebGPURenderer({
    antialias: window.devicePixelRatio < 2,
  });
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = VSMShadowMap;
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(params.dimensions.game.x, params.dimensions.game.y);

  const stats = new Stats();

  const game = new Game(scene, camera, renderer, params);

  //

  onMount(async () => {
    try {
      gameRef.current.appendChild(renderer.domElement);
      gameRef.current.appendChild(stats.dom);

      await game.init();

      renderer.setAnimationLoop(animate);
    } catch (error) {
      console.error('Game initialization failed:', error);
    }
  });

  const handleResize = () => {
    if (!renderer || !camera) return;
    params.dimensions.game.x = window.innerWidth;
    params.dimensions.game.y = container.getBoundingClientRect().height;
    camera.aspect = params.dimensions.game.x / params.dimensions.game.y;
    camera.updateProjectionMatrix();

    renderer.setSize(params.dimensions.game.x, params.dimensions.game.y);
  };

  window.addEventListener('resize', handleResize);

  onCleanup(() => {
    window.removeEventListener('resize', handleResize);
    game.dispose();
  });

  let delta = 0;
  function animate() {
    delta = clock.getDelta();
    stats.update();
    game.update(delta);
  }

  return createComponent('div', {
    className: `${styles.gameWrapper}`,
    children: [],
    ref: (element) => (gameRef.current = element),
    cleanup,
    mount,
  });
}
