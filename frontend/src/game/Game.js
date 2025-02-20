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

  networkBufferSize = 5;
  networkBuffer = [];
  lastSentMovement = 0;
  movementThreshold = 0.01;
  networkUpdateRate = 50; // ms
  lastNetworkUpdate = 0;
  inputDirection = 0;
  lastCollisionTime = 0;
  collisionCooldown = 100; // ms
  lastGoalTime = 0;
  goalCooldown = 1000; // ms

  constructor(scene, camera, renderer, params) {
    this.timeCount = 0;
    this.timeMax = 30.0;
    this.isMouseMode = false;
    this.isAiMode = true;
    this.paddleSpeed = 0.1;
    this.isOnline = false;
    this.sendAccumulator = 0;
    this.sendInterval = 0.1;

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
    this.network.callbacks.onPlayerJoined = () => this.updatePlayerInfo();
    this.gameData = {
      userIs: null,
      userPaddle: null,
      opponentPaddle: null,
      startPosition: this.params.camera.offlinePosition,
      prevBallPosition: new Vector3(0, 0, 0),
      ballVelocity: new Vector3(0, 0, 0),
    };
  }

  updatePlayerInfo() {
    if (
      this.network.userState.userId === this.network.userState.match.player1Id
    ) {
      this.gameData.userPaddle = this.pongTable.player1Paddle;
      this.gameData.opponentPaddle = this.pongTable.player2Paddle;
      this.gameData.startPosition = this.params.camera.pongP1Position;
      this.gameData.userIs = 'p1';
    } else {
      this.gameData.userPaddle = this.pongTable.player2Paddle;
      this.gameData.opponentPaddle = this.pongTable.player1Paddle;
      this.gameData.startPosition = this.params.camera.pongP2Position;
      this.gameData.userIs = 'p2';
    }

    // TODO: maybe move when the game start after init the socket connection
    if (this.pongTable && this.pongTable.ball) {
      this.gameData.prevBallPosition =
        this.pongTable.ball.mesh.position.clone();
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
      // setTimeout(() => {
      //   if (this.isOnline) {
      //     this.network.toggle();
      //   }
      // }, 1000);
    });

    this.pongTable.ball.addEventListener('collide', () => {
      const now = performance.now();
      if (now - this.lastCollisionTime < this.collisionCooldown) return;
      this.lastCollisionTime = now;

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

    if (this.isOnline && this.isGameStart) {
      //   if (event.key === 'ArrowLeft') this.inputDirection = -1;
      //   else if (event.key === 'ArrowRight') this.inputDirection = 1;
      if (event.key === ' ') {
        if (this.isOnline) {
          this.network.toggle();
        }
      }
    }
  }

  handleKeyUp(event) {
    this.keys[event.key] = false;

    if (this.isOnline && this.isGameStart) {
      if (
        (event.key === 'ArrowLeft' && this.inputDirection === -1) ||
        (event.key === 'ArrowRight' && this.inputDirection === 1)
      ) {
        this.inputDirection = 0;
      }
    }
  }

  // predictBallPosition(delta) {
  //   if (!this.network.gameEngineState.state) return null;

  //   const serverBallX =
  //     this.network.gameEngineState.state.ball_y_position -
  //     this.params.dimensions.boundaries.x;
  //   const serverBallZ =
  //     this.network.gameEngineState.state.ball_x_position -
  //     this.params.dimensions.boundaries.y;

  //   const currentBallPos = new Vector3(serverBallX, 0, serverBallZ);

  //   this.gameData.ballVelocity = currentBallPos
  //     .clone()
  //     .sub(this.gameData.prevBallPosition)
  //     .divideScalar(delta);

  //   const predictedPosition = currentBallPos
  //     .clone()
  //     .add(this.gameData.ballVelocity.clone().multiplyScalar(delta * 2));

  //   this.gameData.prevBallPosition = currentBallPos.clone();

  //   return predictedPosition;
  // }

  // handleOnlineMovement(delta) {
  //   this.sendAccumulator += delta * 1000;

  //   // if (this.sendAccumulator < this.networkUpdateRate) {
  //   //   return;
  //   // }

  //   let direction = 0;
  //   let shouldSendUpdate = false;

  //   if (this.isMouseMode) {
  //     this.raycaster.setFromCamera(this.cursor, this.camera);
  //     const intersection = this.raycaster.intersectObject(
  //       this.sceneEnv.water
  //     )?.[0];

  //     if (intersection) {
  //       const currentX = this.gameData.userPaddle.mesh.position.x;
  //       const targetX = intersection.point.x;
  //       const diff = targetX - currentX;

  //       if (Math.abs(diff) > this.movementThreshold) {
  //         const normalizedDirection = Math.max(-1, Math.min(1, diff / 5));
  //         direction = normalizedDirection;
  //         shouldSendUpdate = true;
  //       }
  //     }
  //   } else if (this.inputDirection !== 0) {
  //     direction = this.inputDirection;
  //     shouldSendUpdate = true;
  //   }
  //   if (shouldSendUpdate && direction !== this.lastSentMovement) {
  //     this.network.move(direction);
  //     this.lastSentMovement = direction;
  //     this.sendAccumulator = 0;
  //   } else if (this.sendAccumulator > this.networkUpdateRate * 3) {
  //     this.sendAccumulator = 0;
  //   }
  // }

  // smoothlyUpdatePositions(delta) {
  //   if (!this.network.gameEngineState.state) return;

  //   const prevUserX = this.gameData.userPaddle.mesh.position.x;
  //   const serverUserX =
  //     this.gameData.userIs === 'p1'
  //       ? this.network.gameEngineState.state.player_1_position -
  //         this.params.dimensions.boundaries.x
  //       : this.network.gameEngineState.state.player_2_position -
  //         this.params.dimensions.boundaries.x;

  //   const userLerpFactor = 0.5;
  //   this.gameData.userPaddle.setX(lerp(prevUserX, serverUserX, userLerpFactor));

  //   const prevOpponentX = this.gameData.opponentPaddle.mesh.position.x;
  //   const serverOpponentX =
  //     this.gameData.userIs !== 'p1'
  //       ? this.network.gameEngineState.state.player_1_position -
  //         this.params.dimensions.boundaries.x
  //       : this.network.gameEngineState.state.player_2_position -
  //         this.params.dimensions.boundaries.x;

  //   const opponentLerpFactor = 0.5;
  //   this.gameData.opponentPaddle.setX(
  //     lerp(prevOpponentX, serverOpponentX, opponentLerpFactor)
  //   );

  //   const predictedBallPos = this.predictBallPosition(delta);
  //   if (predictedBallPos) {
  //     const prevBallX = this.pongTable.ball.mesh.position.x;
  //     const prevBallZ = this.pongTable.ball.mesh.position.z;

  //     const ballLerpFactor = 0.5;

  //     const newBallX = lerp(prevBallX, predictedBallPos.x, ballLerpFactor);
  //     const newBallZ = lerp(prevBallZ, predictedBallPos.z, ballLerpFactor);

  //     this.pongTable.ball.updateFromGameEngine(newBallX, newBallZ);
  //   }
  // }

  handleOnlineMovement(delta) {
    if (!this.isOnline || !this.isGameStart) return;

    this.sendAccumulator += delta * 1000;
    if (this.sendAccumulator < this.networkUpdateRate) return;

    let direction = 0;

    if (!this.isMouseMode) {
      if (this.keys['ArrowLeft']) direction = -1;
      else if (this.keys['ArrowRight']) direction = 1;
    } else {
      this.raycaster.setFromCamera(this.cursor, this.camera);
      const intersection = this.raycaster.intersectObject(
        this.sceneEnv.water
      )?.[0];

      if (intersection) {
        const currentX = this.gameData.userPaddle.mesh.position.x;
        const targetX = intersection.point.x;
        if (Math.abs(targetX - currentX) > 0.5) {
          direction = Math.sign(targetX - currentX);
        }
      }
    }

    if (this.gameData.userIs === 'p2') {
      direction *= -1;
    }

    // if (direction !== this.lastSentMovement) {
    if (direction !== 0) {
      this.network.move(direction);
      this.lastSentMovement = direction;
      this.sendAccumulator = 0;
    }
    // } else if (this.sendAccumulator > this.networkUpdateRate * 3) {
    //   this.sendAccumulator = 0;
    // }
  }

  // Método simplificado para actualizar posiciones desde el servidor
  updatePositionsFromServer() {
    if (!this.network.gameEngineState.state) return;

    const state = this.network.gameEngineState.state;

    if (this.gameData.userIs === 'p1') {
      const serverX =
        state.player_1_position - this.params.dimensions.boundaries.x;
      this.gameData.userPaddle.setX(serverX);
    } else {
      const serverX =
        state.player_2_position - this.params.dimensions.boundaries.x;
      this.gameData.userPaddle.setX(serverX);
    }

    if (this.gameData.userIs === 'p1') {
      const serverX =
        state.player_2_position - this.params.dimensions.boundaries.x;
      this.gameData.opponentPaddle.setX(serverX);
    } else {
      const serverX =
        state.player_1_position - this.params.dimensions.boundaries.x;
      this.gameData.opponentPaddle.setX(serverX);
    }

    const ballX = state.ball_y_position - this.params.dimensions.boundaries.x;
    const ballZ = state.ball_x_position - this.params.dimensions.boundaries.y;
    this.pongTable.ball.updateFromGameEngine(ballX, ballZ);
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

      if (
        Math.abs(this.camera.position.x - this.gameData.startPosition.x) <
          0.1 &&
        Math.abs(this.camera.position.y - this.gameData.startPosition.y) <
          0.1 &&
        Math.abs(this.camera.position.z - this.gameData.startPosition.z) < 0.1
      ) {
        this.isTransitioning = false;
        this.isGameStart = true;
        // this.controls.enabled = true;
        // if (this.isOnline && this.gameData.userIs === 'p1') {
        //   this.network.toggle();
        // }
      }
    }

    if (this.isGameStart) {
      if (!this.isOnline) {
        let intersection = null;
        if (this.isMouseMode) {
          this.raycaster.setFromCamera(this.cursor, this.camera);
          intersection = this.raycaster.intersectObject(
            this.sceneEnv.water
          )?.[0];
        }

        const dt = delta * 0.1;
        let prevX, nextX;

        for (let i = 0; i < 10; i++) {
          prevX = this.pongTable.player1Paddle.mesh.position.x;
          nextX = prevX;

          if (intersection) {
            nextX = intersection.point.x;
          } else if (this.keys['ArrowLeft']) {
            nextX = prevX - this.paddleSpeed;
          } else if (this.keys['ArrowRight']) {
            nextX = prevX + this.paddleSpeed;
          }
          this.pongTable.player1Paddle.setX(lerp(prevX, nextX, 0.5));

          if (this.isAiMode) {
            this.aiController.update(dt);
          } else {
            prevX = this.pongTable.player2Paddle.mesh.position.x;
            nextX = prevX;

            if (this.keys['a']) {
              nextX = prevX - this.paddleSpeed;
            } else if (this.keys['d']) {
              nextX = prevX + this.paddleSpeed;
            }

            this.pongTable.player2Paddle.setX(lerp(prevX, nextX, 0.5));
          }
          this.pongTable.ball.update(dt);
        }
      } else {
        this.handleOnlineMovement(delta);
        this.updatePositionsFromServer();
        // this.handleOnlineMovement(delta);
        // this.smoothlyUpdatePositions(delta);
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
