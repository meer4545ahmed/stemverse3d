import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Compass,
  Flame,
  Layers,
  Play,
} from 'lucide-react';
import { HERO_LAB_IMAGE, SUBJECT_LIST, SUBJECTS } from '../data/subjects';
import {
  ALL_EXPERIMENTS,
  DAILY_STEM_CHALLENGE,
  EXPERIMENTS_BY_SUBJECT,
  FEATURED_EXPERIMENT_ID,
  POPULAR_EXPERIMENT_IDS,
  getExperimentById,
} from '../data';
import { TRANSLATIONS } from '../data/i18n';
import { useAppStore } from '../store/useAppStore';
import { ExperimentCard } from '../components/ExperimentCard';

export const HomeScreen: React.FC = () => {
  const {
    student,
    exploredIds,
    completedIds,
    recentlyViewedIds,
    streakDays,
    dailyChallengeAnswered,
    language,
    openSubject,
    openExperiment,
    openLaboratory,
    setDailyChallengeAnswered,
  } = useAppStore();

  const t = TRANSLATIONS[language];
  const [challengePick, setChallengePick] = useState<number | null>(
    dailyChallengeAnswered ? DAILY_STEM_CHALLENGE.correctIndex : null
  );

  const featuredExp = getExperimentById(FEATURED_EXPERIMENT_ID);
  const continueExp = getExperimentById(recentlyViewedIds[0] ?? 'B01');
  const popularExps = POPULAR_EXPERIMENT_IDS.map((id) => getExperimentById(id));
  const recentExps = recentlyViewedIds.slice(0, 3).map((id) => getExperimentById(id));

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-6 space-y-12">
      {/* Dark-Studio Precision Hero Showcase */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-[#11141D] border border-[#222736] rounded-2xl overflow-hidden">
        <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono-tech text-[#38BDF8] tracking-wide">
              {student.name} · {student.grade} · Local Workstation
            </p>
            <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-[#F4F6FA] mt-3 leading-[1.08] [text-wrap:balance]">
              {t.heroTitle}
            </h1>
            <p className="text-sm sm:text-base text-[#9CA3B5] mt-4 max-w-xl leading-relaxed">
              {t.heroSubtitle}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => openLaboratory(FEATURED_EXPERIMENT_ID)}
              className="h-12 px-5 rounded-lg bg-[#F4F6FA] hover:bg-white text-[#06070B] font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.exploreFeatured}</span>
            </button>
            <button
              type="button"
              onClick={() => openExperiment(continueExp.id)}
              className="h-12 px-5 rounded-lg bg-[#171B26] hover:bg-[#1E2433] text-[#F4F6FA] border border-[#262C3D] font-medium text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <span>
                {t.continueExploring}: {continueExp.code}
              </span>
              <ArrowRight className="w-4 h-4 text-[#38BDF8]" />
            </button>
          </div>
        </div>

        <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-full bg-[#090B10]">
          <img
            src={HERO_LAB_IMAGE}
            alt="VidyaVerse Optical & Electronics Precision Workbench"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11141D] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#11141D] lg:via-[#11141D]/20 lg:to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-center justify-between text-xs font-mono-tech text-[#CBD5E1] bg-[#0B0D13]/90 px-3.5 py-2 rounded-lg border border-[#222736] w-fit">
            <span>40 Live 3D Apparatus · Physics · Chemistry · Biology · Math</span>
          </div>
        </div>
      </section>

      {/* Four Subject Labs */}
      <section>
        <div className="flex items-end justify-between gap-4 mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#F4F6FA]">{t.subjectLabs}</h2>
            <p className="text-sm text-[#8B93A7] mt-1">
              Select a laboratory bench to manipulate physical instruments and inspect live readouts.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {SUBJECT_LIST.map((subj) => {
            const total = EXPERIMENTS_BY_SUBJECT[subj.id].length;
            const done = EXPERIMENTS_BY_SUBJECT[subj.id].filter((e) =>
              completedIds.includes(e.id)
            ).length;
            return (
              <button
                key={subj.id}
                type="button"
                onClick={() => openSubject(subj.id)}
                className="group text-left bg-[#11141D] border border-[#222736] rounded-xl overflow-hidden hover:border-[#3A435C] transition-colors flex flex-col"
              >
                <div className="aspect-[4/3] w-full bg-[#090B10] relative overflow-hidden">
                  <img
                    src={subj.heroImage}
                    alt={subj.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#11141D] via-transparent to-transparent" />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between w-full">
                  <div>
                    <p className="text-xs text-[#8B93A7] font-mono-tech tabular-nums">
                      <span style={{ color: subj.accentHex }} className="font-semibold">
                        {total} LABS
                      </span>{' '}
                      · {done} VERIFIED
                    </p>
                    <h3 className="font-display text-xl font-bold text-[#F4F6FA] mt-1.5">
                      {subj.name}
                    </h3>
                    <p className="text-xs text-[#9CA3B5] mt-1.5 leading-relaxed">
                      {subj.tagline}
                    </p>
                  </div>
                  <div
                    className="mt-4 pt-3 border-t border-[#1D2230] flex items-center justify-between text-xs font-semibold"
                    style={{ color: subj.accentHex }}
                  >
                    <span>Open {subj.shortName}</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Learning Journey & Daily STEM Challenge + Featured 3D */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Learning Journey */}
        <div className="lg:col-span-5 bg-[#11141D] border border-[#222736] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-[#F4F6FA]">{t.learningJourney}</h2>
              <span className="font-mono-tech text-xs text-[#F59E0B] font-semibold inline-flex items-center gap-1.5">
                <Flame className="w-4 h-4" />
                {streakDays}d streak
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-5 pb-5 border-b border-[#1D2230]">
              <div>
                <p className="text-xs text-[#8B93A7]">Explored</p>
                <p className="font-mono-tech tabular-nums text-2xl font-bold text-[#F4F6FA] mt-0.5">
                  {exploredIds.length}/{ALL_EXPERIMENTS.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B93A7]">Verified</p>
                <p className="font-mono-tech tabular-nums text-2xl font-bold text-[#10B981] mt-0.5">
                  {completedIds.length}
                </p>
              </div>
              <div>
                <p className="text-xs text-[#8B93A7]">Mastery</p>
                <p className="font-mono-tech tabular-nums text-2xl font-bold text-[#38BDF8] mt-0.5">
                  {Math.round((completedIds.length / ALL_EXPERIMENTS.length) * 100)}%
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3.5">
              {SUBJECT_LIST.map((s) => {
                const exps = EXPERIMENTS_BY_SUBJECT[s.id];
                const done = exps.filter((e) => completedIds.includes(e.id)).length;
                const pct = Math.round((done / exps.length) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-[#E2E8F0] font-medium">{s.name}</span>
                      <span className="font-mono-tech tabular-nums text-[#8B93A7]">
                        {done}/{exps.length} ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#1C212E] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, pct)}%`, backgroundColor: s.accentHex }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => openExperiment(continueExp.id)}
            className="mt-6 w-full h-11 rounded-lg bg-[#171B26] hover:bg-[#1E2433] border border-[#262C3D] text-sm font-medium text-[#F4F6FA] flex items-center justify-between px-4 transition-colors"
          >
            <span className="inline-flex items-center gap-2 truncate">
              <Compass className="w-4 h-4 text-[#38BDF8] shrink-0" />
              <span className="truncate">Resume {continueExp.title}</span>
            </span>
            <ArrowRight className="w-4 h-4 text-[#8B93A7] shrink-0" />
          </button>
        </div>

        {/* Daily STEM Challenge */}
        <div className="lg:col-span-4 bg-[#11141D] border border-[#222736] rounded-xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono-tech font-semibold text-[#F59E0B] flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              <span>
                {t.dailyChallenge} · {DAILY_STEM_CHALLENGE.experimentId}
              </span>
            </p>
            <h3 className="font-display text-lg font-bold text-[#F4F6FA] mt-2">
              {DAILY_STEM_CHALLENGE.title}
            </h3>
            <p className="text-sm text-[#9CA3B5] mt-2 leading-relaxed">
              {DAILY_STEM_CHALLENGE.question}
            </p>

            <div className="mt-4 space-y-2">
              {DAILY_STEM_CHALLENGE.options.map((opt, idx) => {
                const picked = challengePick === idx;
                const isCorrect = idx === DAILY_STEM_CHALLENGE.correctIndex;
                let style =
                  'bg-[#0B0D13] border-[#222736] text-[#CBD5E1] hover:border-[#38BDF8]';
                if (challengePick !== null) {
                  if (isCorrect)
                    style = 'bg-[#09221A] border-[#10B981] text-[#D1FAE5] font-semibold';
                  else if (picked) style = 'bg-[#280D12] border-[#EF4444] text-[#FEE2E2]';
                }
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => {
                      setChallengePick(idx);
                      setDailyChallengeAnswered();
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors flex items-center justify-between ${style}`}
                  >
                    <span>{opt}</span>
                    {challengePick !== null && isCorrect && (
                      <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {challengePick !== null && (
              <p className="text-xs text-[#9CA3B5] mt-3 leading-relaxed">
                {DAILY_STEM_CHALLENGE.explanation}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => openLaboratory(DAILY_STEM_CHALLENGE.experimentId)}
            className="mt-5 h-10 px-4 rounded-lg bg-[#171B26] hover:bg-[#1E2433] border border-[#262C3D] text-xs font-semibold text-[#F4F6FA] inline-flex items-center justify-center gap-2 transition-colors"
          >
            <span>Verify in 3D Prism Lab</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8]" />
          </button>
        </div>

        {/* Featured 3D Experience */}
        <div className="lg:col-span-3 bg-[#11141D] border border-[#222736] rounded-xl overflow-hidden flex flex-col justify-between">
          <div>
            <div className="aspect-[4/3] w-full bg-[#090B10] relative">
              <img
                src={SUBJECTS[featuredExp.subject].heroImage}
                alt={featuredExp.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#11141D] via-transparent to-transparent" />
            </div>
            <div className="p-5">
              <p className="text-xs text-[#38BDF8] font-mono-tech font-semibold inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                <span>{t.featuredExperience}</span>
              </p>
              <h3 className="font-display text-xl font-bold text-[#F4F6FA] mt-1.5">
                {featuredExp.title}
              </h3>
              <p className="text-xs text-[#9CA3B5] mt-2 leading-relaxed">
                {featuredExp.summary}
              </p>
            </div>
          </div>

          <div className="p-5 pt-0">
            <button
              type="button"
              onClick={() => openLaboratory(featuredExp.id)}
              className="w-full h-11 rounded-lg bg-[#F4F6FA] hover:bg-white text-[#06070B] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{t.openLab}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Popular Experiments */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-display text-2xl font-bold text-[#F4F6FA]">{t.popularExperiments}</h2>
            <p className="text-sm text-[#8B93A7] mt-1">
              Calibrated 3D instruments with live visual outputs and measurements.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {popularExps.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </div>
      </section>

      {/* Recently Viewed */}
      {recentExps.length > 0 && (
        <section>
          <h2 className="font-display text-xl font-bold text-[#F4F6FA] mb-4">{t.recentlyViewed}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentExps.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} compact />
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
