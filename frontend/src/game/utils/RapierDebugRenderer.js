import {
  Scene,
  LineSegments,
  BufferGeometry,
  LineBasicMaterial,
  BufferAttribute,
} from 'three';

export default class RapierDebugRenderer {
  mesh;
  world;
  enabled = true;

  constructor(scene, world) {
    this.world = world;
    this.mesh = new LineSegments(
      new BufferGeometry(),
      new LineBasicMaterial({ color: 0xff0000, vertexColors: true })
    );
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update() {
    if (this.enabled) {
      const { vertices, colors } = this.world.debugRender();
      this.mesh.geometry.setAttribute(
        'position',
        new BufferAttribute(vertices, 3)
      );
      this.mesh.geometry.setAttribute('color', new BufferAttribute(colors, 4));
      this.mesh.visible = true;
    } else {
      this.mesh.visible = false;
    }
  }
}
