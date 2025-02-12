import {
  Group,
  MeshPhysicalMaterial,
  BoxGeometry,
  Mesh,
  CylinderGeometry,
} from 'three';

export default function MetallicWalls(dimensions) {
  const wallThickness = 0.3;
  const wallGroup = new Group();

  const metallicMaterial = new MeshPhysicalMaterial({
    color: 0x444444,
    metalness: 1.0,
    roughness: 0.9,
    // envMapIntensity: 2.0,
    // emissive: 0x222222,
    // clearcoat: 1.0,
    // clearcoatRoughness: 0.1,
    reflectivity: 1.0,
    flatShading: true,
    // iridescence: 1.0,
  });

  const width = dimensions.boundaries.x * 2 + 1;
  const height = 2.0;
  const depth = dimensions.boundaries.y * 2 + 1;

  const frontWall = new Mesh(
    new BoxGeometry(width, height, wallThickness),
    metallicMaterial
  );
  const backWall = frontWall.clone();
  frontWall.position.z = depth * 0.5;
  backWall.position.z = -depth * 0.5;

  const leftWall = new Mesh(
    new BoxGeometry(wallThickness, height, depth),
    metallicMaterial
  );
  const rightWall = leftWall.clone();
  leftWall.position.x = -width * 0.5;
  rightWall.position.x = width * 0.5;

  wallGroup.add(frontWall);
  wallGroup.add(backWall);
  wallGroup.add(leftWall);
  wallGroup.add(rightWall);

  const cornerHeight = height;
  const cornerRadius = wallThickness * 0.5;

  const corners = [
    { x: -width * 0.5, z: -depth * 0.5 },
    { x: width * 0.5, z: -depth * 0.5 },
    { x: -width * 0.5, z: depth * 0.5 },
    { x: width * 0.5, z: depth * 0.5 },
  ];

  corners.forEach((corner) => {
    const cornerPillar = new Mesh(
      new CylinderGeometry(cornerRadius, cornerRadius, cornerHeight, 8),
      metallicMaterial
    );
    cornerPillar.position.set(corner.x, 0, corner.z);
    wallGroup.add(cornerPillar);
  });

  return wallGroup;
}
