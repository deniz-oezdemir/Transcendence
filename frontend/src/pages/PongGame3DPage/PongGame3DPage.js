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
} from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { UltraHDRLoader } from 'three/addons/loaders/UltraHDRLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';

import Score from '@/components/Score/Score';
import GameBoard from '@/components/GameBoard/GameBoard';
import GameControls from '@/components/GameControls/GameControls';
import Ball from '@/game/Ball.js';
import Paddle from '@/game/Paddle.js';
import AIController from '@/game/AIController.js';
import lights from '@/game/lights.js';
import Firework from '@/game/Firework.js';

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
  const params = {
    planeColor: 0xb994ff, //0x9b71ea, //0x6966ff,
    fogColor: 0xb499ff, //0x9e7aff,
    fogNear: 30,
    fogFar: 300,
    paddleColor: 0x3633ff, //0x3633ff,
    ballColor: 0xce47ff, //0xe63d05,
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

  const scoreMaterial = new MeshStandardMaterial({ color: params.ballColor });

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

      pcScoreMesh = new Mesh(geometry, scoreMaterial);
      playerScoreMesh = new Mesh(geometry, scoreMaterial);
      pcScoreMesh.position.set(0, 4, -boundaries.y - 2);
      playerScoreMesh.position.set(0, 4, boundaries.y + 2);

      pcScoreMesh.castShadow = true;
      playerScoreMesh.castShadow = true;

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
  // scene.background = new Color(params.fogColor);
  // scene.fog = new Fog(params.fogColor, params.fogNear, params.fogFar);

  scene.add(...lights);

  // const axesHelper = new AxesHelper(3);
  // scene.add(axesHelper);
  // const gridHelper = new GridHelper();
  // scene.add(gridHelper);

  // const helpers = new Group();
  // helpers.visible = true;
  // scene.add(helpers);

  const stats = new Stats();

  const gui = new GUI();

  gui
    .addColor(params, 'paddleColor')
    .name('PC Paddle Color')
    .onChange((val) => {
      pcPaddle.material.color.set(val);
    });

  gui
    .addColor(params, 'paddleColor')
    .name('Player Paddle Color')
    .onChange((val) => {
      playerPaddle.material.color.set(val);
    });

  gui
    .addColor(params, 'ballColor')
    .name('Ball Color')
    .onChange((val) => {
      ball.material.color.set(val);
    });

  gui
    .add(params, 'fogNear', 0, 100, 1)
    .name('Near')
    .onChange((val) => {
      scene.fog.near = val;
    });

  gui
    .add(params, 'fogFar', 50, 500, 1)
    .name('Far')
    .onChange((val) => {
      scene.fog.far = val;
    });

  gui
    .addColor(params, 'planeColor')
    .name('Plane Color')
    .onChange((val) => {
      planeMaterial.color.set(val);
    });

  gui
    .addColor(params, 'fogColor')
    .name('Fog Color')
    .onChange((val) => {
      scene.bakground.set(val);
      scene.fog.color.set(val);
    });

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
  const planeMaterial = new MeshStandardMaterial({
    color: params.planeColor,
    // wireframe: true,
    // transparent: true,
    // opacity: 0.1,
  });

  const plane = new Mesh(planeGeometry, planeMaterial);
  // plane.castShadow = true;
  plane.receiveShadow = true;
  plane.position.y = -1.5;
  scene.add(plane);

  const boundGeometry = new RoundedBoxGeometry(1, 2, boundaries.y * 2, 5, 0.5);
  const boundMaterial = new MeshStandardMaterial({ color: 0xdddddd });
  const leftBound = new Mesh(boundGeometry, boundMaterial);
  leftBound.position.x = -boundaries.x - 0.25;
  const rightBound = leftBound.clone();
  rightBound.position.x *= -1;

  leftBound.castShadow = true;
  // leftBound.receiveShadow = true;
  rightBound.castShadow = true;
  rightBound.receiveShadow = true;

  scene.add(leftBound);
  scene.add(rightBound);

  const playerPaddle = new Paddle(scene, boundaries, new Vector3(0, 0, 15));
  const pcPaddle = new Paddle(scene, boundaries, new Vector3(0, 0, -15));
  const ball = new Ball(scene, boundaries, [playerPaddle, pcPaddle]);
  ball.material.color.set(params.ballColor);
  pcPaddle.material.color.set(params.paddleColor);
  playerPaddle.material.color.set(params.paddleColor);

  const fireworks = [];

  const controller = new AIController(pcPaddle, ball);

  //

  onMount(() => {
    const container = window.document.querySelector('.container');
    if (gameRef) {
      setSize({
        width: window.innerWidth,
        height: container.getBoundingClientRect().height,
      });
    }

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

      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(pixelRatio);
    });

    onCleanup(() => {
      resizeObserver.disconnect();
      device?.destroy();
      fireworks.forEach((f) => f.die());
    });
  });

  let adapter, device, format;

  async function initWebGPU() {
    if (!navigator.gpu) throw new Error('WebGPU not supported');
    adapter = await navigator.gpu.requestAdapter();
    if (!adapter) throw new Error('No WebGPU adapter found');
    device = await adapter.requestDevice();
    format = navigator.gpu.getPreferredCanvasFormat();
    return {
      adapter,
      device,
      format,
    };
  }

  const init = async () => {
    try {
      const { adap, devi, form } = await initWebGPU();

      renderer = new WebGPURenderer({
        antialias: window.devicePixelRatio < 2,
        // device: devi,
        // format: form,
        // logarithmicDepthBuffer: true,
      });
      renderer.toneMapping = ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = VSMShadowMap;
      renderer.setPixelRatio(window.devicePixelRatio);

      // environment
      // const hdr = 'assets/images/shanghai_bund_4k.hdr';
      // const hdr = 'assets/images/kloppenheim_02_puresky_2k.hdr';
      // const hdr = 'assets/images/kloppenheim_03_puresky_2k.hdr';
      // const hdr = 'assets/images/autumn_field_puresky_2k.hdr';
      const hdr = 'assets/images/autumn_field_puresky_4k.hdr.jpg';

      // NOTE: loader for hdri
      // // let environmentTexture;
      // const pmremGenerator = new PMREMGenerator(renderer);
      // pmremGenerator.compileEquirectangularShader();

      // const loadEnv = async () => {
      //   new RGBELoader().loadAsync(hdr).then((texture) => {
      //     // environmentTexture = texture;
      //     // environmentTexture.mapping = EquirectangularReflectionMapping;
      //     // environmentTexture.needsUpdate = true;

      //     texture.mapping = EquirectangularReflectionMapping;
      //     // texture.colorSpace = LinearColorSpace;
      //     texture.colorSpace = SRGBColorSpace;
      //     texture.minFilter = LinearFilter;
      //     texture.magFilter = LinearFilter;
      //     texture.generateMipmaps = false;

      //     const envMap = pmremGenerator.fromEquirectangular(texture).texture;
      //     texture.dispose();

      //     scene.environment = envMap;
      //     scene.environmentIntensity = 0.75;
      //     scene.background = envMap;
      //     scene.backgroundIntensity = 0.75;
      //     scene.backgroundBlurriness = 0.0;
      //   });
      // };

      // loadEnv();

      // NOTE: Loader for hdri+jpg
      let loader = new UltraHDRLoader();
      // loader.setDataType(FloatType);
      loader.setDataType(HalfFloatType);

      const loadEnvironment = async () => {
        loader.load(hdr, (texture) => {
          texture.mapping = EquirectangularReflectionMapping;
          texture.colorSpace = SRGBColorSpace;
          texture.wrapS = ClampToEdgeWrapping;
          texture.wrapT = ClampToEdgeWrapping;
          texture.minFilter = LinearFilter;
          texture.magFilter = LinearFilter;
          texture.generateMipmaps = false;

          scene.background = texture;
          // scene.backgroundIntensity = 0.75;
          scene.backgroundBlurriness = 0.0;
          scene.environment = texture;
          // scene.environmentIntensity = 0.75;
        });
      };

      loadEnvironment();

      //

      const { width, height } = size();

      renderer.setSize(width, height);
      camera = new PerspectiveCamera(fov, width / height, 0.1, 1000);
      // camera.position.set(0, 20, 45);
      camera.position.set(0, 50, 1000);
      camera.lookAt(new Vector3(0, 0, 0));

      ball.addEventListener('onGoal', (e) => {
        score[e.message] += 1;
        const mesh = e.message === 'pc' ? pcScoreMesh : playerScoreMesh;
        const geometry = getScoreGeometry(score[e.message]);
        mesh.geometry = geometry;

        const firework = new Firework(
          20,
          3,
          e.message === 'pc' ? pcScoreMesh.position : playerScoreMesh.position
        );
        scene.add(firework.mesh);
        // firework.mesh.position.copy(
        //   e.message === 'pc' ? pcScoreMesh.position : playerScoreMesh.position
        // );
        fireworks.push(firework);
        // playerScoreMesh.geometry.getAttibute('position').needUpdate = true;
      });

      ball.addEventListener('collide', () => {
        const firework = new Firework(50, 5, ball.mesh.position);
        scene.add(firework.mesh);
        // firework.mesh.position.copy(ball.mesh.position);
        fireworks.push(firework);
      });

      gameRef.appendChild(renderer.domElement);
      gameRef.appendChild(stats.dom);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      renderer.setAnimationLoop(animate);
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

    fireworks.forEach((firework, index) => {
      if (firework.isDie) {
        scene.remove(firework.mesh);
        fireworks.splice(index, 1);
      } else {
        firework.update(deltaTime);
      }
    });

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
