import { buildPhysicsScene } from './physicsScenes';
import { buildChemistryScene } from './chemistryScenes';
import { buildBiologyScene } from './biologyScenes';
import { buildMathematicsScene } from './mathematicsScenes';
import { ActiveLabScene, LabSceneContext } from './sceneTypes';

export function buildExperimentScene(experimentId: string, ctx: LabSceneContext): ActiveLabScene {
  const prefix = experimentId.charAt(0).toUpperCase();
  if (prefix === 'P') return buildPhysicsScene(experimentId, ctx);
  if (prefix === 'C') return buildChemistryScene(experimentId, ctx);
  if (prefix === 'B') return buildBiologyScene(experimentId, ctx);
  return buildMathematicsScene(experimentId, ctx);
}
