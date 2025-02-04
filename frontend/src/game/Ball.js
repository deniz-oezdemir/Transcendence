import { Mesh, MeshNormalMaterial, SphereGeometry, Vector3 } from 'three';

export default class Ball {
  speed = 5;
  velocity = new Vector3(1, 0, 0.5);

  constructor(scene, boundaries) {
    this.scene = scene;
    this.boundaries = boundaries;
    this.radius = 0.5;
    this.geometry = new SphereGeometry(this.radius);
    this.material = new MeshNormalMaterial();
    this.mesh = new Mesh(this.geometry, this.material);

    this.velocity.multiplyScalar(this.speed);

    this.scene.add(this.mesh);
  }

  update(deltaTime) {
    const s = this.velocity.clone().multiplyScalar(deltaTime);
    const tPos = this.mesh.position.clone().add(s);

    const dx = this.boundaries.x - this.radius - Math.abs(this.mesh.position.x);
    const dz = this.boundaries.y - this.radius - Math.abs(this.mesh.position.z);

    if (dx <= 0) {
      tPos.x =
        (this.boundaries.x - this.radius + dx) *
        Math.sign(this.mesh.position.x);
      this.velocity.x *= -1;
    }

    if (dz < 0) {
      tPos.set(0, 0, 0);
      this.velocity.z *= -1;
    }

    this.mesh.position.copy(tPos);
  }
}
