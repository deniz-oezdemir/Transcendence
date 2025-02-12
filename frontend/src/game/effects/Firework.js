import * as THREE from 'three';
import {
  attribute,
  color,
  float,
  mix,
  range,
  uniform,
  vec3,
  vec4,
} from 'three/tsl';

export default class Firework {
  // Explotion duration (in seconds)
  expireIn = 0.8;

  /**
   * @param {number} num - Particles Numben
   * @param {number} radius - Dispersion factor (particles will be placed in a sphere of this radius)
   * @param {THREE.Vector3} startPosition - Position where the particles will be positioned
   */
  constructor(num, radius, startPosition) {
    this.num = num;
    this.radius = radius;

    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(num * 3);
    const velocities = new Float32Array(num * 3);
    const colors = new Float32Array(num * 3);

    for (let i = 0; i < num; i++) {
      // Each particle position is stored in 3 consecutive positions in the buffer
      positions.set([0, 0, 0], i * 3);

      // Random velocity vector
      const v = new THREE.Vector3(
        Math.random() * 2 - 1,
        Math.random() * 2 - 1,
        Math.random() * 2 - 1
      )
        .normalize()
        .multiplyScalar(Math.random() * radius * 3);
      velocities.set([v.x, v.y, v.z], i * 3);

      // Random color HSL with hight Saturation and Lightness
      const c = new THREE.Color().setHSL(Math.random(), 1.0, 1.0);
      colors.set([c.r, c.g, c.b], i * 3);
    }

    this.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(positions, 3)
    );
    this.geometry.setAttribute(
      'velocity',
      new THREE.BufferAttribute(velocities, 3)
    );
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Time uniform to control the particles life
    this.uTime = uniform(0.0);

    this.material = new THREE.PointsNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    // Each particle is positioned by its velocity and time
    this.material.positionNode = attribute('position', 'vec3').add(
      attribute('velocity', 'vec3').mul(this.uTime)
    );

    // Each particle is scale by a factor that goes to max 10 and then back to 1 in respect to time
    this.material.PointSize = range(0, 1)
      .mul(float(10))
      .mul(float(1).sub(this.uTime));

    // Each particle is colored by its original color and mix with black in
    // respect to time (the particle will be black at the end of its life).
    // The alpha is set at beginning to 1 and at the end of its life to 0
    this.material.colorNode = vec4(
      mix(attribute('color', 'vec3'), color(0x000000), this.uTime),
      float(1).sub(this.uTime)
    );
    this.material.sizeAttenuation = true;

    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.position.copy(startPosition);

    this.isDie = false;
    this.born();
  }

  /**
   * Control the life circle of the particle depending on the delta time
   */
  update(dt) {
    this.uTime.value += dt / this.expireIn;
    if (this.uTime.value >= 1) {
      this.uTime.value = 1;
      this.isDie = true;
    }
  }

  born() {
    this.uTime.value = 0;
  }

  // Remove the particle from the scene and dispose the geometry
  die() {
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
    this.geometry.dispose();
    this.material.dispose();
  }
}
