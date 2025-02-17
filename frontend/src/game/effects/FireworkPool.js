import { Vector3 } from 'three';
import Firework from './Firework.js';

export default class FireworkPool {
  scene;
  poolSize;
  numParticles;
  radius;
  fireworks;
  currentIndex;

  constructor(scene, poolSize = 8, numParticles = 50, radius = 5) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.numParticles = numParticles;
    this.radius = radius;
    this.fireworks = [];
    this.currentIndex = 0;

    this.initializePool();
  }

  initializePool() {
    const defaultPosition = new Vector3();
    for (let i = 0; i < this.poolSize; i++) {
      const firework = new Firework(
        this.numParticles,
        this.radius,
        defaultPosition
      );
      firework.mesh.visible = false;
      firework.isDie = true;

      this.fireworks[i] = firework;
      this.scene.add(firework.mesh);
    }
  }

  getAvailableFirework(position) {
    this.fireworks[this.currentIndex].reset(position);
    this.currentIndex = (this.currentIndex + 1) % this.poolSize;
  }

  update(deltaTime) {
    for (const firework of this.fireworks) {
      if (!firework.isDie) {
        firework.update(deltaTime);
      }
    }
  }

  dispose() {
    for (const firework of this.fireworks) {
      firework.die();
    }
    this.fireworks.length = 0;
  }
}
