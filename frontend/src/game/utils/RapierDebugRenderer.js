import {
  LineSegments,
  BufferGeometry,
  LineBasicMaterial,
  BufferAttribute,
} from 'three';

export default class RapierDebugRenderer {
  mesh;
  world;

  constructor(scene, world, devMode) {
    this.enabled = devMode;
    this.world = world;
    this.mesh = new LineSegments(
      new BufferGeometry(),
      new LineBasicMaterial({ color: 0xff0000, vertexColors: true })
    );
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }

  update() {
    if (!this.enabled) {
      if (this.mesh.visible) this.mesh.visible = false;
      return;
    }

    const { vertices, colors } = this.world.debugRender();
    const geometry = this.mesh.geometry;

    if (vertices.length !== geometry.getAttribute('position')?.array.length) {
      geometry.setAttribute('position', new BufferAttribute(vertices, 3));
    } else {
      const positionAttr = geometry.getAttribute('position');
      positionAttr.array.set(vertices);
      positionAttr.needsUpdate = true;
    }

    if (colors.length !== geometry.getAttribute('color')?.array.length) {
      geometry.setAttribute('color', new BufferAttribute(colors, 4));
    } else {
      const colorAttr = geometry.getAttribute('color');
      colorAttr.array.set(colors);
      colorAttr.needsUpdate = true;
    }

    if (!this.mesh.visible) this.mesh.visible = true;
  }
}
