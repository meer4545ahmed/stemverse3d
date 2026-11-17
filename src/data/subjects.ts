import { SubjectMeta } from '../types/stemverse';

export const HERO_LAB_IMAGE = '/src/assets/images/vidya_hero_bench_1794916464111.jpg';

export const SUBJECTS: Record<'physics' | 'chemistry' | 'biology' | 'mathematics', SubjectMeta> = {
  physics: {
    id: 'physics',
    name: 'Physics Lab',
    shortName: 'Physics',
    tagline: 'Optics, Circuits & Electromagnetism',
    description:
      'Manipulate light rays, lenses, circuits, magnetic fields, and electromagnetic induction on precision 3D laboratory apparatus with live instrument outputs.',
    heroImage: '/src/assets/images/vidya_physics_card_1794916464983.jpg',
    accentHex: '#38BDF8',
    categories: ['All', 'Optics', 'Electricity', 'Electromagnetism'],
    experimentCount: 10,
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry Lab',
    shortName: 'Chemistry',
    tagline: 'Reactions, Molecular Bonds & Electrochemistry',
    description:
      'Observe atomic rearrangements, pH indicator color shifts, ionic electron transfer, electrolysis gases, and carbon structures.',
    heroImage: '/src/assets/images/vidya_chemistry_card_1794916464947.jpg',
    accentHex: '#10B981',
    categories: ['All', 'Reactions', 'Acids & Bases', 'Metals & Bonding', 'Carbon & Surfaces'],
    experimentCount: 10,
  },
  biology: {
    id: 'biology',
    name: 'Biology Lab',
    shortName: 'Biology',
    tagline: 'Human Anatomy, Cells & Life Processes',
    description:
      'Inspect layered anatomical chambers, physiological fluid pathways, plant and animal organelles, and cellular energetics.',
    heroImage: '/src/assets/images/vidya_biology_card_1794916464895.jpg',
    accentHex: '#EF4444',
    categories: ['All', 'Human Physiology', 'Cellular Biology', 'Genetics & Life'],
    experimentCount: 10,
  },
  mathematics: {
    id: 'mathematics',
    name: 'Mathematics Lab',
    shortName: 'Mathematics',
    tagline: 'Spatial Solids, Coordinate Planes & Calculus Foundations',
    description:
      'Unfold 3D solids into 2D nets, manipulate coordinate planes, explore trigonometric ratios, and visualize polynomial curves.',
    heroImage: '/src/assets/images/vidya_math_card_1794916465014.jpg',
    accentHex: '#F59E0B',
    categories: ['All', 'Mensuration & Solids', 'Algebra & Graphs', 'Geometry & Trigonometry', 'Statistics'],
    experimentCount: 10,
  },
};

export const SUBJECT_LIST: SubjectMeta[] = [
  SUBJECTS.physics,
  SUBJECTS.chemistry,
  SUBJECTS.biology,
  SUBJECTS.mathematics,
];
