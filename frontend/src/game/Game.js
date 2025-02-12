import { PerspectiveCamera, Scene, WebGLRenderer, Vector3 } from 'three';

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
}
