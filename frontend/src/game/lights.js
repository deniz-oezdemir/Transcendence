import { AmbientLight, DirectionalLight } from 'three';

const ambientLight = new AmbientLight(0xffffff, 0.6);
const dirLight = new DirectionalLight(0xffffff, 0.7);

dirLight.position.set(20, 20, 20);

const lights = [dirLight, ambientLight];

export default lights;
