export type SubjectId = 'physics' | 'chemistry' | 'biology' | 'mathematics';

export type LanguageCode = 'en' | 'hi' | 'kn';

export type DifficultyLevel = 'Foundation' | 'Intermediate' | 'Advanced';

export type ScreenRoute =
  | 'splash'
  | 'home'
  | 'subject'
  | 'experiment'
  | 'lab'
  | 'search'
  | 'profile';

export interface ExperimentComponentInfo {
  id: string;
  name: string;
  description: string;
  functionText: string;
  importance: string;
  meshKey: string;
  colorSwatch?: string;
}

export interface ExperimentParameter {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit: string;
}

export interface ExperimentStep {
  step: number;
  title: string;
  instruction: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface Experiment {
  id: string;
  code: string;
  subject: SubjectId;
  title: string;
  category: string;
  difficulty: DifficultyLevel;
  estimatedMinutes: number;
  summary: string;
  introduction: string;
  scientificPrinciple: string;
  formula?: string;
  learningObjectives: string[];
  whatYouWillLearn: string[];
  steps: ExperimentStep[];
  realWorldApps: string[];
  components: ExperimentComponentInfo[];
  parameters: ExperimentParameter[];
  quiz: QuizQuestion[];
  hasExplodedView: boolean;
  isSimulationModel?: boolean;
  simulationModelNote?: string;
  audioScript: string;
  cameraPresets?: {
    id: string;
    label: string;
    position: [number, number, number];
    target: [number, number, number];
  }[];
}

export interface SubjectMeta {
  id: SubjectId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  heroImage: string;
  accentHex: string;
  categories: string[];
  experimentCount: number;
}

export interface Annotation2D {
  id: string;
  label: string;
  x: number;
  y: number;
  visible: boolean;
  selected: boolean;
}

export interface TelemetryReadout {
  label: string;
  value: string;
  unit?: string;
}

export type BridgeCommandToViewer =
  | { type: 'LOAD_EXPERIMENT'; experimentId: string; params: Record<string, number> }
  | { type: 'SET_PARAM'; key: string; value: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'RESET_SIM' }
  | { type: 'SET_EXPLODED'; amount: number }
  | { type: 'TOGGLE_ANNOTATIONS'; visible: boolean }
  | { type: 'SET_COMPONENT_VISIBILITY'; meshKey: string; visible: boolean }
  | { type: 'SELECT_COMPONENT'; meshKey: string | null }
  | { type: 'RESET_CAMERA' }
  | { type: 'SET_CAMERA_PRESET'; position: [number, number, number]; target: [number, number, number] }
  | { type: 'SET_LIGHTWEIGHT_MODE'; enabled: boolean };

export type BridgeEventFromViewer =
  | { type: 'VIEWER_READY'; isSoftwareGl: boolean }
  | { type: 'COMPONENT_SELECTED'; meshKey: string | null }
  | { type: 'ANNOTATIONS_UPDATED'; annotations: Annotation2D[] }
  | { type: 'TELEMETRY_UPDATED'; readouts: TelemetryReadout[] };
