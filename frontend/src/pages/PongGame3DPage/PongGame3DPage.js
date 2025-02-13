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
  BoxGeometry,
  MeshStandardMaterial,
  MeshNormalMaterial,
  Mesh,
  PerspectiveCamera,
  Scene,
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
  Color,
  Fog,
  VSMShadowMap,
  AxesHelper,
  EquirectangularReflectionMapping,
  FloatType,
  HalfFloatType,
  PMREMGenerator,
  LinearColorSpace,
  LinearFilter,
  LinearEncoding,
  SRGBColorSpace,
  ClampToEdgeWrapping,
  DoubleSide,
  BackSide,
  CylinderGeometry,
  MeshPhysicalMaterial,
  FrontSide,
  PostProcessing,
  NormalBlending,
  AdditiveBlending,
  MeshBasicMaterial,
  NearestMipmapNearestFilter,
  ColorManagement,
  LinearMipmapLinearFilter,
  NearestFilter,
  SpriteMaterial,
  TextureLoader,
  Sprite,
  RepeatWrapping,
  LineBasicMaterial,
  EdgesGeometry,
  LineSegments,
  CircleGeometry,
  FogExp2,
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { pass, mrt, output, emissive, uniform, float } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';
import { WaterMesh } from 'three/addons/objects/WaterMesh.js';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';

import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import Ball from '@/game/entities/Ball.js';
import Paddle from '@/game/entities/Paddle.js';
import AIController from '@/game/entities/AIController.js';
import lights from '@/game/environment/lights.js';
import Firework from '@/game/effects/Firework.js';
import FireworkPool from '@/game/effects/FireworkPool.js';
import NeonRingEffect from '@/game/effects/NeonRingEffect.js';
import HolographicMaterial from '@/game/materials/HolographicMaterial.js';
import MetallicWalls from '@/game/environment/MetallicWalls.js';
import lerp from '@/game/utils/lerp.js';
import { getSunParams, getSkyParams } from '@/game/utils/skyParams.js';
import createPongTable from '@/game/environment/createPongTable.js';
import ScoreDisplay from '@/game/entities/ScoreDisplay.js';
import ScoreMessages from '@/game/effects/ScoreMessages.js';
import SceneEnvironment from '@/game/environment/SceneEnvironment.js';

import styles from './PongGame3DPage.module.css';

