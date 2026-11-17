import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookmarkCheck,
  CheckCircle2,
  Download,
  Heart,
  Play,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { getExperimentById } from '../data';
import { SUBJECTS } from '../data/subjects';
import { TRANSLATIONS } from '../data/i18n';
import { useAppStore } from '../store/useAppStore';
import { LabViewerCanvas } from '../viewer/engine/LabViewerCanvas';
import { speakExplanation, stopSpeaking } from '../utils/speech';

export const ExperimentDetailScreen: React.FC = () => {
  const {
    activeExperimentId,
    language,
    favoriteIds,
    completedIds,
    offlineDownloadedIds,
    lightweight3D,
    goBack,
    openLaboratory,
    toggleFavorite,
    toggleOfflinePack,
  } = useAppStore();

  const exp = getExperimentById(activeExperimentId);
  const subject = SUBJECTS[exp.subject];
  const t = TRANSLATIONS[language];
  const isFav = favoriteIds.includes(exp.id);
  const isDone = completedIds.includes(exp.id);
  const isOffline = offlineDownloadedIds.includes(exp.id);
  const [speaking, setSpeaking] = useState(false);
  const [readouts, setReadouts] = useState<{ label: string; value: string; unit?: string }[]>([]);

  const initialParams = useMemo(() => {
    const map: Record<string, number> = {};
    exp.parameters.forEach((p) => {
      map[p.key] = p.defaultValue;
    });
    return map;
  }, [exp]);

  React.useEffect(() => {
    return () => stopSpeaking();
  }, [exp.id]);

  const handleAudioToggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakExplanation(`${exp.title}. ${exp.audioScript}`, language, () => setSpeaking(false));
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-6 space-y-8 overflow-x-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 text-sm text-[#8B93A7] hover:text-[#F4F6FA] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleAudioToggle}
            className="h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg bg-[#11141D] border border-[#222736] text-xs font-medium text-[#E2E8F0] hover:border-[#38BDF8] inline-flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            {speaking ? <VolumeX className="w-4 h-4 text-[#F59E0B]" /> : <Volume2 className="w-4 h-4 text-[#38BDF8]" />}
            <span>{speaking ? t.stopAudio : t.audioGuide}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleOfflinePack(exp.id)}
            className={`h-9 sm:h-10 px-3 sm:px-3.5 rounded-lg border text-xs font-medium inline-flex items-center gap-2 transition-colors whitespace-nowrap ${
              isOffline
                ? 'bg-[#09221A] border-[#10B981] text-[#34D399]'
                : 'bg-[#11141D] border-[#222736] text-[#9CA3B5] hover:text-[#F4F6FA]'
            }`}
          >
            {isOffline ? <BookmarkCheck className="w-4 h-4" /> : <Download className="w-4 h-4" />}
            <span>{isOffline ? t.offlineReady : 'Save Offline'}</span>
          </button>

          <button
            type="button"
            onClick={() => toggleFavorite(exp.id)}
            aria-label="Toggle favourite"
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-lg border flex items-center justify-center transition-colors ${
              isFav ? 'bg-[#1F170A] border-[#F59E0B] text-[#F59E0B]' : 'bg-[#11141D] border-[#222736] text-[#8B93A7]'
            }`}
          >
            <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      {/* Top Split: Live Interactive 3D Preview + Key Overview */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#06070B] border border-[#222736] rounded-2xl overflow-hidden flex flex-col">
          <div className="h-[310px] sm:h-[400px] lg:flex-1 lg:min-h-[420px] w-full relative">
            <LabViewerCanvas
              experimentId={exp.id}
              initialParams={initialParams}
              lightweightMode={lightweight3D}
              showAnnotations={false}
              onReadoutsChange={setReadouts}
            />
          </div>
          <div className="bg-[#0B0D13] border-t border-[#222736] px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-mono-tech text-[#8B93A7]">
              Drag to orbit · Scroll/Pinch to zoom
            </span>
            {readouts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {readouts.map((r) => (
                  <span
                    key={r.label}
                    className="px-2 py-1 rounded bg-[#11141D] border border-[#222736] text-[11px] font-mono-tech text-[#CBD5E1]"
                  >
                    <span className="text-[#8B93A7]">{r.label}:</span>{' '}
                    <span className="text-[#38BDF8] font-semibold">
                      {r.value} {r.unit || ''}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 bg-[#11141D] border border-[#222736] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono-tech text-[#8B93A7]">
              <span style={{ color: subject.accentHex }} className="font-semibold">
                {exp.code}
              </span>{' '}
              · {subject.name} · {exp.category} · {exp.difficulty} · {exp.estimatedMinutes} min
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4F6FA] mt-2 leading-tight">
              {exp.title}
            </h1>
            {isDone && (
              <p className="text-xs font-semibold text-[#34D399] inline-flex items-center gap-1.5 mt-2">
                <CheckCircle2 className="w-4 h-4" />
                Verified & Completed
              </p>
            )}

            <p className="text-sm text-[#9CA3B5] mt-4 leading-relaxed">
              {exp.introduction}
            </p>

            {exp.formula && (
              <div className="mt-4 p-3.5 rounded-lg bg-[#0B0D13] border border-[#222736] font-mono-tech text-xs text-[#38BDF8] font-semibold">
                {exp.formula}
              </div>
            )}

            {exp.isSimulationModel && exp.simulationModelNote && (
              <p className="mt-3 text-xs text-[#64748B] italic">
                Model Note: {exp.simulationModelNote}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => openLaboratory(exp.id)}
            className="mt-6 w-full h-12 rounded-lg bg-[#F4F6FA] hover:bg-white text-[#06070B] font-semibold text-sm inline-flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Full-Screen 3D Laboratory</span>
          </button>
        </div>
      </section>

      {/* Curriculum Details Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6">
          <h2 className="font-display text-lg font-bold text-[#F4F6FA]">Scientific Principle</h2>
          <p className="text-sm text-[#9CA3B5] mt-3 leading-relaxed">
            {exp.scientificPrinciple}
          </p>
          <h3 className="font-display text-sm font-semibold text-[#F4F6FA] mt-5">What You Will Learn</h3>
          <ul className="mt-2.5 space-y-2 text-sm text-[#9CA3B5]">
            {exp.whatYouWillLearn.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#38BDF8] font-bold">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6">
          <h2 className="font-display text-lg font-bold text-[#F4F6FA]">Learning Objectives</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-[#9CA3B5]">
            {exp.learningObjectives.map((obj) => (
              <li key={obj} className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>{obj}</span>
              </li>
            ))}
          </ul>

          <h3 className="font-display text-sm font-semibold text-[#F4F6FA] mt-5">Real-World Applications</h3>
          <ul className="mt-2.5 space-y-2 text-sm text-[#9CA3B5]">
            {exp.realWorldApps.map((app) => (
              <li key={app} className="flex items-start gap-2">
                <span className="text-[#F59E0B] font-bold">·</span>
                <span>{app}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-6">
          <h2 className="font-display text-lg font-bold text-[#F4F6FA]">Step-by-Step Protocol</h2>
          <div className="mt-3 space-y-4">
            {exp.steps.map((st) => (
              <div key={st.step} className="pb-3 border-b border-[#1D2230] last:border-b-0 last:pb-0">
                <p className="text-xs font-mono-tech font-semibold text-[#38BDF8]">STEP 0{st.step}</p>
                <p className="text-sm font-semibold text-[#F4F6FA] mt-0.5">{st.title}</p>
                <p className="text-xs text-[#9CA3B5] mt-1 leading-relaxed">{st.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};
