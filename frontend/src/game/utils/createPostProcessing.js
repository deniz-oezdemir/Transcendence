import { PostProcessing } from 'three';
import { pass, mrt, output, float } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

export default function createPostProcessing(
  renderer,
  scene,
  camera,
  bloomParams
) {
  const scenePass = pass(scene, camera);
  scenePass.setMRT(
    mrt({
      output,
      bloomIntensity: float(0), // default bloom intensity
    })
  );
  const outputPass = scenePass.getTextureNode();
  const bloomIntensityPass = scenePass.getTextureNode('bloomIntensity');
  const bloomPass = bloom(outputPass.mul(bloomIntensityPass));
  const { threshold, strength, radius } = bloomParams;
  bloomPass.threshold.value = threshold;
  bloomPass.strength.value = strength;
  bloomPass.radius.value = radius;

  const postProcessing = new PostProcessing(renderer);
  postProcessing.outputColorTransform = false;
  postProcessing.outputNode = outputPass.add(bloomPass).renderOutput();

  return postProcessing;
}
