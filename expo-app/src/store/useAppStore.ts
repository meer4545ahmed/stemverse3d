import { create } from 'zustand';
import { LanguageCode } from '../types/stemverse';

interface QuizResult {
  score: number;
  total: number;
}

interface AppState {
  student: {
    name: string;
    grade: string;
    school: string;
    city: string;
  };
  exploredIds: string[];
  completedIds: string[];
  favoriteIds: string[];
  recentlyViewedIds: string[];
  quizScores: Record<string, QuizResult>;
  streakDays: number;
  dailyChallengeAnswered: boolean;
  language: LanguageCode;
  lightweight3D: boolean;
  offlineDownloadedIds: string[];

  markExplored: (id: string) => void;
  markCompleted: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleOfflinePack: (id: string) => void;
  saveQuizScore: (id: string, score: number, total: number) => void;
  setDailyChallengeAnswered: () => void;
  setLanguage: (lang: LanguageCode) => void;
  setLightweight3D: (enabled: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  student: {
    name: 'Aarav Sharma',
    grade: 'Class 10 · Section A',
    school: 'VIDYAVERSE Model Lab',
    city: 'Bengaluru',
  },
  exploredIds: ['B01', 'B04', 'P04', 'P06', 'C04', 'M02'],
  completedIds: ['P04', 'C04', 'B01'],
  favoriteIds: ['B01', 'B04', 'P04', 'M02'],
  recentlyViewedIds: ['B01', 'B04', 'P04', 'P06'],
  quizScores: {
    P04: { score: 3, total: 3 },
    C04: { score: 2, total: 3 },
    B01: { score: 3, total: 3 },
  },
  streakDays: 7,
  dailyChallengeAnswered: false,
  language: 'en',
  lightweight3D: false,
  offlineDownloadedIds: ['B01', 'B04', 'P04', 'P06'],

  markExplored: (id) =>
    set((state) => ({
      exploredIds: state.exploredIds.includes(id) ? state.exploredIds : [...state.exploredIds, id],
      recentlyViewedIds: [id, ...state.recentlyViewedIds.filter((x) => x !== id)].slice(0, 8),
    })),

  markCompleted: (id) =>
    set((state) => ({
      completedIds: state.completedIds.includes(id) ? state.completedIds : [...state.completedIds, id],
    })),

  toggleFavorite: (id) =>
    set((state) => ({
      favoriteIds: state.favoriteIds.includes(id)
        ? state.favoriteIds.filter((x) => x !== id)
        : [...state.favoriteIds, id],
    })),

  toggleOfflinePack: (id) =>
    set((state) => ({
      offlineDownloadedIds: state.offlineDownloadedIds.includes(id)
        ? state.offlineDownloadedIds.filter((x) => x !== id)
        : [...state.offlineDownloadedIds, id],
    })),

  saveQuizScore: (id, score, total) =>
    set((state) => ({
      quizScores: { ...state.quizScores, [id]: { score, total } },
      completedIds: state.completedIds.includes(id) ? state.completedIds : [...state.completedIds, id],
    })),

  setDailyChallengeAnswered: () => set({ dailyChallengeAnswered: true }),
  setLanguage: (language) => set({ language }),
  setLightweight3D: (lightweight3D) => set({ lightweight3D }),
}));
