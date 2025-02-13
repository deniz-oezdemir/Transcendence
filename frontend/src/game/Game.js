import { Vector2, Vector3, TextureLoader, Raycaster } from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import RAPIER, { World, EventQueue } from '@dimforge/rapier3d-compat';
import RapierDebugRenderer from '@/game/utils/RapierDebugRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import createPostProcessing from '@/game/utils/createPostProcessing.js';
import Ball from '@/game/entities/Ball.js';
import Paddle from '@/game/entities/Paddle.js';
import AIController from '@/game/entities/AIController.js';
import FireworkPool from '@/game/effects/FireworkPool.js';
import NeonRingEffect from '@/game/effects/NeonRingEffect.js';
import createPongTable from '@/game/environment/createPongTable.js';
import ScoreDisplay from '@/game/entities/ScoreDisplay.js';
import ScoreMessages from '@/game/effects/ScoreMessages.js';
import SceneEnvironment from '@/game/environment/SceneEnvironment.js';
import lerp from '@/game/utils/lerp.js';

export default class Game {
  scene;
  camera;
  renderer;
  params;
  controls;
  textureLoader;
  fontLoader;
  cursor;
  raycaster;
  keys;
  postProcessing;
  ScoreDisplay;
  player1Paddle;
  player2Paddle;
  ball;
  AIController;
  sceneEnv;
  fireworkPool;
  neonRingEffect;
  scoreMessages;
  pongTable;
  world;
  rapierDebugRenderer;
  eventQueue;
  paddleSpeed;
  isMouseMode;
  isAi;

  constructor(scene, camera, renderer, params) {
    this.isMouseMode = false;
    this.isAiMode = true;
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.params = params;

    this.paddleSpeed = 0.1;
    // this.gui = new GUI();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;

    this.textureLoader = new TextureLoader();
    this.fontLoader = new FontLoader();

    this.cursor = new Vector2(0, 0);
    this.raycaster = new Raycaster();
    this.keys = {};

    this.postProcessing = createPostProcessing(
      this.renderer,
      this.scene,
      this.camera,
      this.params.bloom
    );

    this.setGameObjects();
    this.setEffects();
  }

  setGameObjects() {
    this.scoreDisplay = new ScoreDisplay(
      this.scene,
      this.params,
      this.fontLoader
    );
    this.player1Paddle = new Paddle(
      this.scene,
      this.params.dimensions,
      this.params.positions.paddleP1,
      this.params.colors.paddleP1
    );
    this.player1Paddle.setBloomEffect(this.params.colors.bloomIntensity);

    this.player2Paddle = new Paddle(
      this.scene,
      this.params.dimensions,
      this.params.positions.paddleP2,
      this.params.colors.paddleP2
    );
    this.player2Paddle.setBloomEffect(this.params.colors.bloomIntensity);

    this.ball = new Ball(
      this.scene,
      this.params.dimensions.boundaries,
      [this.player1Paddle, this.player2Paddle],
      this.params.colors.ball
    );
    this.ball.setBloomEffect(this.params.colors.bloomIntensity);

    this.aiController = new AIController(this.player2Paddle, this.ball);

    this.sceneEnv = new SceneEnvironment(
      this.scene,
      this.renderer,
      this.params
    );
  }

  setEffects() {
    this.fireworks = new FireworkPool(this.scene);
    this.neonRings = new NeonRingEffect(
      this.scene,
      [this.params.colors.paddleP1, this.params.colors.paddleP2],
      this.textureLoader
    );
    this.scoreMessages = new ScoreMessages(
      this.scene,
      this.params,
      this.textureLoader
    );
  }

  async init() {
    await this.renderer.init();
    await RAPIER.init();

    const [pongTable] = await Promise.all([
      createPongTable(this.params),
      this.scoreDisplay.init(),
      this.scoreMessages.init(),
      this.sceneEnv.init(),
      this.neonRings.init(),
    ]);

    this.pongTable = pongTable;
    this.scene.add(this.pongTable);

    const gravity = new Vector3(0.0, -9.81, 0.0);

    this.world = new World(gravity);
    this.eventQueue = new EventQueue(true);

    this.rapierDebugRenderer = new RapierDebugRenderer(this.scene, this.world);

    this.setEventListeners();
  }

  setEventListeners() {
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    this.ball.addEventListener('onGoal', (e) => {
      this.params.score[e.message] += 1;
      this.scoreDisplay.updateScore(
        this.params.score['p1'],
        this.params.score['p2']
      );

      this.scoreMessages.trigger(e.message);
    });

    this.ball.addEventListener('collide', () => {
      this.fireworks.getAvailableFirework(this.ball.mesh.position);
      this.neonRings.onCollision(this.ball.mesh.position);
    });
  }

  handleMouseMove(event) {
    this.cursor.x = 2 * (event.clientX / window.innerWidth) - 1;
    this.cursor.y = -2 * (event.clientY / window.innerHeight) + 1;
  }

  handleKeyDown(event) {
    this.keys[event.key] = true;
  }

  handleKeyUp(event) {
    this.keys[event.key] = false;
  }

  update(delta) {
    const dt = delta * 0.1;
    let intersection = null;
    if (this.isMouseMode) {
      this.raycaster.setFromCamera(this.cursor, this.camera);
      intersection = this.raycaster.intersectObject(this.sceneEnv.water)?.[0];
    }

    let prevX;
    let nextX;
    for (let i = 0; i < 10; i++) {
      prevX = this.player1Paddle.mesh.position.x;
      if (intersection) {
        nextX = intersection.point.x;
        this.player1Paddle.setX(lerp(prevX, nextX, 0.5));
      } else {
        if (this.keys['ArrowLeft']) {
          nextX = prevX - this.paddleSpeed;
          this.player1Paddle.setX(lerp(prevX, nextX, 0.5));
        } else if (this.keys['ArrowRight']) {
          nextX = prevX + this.paddleSpeed;
          this.player1Paddle.setX(lerp(prevX, nextX, 0.5));
        }
      }
      if (this.isAiMode) {
        this.aiController.update(dt);
      } else {
        prevX = this.player2Paddle.mesh.position.x;
        if (this.keys['a']) {
          nextX = prevX - this.paddleSpeed;
          this.player2Paddle.setX(lerp(prevX, nextX, 0.5));
        } else if (this.keys['d']) {
          nextX = prevX + this.paddleSpeed;
          this.player2Paddle.setX(lerp(prevX, nextX, 0.5));
        }
      }
      this.ball.update(dt);
    }

    this.fireworks.update(delta);
    this.neonRings.update(delta);

    this.scoreDisplay.update();
    this.scoreMessages.update();

    this.controls.update();
    this.postProcessing.render();
  }

  dispose() {
    window.removeEventListener('mousemove', this.handleMouseMove);

    this.fireworks.dispose();
    this.neonRings.dispose();

    this.renderer.dispose();
  }
}
