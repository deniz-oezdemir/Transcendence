import { AdditiveBlending, Color, Group, Mesh } from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import HolographicMaterial from '@/game/materials/HolographicMaterial.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';

export default class ScoreDisplay {
  scene;
  params;
  loadedFont;
  holographicMaterial;
  fontLoader;
  loadedFont;
  player1ScoreMesh;
  player1NameMesh;
  player2ScoreMesh;
  player2NameMesh;
  group;

  constructor(scene, params, fontLoader = new FontLoader()) {
    this.scene = scene;
    this.params = params;
    this.loadedFont = null;
    this.holographicMaterial = new HolographicMaterial({
      hologramColor: new Color(this.params.colors.hologram),
      fresnelAmount: 0.7,
      blendMode: AdditiveBlending,
      scanlineSize: 30,
      signalSpeed: 1.0,
      hologramOpacity: 0.5,
      blinkFresnelOnly: true,
      hologramBrightness: 2,
      depthTest: false,
    });

    this.fontLoader = fontLoader;
    this.group = new Group();
  }

  async init() {
    this.loadedFont = await this.fontLoader.loadAsync(
      'assets/fonts/Exo_2_Regular.json'
      // 'assets/fonts/helvetiker_bold.typeface.json'
      // 'assets/fonts/droid_sans_bold.typeface.json'
      // 'assets/fonts/droid_sans_mono_regular.typeface.json'
      // 'assets/fonts/droid_sans_regular.typeface.json'
      // 'assets/fonts/gentilis_bold.typeface.json'
      // 'assets/fonts/gentilis_regular.typeface.json'
      // 'assets/fonts/helvetiker_regular.typeface.json'
    );
    this.createTextMeshes();
    this.scene.add(this.group);
  }

  createTextMeshes() {
    const scoreGeometry = this.createTextGeometry('0');
    const p1NameGeometry = this.createTextGeometry(
      this.params.score.info.p1.name
    );
    const p2NameGeometry = this.createTextGeometry(
      this.params.score.info.p2.name
    );

    // Center geometries
    scoreGeometry.center();
    p1NameGeometry.center();
    p2NameGeometry.center();

    // Create meshes
    this.player1ScoreMesh = new Mesh(scoreGeometry, this.holographicMaterial);
    this.player1NameMesh = new Mesh(p1NameGeometry, this.holographicMaterial);
    this.player2ScoreMesh = new Mesh(scoreGeometry, this.holographicMaterial);
    this.player2NameMesh = new Mesh(p2NameGeometry, this.holographicMaterial);

    // Set positions and rotations
    this.positionMeshes();

    // Add meshes to the scene
    this.addToScene();
  }

  createTextGeometry(text) {
    return new TextGeometry(text, {
      font: this.loadedFont,
      size: 7,
      depth: 1.0,
      curveSegments: 16,
      bevelEnabled: true,
      bevelThickness: 1.0,
      bevelSize: 0.5,
      bevelOffset: 0,
      bevelSegments: 8,
    });
  }

  positionMeshes() {
    const { boundaries } = this.params.dimensions;
    this.player1ScoreMesh.rotation.y = -Math.PI * 0.5;
    this.player1ScoreMesh.position.set(boundaries.x * 2, 16, boundaries.x - 12);

    this.player2ScoreMesh.rotation.y = -Math.PI * 0.5;
    this.player2ScoreMesh.position.set(boundaries.x * 2, 16, -boundaries.x + 8);

    this.player1NameMesh.rotation.y = -Math.PI;
    this.player1NameMesh.position.set(0, 4, boundaries.y * 2);

    // this.player2NameMesh.rotation.y = Math.PI;
    this.player2NameMesh.position.set(0, 4, -boundaries.y * 2);
  }

  addToScene() {
    this.player1ScoreMesh.castShadow = true;
    this.player1NameMesh.castShadow = true;
    this.player2ScoreMesh.castShadow = true;
    this.player2NameMesh.castShadow = true;

    this.group.add(
      this.player2ScoreMesh,
      this.player1ScoreMesh,
      this.player1NameMesh,
      this.player2NameMesh
    );
    this.scene.add(this.group);
  }

  updateScore(scoreP1, scoreP2) {
    if (!this.loadedFont) return; // Font is not loaded yet

    this.player1ScoreMesh.geometry.dispose();
    this.player1ScoreMesh.geometry = this.createTextGeometry(`${scoreP1}`);

    this.player2ScoreMesh.geometry.dispose();
    this.player2ScoreMesh.geometry = this.createTextGeometry(`${scoreP2}`);
  }

  update() {
    this.holographicMaterial.update();
  }
}
