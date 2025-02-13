import {
  RingGeometry,
  Color,
  TextureLoader,
  RepeatWrapping,
  MeshStandardMaterial,
  DoubleSide,
  AdditiveBlending,
  Mesh,
} from 'three';
import lerp from '@/game/utils/lerp.js';

export default class NeonRingEffect {
  scene;
  poolSize;
  textureLoader;
  colors;
  currentColor;
  ringPool;
  currentRingIndex;
  isSecondary;
  lastCollisionTime;
  maxAge;
  progressScale;
  maxScale;
  ringGeometry;
  noiseTexture;

  constructor(
    scene,
    colors = [0x00ff00, 0xff0066],
    textureLoader = new TextureLoader(),
    poolSize = 8
  ) {
    this.scene = scene;
    this.poolSize = poolSize;
    this.textureLoader = textureLoader;
    this.colors = {
      primary: new Color(colors[0]),
      secondary: new Color(colors[1]),
    };
    this.currentColor = this.colors.primary;

    this.ringPool = [];
    this.currentRingIndex = 0;
    this.isSecondary = false;
    this.lastCollisionTime = null;

    // Precomputed constants
    this.maxAge = 4.0;
    this.progressScale = (this.maxAge * 0.5) / this.maxAge;
    this.maxScale = 64.0;
    this.initialScale = 0.01;

    // Create ring geometry once to reuse
    this.ringGeometry = new RingGeometry(1, 1.15, 64);
    this.ringGeometry.rotateX(Math.PI * 0.5);
  }

  async init() {
    try {
      // Load noise texture
      this.noiseTexture = await this.textureLoader.loadAsync(
        'assets/textures/wavesTexture.webp'
      );
      this.noiseTexture.wrapS = this.noiseTexture.wrapT = RepeatWrapping;

      // Initialize the pool with inactive rings
      this.initializePool();
    } catch (error) {
      console.error('Error loading noise texture en NeonRingEffect:', error);
    }
  }

  initializePool() {
    for (let i = 0; i < this.poolSize; i++) {
      const material = new MeshStandardMaterial({
        transparent: true,
        opacity: 0,
        side: DoubleSide,
        map: this.noiseTexture,
        color: this.colors.primary,
        alphaMap: this.noiseTexture,
        depthWrite: false,
        blending: AdditiveBlending,
        emissive: this.colors.primary, // Emisión del mismo color
        emissiveIntensity: 1.0, // Ajusta la intensidad
      });

      const mesh = new Mesh(this.ringGeometry, material);
      mesh.visible = false; // Hide by default
      this.scene.add(mesh);

      this.ringPool.push({
        mesh,
        age: 0,
      });
    }
  }

  getAvailableRing(position) {
    position.y = -1.0;
    // Get the next ring from the pool in a circular manner
    const ring = this.ringPool[this.currentRingIndex];

    // Reset ring properties
    ring.mesh.position.copy(position);
    ring.mesh.scale.set(0.1, 1, 0.1);
    ring.mesh.material.opacity = 1;
    ring.mesh.visible = true;
    ring.age = 0;

    // Only update color if necessary
    if (ring.mesh.material.color !== this.currentColor) {
      ring.mesh.material.color.copy(this.currentColor);
      ring.mesh.material.emissive.copy(this.currentColor);
    }

    // Move to the next ring index (circular buffer)
    this.currentRingIndex = (this.currentRingIndex + 1) % this.poolSize;

    return ring;
  }

  update(deltaTime) {
    for (const ring of this.ringPool) {
      if (!ring.mesh.visible) continue; // Skip inactive rings

      ring.age += deltaTime;

      const lifeProgress = ring.age / this.maxAge;
      let scale;

      if (lifeProgress < this.progressScale) {
        scale = lerp(
          this.initialScale,
          this.maxScale * 0.6,
          lifeProgress / this.progressScale
        );
      } else {
        const progress = Math.min((lifeProgress - this.progressScale) * 2, 1);
        scale = lerp(this.maxScale * 0.6, this.maxScale, progress);
        const newOpacity = Math.max(1 - progress, 0);
        if (ring.mesh.material.opacity !== newOpacity) {
          ring.mesh.material.opacity = newOpacity;
        }
      }

      ring.mesh.scale.set(scale, 1, scale);

      // If ring has expired, hide it instead of removing
      if (ring.age >= this.maxAge) {
        ring.mesh.visible = false;
      }
    }
  }

  onCollision(position) {
    const currentTime = performance.now() * 0.001;
    const timeSinceLastCollision = this.lastCollisionTime
      ? currentTime - this.lastCollisionTime
      : null;

    this.lastCollisionTime = currentTime;

    if (timeSinceLastCollision !== null && timeSinceLastCollision < 0.7) {
      this.isSecondary = !this.isSecondary;
    } else if (this.isSecondary) {
      this.isSecondary = !this.isSecondary;
    }

    this.currentColor = this.isSecondary
      ? this.colors.secondary
      : this.colors.primary;

    this.getAvailableRing(position);
  }

  dispose() {
    for (const ring of this.ringPool) {
      this.scene.remove(ring.mesh);
      ring.mesh.material.dispose();
      ring.mesh.geometry.dispose();
    }
    this.ringPool = [];
  }
}
