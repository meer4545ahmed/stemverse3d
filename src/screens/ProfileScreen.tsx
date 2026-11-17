import React from 'react';
import { Award, CheckCircle2, Download, Flame, Globe, User, Zap } from 'lucide-react';
import { ALL_EXPERIMENTS, EXPERIMENTS_BY_SUBJECT, getExperimentById } from '../data';
import { LANGUAGE_LABELS } from '../data/i18n';
import { SUBJECT_LIST } from '../data/subjects';
import { useAppStore } from '../store/useAppStore';
import { LanguageCode } from '../types/stemverse';

export const ProfileScreen: React.FC = () => {
  const {
    student,
    exploredIds,
    completedIds,
    quizScores,
    streakDays,
    language,
    lightweight3D,
    offlineDownloadedIds,
    setLanguage,
    setLightweight3D,
    openExperiment,
  } = useAppStore();

  const totalQuizzes = Object.keys(quizScores).length;
  const achievements = [
    {
      id: 'first-lab',
      title: 'Virtual Pioneer',
      desc: 'Explore your first 3D simulation.',
      unlocked: exploredIds.length >= 1,
    },
    {
      id: 'five-explored',
      title: 'Curious Researcher',
      desc: 'Explore 5 or more interactive laboratories.',
      unlocked: exploredIds.length >= 5,
    },
    {
      id: 'quiz-master',
      title: 'Concept Verified',
      desc: 'Complete 3 Knowledge Check quizzes.',
      unlocked: totalQuizzes >= 3,
    },
    {
      id: 'streak-7',
      title: 'Weekly Scholar',
      desc: 'Maintain a 7-day learning streak.',
      unlocked: streakDays >= 7,
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 pt-6 space-y-8">
      {/* Student Profile Header */}
      <section className="bg-[#11141D] border border-[#222736] rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-[#0B0D13] border border-[#262C3D] flex items-center justify-center text-[#38BDF8] shrink-0">
            <User className="w-8 h-8" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-[#F4F6FA]">{student.name}</h1>
            <p className="text-sm text-[#8B93A7] mt-0.5">
              {student.grade} · {student.school} · Offline Local Profile
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-[#8B93A7]">Streak</p>
            <p className="font-mono-tech tabular-nums text-xl font-bold text-[#F59E0B] inline-flex items-center gap-1.5 mt-0.5">
              <Flame className="w-4 h-4" />
              {streakDays}d
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8B93A7]">Verified</p>
            <p className="font-mono-tech tabular-nums text-xl font-bold text-[#10B981] mt-0.5">
              {completedIds.length}/{ALL_EXPERIMENTS.length}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#8B93A7]">Offline Packs</p>
            <p className="font-mono-tech tabular-nums text-xl font-bold text-[#38BDF8] mt-0.5">
              {offlineDownloadedIds.length}
            </p>
          </div>
        </div>
      </section>

      {/* Accessibility, Language & Low-Data Settings */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#F4F6FA] font-display text-lg font-bold">
            <Globe className="w-5 h-5 text-[#38BDF8]" />
            <h2>Language & Audio Accessibility</h2>
          </div>
          <p className="text-xs text-[#9CA3B5] leading-relaxed">
            Switch interface language and audio explanation locale. Ready for English, Hindi, and Kannada classrooms.
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(['en', 'hi', 'kn'] as LanguageCode[]).map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => setLanguage(code)}
                className={`h-11 rounded-lg border text-xs font-semibold transition-colors ${
                  language === code
                    ? 'bg-[#F4F6FA] text-[#06070B] border-[#F4F6FA]'
                    : 'bg-[#0B0D13] text-[#8B93A7] border-[#222736] hover:border-[#38BDF8] hover:text-[#F4F6FA]'
                }`}
              >
                {LANGUAGE_LABELS[code]}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-[#F4F6FA] font-display text-lg font-bold">
            <Zap className="w-5 h-5 text-[#F59E0B]" />
            <h2>Low-Data & Lightweight 3D Mode</h2>
          </div>
          <p className="text-xs text-[#9CA3B5] leading-relaxed">
            Optimizes pixel ratio and shadow passes for budget smartphones and zero-login offline use.
          </p>
          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-[#E2E8F0] font-medium">
              Lightweight 3D Renderer: {lightweight3D ? 'Enabled' : 'Standard Quality'}
            </span>
            <button
              type="button"
              onClick={() => setLightweight3D(!lightweight3D)}
              className={`h-10 px-4 rounded-lg text-xs font-semibold border transition-colors ${
                lightweight3D
                  ? 'bg-[#10B981] text-[#06070B] border-[#10B981]'
                  : 'bg-[#0B0D13] text-[#F4F6FA] border-[#222736] hover:border-[#38BDF8]'
              }`}
            >
              {lightweight3D ? 'Turn Off' : 'Enable Low-Data'}
            </button>
          </div>
        </div>
      </section>

      {/* Subject Progress & Quiz Scores */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#F4F6FA]">Subject Mastery</h2>
          {SUBJECT_LIST.map((s) => {
            const total = EXPERIMENTS_BY_SUBJECT[s.id].length;
            const done = EXPERIMENTS_BY_SUBJECT[s.id].filter((e) => completedIds.includes(e.id)).length;
            const pct = Math.round((done / total) * 100);
            return (
              <div key={s.id}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#E2E8F0] font-medium">{s.name}</span>
                  <span className="font-mono-tech tabular-nums text-[#8B93A7]">
                    {done}/{total} ({pct}%)
                  </span>
                </div>
                <div className="h-1.5 bg-[#1C212E] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${Math.max(4, pct)}%`, backgroundColor: s.accentHex }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#F4F6FA]">Quiz Scores & Offline Library</h2>
          {Object.entries(quizScores).map(([id, res]) => {
            const exp = getExperimentById(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => openExperiment(id)}
                className="w-full text-left flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-[#0B0D13] border border-[#222736] hover:border-[#38BDF8] transition-colors"
              >
                <span className="text-xs font-medium text-[#E2E8F0] truncate">
                  {exp.code} · {exp.title}
                </span>
                <span className="font-mono-tech tabular-nums text-xs text-[#38BDF8] font-semibold shrink-0">
                  {res.score}/{res.total}
                </span>
              </button>
            );
          })}
          <div className="pt-2 text-xs text-[#8B93A7] flex items-center gap-2">
            <Download className="w-4 h-4 text-[#38BDF8]" />
            <span>{offlineDownloadedIds.length} simulation packs cached locally for offline study.</span>
          </div>
        </div>
      </section>

      {/* Achievements */}
      <section>
        <h2 className="font-display text-xl font-bold text-[#F4F6FA] mb-4">Achievements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={`rounded-xl border p-4 ${
                a.unlocked
                  ? 'bg-[#11141D] border-[#262C3D]'
                  : 'bg-[#0B0D13] border-[#1A1F2C] opacity-55'
              }`}
            >
              <div className="flex items-center justify-between">
                <Award className={`w-5 h-5 ${a.unlocked ? 'text-[#F59E0B]' : 'text-[#475569]'}`} />
                {a.unlocked && <CheckCircle2 className="w-4 h-4 text-[#10B981]" />}
              </div>
              <h3 className="font-display text-base font-bold text-[#F4F6FA] mt-3">{a.title}</h3>
              <p className="text-xs text-[#8B93A7] mt-1">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};
