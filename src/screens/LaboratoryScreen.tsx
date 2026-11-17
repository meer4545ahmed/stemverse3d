import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Tag,
  Volume2,
  VolumeX,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { getExperimentById } from '../data';
import { TRANSLATIONS } from '../data/i18n';
import { useAppStore } from '../store/useAppStore';
import { TelemetryReadout } from '../types/stemverse';
import { LabViewerCanvas, LabViewerHandle } from '../viewer/engine/LabViewerCanvas';
import { LiveExperimentChart } from '../components/LiveExperimentChart';
import { speakExplanation, stopSpeaking } from '../utils/speech';

export const LaboratoryScreen: React.FC = () => {
  const {
    activeExperimentId,
    language,
    lightweight3D,
    goBack,
    setLightweight3D,
    saveQuizScore,
    markCompleted,
    completedIds,
  } = useAppStore();

  const exp = getExperimentById(activeExperimentId);
  const t = TRANSLATIONS[language];
  const viewerRef = useRef<LabViewerHandle | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const initialParams = useMemo(() => {
    const map: Record<string, number> = {};
    exp.parameters.forEach((p) => {
      map[p.key] = p.defaultValue;
    });
    return map;
  }, [exp]);

  const [params, setParams] = useState<Record<string, number>>(initialParams);
  const [playing, setPlaying] = useState(true);
  const [exploded, setExploded] = useState(0);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [selectedMeshKey, setSelectedMeshKey] = useState<string | null>(null);
  const [hiddenComponents, setHiddenComponents] = useState<Record<string, boolean>>({});
  const [readouts, setReadouts] = useState<TelemetryReadout[]>([]);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<'component' | 'guide' | 'quiz'>('component');
  const [speaking, setSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizCorrectCount, setQuizCorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    setParams(initialParams);
    setPlaying(true);
    setExploded(0);
    setSelectedMeshKey(null);
    setHiddenComponents({});
    setQuizIndex(0);
    setSelectedOption(null);
    setQuizCorrectCount(0);
    setQuizFinished(false);
    return () => stopSpeaking();
  }, [exp.id, initialParams]);

  const selectedComponent = useMemo(
    () => exp.components.find((c) => c.meshKey === selectedMeshKey) ?? exp.components[0],
    [exp.components, selectedMeshKey]
  );

  const handleParamChange = (key: string, value: number) => {
    setParams((prev) => ({ ...prev, [key]: value }));
    viewerRef.current?.sendCommand({ type: 'SET_PARAM', key, value });
  };

  const handleTogglePlay = () => {
    const next = !playing;
    setPlaying(next);
    viewerRef.current?.sendCommand({ type: 'SET_PLAYING', playing: next });
  };

  const handleResetSim = () => {
    setParams(initialParams);
    setExploded(0);
    setPlaying(true);
    setHiddenComponents({});
    viewerRef.current?.sendCommand({ type: 'LOAD_EXPERIMENT', experimentId: exp.id, params: initialParams });
  };

  const handleExplodedChange = (val: number) => {
    setExploded(val);
    viewerRef.current?.sendCommand({ type: 'SET_EXPLODED', amount: val });
  };

  const handleSelectComponent = (meshKey: string | null) => {
    setSelectedMeshKey(meshKey);
    if (meshKey) {
      setDrawerTab('component');
      setDrawerOpen(true);
    }
  };

  const handleToggleComponentVis = (meshKey: string) => {
    const currentlyHidden = !!hiddenComponents[meshKey];
    const nextVisible = currentlyHidden;
    setHiddenComponents((prev) => ({ ...prev, [meshKey]: !nextVisible }));
    viewerRef.current?.sendCommand({
      type: 'SET_COMPONENT_VISIBILITY',
      meshKey,
      visible: nextVisible,
    });
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement && containerRef.current) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else if (document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      setIsFullscreen((v) => !v);
    }
  };

  const handleAudioToggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      speakExplanation(exp.audioScript, language, () => setSpeaking(false));
    }
  };

  const currentQ = exp.quiz[quizIndex];
  const handleAnswerQuiz = (idx: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(idx);
    if (idx === currentQ.correctIndex) {
      setQuizCorrectCount((c) => c + 1);
    }
  };

  const handleNextQuiz = () => {
    const finalCorrect = quizCorrectCount;
    if (quizIndex + 1 < exp.quiz.length) {
      setQuizIndex((i) => i + 1);
      setSelectedOption(null);
    } else {
      setQuizFinished(true);
      saveQuizScore(exp.id, finalCorrect, exp.quiz.length);
    }
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-[100dvh] flex flex-col bg-[#06070B] overflow-hidden select-none"
    >
      {/* 1. Compact Top Laboratory HUD Bar (does NOT overlap 3D canvas) */}
      <header className="shrink-0 z-20 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-[#0B0D13] border-b border-[#222736]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <button
            type="button"
            onClick={goBack}
            aria-label="Exit 3D laboratory"
            className="w-8 h-8 rounded-lg bg-[#171B26] hover:bg-[#1E2433] text-[#F4F6FA] flex items-center justify-center shrink-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <p className="text-[10px] sm:text-[11px] font-mono-tech font-semibold text-[#38BDF8] leading-none">
              {exp.code} · {exp.category}
            </p>
            <h1 className="font-display text-sm sm:text-base font-bold text-[#F4F6FA] truncate mt-0.5">
              {exp.title}
            </h1>
          </div>
        </div>

        {/* Quick Viewport Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setShowAnnotations((v) => !v)}
            title={t.annotations}
            className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap border ${
              showAnnotations
                ? 'bg-[#38BDF8] text-[#06070B] border-[#38BDF8] font-semibold'
                : 'bg-[#11141D] text-[#8B93A7] border-[#222736] hover:text-[#F4F6FA]'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.annotations}</span>
          </button>

          <button
            type="button"
            onClick={() => setLightweight3D(!lightweight3D)}
            title={t.lightweightMode}
            className={`h-8 px-2 sm:px-2.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap border ${
              lightweight3D
                ? 'bg-[#10B981]/20 text-[#34D399] border-[#10B981]/40'
                : 'bg-[#11141D] text-[#8B93A7] border-[#222736] hover:text-[#F4F6FA]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{t.lightweightMode}</span>
          </button>

          <button
            type="button"
            onClick={handleAudioToggle}
            title={t.audioGuide}
            className={`h-8 w-8 rounded-lg border flex items-center justify-center transition-colors ${
              speaking
                ? 'bg-[#F59E0B] text-[#06070B] border-[#F59E0B]'
                : 'bg-[#11141D] text-[#8B93A7] border-[#222736] hover:text-[#F4F6FA]'
            }`}
          >
            {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => viewerRef.current?.sendCommand({ type: 'RESET_CAMERA' })}
            title={t.resetCamera}
            className="h-8 px-2 sm:px-2.5 rounded-lg bg-[#11141D] border border-[#222736] text-xs font-medium text-[#8B93A7] hover:text-[#F4F6FA] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.resetCamera}</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullscreen}
            aria-label="Toggle fullscreen"
            className="hidden sm:flex h-8 w-8 rounded-lg bg-[#11141D] border border-[#222736] text-[#8B93A7] hover:text-[#F4F6FA] items-center justify-center transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerTab('guide');
              setDrawerOpen((v) => !v);
            }}
            className="h-8 px-2.5 sm:px-3 rounded-lg bg-[#F4F6FA] hover:bg-white text-[#06070B] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden xs:inline sm:inline">Guide & Quiz</span>
            <span className="xs:hidden sm:hidden">Guide</span>
          </button>
        </div>
      </header>

      {/* 2. Always-Visible Live Telemetry Output Strip (Visible on BOTH Phone & Desktop!) */}
      {readouts.length > 0 && (
        <div className="shrink-0 bg-[#090B10] border-b border-[#1D2230] px-3 py-1.5 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          <span className="text-[10px] font-mono-tech uppercase tracking-wider text-[#10B981] font-semibold shrink-0 pr-1 border-r border-[#222736]">
            Live Output
          </span>
          {readouts.map((r) => (
            <div
              key={r.label}
              className="shrink-0 flex items-baseline gap-1.5 bg-[#11141D] border border-[#222736] rounded-md px-2.5 py-1"
            >
              <span className="text-[10px] text-[#8B93A7] uppercase tracking-wider whitespace-nowrap">
                {r.label}:
              </span>
              <span className="font-mono-tech tabular-nums text-xs sm:text-sm font-bold text-[#F4F6FA] whitespace-nowrap">
                {r.value}
                {r.unit ? <span className="text-[11px] text-[#38BDF8] ml-1">{r.unit}</span> : null}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 3. Unobstructed Dedicated 3D Viewport (Zero Controls Covering the Model!) */}
      <div className="relative flex-1 min-h-[220px] w-full bg-[#06070B] overflow-hidden">
        <LabViewerCanvas
          ref={viewerRef}
          experimentId={exp.id}
          initialParams={initialParams}
          lightweightMode={lightweight3D}
          showAnnotations={showAnnotations}
          selectedMeshKey={selectedMeshKey}
          onSelectComponent={handleSelectComponent}
          onReadoutsChange={setReadouts}
          className="w-full h-full"
        />

        {/* Educational Inspector, Guide & Quiz Drawer */}
        {drawerOpen && (
          <aside className="absolute inset-2 sm:inset-auto sm:top-3 sm:right-3 sm:bottom-3 z-30 sm:w-[410px] bg-[#0E1118] border border-[#222736] rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#1D2230] bg-[#0B0D13]">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setDrawerTab('component')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    drawerTab === 'component' ? 'bg-[#F4F6FA] text-[#06070B]' : 'text-[#8B93A7] hover:text-[#F4F6FA]'
                  }`}
                >
                  {t.inspectorTab}
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('guide')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    drawerTab === 'guide' ? 'bg-[#F4F6FA] text-[#06070B]' : 'text-[#8B93A7] hover:text-[#F4F6FA]'
                  }`}
                >
                  {t.guideTab}
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('quiz')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 ${
                    drawerTab === 'quiz' ? 'bg-[#38BDF8] text-[#06070B]' : 'text-[#8B93A7] hover:text-[#F4F6FA]'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{t.quizTab}</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close educational drawer"
                className="w-8 h-8 rounded-lg text-[#8B93A7] hover:text-[#F4F6FA] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
            {drawerTab === 'component' && selectedComponent && (
              <>
                <div>
                  <p className="text-xs font-mono-tech font-semibold text-[#38BDF8]">SELECTED COMPONENT</p>
                  <h2 className="font-display text-xl font-bold text-[#F4F6FA] mt-1">
                    {selectedComponent.name}
                  </h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="bg-[#11141D] border border-[#222736] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#8B93A7]">Description</p>
                    <p className="text-[#F4F6FA] mt-1 leading-relaxed">{selectedComponent.description}</p>
                  </div>

                  <div className="bg-[#11141D] border border-[#222736] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#38BDF8]">Function</p>
                    <p className="text-[#CBD5E1] mt-1 leading-relaxed">{selectedComponent.functionText}</p>
                  </div>

                  <div className="bg-[#11141D] border border-[#222736] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#F59E0B]">Scientific Importance</p>
                    <p className="text-[#CBD5E1] mt-1 leading-relaxed">{selectedComponent.importance}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#8B93A7] mb-2">All Apparatus Parts</p>
                  <div className="grid grid-cols-1 gap-2">
                    {exp.components.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          setSelectedMeshKey(c.meshKey);
                          viewerRef.current?.sendCommand({ type: 'SELECT_COMPONENT', meshKey: c.meshKey });
                        }}
                        className={`text-left px-3.5 py-2.5 rounded-lg border text-xs font-medium transition-colors ${
                          selectedComponent.id === c.id
                            ? 'bg-[#0B2233] border-[#38BDF8] text-[#F4F6FA] font-semibold'
                            : 'bg-[#11141D] border-[#222736] text-[#9CA3B5] hover:text-[#F4F6FA]'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {drawerTab === 'guide' && (
              <>
                <LiveExperimentChart experimentId={exp.id} params={params} />

                {readouts.length > 0 && (
                  <div className="grid grid-cols-2 gap-2.5">
                    {readouts.map((r) => (
                      <div key={r.label} className="bg-[#11141D] border border-[#222736] rounded-xl p-3">
                        <p className="text-[11px] text-[#8B93A7]">{r.label}</p>
                        <p className="font-mono-tech tabular-nums text-sm font-bold text-[#F4F6FA] mt-0.5">
                          {r.value} {r.unit}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {exp.formula && (
                  <div className="bg-[#0B0D13] border border-[#222736] rounded-xl p-3.5 font-mono-tech text-xs font-semibold text-[#38BDF8]">
                    {exp.formula}
                  </div>
                )}

                <div>
                  <h3 className="font-display text-base font-bold text-[#F4F6FA]">Scientific Principle</h3>
                  <p className="text-sm text-[#9CA3B5] mt-1.5 leading-relaxed">
                    {exp.scientificPrinciple}
                  </p>
                </div>

                <div>
                  <h3 className="font-display text-base font-bold text-[#F4F6FA]">Step-by-Step Protocol</h3>
                  <div className="mt-2 space-y-2.5">
                    {exp.steps.map((st) => (
                      <div key={st.step} className="bg-[#11141D] border border-[#222736] rounded-xl p-3">
                        <p className="text-xs font-mono-tech font-semibold text-[#38BDF8]">
                          STEP 0{st.step} · {st.title}
                        </p>
                        <p className="text-xs text-[#CBD5E1] mt-1 leading-relaxed">{st.instruction}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => markCompleted(exp.id)}
                  className={`w-full h-10 rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-2 border transition-colors ${
                    completedIds.includes(exp.id)
                      ? 'bg-[#09221A] border-[#10B981] text-[#34D399]'
                      : 'bg-[#171B26] border-[#262C3D] text-[#F4F6FA] hover:border-[#38BDF8]'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completedIds.includes(exp.id) ? 'Verified & Completed' : 'Mark Experiment Verified'}</span>
                </button>
              </>
            )}

            {drawerTab === 'quiz' && (
              <>
                {quizFinished ? (
                  <div className="bg-[#11141D] border border-[#222736] rounded-2xl p-6 text-center space-y-3">
                    <CheckCircle2 className="w-10 h-10 text-[#10B981] mx-auto" />
                    <h3 className="font-display text-xl font-bold text-[#F4F6FA]">Knowledge Check Complete</h3>
                    <p className="font-mono-tech text-2xl font-bold text-[#38BDF8]">
                      {quizCorrectCount} / {exp.quiz.length} Correct
                    </p>
                    <p className="text-xs text-[#9CA3B5]">
                      Your score has been saved to your local VidyaVerse progress record.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setQuizIndex(0);
                        setSelectedOption(null);
                        setQuizCorrectCount(0);
                        setQuizFinished(false);
                      }}
                      className="mt-2 h-10 px-4 rounded-lg bg-[#F4F6FA] text-[#06070B] text-xs font-semibold"
                    >
                      Retake Quiz
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-[#8B93A7] font-mono-tech">
                      <span>{t.knowledgeCheck}</span>
                      <span>
                        Question {quizIndex + 1} of {exp.quiz.length}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-[#F4F6FA] leading-relaxed">
                      {currentQ.question}
                    </p>

                    <div className="space-y-2">
                      {currentQ.options.map((opt, idx) => {
                        const isPicked = selectedOption === idx;
                        const isCorrect = idx === currentQ.correctIndex;
                        let style =
                          'bg-[#11141D] border-[#222736] text-[#CBD5E1] hover:border-[#38BDF8]';
                        if (selectedOption !== null) {
                          if (isCorrect)
                            style = 'bg-[#09221A] border-[#10B981] text-[#D1FAE5] font-semibold';
                          else if (isPicked) style = 'bg-[#280D12] border-[#EF4444] text-[#FEE2E2]';
                        }
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => handleAnswerQuiz(idx)}
                            className={`w-full text-left px-3.5 py-3 rounded-lg border text-xs font-medium flex items-center justify-between gap-2 transition-colors ${style}`}
                          >
                            <span>{opt}</span>
                            {selectedOption !== null && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                            )}
                            {selectedOption !== null && isPicked && !isCorrect && (
                              <XCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {selectedOption !== null && (
                      <div className="bg-[#11141D] border border-[#222736] rounded-xl p-3.5 space-y-3">
                        <p className="text-xs font-semibold text-[#F4F6FA]">
                          {selectedOption === currentQ.correctIndex ? 'Correct Answer' : 'Explanation'}
                        </p>
                        <p className="text-xs text-[#9CA3B5] leading-relaxed">
                          {currentQ.explanation}
                        </p>
                        <button
                          type="button"
                          onClick={handleNextQuiz}
                          className="w-full h-10 rounded-lg bg-[#F4F6FA] text-[#06070B] text-xs font-semibold"
                        >
                          {quizIndex + 1 < exp.quiz.length ? t.nextQuestion : 'Finish & Save Score'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </aside>
      )}
      </div>

      {/* 4. Non-Overlapping Collapsible Bottom Control Dock (Sits BELOW the 3D Canvas) */}
      <section className="shrink-0 z-20 bg-[#0B0D13] border-t border-[#222736]">
        <div className="max-w-6xl mx-auto px-3 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              className="h-8 px-3 rounded-lg bg-[#F4F6FA] hover:bg-white text-[#06070B] text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{playing ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              onClick={handleResetSim}
              className="h-8 px-2.5 rounded-lg bg-[#171B26] border border-[#262C3D] text-xs font-medium text-[#CBD5E1] hover:text-[#F4F6FA] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setDockCollapsed((c) => !c)}
            className="h-8 px-3 rounded-lg bg-[#11141D] border border-[#222736] text-[11px] font-medium text-[#9CA3B5] hover:text-[#F4F6FA] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            {dockCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>{dockCollapsed ? 'Show Controls' : 'Hide Controls'}</span>
          </button>
        </div>

        {!dockCollapsed && (
          <div className="max-w-6xl mx-auto px-3 pb-3 pt-1 space-y-2.5 max-h-[34dvh] sm:max-h-[36dvh] overflow-y-auto border-t border-[#171B26]">
            {/* Row 1: Exploded View & Component Quick Chips */}
            {(exp.hasExplodedView || exp.components.length > 0) && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5">
                {exp.hasExplodedView && (
                  <div className="flex items-center gap-2 min-w-[180px]">
                    <Layers className="w-4 h-4 text-[#F59E0B] shrink-0" />
                    <span className="text-xs text-[#9CA3B5] whitespace-nowrap">{t.explodedView}</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.02}
                      value={exploded}
                      onChange={(e) => handleExplodedChange(Number(e.target.value))}
                      className="stem-slider w-24 sm:w-28"
                    />
                    <span className="font-mono-tech tabular-nums text-xs text-[#F4F6FA] w-9 text-right">
                      {Math.round(exploded * 100)}%
                    </span>
                  </div>
                )}

                {/* Component Quick Selector Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
                  {exp.components.map((comp) => {
                    const isHidden = !!hiddenComponents[comp.meshKey];
                    const isSel = selectedMeshKey === comp.meshKey;
                    return (
                      <div
                        key={comp.id}
                        className={`inline-flex items-center rounded-lg border text-xs overflow-hidden shrink-0 ${
                          isSel
                            ? 'border-[#38BDF8] bg-[#0B2233] text-[#F4F6FA] font-semibold'
                            : 'border-[#222736] bg-[#141824] text-[#9CA3B5]'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            viewerRef.current?.sendCommand({ type: 'SELECT_COMPONENT', meshKey: comp.meshKey });
                            handleSelectComponent(comp.meshKey);
                          }}
                          className="px-2.5 py-1 hover:text-[#F4F6FA] whitespace-nowrap"
                        >
                          {comp.name.split(' ')[0]}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleComponentVis(comp.meshKey)}
                          aria-label={`Toggle ${comp.name} visibility`}
                          className="px-1.5 py-1 border-l border-[#222736] hover:text-[#F4F6FA]"
                        >
                          {isHidden ? <EyeOff className="w-3 h-3 text-[#EF4444]" /> : <Eye className="w-3 h-3" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Row 2: Experiment Parameter Sliders */}
            {exp.parameters.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {exp.parameters.map((param) => {
                  const val = params[param.key] ?? param.defaultValue;
                  return (
                    <div key={param.key} className="bg-[#11141D] border border-[#222736] rounded-xl px-3 py-2">
                      <div className="flex items-center justify-between text-xs mb-1 gap-2">
                        <span className="text-[#9CA3B5] truncate">{param.label}</span>
                        <span className="font-mono-tech tabular-nums font-semibold text-[#38BDF8] shrink-0">
                          {Number.isInteger(param.step) ? val : val.toFixed(2)}
                          {param.unit ? ` ${param.unit}` : ''}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={val}
                        onChange={(e) => handleParamChange(param.key, Number(e.target.value))}
                        className="stem-slider w-full"
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
