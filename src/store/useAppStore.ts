import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LanguageCode, ScreenRoute, SubjectId } from '../types/stemverse';

export interface StudentProfile {
  name: string;
  grade: string;
  school: string;
  city: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
}

interface RouteEntry {
  screen: ScreenRoute;
  subjectId: SubjectId;
  experimentId: string;
}

interface AppState {
  screen: ScreenRoute;
  activeSubjectId: SubjectId;
  activeExperimentId: string;
  history: RouteEntry[];

  // Student Progress
  student: StudentProfile;
  exploredIds: string[];
  completedIds: string[];
  favoriteIds: string[];
  recentlyViewedIds: string[];
  quizScores: Record<string, { score: number; total: number }>;
  streakDays: number;
  dailyChallengeAnswered: boolean;

  // Accessibility & Preferences
  language: LanguageCode;
  lightweight3D: boolean;
  offlineDownloadedIds: string[];

  // Navigation Actions
  navigateTo: (screen: ScreenRoute, opts?: { subjectId?: SubjectId; experimentId?: string }) => void;
  goBack: () => void;
  openSubject: (subjectId: SubjectId) => void;
  openExperiment: (experimentId: string) => void;
  openLaboratory: (experimentId: string) => void;

  // Progress Actions
  markExplored: (experimentId: string) => void;
  markCompleted: (experimentId: string) => void;
  toggleFavorite: (experimentId: string) => void;
  saveQuizScore: (experimentId: string, score: number, total: number) => void;
  setDailyChallengeAnswered: () => void;

  // Accessibility Actions
  setLanguage: (lang: LanguageCode) => void;
  setLightweight3D: (enabled: boolean) => void;
  toggleOfflinePack: (experimentId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'splash',
      activeSubjectId: 'physics',
      activeExperimentId: 'P04',
      history: [],

      student: {
        name: 'Aarav Sharma',
        grade: 'Class 10 — Section A',
        school: 'Govt. Model High School',
        city: 'Bengaluru, Karnataka',
      },
      exploredIds: ['P04', 'P06', 'C03', 'B01', 'M02'],
      completedIds: ['P04', 'B01', 'M02'],
      favoriteIds: ['P04', 'B01', 'C08'],
      recentlyViewedIds: ['B01', 'P04', 'C03', 'M02', 'P06'],
      quizScores: {
        P04: { score: 2, total: 2 },
        B01: { score: 2, total: 2 },
        M02: { score: 2, total: 2 },
      },
      streakDays: 7,
      dailyChallengeAnswered: false,

      language: 'en',
      lightweight3D: false,
      offlineDownloadedIds: ['P01', 'P04', 'P06', 'C03', 'C04', 'B01', 'B07', 'M01', 'M02'],

      navigateTo: (screen, opts) => {
        const state = get();
        const nextSubject = opts?.subjectId ?? state.activeSubjectId;
        const nextExperiment = opts?.experimentId ?? state.activeExperimentId;
        const shouldPushHistory = state.screen !== 'splash' && state.screen !== screen;
        const nextHistory = shouldPushHistory
          ? [
              ...state.history.slice(-15),
              {
                screen: state.screen,
                subjectId: state.activeSubjectId,
                experimentId: state.activeExperimentId,
              },
            ]
          : state.history;

        set({
          screen,
          activeSubjectId: nextSubject,
          activeExperimentId: nextExperiment,
          history: nextHistory,
        });
      },

      goBack: () => {
        const state = get();
        if (state.history.length > 0) {
          const prev = state.history[state.history.length - 1];
          set({
            screen: prev.screen,
            activeSubjectId: prev.subjectId,
            activeExperimentId: prev.experimentId,
            history: state.history.slice(0, -1),
          });
        } else {
          set({ screen: 'home' });
        }
      },

      openSubject: (subjectId) => {
        get().navigateTo('subject', { subjectId });
      },

      openExperiment: (experimentId) => {
        const state = get();
        const recent = [experimentId, ...state.recentlyViewedIds.filter((id) => id !== experimentId)].slice(0, 8);
        set({ recentlyViewedIds: recent });
        state.navigateTo('experiment', { experimentId });
      },

      openLaboratory: (experimentId) => {
        const state = get();
        const explored = state.exploredIds.includes(experimentId)
          ? state.exploredIds
          : [...state.exploredIds, experimentId];
        const recent = [experimentId, ...state.recentlyViewedIds.filter((id) => id !== experimentId)].slice(0, 8);
        set({ exploredIds: explored, recentlyViewedIds: recent });
        state.navigateTo('lab', { experimentId });
      },

      markExplored: (experimentId) => {
        const state = get();
        if (!state.exploredIds.includes(experimentId)) {
          set({ exploredIds: [...state.exploredIds, experimentId] });
        }
      },

      markCompleted: (experimentId) => {
        const state = get();
        const completed = state.completedIds.includes(experimentId)
          ? state.completedIds
          : [...state.completedIds, experimentId];
        const explored = state.exploredIds.includes(experimentId)
          ? state.exploredIds
          : [...state.exploredIds, experimentId];
        set({ completedIds: completed, exploredIds: explored });
      },

      toggleFavorite: (experimentId) => {
        const state = get();
        const exists = state.favoriteIds.includes(experimentId);
        set({
          favoriteIds: exists
            ? state.favoriteIds.filter((id) => id !== experimentId)
            : [...state.favoriteIds, experimentId],
        });
      },

      saveQuizScore: (experimentId, score, total) => {
        const state = get();
        const nextScores = { ...state.quizScores, [experimentId]: { score, total } };
        const completed =
          score >= Math.ceil(total / 2) && !state.completedIds.includes(experimentId)
            ? [...state.completedIds, experimentId]
            : state.completedIds;
        set({ quizScores: nextScores, completedIds: completed });
      },

      setDailyChallengeAnswered: () => set({ dailyChallengeAnswered: true }),

      setLanguage: (language) => set({ language }),
      setLightweight3D: (lightweight3D) => set({ lightweight3D }),
      toggleOfflinePack: (experimentId) => {
        const state = get();
        const exists = state.offlineDownloadedIds.includes(experimentId);
        set({
          offlineDownloadedIds: exists
            ? state.offlineDownloadedIds.filter((id) => id !== experimentId)
            : [...state.offlineDownloadedIds, experimentId],
        });
      },
    }),
    {
      name: 'stemverse_state_v1',
      partialize: (state) => ({
        student: state.student,
        exploredIds: state.exploredIds,
        completedIds: state.completedIds,
        favoriteIds: state.favoriteIds,
        recentlyViewedIds: state.recentlyViewedIds,
        quizScores: state.quizScores,
        streakDays: state.streakDays,
        dailyChallengeAnswered: state.dailyChallengeAnswered,
        language: state.language,
        lightweight3D: state.lightweight3D,
        offlineDownloadedIds: state.offlineDownloadedIds,
      }),
    }
  )
);
