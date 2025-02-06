import {
  Mesh,
  MeshStandardMaterial,
  MeshNormalMaterial,
  MeshBasicMaterial,
  SphereGeometry,
  Vector3,
  Raycaster,
  EventDispatcher,
} from 'three';

export default class Ball extends EventDispatcher {
  speed = 15;
  velocity = new Vector3(1, 0, 1);

  constructor(scene, boundaries, paddles) {
    super();

    this.scene = scene;
    this.boundaries = boundaries;
    this.paddles = paddles;
    this.radius = 0.5;
    this.geometry = new SphereGeometry(this.radius);
    this.material = new MeshStandardMaterial({ color: 0xffaa00 });
    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.velocity.multiplyScalar(this.speed);

    this.scene.add(this.mesh);

    this.raycaster = new Raycaster();
    this.raycaster.near = 0;
    this.raycaster.far = this.boundaries.y * 2.5;

    // For Debugging
    this.pointCollision = new Mesh(
      new SphereGeometry(0.1),
      new MeshBasicMaterial({ color: 'red' })
    );
    // this.scene.add(this.pointCollision);
  }

  resetVelocity() {
    this.speed = 15;
    this.velocity.z *= -1;
    this.velocity.normalize().multiplyScalar(this.speed);
  }

  update(deltaTime) {
    const dir = this.velocity.clone().normalize();
    this.raycaster.set(this.mesh.position, dir);

    const s = this.velocity.clone().multiplyScalar(deltaTime);
    const tPos = this.mesh.position.clone().add(s);

    const dx = this.boundaries.x - this.radius - Math.abs(this.mesh.position.x);
    const dz = this.boundaries.y - this.radius - Math.abs(this.mesh.position.z);

    if (dx <= 0) {
      tPos.x =
        (this.boundaries.x - this.radius + dx) *
        Math.sign(this.mesh.position.x);
      this.velocity.x *= -1;
      this.dispatchEvent({ type: 'collide' });
    }

    if (dz < 0) {
      const z = this.mesh.position.z;
      const message = z > 0 ? 'pc' : 'player';
      this.dispatchEvent({ type: 'onGoal', message: message });

      tPos.set(0, 0, 0);
      this.resetVelocity();
    }

    // Collision with one of the paddle
    const paddle = this.paddles.find((paddle) => {
      return Math.sign(paddle.mesh.position.z) === Math.sign(this.velocity.z);
    });

    const [intersection] = this.raycaster.intersectObjects(
      paddle.mesh.children
    );

    if (intersection) {
      // this.pointCollision.position.copy(intersection.point);

      if (intersection.distance < s.length()) {
        tPos.copy(intersection.point);
        const d = s.length() - intersection.distance;

        const normal = intersection.normal;
        normal.y = 0;
        normal.normalize();
        this.velocity.reflect(normal);

        const dS = this.velocity.clone().normalize().multiplyScalar(d);
        tPos.add(dS);

        this.speed *= 1.1;
        this.velocity.normalize().multiplyScalar(this.speed);
      }
    }
    // else {
    //     this.pointCollision.position.set(0, 0, 0);
    //   }

    this.mesh.position.copy(tPos);
  }
}
