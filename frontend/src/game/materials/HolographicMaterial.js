// Importamos funciones y clases de TSL y Three.js
import {
  uniform,
  float,
  sin,
  cos,
  fract,
  clamp,
  mix,
  uv,
  vec2,
  vec3,
  vec4,
  add,
  sub,
  mul,
  div,
  smoothstep,
  max,
  texture,
} from 'three/tsl';
import { AdditiveBlending, FrontSide } from 'three';
import { Clock, Color, MeshBasicNodeMaterial, Texture } from 'three';

/**
 * HolographicMaterial base in TSL for WebGPU.
 *
 * Parámetros por defecto:
 *  - time: 0.0
 *  - fresnelOpacity: 1.0
 *  - fresnelAmount: 0.45
 *  - scanlineSize: 8.0
 *  - hologramBrightness: 1.0
 *  - signalSpeed: 1.0
 *  - hologramOpacity: 1.0
 *  - enableBlinking: true
 *  - blinkFresnelOnly: true
 *  - hologramColor: new Color('#00d5ff')
 *  - blendMode: AdditiveBlending
 *  - side: FrontSide
 */
export default class HolographicMaterial extends MeshBasicNodeMaterial {
  constructor(parameters = {}) {
    super();

    // Booleans are not supported in TSL, so we use 0.0 for false and 1.0 for true
    this.timeNode = uniform(
      parameters.time !== undefined ? parameters.time : 0.0
    );
    this.fresnelOpacityNode = uniform(
      parameters.fresnelOpacity !== undefined ? parameters.fresnelOpacity : 1.0
    );
    this.fresnelAmountNode = uniform(
      parameters.fresnelAmount !== undefined ? parameters.fresnelAmount : 0.45
    );
    this.scanlineSizeNode = uniform(
      parameters.scanlineSize !== undefined ? parameters.scanlineSize : 8.0
    );
    this.hologramBrightnessNode = uniform(
      parameters.hologramBrightness !== undefined
        ? parameters.hologramBrightness
        : 1.0
    );
    this.signalSpeedNode = uniform(
      parameters.signalSpeed !== undefined ? parameters.signalSpeed : 1.0
    );
    this.hologramOpacityNode = uniform(
      parameters.hologramOpacity !== undefined
        ? parameters.hologramOpacity
        : 1.0
    );
    this.enableBlinkingNode = uniform(
      parameters.enableBlinking !== undefined
        ? parameters.enableBlinking
          ? 1.0
          : 0.0
        : 1.0
    );
    this.blinkFresnelOnlyNode = uniform(
      parameters.blinkFresnelOnly !== undefined
        ? parameters.blinkFresnelOnly
          ? 1.0
          : 0.0
        : 1.0
    );
    this.hologramColorNode = uniform(
      parameters.hologramColor !== undefined
        ? parameters.hologramColor
        : new Color('#00d5ff')
    );
    this.useMapNode = uniform(parameters.useMap ? 1.0 : 0.0);
    this.mapValue = parameters.map instanceof Texture ? parameters.map : null;

    /**/
    // Coordinates for the fragment shader
    const uvNode = uv(); // vec2

    let texColor = vec4(float(1.0));
    if (this.mapValue) {
      texColor = texture(this.mapValue, uvNode);
    }

    // Base color for the hologram
    // We mix the hologram color with the brightness based on the UV Y coordinate
    const baseAlpha = mix(this.hologramBrightnessNode, uvNode.y, float(0.5));
    const baseColor = vec4(this.hologramColorNode, baseAlpha);

    // Scanlines effect
    // We use a sin wave to create the scanlines effect based on the time and UV Y coordinate
    const timeFactor = mul(
      this.timeNode,
      mul(this.signalSpeedNode, float(20.8))
    );
    const uvFactor = mul(uvNode.y, mul(float(60.0), this.scanlineSizeNode));
    const sinTerm = sin(sub(timeFactor, uvFactor));
    const scanlinesRaw = add(float(10.0), mul(float(20.0), sinTerm));
    // Smoothstep to adjust the scanlines effect
    const smoothVal = smoothstep(
      float(0.78),
      float(0.9),
      mul(
        float(1.3),
        cos(
          add(
            mul(this.timeNode, this.signalSpeedNode),
            mul(uvNode.y, this.scanlineSizeNode)
          )
        )
      )
    );
    const scanlinesAdjusted = mul(scanlinesRaw, smoothVal);
    // We use a sin wave to create the scanlines effect based on the time and UV Y coordinate
    const timeSin = sin(mul(this.timeNode, this.signalSpeedNode));
    const maxFactor = max(float(0.25), timeSin);
    const scanlinesFinal = mul(scanlinesAdjusted, maxFactor);

    // Rondom simple function: fract(cos(uv.x + uv.y) * 43758.5453)
    const randomValue = fract(
      mul(cos(add(uvNode.x, uvNode.y)), float(43758.5453))
    );
    // We use the random value to create the scanline offset
    const scanlineOffset = div(
      vec4(randomValue, randomValue, randomValue, float(1.0)),
      float(84.0)
    );
    const colorWithScanlines = add(
      baseColor,
      mul(scanlineOffset, scanlinesFinal)
    );
    // We mix the base color with the scanlines effect based on the UV X coordinate
    const scanlineMix = mix(
      vec4(float(0.0)),
      colorWithScanlines,
      colorWithScanlines.a
    );

    // Fresnel effect (simplify)
    // TSL doesn't offer a transformed viewDirection or normal node,
    // so we simulate the fresnel with a constant value based on fresnelAmount.
    const fresnelEffect = clamp(
      sub(this.fresnelAmountNode, float(0.3)),
      float(0.0),
      this.fresnelOpacityNode
    );
    // Flicker effect
    // blinkValue = enableBlinking ? (0.6 - signalSpeed) : 1.0
    const blinkValue = mix(
      float(1.0),
      sub(float(0.6), this.signalSpeedNode),
      this.enableBlinkingNode
    );
    // flickerValue = clamp(fract(cos(time * signalSpeed * 0.02) * 43758.5453123), blinkValue, 1.0)
    const flickerValue = clamp(
      fract(
        mul(
          cos(mul(this.timeNode, mul(this.signalSpeedNode, float(0.02)))),
          float(43758.5453123)
        )
      ),
      blinkValue,
      float(1.0)
    );

    // Final Composition
    // If blinkFresnelOnly is true, finalColor = scanlineMix.rgb + fresnelEffect * flickerValue;
    // If not, finalColor = scanlineMix.rgb * flickerValue + fresnelEffect.
    const finalRGB = mix(
      add(scanlineMix.rgb, mul(fresnelEffect, flickerValue)),
      add(mul(scanlineMix.rgb, flickerValue), fresnelEffect),
      this.blinkFresnelOnlyNode
    );
    let finalColor = vec4(finalRGB, this.hologramOpacityNode);

    // If we have a texture, we mix the final color with the texture color
    // If not, we just use the final color
    finalColor = mix(finalColor, mul(finalColor, texColor), this.useMapNode);
    this.colorNode = finalColor;

    // Material configuration
    this.blending =
      parameters.blendMode !== undefined
        ? parameters.blendMode
        : AdditiveBlending;
    this.transparent = true;
    this.side = parameters.side !== undefined ? parameters.side : FrontSide;

    // We add the time node to the uniforms
    this._clock = new Clock();
  }

  update() {
    // Update the time node with the elapsed time
    this.timeNode.value = this._clock.getElapsedTime();
  }
}
