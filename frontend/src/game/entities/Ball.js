import {
  Mesh,
  MeshBasicNodeMaterial,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
  Raycaster,
  EventDispatcher,
} from 'three';
import { mrt, uniform } from 'three/tsl';

export default class Ball extends EventDispatcher {
  speed = 15;
  velocity = new Vector3(1, 0, 1);

  constructor(boundaries, paddles, color, bloomIntensity) {
    super();

    this.boundaries = boundaries;
    this.paddles = paddles;
    this.radius = 0.5;

    this.geometry = new SphereGeometry(this.radius);
    this.material = new MeshBasicNodeMaterial({ color });
    this.mesh = new Mesh(this.geometry, this.material);

    this.mesh.castShadow = true;
    // this.mesh.receiveShadow = true;
    this.mesh.material.mrtNode = mrt({
      bloomIntensity: uniform(bloomIntensity),
    });

    this.velocity.multiplyScalar(this.speed);

    this.raycaster = new Raycaster();
    this.raycaster.near = 0;
    this.raycaster.far = this.boundaries.y * 2.5;
    this.intersections = [];

    // For Debugging
    // this.pointCollision = new Mesh(
    //   new SphereGeometry(0.1),
    //   new MeshBasicMaterial({ color: 'red' })
    // );
  }

  resetVelocity() {
    this.speed = 15;
    this.velocity.z *= -1;
    this.velocity.normalize().multiplyScalar(this.speed);
  }

  update(deltaTime) {
    const pos = this.mesh.position;
    const absX = Math.abs(pos.x);
    const absZ = Math.abs(pos.z);

    const s = this.velocity.clone().multiplyScalar(deltaTime);
    const tPos = pos.clone().add(s);
    const dir = this.velocity.clone().normalize();

    this.raycaster.set(this.mesh.position, dir);

    const dx = this.boundaries.x - this.radius - absX;
    const dz = this.boundaries.y - this.radius - absZ;

    if (dx <= 0) {
      tPos.x = (this.boundaries.x - this.radius + dx) * Math.sign(pos.x);
      this.velocity.x *= -1;
      this.dispatchEvent({ type: 'collide' });
    }

    if (dz <= -0.5) {
      this.dispatchEvent({ type: 'onGoal', message: pos.z > 0 ? 'p2' : 'p1' });

      tPos.set(0, 0, 0);
      this.resetVelocity();
    }

    // Collision with one of the paddle
    let paddle = null;
    for (const p of this.paddles) {
      if (Math.sign(p.mesh.position.z) === Math.sign(this.velocity.z)) {
        paddle = p;
        break;
      }
    }

    if (paddle) {
      this.intersections.length = 0;
      this.raycaster.intersectObjects(
        paddle.mesh.children,
        false,
        this.intersections
      );

      if (this.intersections.length > 0) {
        const intersection = this.intersections[0];

        if (intersection.distance < s.length()) {
          tPos.copy(intersection.point);
          const d = s.length() - intersection.distance;

          intersection.normal.y = 0;
          this.velocity.reflect(intersection.normal);

          tPos.add(this.velocity.clone().normalize().multiplyScalar(d));

          this.speed *= 1.1;
          this.velocity.normalize().multiplyScalar(this.speed);
          this.dispatchEvent({ type: 'collide' });
        }
      }
    }

    this.mesh.position.copy(tPos);
  }

  updateFromGameEngine(newX, newZ) {
    const pos = this.mesh.position;
    const absX = Math.abs(newX);
    const absZ = Math.abs(newZ);

    pos.set(newX, pos.y, newZ);

    const dx = this.boundaries.x - this.radius - absX;
    if (dx <= 0.0) {
      pos.x = (this.boundaries.x - this.radius + dx) * Math.sign(newX);
      this.dispatchEvent({ type: 'collide' });
    }

    const dz = this.boundaries.y - this.radius - absZ;
    if (dz <= 0.0) {
      this.dispatchEvent({ type: 'onGoal', message: newZ > 0 ? 'p2' : 'p1' });
    }
  }
}
