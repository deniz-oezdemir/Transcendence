import { AmbientLight, DirectionalLight } from 'three';

const ambientLight = new AmbientLight(0xffffff, 0.7);
const dirLight = new DirectionalLight(0xffffff, 0.7);

dirLight.position.set(-20, 50, 20);
dirLight.castShadow = true;

dirLight.shadow.mapSize.set(2048, 2048);
dirLight.shadow.camera.top = 100;
dirLight.shadow.camera.bottom = -100;
dirLight.shadow.camera.left = -100;
dirLight.shadow.camera.right = 100;
dirLight.shadow.radius = 5;
dirLight.shadow.blurSamples = 10;
dirLight.shadow.bias = -0.0005;

const lights = [dirLight, ambientLight];

export default lights;
