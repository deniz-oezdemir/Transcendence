import {
  Vector3,
  BufferGeometry,
  Color,
  BufferAttribute,
  PointsNodeMaterial,
  AdditiveBlending,
  Points,
} from 'three';
import { attribute, color, float, mix, range, uniform, vec4 } from 'three/tsl';

export default class Firework {
  // Explotion duration (in seconds)
  expireIn = 0.8;

  /**
   * @param {number} num - Particles Numben
   * @param {number} radius - Dispersion factor (particles will be placed in a sphere of this radius)
   * @param {Vector3} startPosition - Position where the particles will be positioned
   */
  constructor(num, radius, startPosition) {
    this.num = num;
    this.radius = radius;

    this.geometry = new BufferGeometry();
    const positions = new Float32Array(num * 3);
    const velocities = new Float32Array(num * 3);
    const colors = new Float32Array(num * 3);

    const velocityVec = new Vector3();
    const colorObj = new Color();

    for (let i = 0; i < num; i++) {
      // Each particle position is stored in 3 consecutive positions in the buffer
      const index = i * 3;
      positions.set([0, 0, 0], index);

      // Random velocity vector
      velocityVec
        .set(
          Math.random() * 2 - 1,
          Math.random() * 2 - 1,
          Math.random() * 2 - 1
        )
        .normalize()
        .multiplyScalar(Math.random() * radius * 3);

      velocities.set([velocityVec.x, velocityVec.y, velocityVec.z], index);

      // Random color HSL with hight Saturation and Lightness
      colorObj.setHSL(Math.random(), 1.0, 1.0);
      colors.set([colorObj.r, colorObj.g, colorObj.b], index);
    }

    this.geometry.setAttribute('position', new BufferAttribute(positions, 3));
    this.geometry.setAttribute('velocity', new BufferAttribute(velocities, 3));
    this.geometry.setAttribute('color', new BufferAttribute(colors, 3));

    // Time uniform to control the particles life
    this.uTime = uniform(0.0);

    this.material = new PointsNodeMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      sizeAttenuation: true,
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

    this.mesh = new Points(this.geometry, this.material);
    this.mesh.position.copy(startPosition);

    this.isDie = false;
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

  reset(position) {
    this.mesh.position.copy(position);
    this.mesh.visible = true;
    this.isDie = false;
    this.born();
  }

  // Remove the particle from the scene and dispose the geometry
  die() {
    this.mesh.parent?.remove(this.mesh);
    this.geometry.dispose();
    this.material.dispose();
  }
}
