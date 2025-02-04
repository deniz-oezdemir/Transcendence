import { CapsuleGeometry, Mesh, MeshNormalMaterial } from 'three';

const GEOMETRY = new CapsuleGeometry(0.25, 5, 20, 20);
GEOMETRY.rotateZ(Math.PI * 0.5);
const MATERIAL = new MeshNormalMaterial();

export default class Paddle {
  constructor(scene, position) {
    this.scene = scene;

    this.geometry = GEOMETRY;
    this.material = MATERIAL;
    this.mesh = new Mesh(GEOMETRY, MATERIAL);

    this.mesh.position.copy(position);
    this.scene.add(this.mesh);
  }
}