export default function PongGame3DPage({ navigate }) {
  const cleanup = createCleanupContext();
  const mount = createMountContext();

  const clock = new Clock();

  const [size, setSize] = createSignal({
    width: 0,
    height: 0,
  });

  const fov = 75;
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
      sun: 0xffffff,
      water: 0x003333,
    },
    dimensions: {
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
      strength: 1.0,
      radius: 0.0,
    },
  };

  let gameRef;

  const container = window.document.querySelector('.container');
  const width = window.innerWidth;
  const height = container.getBoundingClientRect().height;
  setSize({
    width,
    height,
  });

  // Scene Setup
  const scene = new Scene();
  // scene.add(...lights);
  scene.fog = new FogExp2(params.environment.fog.color, 0.001);
  // scene.fog = new Fog(
  //   params.environment.fog.color,
  //   params.environment.fog.near * 0.5,
  //   params.environment.fog.far * 2
  // );

  const camera = new PerspectiveCamera(fov, width / height, 1, 20000);
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
  renderer.setSize(width, height);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const scenePass = pass(scene, camera);
  scenePass.setMRT(
    mrt({
      output,
      bloomIntensity: float(0), // default bloom intensity
    })
  );

  const outputPass = scenePass.getTextureNode();
  const bloomIntensityPass = scenePass.getTextureNode('bloomIntensity');

  const bloomPass = bloom(outputPass.mul(bloomIntensityPass));
  bloomPass.threshold.value = params.bloom.threshold;
  bloomPass.strength.value = params.bloom.strength;
  bloomPass.radius.value = params.bloom.radius;

  const postProcessing = new PostProcessing(renderer);
  postProcessing.outputColorTransform = false;
  postProcessing.outputNode = outputPass.add(bloomPass).renderOutput();

  // const axesHelper = new AxesHelper(5);
  // axesHelper.position.y = -1;
  // scene.add(axesHelper);
  // const gridHelper = new GridHelper();
  // scene.add(gridHelper);

  const fontLoader = new FontLoader();
  const scoreDisplay = new ScoreDisplay(scene, params, fontLoader);
  scoreDisplay.init();

  const pongTable = createPongTable(params);
  scene.add(pongTable);

  const stats = new Stats();

  const gui = new GUI();

  const bloomFolder = gui.addFolder('Bloom').close();
  bloomFolder
    .add(params.bloom, 'threshold', 0, 1, 1)
    .name('Bloom Threshold')
    .onChange((value) => {
      bloomPass.threshold.value = value;
    });
  bloomFolder
    .add(params.bloom, 'strength', 0.0, 10.0)
    .name('Bloom Strength')
    .onChange((value) => {
      bloomPass.strength.value = value;
    });
  bloomFolder
    .add(params.bloom, 'radius', 0.0, 1.0, 0.01)
    .name('Bloom Radius')
    .onChange((value) => {
      bloomPass.radius.value = value;
    });

  // Cursor
  const cursor = new Vector2(0, 0);
  const raycaster = new Raycaster();

  window.addEventListener('mousemove', (e) => {
    cursor.x = 2 * (e.clientX / window.innerWidth) - 1;
    cursor.y = -2 * (e.clientY / window.innerHeight) + 1;
  });

  //
  //

  const player1Paddle = new Paddle(
    scene,
    params.dimensions,
    params.positions.paddleP1,
    params.colors.paddleP1
  );
  player1Paddle.material.mrtNode = mrt({
    bloomIntensity: uniform(params.colors.bloomIntensity),
  });

  const player2Paddle = new Paddle(
    scene,
    params.dimensions,
    params.positions.paddleP2,
    params.colors.paddleP2
  );
  player2Paddle.material.mrtNode = mrt({
    bloomIntensity: uniform(params.colors.bloomIntensity),
  });

  const ball = new Ball(
    scene,
    params.dimensions.boundaries,
    [player1Paddle, player2Paddle],
    params.colors.ball
  );
  ball.material.mrtNode = mrt({
    bloomIntensity: uniform(params.colors.bloomIntensity),
  });

  const fireworks = new FireworkPool(scene);
  const ringWaves = new NeonRingEffect(scene, [
    params.colors.paddleP1,
    params.colors.paddleP2,
  ]);
  //

  const controller = new AIController(player2Paddle, ball);

  //

  onMount(() => {
    init();

    window.addEventListener('resize', () => {
      if (!renderer || !camera) return;
      setSize({
        width: window.innerWidth,
        height: container.getBoundingClientRect().height,
      });
      const { width, height } = size();

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    });

    onCleanup(() => {
      resizeObserver.disconnect();
      fireworks.dispose();
      ringWaves.dispose();
    });
  });

  const textureLoader = new TextureLoader();

  const scoreMessages = new ScoreMessages(scene, params, textureLoader);
  const sceneEnv = new SceneEnvironment(scene, renderer, params);

  const init = async () => {
    try {
      gameRef.appendChild(renderer.domElement);
      gameRef.appendChild(stats.dom);

      await renderer.init();

      ball.addEventListener('onGoal', (e) => {
        params.score[e.message] += 1;
        scoreDisplay.updateScore(params.score['p1'], params.score['p2']);

        scoreMessages.trigger(e.message);
      });

      ball.addEventListener('collide', () => {
        fireworks.getAvailableFirework(ball.mesh.position);
        ringWaves.onCollision(ball.mesh.position);
      });

      //

      await scoreMessages.init();
      await sceneEnv.init();

      renderer.setAnimationLoop(animate);
    } catch (error) {
      console.error('WebGPU setup failed:', error);
    }
  };

  function animate() {
    const deltaTime = clock.getDelta();

    raycaster.setFromCamera(cursor, camera);
    const [intersection] = raycaster.intersectObject(sceneEnv.water);

    const dt = deltaTime * 0.1;

    for (let i = 0; i < 10; i++) {
      if (intersection) {
        const nextX = intersection.point.x;
        const prevX = player1Paddle.mesh.position.x;
        player1Paddle.setX(lerp(prevX, nextX, 0.5));
      }

      ball.update(dt);
      controller.update(dt);
    }

    fireworks.update(deltaTime);
    ringWaves.update(deltaTime);

    controls.update();

    scoreDisplay.update();
    scoreMessages.update();

    stats.update();

    postProcessing.render();
    // renderer.render(scene, camera);
  }

  return createComponent('div', {
    className: `${styles.gameWrapper}`,
    children: [],
    ref: (element) => (gameRef = element),
    cleanup,
    mount,
  });
}
