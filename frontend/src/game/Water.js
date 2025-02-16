import { Color, Mesh, Vector3, MeshLambertNodeMaterial } from 'three/webgpu';

import {
  Fn,
  add,
  cameraPosition,
  div,
  normalize,
  positionWorld,
  sub,
  time,
  texture,
  vec2,
  vec3,
  max,
  dot,
  reflect,
  pow,
  length,
  float,
  uniform,
  reflector,
  mul,
  mix,
  diffuseColor,
} from 'three/tsl';

/**
 * Water (WebGPU)
 *
 * Versión que recrea la lógica del shader original de WebGL de agua,
 * trasladándola al sistema de nodos de Three.js para WebGPU.
 *
 * Importante:
 *  - Toda la cadena de cálculos (ruido, normales, iluminación y reflejo)
 *    se define dentro de material.colorNode para que se evalúe dinámicamente.
 *  - Asegúrate de que la textura de normales (waterNormals) esté cargada
 *    y configurada con wrapS y wrapT en RepeatWrapping.
 */
class Water extends Mesh {
  constructor(geometry, options = {}) {
    // Creamos un material basado en MeshLambertNodeMaterial para WebGPU
    const material = new MeshLambertNodeMaterial();
    super(geometry, material);
    this.isWater = true;
    this.resolution =
      options.resolution !== undefined ? options.resolution : 0.5;

    // Uniformes y parámetros usando la API de nodos
    this.waterNormals = texture(options.waterNormals);
    this.alpha = uniform(options.alpha !== undefined ? options.alpha : 1.0);
    this.size = uniform(options.size !== undefined ? options.size : 1.0);
    this.sunColor = uniform(
      new Color(options.sunColor !== undefined ? options.sunColor : 0xffffff)
    );
    this.sunDirection = uniform(
      options.sunDirection !== undefined
        ? options.sunDirection
        : new Vector3(0.70707, 0.70707, 0.0)
    );
    this.waterColor = uniform(
      new Color(
        options.waterColor !== undefined ? options.waterColor : 0x7f7f7f
      )
    );
    this.distortionScale = uniform(
      options.distortionScale !== undefined ? options.distortionScale : 20.0
    );

    material.transparent = true;
    material.opacityNode = this.alpha;
    // (Opcional) Se asigna la posición del mundo sin distorsión para sombras, etc.
    material.shadowPositionNode = positionWorld;
    material.setupOutgoingLight = () => diffuseColor.rgb;

    // Definición de material.colorNode con toda la cadena de cálculo
    material.colorNode = Fn(() => {
      // --- Obtención de datos dinámicos ---
      const pos = positionWorld; // posición del fragmento en el mundo
      const camPos = cameraPosition; // posición de la cámara

      // --- Cálculo del ruido usando la textura de normales ---
      // Se utiliza la componente XZ de la posición, escalada por el uniforme 'size'
      const uv = pos.xz.mul(this.size);
      const offset = time; // valor del tiempo (se actualiza en cada frame)

      // Se definen las 4 muestras con offsets (similares al GLSL original)
      const uv0 = add(div(uv, 103), vec2(div(offset, 17), div(offset, 29)));
      const uv1 = div(uv, 107).sub(vec2(div(offset, -19), div(offset, 31)));
      const uv2 = add(
        div(uv, vec2(8907.0, 9803.0)),
        vec2(div(offset, 101), div(offset, 97))
      );
      const uv3 = sub(
        div(uv, vec2(1091.0, 1027.0)),
        vec2(div(offset, 109), div(offset, -113))
      );

      // Se muestrea la textura de normales en las 4 coordenadas
      const noise0 = this.waterNormals.sample(uv0);
      const noise1 = this.waterNormals.sample(uv1);
      const noise2 = this.waterNormals.sample(uv2);
      const noise3 = this.waterNormals.sample(uv3);
      // Se suman las muestras y se reescala para obtener ruido en el rango [-1,1]
      const noise = noise0.add(noise1).add(noise2).add(noise3).mul(0.5).sub(1);

      // --- Cálculo de la normal perturbada ---
      // Reordenamos las componentes como en el shader original: noise.xzy * vec3(1.5, 1.0, 1.5)
      const surfaceNormal = normalize(noise.xzy.mul(vec3(1.5, 1.0, 1.5)));

      // --- Cálculos de iluminación y reflexión ---
      const worldToEye = camPos.sub(pos);
      const eyeDirection = normalize(worldToEye);
      // Se calcula la reflexión de la luz solar (se invierte la dirección)
      const negSunDir = this.sunDirection.negate();
      const reflection = normalize(reflect(negSunDir, surfaceNormal));
      const specFactor = max(0.0, dot(eyeDirection, reflection));
      const specularLight = pow(specFactor, 100).mul(this.sunColor).mul(2.0);
      const diffuseLight = max(dot(this.sunDirection, surfaceNormal), 0.0)
        .mul(this.sunColor)
        .mul(0.5);

      // --- Cálculo de la distorsión para el reflejo ---
      const distance = length(worldToEye);
      const distortion = surfaceNormal.xz
        .mul(float(0.001).add(float(1.0).div(distance)))
        .mul(this.distortionScale);

      // --- Reflejo de la escena ---
      // reflector() gestiona el render target para obtener el reflejo dinámico
      const mirrorSampler = reflector();
      mirrorSampler.uvNode = mirrorSampler.uvNode.add(distortion);
      mirrorSampler.resolution = this.resolution;
      // Se agrega el target del reflector a la malla si aún no lo tiene
      if (!this.children.includes(mirrorSampler.target)) {
        this.add(mirrorSampler.target);
      }

      // --- Mezcla final: iluminación y reflejo ---
      const theta = max(dot(eyeDirection, surfaceNormal), 0.0);
      const rf0 = float(0.3);
      const reflectance = mul(
        pow(float(1.0).sub(theta), 5.0),
        float(1.0).sub(rf0)
      ).add(rf0);
      const scatter = max(0.0, dot(surfaceNormal, eyeDirection)).mul(
        this.waterColor
      );
      const albedo = mix(
        this.sunColor.mul(diffuseLight).mul(0.3).add(scatter),
        mirrorSampler.rgb
          .mul(specularLight)
          .add(mirrorSampler.rgb.mul(0.9))
          .add(vec3(0.1)),
        reflectance
      );

      return albedo;
    });

    // Se actualiza el valor de 'time' en cada frame para animar el agua
    this.onBeforeRender = () => {
      time.value = performance.now() * 0.001;
    };
  }
}

export { Water };
