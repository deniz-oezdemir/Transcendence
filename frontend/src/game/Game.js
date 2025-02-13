import { PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from 'three';
import { World, EventQueue } from '@dimforge/rapier3d';
import RapierDebugRenderer from '@/game/utils/RapierDebugRenderer.js';

export default class Game {
  scene;
  camera;
  player;
  world;
  rapierDebugRenderer;
  eventQueue;
  pong;

  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
  }

  init() {
    const gravity = new Vector3(0.0, -9.81, 0.0);

    this.world = new World(gravity);
    this.eventQueue = new EventQueue(true);

    this.rapierDebugRenderer = new RapierDebugRenderer(this.scene, this.world);
  }
}
