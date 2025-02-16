import {
  Group,
  TextureLoader,
  RepeatWrapping,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  FrontSide,
  Vector3,
  Box3,
  Quaternion,
  Euler,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import RAPIER from '@dimforge/rapier3d-compat';
import { createNoise3D } from 'simplex-noise';

import MetallicWalls from '@/game/environment/MetallicWalls.js';
import Ball from '@/game/entities/Ball.js';
import Paddle from '@/game/entities/Paddle.js';

export default class PongTable {
  scene;
  params;
  textureLoader;
  group;
  metallicWalls;
  coliseum;
  platform;
  rigidBody;
  collider;
  noise3D;
  submergedPoints;
  player1Paddle;
  player2Paddle;
  ball;

  physicsConfig;

  constructor(
    scene,
    params,
    textureLoader = new TextureLoader(),
    fontLoader = new FontLoader()
  ) {
    this.physicsConfig = {
      oscillation: {
        translationAmplitude: { x: 0.6, y: 0.6, z: 0.6 },
        rotationAmplitude: { x: 0.03, y: 0.03, z: 0.03 },
        frequency: 0.15,
      },
    };

    this.scene = scene;
    this.params = params;
    this.textureLoader = textureLoader;
    this.fontLoader = fontLoader;
    this.noise3D = createNoise3D();
    this.basePosition = new Vector3(0, 0, 0);

    this.metallicWalls = MetallicWalls(this.params.dimensions);
    this.coliseum = null;
    this.platform = null;
    this.group = new Group();

    this.player1Paddle = new Paddle(
      this.params.dimensions,
      this.params.positions.paddleP1,
      this.params.colors.paddleP1,
      this.params.colors.bloomIntensity
    );
    this.player2Paddle = new Paddle(
      this.params.dimensions,
      this.params.positions.paddleP2,
      this.params.colors.paddleP2,
      this.params.colors.bloomIntensity
    );
    this.ball = new Ball(
      this.params.dimensions.boundaries,
      [this.player1Paddle, this.player2Paddle],
      this.params.colors.ball,
      this.params.colors.bloomIntensity
    );
  }

  async init() {
    const [noiseTexture] = await Promise.all([
      this.textureLoader.loadAsync('assets/textures/neon.webp'),
    ]);
    noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping;

    const coliseumMaterial = new MeshPhysicalMaterial({
      map: noiseTexture,
      alphaMap: noiseTexture,
      clearcoat: 0.0,
      clearcoatRoughness: 0.0,
      // dispersion: 0.00000001,
      ior: 1.25,
      reflectivity: 1.0,
      thickness: 2.5,
      roughness: 0.1,
      transmission: 0.99,
      envMapIntensity: 25,
      transparent: true,
      opacity: 1.0,
      metalness: 0.0,
      depthWrite: false,
      depthTest: true,
    });

    const coliseumGeometry = new RoundedBoxGeometry(
      this.params.dimensions.boundaries.x * 2 + 1.2,
      3.5,
      this.params.dimensions.boundaries.y * 2 + 1.2,
      8,
      1.5
    );
    const platformGeometry = new RoundedBoxGeometry(
      this.params.dimensions.boundaries.x * 4,
      3.0,
      this.params.dimensions.boundaries.x * 5,
      8,
      3
    );
    platformGeometry.translate(0, -1.0, 0);

    const platformMaterial = new MeshStandardMaterial({
      color: 0x000000,
      metalness: 1.0,
      roughness: 0.25,
      flatShading: true,
      side: FrontSide,
    });

    this.coliseum = new Brush(coliseumGeometry, coliseumMaterial);
    this.platform = new Evaluator().evaluate(
      new Brush(platformGeometry, platformMaterial),
      this.coliseum,
      SUBTRACTION
    );

    this.coliseum.castShadow = true;
    this.coliseum.receiveShadow = true;
    this.platform.castShadow = true;
    this.platform.receiveShadow = true;
    this.metallicWalls.receiveshadow = true;

    this.group.add(
      this.coliseum,
      this.platform,
      this.metallicWalls,
      this.player1Paddle.mesh,
      this.player2Paddle.mesh,
      this.ball.mesh
    );
    this.scene.add(this.group);
  }

  createPhysics(world) {
    const bodyDesc =
      RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(0, 0, 0);
    this.rigidBody = world.createRigidBody(bodyDesc);

    const coliseumBox = new Box3().setFromObject(this.coliseum);
    const platformBox = new Box3().setFromObject(this.platform);

    const coliseumSize = new Vector3();
    coliseumBox.getSize(coliseumSize);

    const platformSize = new Vector3();
    platformBox.getSize(platformSize);

    const coliseumColliderDesc = RAPIER.ColliderDesc.cuboid(
      coliseumSize.x * 0.5,
      coliseumSize.y * 0.5,
      coliseumSize.z * 0.5
    ).setTranslation(0, -0.5, 0);

    const platformColliderDesc = RAPIER.ColliderDesc.cuboid(
      platformSize.x * 0.5,
      platformSize.y * 0.5,
      platformSize.z * 0.5
    ).setTranslation(0, -1.0, 0);

    world.createCollider(coliseumColliderDesc, this.rigidBody);
    world.createCollider(platformColliderDesc, this.rigidBody);
  }

  update(elapsedTime) {
    const { frequency, translationAmplitude, rotationAmplitude } =
      this.physicsConfig.oscillation;

    const offsetX =
      this.noise3D(elapsedTime * frequency, 0, 0) * translationAmplitude.x;
    const offsetY =
      this.noise3D(0, elapsedTime * frequency, 0) * translationAmplitude.y;
    const offsetZ =
      this.noise3D(0, 0, elapsedTime * frequency) * translationAmplitude.z;

    const targetPosition = this.basePosition
      .clone()
      .add(new Vector3(offsetX, offsetY, offsetZ));

    this.group.position.lerp(targetPosition, 0.1);

    const rotX =
      this.noise3D(elapsedTime * frequency, 100, 100) * rotationAmplitude.x;
    const rotY =
      this.noise3D(100, elapsedTime * frequency, 100) * rotationAmplitude.y;
    const rotZ =
      this.noise3D(100, 100, elapsedTime * frequency) * rotationAmplitude.z;
    const targetEuler = new Euler(rotX, rotY, rotZ);
    const targetQuaternion = new Quaternion().setFromEuler(targetEuler);

    this.group.quaternion.slerp(targetQuaternion, 0.1);

    if (this.rigidBody) {
      this.rigidBody.setNextKinematicTranslation(this.group.position);
      this.rigidBody.setNextKinematicRotation(this.group.quaternion);
    }
  }
}
