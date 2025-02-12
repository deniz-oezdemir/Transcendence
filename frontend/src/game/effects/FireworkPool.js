import * as THREE from 'three';
import Firework from './Firework.js';

export default class FireworkPool {
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
    for (let i = 0; i < this.poolSize; i++) {
      const firework = new Firework(
        this.numParticles,
        this.radius,
        new THREE.Vector3()
      );
      firework.mesh.visible = false;
      this.scene.add(firework.mesh);
      this.fireworks.push(firework);
    }
  }

  getAvailableFirework(position) {
    const firework = this.fireworks[this.currentIndex];

    // Reset properties instead de recrearlo
    firework.mesh.position.copy(position);
    firework.mesh.visible = true;
    firework.isDie = false;
    firework.born();

    // Avanzar índice circularmente
    this.currentIndex = (this.currentIndex + 1) % this.poolSize;
  }

  update(deltaTime) {
    this.fireworks.forEach((firework) => {
      if (!firework.isDie) {
        firework.update(deltaTime);
      }
    });
  }

  dispose() {
    this.fireworks.forEach((firework) => {
      this.scene.remove(firework.mesh);
      firework.die();
    });
    this.fireworks = [];
  }
}
