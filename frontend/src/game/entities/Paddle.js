import { Mesh, MeshNormalMaterial, MeshBasicNodeMaterial } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mrt, uniform } from 'three/tsl';

export default class Paddle {
  static HELPER_MATERIAL = new MeshNormalMaterial({
    transparent: true,
    opacity: 0.25,
    visible: false,
  });

  constructor(dimensions, position, color, bloomIntensity) {
    this.boundaries = dimensions.boundaries;

    this.geometry = new RoundedBoxGeometry(
      dimensions.paddle.x,
      dimensions.paddle.y,
      1,
      8,
      0.5
    );

    this.halfLength = dimensions.paddle.x * 0.5;
    this.material = new MeshBasicNodeMaterial({ color });

    this.mesh = new Mesh(this.geometry, this.material);
    this.mesh.castShadow = this.mesh.receiveShadow = true;

    this.collisionHelper = new Mesh(
      new RoundedBoxGeometry(
        dimensions.paddle.x + 1,
        dimensions.paddle.y + 1,
        2,
        4,
        0.5
      ),
      Paddle.HELPER_MATERIAL
    );

    this.mesh.add(this.collisionHelper);
    this.mesh.position.copy(position);
    this.mesh.material.mrtNode = mrt({
      bloomIntensity: uniform(bloomIntensity),
    });
  }

  setX(x) {
    this.mesh.position.x = Math.max(
      -this.boundaries.x + this.halfLength,
      Math.min(x, this.boundaries.x - this.halfLength)
    );
  }
}
