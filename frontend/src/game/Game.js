import { Vector2, Vector3, TextureLoader, Raycaster } from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import RAPIER, { World, EventQueue } from '@dimforge/rapier3d-compat';
import RapierDebugRenderer from '@/game/utils/RapierDebugRenderer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

import createPostProcessing from '@/game/utils/createPostProcessing.js';
import AIController from '@/game/entities/AIController.js';
import FireworkPool from '@/game/effects/FireworkPool.js';
import NeonRingEffect from '@/game/effects/NeonRingEffect.js';
import PongTable from '@/game/environment/PongTable.js';
import ScoreMessages from '@/game/effects/ScoreMessages.js';
import SceneEnvironment from '@/game/environment/SceneEnvironment.js';
import ScoreDisplay from '@/game/entities/ScoreDisplay.js';
import lerp from '@/game/utils/lerp.js';
import NetworkManager from '@/game/NetworkManager.js';

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
  isTransitioning;
  transitionProgress;
  targetCameraPosition;
  targetLookAt;
  orbitRadius;
  orbitSpeed;
  userId;
  isOnline;
  devMode = false;

  constructor(scene, camera, renderer, params) {
    this.timeCount = 0;
    this.timeMax = 30.0;
    this.isMouseMode = false;
    this.isAiMode = true;
    this.paddleSpeed = 0.1;
    this.isOnline = false;
    this.lastSent = 0;
    this.sendInterval = 50;
    this.lastDirection = 0;

    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.params = params;

    // this.gui = new GUI();

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    // this.controls.enabled = false;

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

    this.isGameStart = false;
    this.isTransitioning = false;
    this.transitionProgress = 0;

    this.orbitRadius = Math.sqrt(
      Math.pow(
        this.params.camera.startPosition.x - this.params.camera.pongLookAt.x,
        2
      ) +
        Math.pow(
          this.params.camera.startPosition.z - this.params.camera.pongLookAt.z,
          2
        )
    );
    this.orbitAngle = Math.atan2(
      this.params.camera.startPosition.z - this.params.camera.pongLookAt.z,
      this.params.camera.startPosition.x - this.params.camera.pongLookAt.x
    );
    this.orbitSpeed = 0.2;

    // Websocket connections
    this.network = new NetworkManager(this.params);
    this.network.callbacks.onPlayerJoined = this.updatePlayerInfo;
    this.gameData = {
      userPaddle: null,
      opponentPaddle: null,
      startPosition: this.params.camera.offlinePosition,
    };
  }

  updatePlayerInfo() {
    if (this.network.userState.userId === this.network.match.player1Id) {
      this.gameData.userPaddle = this.pongTable.player1Paddle;
      this.gameData.opponentPaddle = this.pongTable.player2Paddle;
      this.gameData.startPosition = this.params.camera.pongP1Position;
    } else {
      this.gameData.userPaddle = this.pongTable.player2Paddle;
      this.gameData.opponentPaddle = this.pongTable.player1Paddle;
      this.gameData.startPosition = this.params.camera.pongP2Position;
    }
  }

  setGameObjects() {
    this.scoreDisplay = new ScoreDisplay(
      this.scene,
      this.params,
      this.fontLoader
    );

    this.pongTable = new PongTable(
      this.scene,
      this.params,
      this.textureLoader,
      this.fontLoader
    );

    this.sceneEnv = new SceneEnvironment(
      this.scene,
      this.renderer,
      this.params
    );

    this.aiController = new AIController(
      this.pongTable.player2Paddle,
      this.pongTable.ball
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

    await Promise.all([
      this.pongTable.init(),
      this.scoreDisplay.init(),
      this.sceneEnv.init(),
      this.scoreMessages.init(),
      this.neonRings.init(),
      this.network.initMatchmaking().catch((error) => {
        console.error('Matchmaking initialization failed:', error);
      }),
    ]);

    this.setEventListeners();

    const gravity = new Vector3(0.0, -9.81, 0.0);

    this.world = new World(gravity);
    this.eventQueue = new EventQueue(true);

    this.rapierDebugRenderer = new RapierDebugRenderer(
      this.scene,
      this.world,
      this.devMode
    );

    this.world.maxVelocityIterations = 8;
    this.world.maxPositionIterations = 4;
    this.world.maxVelocityFriction_iterations = 8;
    this.world.minIslandSize = 32;

    this.pongTable.createPhysics(this.world);
  }

  setEventListeners() {
    window.addEventListener('mousemove', this.handleMouseMove.bind(this));

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    this.pongTable.ball.addEventListener('onGoal', (e) => {
      this.params.score[e.message] += 1;
      this.scoreDisplay.updateScore(
        this.params.score['p1'],
        this.params.score['p2']
      );

      this.scoreMessages.trigger(e.message);
    });

    this.pongTable.ball.addEventListener('collide', () => {
      this.fireworks.getAvailableFirework(this.pongTable.ball.mesh.position);
      this.neonRings.onCollision(this.pongTable.ball.mesh.position);
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

  update(delta, elapsedTime) {
    this.world.timestep = Math.min(delta, 0.1);
    this.world.step();

    if (!this.isGameStart && !this.isTransitioning) {
      this.orbitAngle += delta * this.orbitSpeed;

      this.camera.position.set(
        Math.cos(this.orbitAngle) * this.orbitRadius +
          this.params.camera.pongLookAt.x,
        this.params.camera.startPosition.y,
        Math.sin(this.orbitAngle) * this.orbitRadius +
          this.params.camera.pongLookAt.z
      );
      // this.camera.lookAt(this.params.camera.pongLookAt);
    } else if (!this.isGameStart) {
      this.transitionProgress += delta * 0.01;

      this.camera.position.x = lerp(
        this.camera.position.x,
        this.gameData.startPosition.x,
        this.transitionProgress
      );

      this.camera.position.y = lerp(
        this.camera.position.y,
        this.gameData.startPosition.y,
        this.transitionProgress
      );

      this.camera.position.z = lerp(
        this.camera.position.z,
        this.gameData.startPosition.z,
        this.transitionProgress
      );

      const cameraArrived =
        Math.abs(this.camera.position.x - this.gameData.startPosition.x) <
          0.1 &&
        Math.abs(this.camera.position.y - this.gameData.startPosition.y) <
          0.1 &&
        Math.abs(this.camera.position.z - this.gameData.startPosition.z) < 0.1;

      if (cameraArrived) {
        this.isTransitioning = false;
        this.isGameStart = true;
        // this.controls.enabled = true;
      }
    }

    if (this.isGameStart) {
      let intersection = null;
      if (this.isMouseMode) {
        this.raycaster.setFromCamera(this.cursor, this.camera);
        intersection = this.raycaster.intersectObject(this.sceneEnv.water)?.[0];
      }

      const dt = delta * 0.1;
      let prevX;
      let nextX;
      if (!this.isOnline) {
        for (let i = 0; i < 10; i++) {
          prevX = this.pongTable.player1Paddle.mesh.position.x;
          if (intersection) {
            nextX = intersection.point.x;
          } else {
            if (this.keys['ArrowLeft']) {
              nextX = prevX - this.paddleSpeed;
            } else if (this.keys['ArrowRight']) {
              nextX = prevX + this.paddleSpeed;
            }
          }
          this.pongTable.player1Paddle.setX(lerp(prevX, nextX, 0.5));

          if (this.isAiMode) {
            this.aiController.update(dt);
          } else {
            prevX = this.pongTable.player2Paddle.mesh.position.x;
            if (this.keys['a']) {
              nextX = prevX - this.paddleSpeed;
              this.pongTable.player2Paddle.setX(lerp(prevX, nextX, 0.5));
            } else if (this.keys['d']) {
              nextX = prevX + this.paddleSpeed;
              this.pongTable.player2Paddle.setX(lerp(prevX, nextX, 0.5));
            }
          }
          this.pongTable.ball.update(dt);
        }
      } else {
        console.log(this.network.gameEngineState);
        for (let i = 0; i < 10; i++) {
          let direction = 0;
          prevX = this.gameData.userPaddle.mesh.position.x;
          if (intersection) {
            nextX = intersection.point.x;
          } else {
            if (this.keys['ArrowLeft']) {
              nextX = prevX - this.paddleSpeed;
              direction = -1;
            } else if (this.keys['ArrowRight']) {
              nextX = prevX + this.paddleSpeed;
              direction = 1;
            }
            this.gameData.userPaddle.setX(lerp(prevX, nextX, 0.5));
          }
          if (
            this.network.gameEngineState.state &&
            elapsedTime - this.lastSent >= this.sendInterval
          ) {
            const serverX =
              this.network.gameEngineState.state.players[0].player_position -
              this.params.dimensions.boundaries.x;
            this.gameData.userPaddle.setX(
              lerp(this.gameData.userPaddle.mesh.position.x, serverX, 0.2)
            );
          }
          if (
            direction !== this.lastDirection ||
            elapsedTime - this.lastSent >= this.sendInterval
          ) {
            this.network.move(direction);
            this.lastDirection = direction;
            this.lastSent = elapsedTime;
          }

          if (this.isAiMode) {
            prevX = this.gameData.opponentPaddle.mesh.position.x;
            nextX =
              this.network.gameEngineState.state.player_1_position -
              this.params.dimensions.boundaries.x;
            this.gameData.opponentPaddle.setX(lerp(prevX, nextX, 0.5));
          } else {
            if (this.keys['a']) {
              nextX = prevX - this.paddleSpeed;
            } else if (this.keys['d']) {
              nextX = prevX + this.paddleSpeed;
            }
            this.gameData.opponentPaddle.setX(lerp(prevX, nextX, 0.5));
          }
          if (this.gameState) {
            this.pongTable.ball.setX(
              lerp(
                this.pongTable.ball.mesh.position.x,
                this.network.gameEngineState.state.ball_x_position -
                  this.params.dimensions.boundaries.x,
                0.2
              )
            );
            this.pongTable.ball.setZ(
              lerp(
                this.pongTable.ball.mesh.position.z,
                this.network.gameEngineState.state.ball_y_position -
                  this.params.dimensions.boundaries.y,
                0.2
              )
            );
          }
        }
      }

      this.fireworks.update(delta);
      this.neonRings.update(delta);
      this.scoreMessages.update();
    }

    this.scoreDisplay.update();
    this.pongTable.update(elapsedTime);

    this.timeCount += delta;
    if (!this.isGameStart && this.timeCount > this.timeMax) {
      this.sceneEnv.updateSun(delta);
      this.timeCount = 0.0;
    }

    if (this.isDev) this.rapierDebugRenderer.update();

    this.controls.update();

    this.postProcessing.render();
  }

  dispose() {
    window.removeEventListener('mousemove', this.handleMouseMove);

    if (this.network) this.network.disconnect();

    if (this.fireworks) this.fireworks.dispose();
    if (this.neonRings) this.neonRings.dispose();

    // if (this.renderer) this.renderer.dispose();
  }
}
