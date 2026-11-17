import { PHYSICS_EXPERIMENTS } from './physics';
import { CHEMISTRY_EXPERIMENTS } from './chemistry';
import { BIOLOGY_EXPERIMENTS } from './biology';
import { MATHEMATICS_EXPERIMENTS } from './mathematics';
import { Experiment, SubjectId } from '../types/stemverse';

export const ALL_EXPERIMENTS: Experiment[] = [
  ...PHYSICS_EXPERIMENTS,
  ...CHEMISTRY_EXPERIMENTS,
  ...BIOLOGY_EXPERIMENTS,
  ...MATHEMATICS_EXPERIMENTS,
];

export const EXPERIMENTS_BY_SUBJECT: Record<SubjectId, Experiment[]> = {
  physics: PHYSICS_EXPERIMENTS,
  chemistry: CHEMISTRY_EXPERIMENTS,
  biology: BIOLOGY_EXPERIMENTS,
  mathematics: MATHEMATICS_EXPERIMENTS,
};

export function getExperimentById(id: string): Experiment {
  return ALL_EXPERIMENTS.find((e) => e.id === id) ?? ALL_EXPERIMENTS[0];
}

export function searchExperiments(query: string, subjectFilter?: SubjectId | 'all'): Experiment[] {
  const q = query.trim().toLowerCase();
  return ALL_EXPERIMENTS.filter((exp) => {
    if (subjectFilter && subjectFilter !== 'all' && exp.subject !== subjectFilter) {
      return false;
    }
    if (!q) return true;
    return (
      exp.title.toLowerCase().includes(q) ||
      exp.code.toLowerCase().includes(q) ||
      exp.category.toLowerCase().includes(q) ||
      exp.summary.toLowerCase().includes(q) ||
      exp.subject.toLowerCase().includes(q) ||
      exp.components.some((c) => c.name.toLowerCase().includes(q))
    );
  });
}

export const POPULAR_EXPERIMENT_IDS = ['B01', 'P04', 'C03', 'M02', 'P06', 'B07'];
export const FEATURED_EXPERIMENT_ID = 'B01';

export const DAILY_STEM_CHALLENGE = {
  experimentId: 'P04',
  subject: 'physics' as SubjectId,
  title: 'Daily Prism Optics Challenge',
  question:
    'White light enters an equilateral flint-glass prism. Which visible wavelength slows down the most inside the glass and bends through the largest deviation angle?',
  options: ['Red (700 nm)', 'Green (530 nm)', 'Yellow (580 nm)', 'Violet (400 nm)'],
  correctIndex: 3,
  explanation:
    'Violet light has the shortest visible wavelength (~400 nm), experiences the highest refractive index in glass, and therefore undergoes maximum angular deviation.',
};
