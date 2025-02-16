import {
  PlaneGeometry,
  TextureLoader,
  PMREMGenerator,
  RepeatWrapping,
  Scene,
  Group,
  Vector3,
  Fog,
  FogExp2,
  CircleGeometry,
} from 'three';
import { SkyMesh } from 'three/addons/objects/SkyMesh.js';
import { WaterMesh } from 'three/addons/objects/WaterMesh.js';
import { getSunParams, getSkyParams } from '@/game/utils/skyParams.js';

export default class SceneEnvironment {
  scene;
  renderer;
  lat;
  lon;
  date;
  sunParams;
  skyParams;
  group;
  textureLoader;
  pmremGenerator;
  sceneEnv;
  renderTarget;
  params;

  constructor(
    scene,
    renderer,
    params,
    textureLoader = new TextureLoader(),
    lat = 52.520008,
    lon = 13.404954
  ) {
    this.water = null;
    this.scene = scene;
    this.renderer = renderer;
    this.group = new Group();
    this.textureLoader = textureLoader;
    this.params = params;

    this.lat = lat;
    this.lon = lon;
    this.date = new Date();
    this.updateSunParams();
  }

  async init() {
    this.createSky();
    await this.createWater();
    await this.createSceneEnvironment();
  }

  createSky() {
    this.sky = new SkyMesh();
    this.sky.scale.setScalar(this.params.dimensions.world.x);

    this.sky.turbidity.value = this.skyParams.turbidity;
    this.sky.rayleigh.value = this.skyParams.rayleigh;
    this.sky.mieCoefficient.value = this.skyParams.mieCoefficient;
    this.sky.mieDirectionalG.value = this.skyParams.mieDirectionalG;

    this.sky.sunPosition.value.copy(this.skyParams.sunPosition);
    this.group.add(this.sky);
  }

  async createWater() {
    const waterGeometry = new CircleGeometry(
      this.params.dimensions.world.x * 2,
      64
    );
    // const waterGeometry = new PlaneGeometry(
    //   this.params.dimensions.world.x,
    //   this.params.dimensions.world.y
    // );
    const waterNormals = await this.textureLoader.loadAsync(
      'assets/textures/waternormals.jpg'
    );

    waterNormals.wrapS = waterNormals.wrapT = RepeatWrapping;

    this.water = new WaterMesh(waterGeometry, {
      waterNormals: waterNormals,
      sunDirection: this.skyParams.sunPosition.clone().normalize(),
      sunColor: this.params.colors.sun,
      waterColor: this.params.colors.water,
      alpha: 0.98,
      distortionScale: 3.7,
    });

    this.water.rotation.x = -Math.PI * 0.5;
    this.water.position.y = -2.0;
    this.water.receiveShadow = true;

    this.group.add(this.water);
  }

  async createSceneEnvironment() {
    this.pmremGenerator = new PMREMGenerator(this.renderer);
    this.sceneEnv = new Scene();
    this.sceneEnv.fog = new FogExp2(this.params.environment.fog.color, 0.00005);
    // this.sceneEnv.fog = new Fog(
    //   this.params.environment.fog.color,
    //   this.params.environment.fog.far * 0.5,
    //   this.params.environment.fog.far * 2
    // );
    this.sceneEnv.add(this.sky);

    this.renderTarget = await this.pmremGenerator.fromSceneAsync(this.sceneEnv);
    this.scene.environment = this.renderTarget.texture;
    this.scene.background = this.renderTarget.texture;
    this.scene.environmentIntensity = 1.2;
    this.scene.backgroundIntensity = 0.7;
    this.scene.backgroundBlurriness = 0.2;

    this.scene.add(this.group);
  }

  updateSunParams() {
    this.sunParams = getSunParams(this.lat, this.lon, this.date);
    this.skyParams = {
      elevation: this.sunParams.elevation,
      azimuth: this.sunParams.azimuth,
      sunPosition: new Vector3(),
      turbidity: 0,
      rayleigh: 0,
      mieCoefficient: 0,
      mieDirectionalG: 0,
    };
    getSkyParams(this.skyParams);
  }

  updateSun(delta) {
    this.date.setMinutes(this.date.getMinutes() + 30);
    this.updateSunParams();

    this.sky.sunPosition.value.copy(this.skyParams.sunPosition);
    this.water.sunDirection.value.copy(this.skyParams.sunPosition).normalize();

    // const texture = this.pmremGenerator.fromScene(this.sky).texture;
    // this.scene.environment = this.scene.background = texture;

    requestIdleCallback(
      () => {
        this.pmremGenerator
          .fromSceneAsync(this.sceneEnv)
          .then((newRenderTarget) => {
            if (this.renderTarget) this.renderTarget.dispose();
            this.scene.environment =
              this.scene.background =
              this.renderTarget =
                newRenderTarget.texture;
          });
      },
      { timeout: 3000 }
    );

    // if (this.renderTarget) this.renderTarget.dispose();

    // this.pmremGenerator
    //   .fromSceneAsync(this.sceneEnv)
    //   .then((newRenderTarget) => {
    //     this.renderTarget = newRenderTarget;
    //     this.scene.environment = this.renderTarget.texture;
    //     this.scene.background = this.renderTarget.texture;
    //     this.scene.environmentIntensity = 0.9;
    //     this.scene.backgroundIntensity = 0.1;
    //     this.scene.backgroundBlurriness = 0.0;
    //   })
    //   .catch((error) => {
    //     console.error('Error generando el render target:', error);
    //   });
  }
}
