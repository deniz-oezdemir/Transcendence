import {
  CapsuleGeometry,
  Mesh,
  MeshNormalMaterial,
  MeshStandardMaterial,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

// const GEOMETRY = new CapsuleGeometry(0.5, 5, 20, 20);
const GEOMETRY = new RoundedBoxGeometry(5, 2, 1, 8, 0.5);
// const HELPER_GEOMETRY = new CapsuleGeometry(1.0, 5, 20, 8);
const HELPER_GEOMETRY = new RoundedBoxGeometry(6, 2, 2, 4, 0.5);
// HELPER_GEOMETRY.rotateZ(Math.PI * 0.5);
// HELPER_GEOMETRY.rotateX(Math.PI * 0.125);
// GEOMETRY.rotateZ(Math.PI * 0.5);

export default class Paddle {
  constructor(scene, dimensions, position, color) {
    this.scene = scene;
    this.boundaries = dimensions.boundaries;

    this.geometry = GEOMETRY;
    if (this.geometry.width !== dimensions.paddle.x)
      this.geometry.width = dimensions.paddle.x;
    if (this.geometry.depth !== dimensions.paddle.y)
      this.geometry.depth = dimensions.paddle.y;

    this.halfLength = this.geometry.width * 0.5;

    this.material = new MeshStandardMaterial({ color });
    this.mesh = new Mesh(GEOMETRY, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;

    this.collisionHelper = new Mesh(
      HELPER_GEOMETRY,
      new MeshNormalMaterial({
        transparent: true,
        opacity: 0.25,
        visible: false,
      })
    );

    this.mesh.add(this.collisionHelper);

    this.mesh.position.copy(position);
    this.scene.add(this.mesh);
  }

  setX(x) {
    const maxX = this.boundaries.x - this.halfLength;

    if (x > maxX) {
      x = maxX;
    } else if (x < -maxX) {
      x = -maxX;
    }

    this.mesh.position.x = x;
  }
}
