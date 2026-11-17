import * as THREE from 'three';
import { TelemetryReadout } from '../../types/stemverse';

export interface RegisteredComponent {
  meshKey: string;
  label: string;
  object: THREE.Object3D;
  basePosition: THREE.Vector3;
  explodeOffset: THREE.Vector3;
  labelAnchorLocal: THREE.Vector3;
  meshes: THREE.Mesh[];
}

export interface LabSceneContext {
  scene: THREE.Scene;
  isSoftwareGl: boolean;
  isLightweight: boolean;
  maxAnisotropy: number;
  registerComponent: (
    object: THREE.Object3D,
    meshKey: string,
    label: string,
    explodeOffset?: THREE.Vector3,
    labelAnchorLocal?: THREE.Vector3
  ) => void;
}

export interface ActiveLabScene {
  root: THREE.Group;
  defaultCameraPos: [number, number, number];
  defaultTarget: [number, number, number];
  update: (dt: number, elapsed: number, params: Record<string, number>, playing: boolean) => void;
  updateParams: (params: Record<string, number>) => void;
  getReadouts: (params: Record<string, number>) => TelemetryReadout[];
  dispose?: () => void;
}
