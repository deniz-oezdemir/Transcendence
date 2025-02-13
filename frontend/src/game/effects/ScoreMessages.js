import { AdditiveBlending, Color, Mesh, Group, PlaneGeometry } from 'three';
import HolographicMaterial from '@/game/materials/HolographicMaterial.js';

export default class ScoreMessages {
  scene;
  params;
  messages;
  materials;
  textureLoader;
  group;
  geometry;

  constructor(scene, params, textureLoader) {
    this.scene = scene;
    this.params = params;
    this.messages = {
      p1: null,
      p2: null,
    };
    this.geometry = new PlaneGeometry(1, 1);
    this.materials = {
      p1: null,
      p2: null,
    };
    this.textureLoader = textureLoader;
    this.group = new Group();
  }

  async init() {
    const [pingTexture, pongTexture] = await Promise.all([
      this.textureLoader.load('assets/textures/ping.webp'),
      this.textureLoader.load('assets/textures/pong.webp'),
    ]);

    pingTexture.flipY = false;
    pongTexture.flipY = false;

    this.materials.p1 = this.createMaterial(
      pongTexture,
      this.params.colors.paddleP1
    );
    this.materials.p2 = this.createMaterial(
      pingTexture,
      this.params.colors.paddleP2
    );

    this.messages.p1 = this.createMessage(this.materials.p1);
    this.messages.p2 = this.createMessage(this.materials.p2);

    this.group.add(this.messages.p1);
    this.group.add(this.messages.p2);
    this.scene.add(this.group);
  }

  createMaterial(texture, color) {
    return new HolographicMaterial({
      useMap: true,
      map: texture,
      hologramColor: new Color(color),
      fresnelAmount: 0.7,
      blendMode: AdditiveBlending,
      scanlineSize: 3.7,
      signalSpeed: 4.0,
      hologramOpacity: 0.0,
      hologramBrightness: 3.0,
      blinkFresnelOnly: false,
      enableBlinking: true,
    });
  }

  createMessage(material) {
    const mesh = new Mesh(this.geometry, material);
    mesh.scale.set(
      this.params.dimensions.boundaries.y * 2,
      this.params.dimensions.boundaries.x * 2,
      1
    );
    mesh.rotateX(-Math.PI * 0.5);
    mesh.rotateZ(-Math.PI * 0.5);
    mesh.position.set(0, -1, 0);
    return mesh;
  }

  trigger(player) {
    if (!this.messages[player]) return;

    const mesh = this.messages[player];
    mesh.material.hologramOpacityNode.value = 1.0;

    setTimeout(() => {
      mesh.material.hologramOpacityNode.value = 0.0;
    }, 800);
  }

  update() {
    this.messages.p1.material.update();
    this.messages.p2.material.update();
  }
}
