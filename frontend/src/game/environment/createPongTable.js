import {
  Group,
  TextureLoader,
  RepeatWrapping,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  FrontSide,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Brush, Evaluator, SUBTRACTION } from 'three-bvh-csg';
import MetallicWalls from '@/game/environment/MetallicWalls.js';

export default function createPongTable(params) {
  const metallicWalls = MetallicWalls(params.dimensions);

  const noiseTexture = new TextureLoader().load('assets/textures/neon.webp');
  noiseTexture.wrapS = noiseTexture.wrapT = RepeatWrapping;

  const coliseumMaterial = new MeshPhysicalMaterial({
    map: noiseTexture,
    alphaMap: noiseTexture,
    clearcoat: 0.0,
    clearcoatRoughness: 0.0,
    // dispersion: 0.00000001,
    ior: 1.25,
    reflectivity: 1.0,
    thickness: 2.5,
    roughness: 0.1,
    transmission: 0.99,
    envMapIntensity: 25,
    transparent: true,
    opacity: 1.0,
    metalness: 0.0,
    depthWrite: false,
    depthTest: true,
  });

  const coliseumGeometry = new RoundedBoxGeometry(
    params.dimensions.boundaries.x * 2 + 1.2,
    3.5,
    params.dimensions.boundaries.y * 2 + 1.2,
    8,
    1.5
  );

  const platformGeometry = new RoundedBoxGeometry(
    params.dimensions.boundaries.x * 4,
    3.0,
    params.dimensions.boundaries.y * 4,
    8,
    3
  );
  platformGeometry.translate(0, -1.0, 0);

  const platformMaterial = new MeshStandardMaterial({
    color: 0x000000,
    metalness: 1.0,
    roughness: 0.25,
    flatShading: true,
    side: FrontSide,
  });

  const coliseumBrush = new Brush(coliseumGeometry, coliseumMaterial);

  const finalPlatform = new Evaluator().evaluate(
    new Brush(platformGeometry, platformMaterial),
    coliseumBrush,
    SUBTRACTION
  );

  coliseumBrush.castShadow = true;
  coliseumBrush.receiveShadow = true;

  finalPlatform.castShadow = true;
  finalPlatform.receiveShadow = true;

  metallicWalls.receiveshadow = true;

  const pongTable = new Group();
  pongTable.add(coliseumBrush);
  pongTable.add(finalPlatform);
  pongTable.add(metallicWalls);

  return pongTable;
}
