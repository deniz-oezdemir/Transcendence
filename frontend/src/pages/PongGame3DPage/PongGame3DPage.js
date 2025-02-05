import { createSignal, createEffect } from '@reactivity';
import {
  createComponent,
  onCleanup,
  createCleanupContext,
  onMount,
  createMountContext,
} from '@component';

import {
  BoxGeometry,
  MeshStandardMaterial,
  MeshNormalMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
  WebGPURenderer,
  GridHelper,
  Clock,
  Group,
  Vector2,
  Vector3,
  PlaneGeometry,
  DirectionalLight,
  DirectionalLightHelper,
  ACESFilmicToneMapping,
  Raycaster,
  MathUtils,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import Ball from '@/game/Ball.js';
import Paddle from '@/game/Paddle.js';
import AIController from '@/game/AIController.js';
import lights from '@/game/lights.js';

import styles from './PongGame3DPage.module.css';

function lerp(from, to, speed) {
  const amount = (1 - speed) * from + speed * to;
  return Math.abs(from - to) < 0.001 ? to : amount;
}

export default function PongGame3DPage({ navigate }) {
  const cleanup = createCleanupContext();
  const mount = createMountContext();

  const clock = new Clock();

  const [size, setSize] = createSignal({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const fov = 60;
  //colors
  const data = {
    color: 0x00ff00,
    lightColor: 0xffffff,
    planeColor: 0x994ff,
    fogColor: 0xb499ff,
    fogNear: 25,
    fogFar: 150,
    paddleColor: 0x3633ff,
    ballColor: 0xce47ff,
  };

  // Score
  const score = {
    pc: 0,
    player: 0,
  };

  // Font Loader

  let pcScoreMesh, playerScoreMesh, loadedFont;
  const TEXT_PARAMS = {
    size: 4,
    depth: 0.5,
    curveSegments: 16,
    bevelEnabled: true,
    bevelThickness: 0.3,
    bevelSize: 0.15,
    bevelOffset: 0,
    bevelSegments: 8,
  };

  const fontLoader = new FontLoader();
  fontLoader.load(
    'assets/fonts/helvetiker_bold.typeface.json',
    function (font) {
      loadedFont = font;
      const geometry = new TextGeometry('0', {
        font: font,
        ...TEXT_PARAMS,
      });

      geometry.center();

      pcScoreMesh = new Mesh(geometry, new MeshNormalMaterial());
      playerScoreMesh = new Mesh(geometry, new MeshNormalMaterial());
      pcScoreMesh.position.set(0, 4, -boundaries.y - 2);
      playerScoreMesh.position.set(0, 4, boundaries.y + 2);

      scene.add(pcScoreMesh, playerScoreMesh);
    }
  );

  function getScoreGeometry(score) {
    const geometry = new TextGeometry(`${score}`, {
      font: loadedFont,
      ...TEXT_PARAMS,
    });

    geometry.center();
    return geometry;
  }

  let camera, renderer, gameRef, controls;

  // Scene Setup
  const scene = new Scene();
  scene.add(...lights);

  // const gridHelper = new GridHelper();
  // scene.add(gridHelper);

  // const helpers = new Group();
  // helpers.visible = true;
  // scene.add(helpers);

  const stats = new Stats();
  const gui = new GUI();
  // gui.add(helpers, 'visible').name('helpers');

  // Cursor
  const cursor = new Vector2(0, 0);
  const raycaster = new Raycaster();

  window.addEventListener('mousemove', (e) => {
    cursor.x = 2 * (e.clientX / window.innerWidth) - 1;
    cursor.y = -2 * (e.clientY / window.innerHeight) + 1;
  });

  const boundaries = new Vector2(20, 20);
  // Plane
  const planeGeometry = new PlaneGeometry(
    boundaries.x * 20,
    boundaries.y * 20,
    boundaries.x * 20,
    boundaries.y * 20
  );
  planeGeometry.rotateX(-Math.PI * 0.5);
  planeGeometry.translate(0, -5, 0);
  const planeMaterial = new MeshNormalMaterial({
    wireframe: true,
    transparent: true,
    opacity: 0.1,
  });

  const plane = new Mesh(planeGeometry, planeMaterial);
  scene.add(plane);

  const boundGeometry = new RoundedBoxGeometry(1, 2, boundaries.y * 2, 5, 0.5);
  const boundMaterial = new MeshNormalMaterial();
  const leftBound = new Mesh(boundGeometry, boundMaterial);
  leftBound.position.x = -boundaries.x - 0.25;
  const rightBound = leftBound.clone();
  rightBound.position.x *= -1;

  scene.add(leftBound);
  scene.add(rightBound);

  const playerPaddle = new Paddle(scene, boundaries, new Vector3(0, 0, 15));
  const pcPaddle = new Paddle(scene, boundaries, new Vector3(0, 0, -15));
  const ball = new Ball(scene, boundaries, [playerPaddle, pcPaddle]);
  const controller = new AIController(pcPaddle, ball);

  ball.addEventListener('onGoal', (e) => {
    score[e.message] += 1;

    const mesh = e.message === 'pc' ? pcScoreMesh : playerScoreMesh;

    const geometry = getScoreGeometry(score[e.message]);
    mesh.geometry = geometry;
    // playerScoreMesh.geometry.getAttibute('position').needUpdate = true;
  });

  //

  const directionalLight = new DirectionalLight(data.lightColor, Math.PI);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  const directionalLightHelper = new DirectionalLightHelper(directionalLight);
  directionalLightHelper.visible = false;
  scene.add(directionalLightHelper);

  const directionalLightFolder = gui.addFolder('DirectionalLight');
  directionalLightFolder.add(directionalLight, 'visible');
  directionalLightFolder.addColor(data, 'lightColor').onChange(() => {
    directionalLight.color.set(data.lightColor);
  });
  directionalLightFolder.add(directionalLight, 'intensity', 0, Math.PI * 10);

  const directionalLightFolderControls =
    directionalLightFolder.addFolder('Controls');
  directionalLightFolderControls
    .add(directionalLight.position, 'x', -1, 1, 0.001)
    .onChange(() => {
      directionalLightHelper.update();
    });
  directionalLightFolderControls
    .add(directionalLight.position, 'y', -1, 1, 0.001)
    .onChange(() => {
      directionalLightHelper.update();
    });
  directionalLightFolderControls
    .add(directionalLight.position, 'z', -1, 1, 0.001)
    .onChange(() => {
      directionalLightHelper.update();
    });
  directionalLightFolderControls
    .add(directionalLightHelper, 'visible')
    .name('Helper Visible');
  directionalLightFolderControls.close();

  onMount(() => {
    if (gameRef) {
      setSize({
        width: window.innerWidth,
        height: gameRef.offsetHeight,
      });
    }

    const resizeObserver = new ResizeObserver(() => {
      setSize({
        width: window.innerWidth,
        height: gameRef.offsetHeight,
      });
      const { width, height } = size();
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });

    resizeObserver.observe(gameRef);

    onCleanup(() => resizeObserver.disconnect());

    init();
  });

  const init = async () => {
    if (!navigator.gpu) {
      alert('WebGPU not supported. Falling back to WebGL');
      return;
    }

    try {
      const { width, height } = size();

      camera = new PerspectiveCamera(fov, width / height, 0.1, 1000);
      camera.position.set(-5, 30, 60);
      camera.lookAt(0, 2.5, 0);

      // WebGPU Renderer setup
      renderer = new WebGPURenderer({ antialias: true });
      // renderer.toneMapping = ACESFilmicToneMapping;
      // renderer.toneMappingExposure = 0.333;
      // renderer.shadowMap.enabled = true;
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(width, height);
      renderer.setAnimationLoop(animate);
      gameRef.appendChild(renderer.domElement);
      gameRef.appendChild(stats.dom);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
    } catch (error) {
      console.error('WebGPU setup failed:', error);
    }
  };

  function animate() {
    /**
     * Time between frames
     */
    const deltaTime = clock.getDelta();

    raycaster.setFromCamera(cursor, camera);
    const [intersection] = raycaster.intersectObject(plane);

    const dt = deltaTime * 0.1;

    for (let i = 0; i < 10; i++) {
      if (intersection) {
        const nextX = intersection.point.x;
        const prevX = playerPaddle.mesh.position.x;
        playerPaddle.setX(lerp(prevX, nextX, 0.5));
      }

      ball.update(dt);
      controller.update(dt);
    }

    controls.update();

    renderer.render(scene, camera);
    stats.update();
  }

  return createComponent('div', {
    className: `${styles.gameWrapper}`,
    children: [],
    ref: (element) => (gameRef = element),
    cleanup,
    mount,
  });
}
