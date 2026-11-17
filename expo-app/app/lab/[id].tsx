import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import Slider from '@react-native-community/slider';
import * as Speech from 'expo-speech';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Eye,
  EyeOff,
  HelpCircle,
  Layers,
  Pause,
  Play,
  RotateCcw,
  Sliders,
  Tag,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react-native';
import { getExperimentById } from '../../src/data';
import { TRANSLATIONS } from '../../src/data/i18n';
import { useAppStore } from '../../src/store/useAppStore';
import { FONTS, THEME } from '../../src/theme/colors';
import { buildViewerHtml } from '../../src/viewer/buildViewerHtml';

interface ReadoutItem {
  label: string;
  value: string;
  unit?: string;
}

type InspectorTab = 'component' | 'guide' | 'quiz';

export default function LaboratoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const experiment = getExperimentById(params.id || 'B01');

  const { markExplored, saveQuizScore, language, lightweight3D } = useAppStore();
  const t = TRANSLATIONS[language];

  const webViewRef = useRef<WebView>(null);

  const defaultParams = useMemo(() => {
    const map: Record<string, number> = {};
    experiment.parameters.forEach((p) => {
      map[p.key] = p.defaultValue;
    });
    return map;
  }, [experiment]);

  const [viewerReady, setViewerReady] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [exploded, setExploded] = useState(0);
  const [simParams, setSimParams] = useState<Record<string, number>>(defaultParams);
  const [readouts, setReadouts] = useState<ReadoutItem[]>([]);
  const [selectedMeshKey, setSelectedMeshKey] = useState<string | null>(
    experiment.components[0]?.meshKey ?? null
  );
  const [hiddenComponents, setHiddenComponents] = useState<Record<string, boolean>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [controlsCollapsed, setControlsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<InspectorTab>('component');
  const [speaking, setSpeaking] = useState(false);

  const [quizIndex, setQuizIndex] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizDone, setQuizDone] = useState(false);

  useEffect(() => {
    markExplored(experiment.id);
    setSimParams(defaultParams);
    setExploded(0);
    setPlaying(true);
    setShowLabels(true);
    setHiddenComponents({});
    setSelectedMeshKey(experiment.components[0]?.meshKey ?? null);
    return () => {
      Speech.stop();
    };
  }, [experiment.id]);

  const viewerHtml = useMemo(
    () => buildViewerHtml(experiment.id, defaultParams, lightweight3D, true, true),
    [experiment.id, defaultParams, lightweight3D]
  );

  const sendToViewer = (command: Record<string, unknown>) => {
    if (!webViewRef.current) return;
    const payload = JSON.stringify(command);
    webViewRef.current.injectJavaScript(
      `window.STEMVERSE_BRIDGE && window.STEMVERSE_BRIDGE(${payload}); true;`
    );
  };

  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);
      if (msg.type === 'READY') {
        setViewerReady(true);
      } else if (msg.type === 'READOUTS' && Array.isArray(msg.readouts)) {
        setReadouts(msg.readouts);
      } else if (msg.type === 'COMPONENT_SELECTED') {
        if (msg.meshKey) {
          setSelectedMeshKey(msg.meshKey);
          setActiveTab('component');
          setDrawerOpen(true);
        }
      }
    } catch {
      // Ignore malformed bridge events
    }
  };

  const handleTogglePlay = () => {
    const next = !playing;
    setPlaying(next);
    sendToViewer({ type: 'SET_PLAYING', playing: next });
  };

  const handleToggleLabels = () => {
    const next = !showLabels;
    setShowLabels(next);
    sendToViewer({ type: 'TOGGLE_ANNOTATIONS', visible: next });
  };

  const handleResetCamera = () => {
    sendToViewer({ type: 'RESET_CAMERA' });
  };

  const handleResetAll = () => {
    setSimParams(defaultParams);
    setExploded(0);
    setPlaying(true);
    setHiddenComponents({});
    sendToViewer({ type: 'RESET_SIM' });
    Object.entries(defaultParams).forEach(([key, value]) => {
      sendToViewer({ type: 'SET_PARAM', key, value });
    });
  };

  const handleParamChange = (key: string, value: number) => {
    setSimParams((prev) => ({ ...prev, [key]: value }));
    sendToViewer({ type: 'SET_PARAM', key, value });
  };

  const handleExplodedChange = (val: number) => {
    setExploded(val);
    sendToViewer({ type: 'SET_EXPLODED', amount: val });
  };

  const handleSelectComponent = (meshKey: string) => {
    setSelectedMeshKey(meshKey);
    sendToViewer({ type: 'SELECT_COMPONENT', meshKey });
  };

  const handleToggleVisibility = (meshKey: string) => {
    const currentlyHidden = !!hiddenComponents[meshKey];
    const nextVisible = currentlyHidden;
    setHiddenComponents((prev) => ({ ...prev, [meshKey]: !currentlyHidden }));
    sendToViewer({ type: 'SET_COMPONENT_VISIBILITY', meshKey, visible: nextVisible });
  };

  const toggleSpeech = () => {
    if (speaking) {
      Speech.stop();
      setSpeaking(false);
    } else {
      setSpeaking(true);
      Speech.speak(experiment.audioScript, {
        language: 'en-US',
        rate: 0.96,
        onDone: () => setSpeaking(false),
        onStopped: () => setSpeaking(false),
        onError: () => setSpeaking(false),
      });
    }
  };

  const selectedComp =
    experiment.components.find((c) => c.meshKey === selectedMeshKey) ??
    experiment.components[0];

  const currentQuestion = experiment.quiz[quizIndex];

  const handleCheckQuiz = () => {
    if (quizSelected === null || !currentQuestion) return;
    setQuizSubmitted(true);
    if (quizSelected === currentQuestion.correctIndex) {
      setQuizScore((s) => s + 1);
    }
  };

  const handleNextQuiz = () => {
    if (quizIndex + 1 < experiment.quiz.length) {
      setQuizIndex((i) => i + 1);
      setQuizSelected(null);
      setQuizSubmitted(false);
    } else {
      setQuizDone(true);
      saveQuizScore(experiment.id, quizScore, experiment.quiz.length);
    }
  };

  const handleRestartQuiz = () => {
    setQuizIndex(0);
    setQuizSelected(null);
    setQuizSubmitted(false);
    setQuizScore(0);
    setQuizDone(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Top Instrument Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.topIconBtn}>
          <ArrowLeft size={18} color={THEME.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.topCode}>{experiment.code} · 3D BENCH</Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            {experiment.title}
          </Text>
        </View>
        <TouchableOpacity onPress={handleTogglePlay} style={styles.topIconBtn}>
          {playing ? (
            <Pause size={17} color={THEME.accentCyan} />
          ) : (
            <Play size={17} color={THEME.accentCyan} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleToggleLabels}
          style={[styles.topIconBtn, showLabels && styles.topIconActive]}
        >
          <Tag size={16} color={showLabels ? THEME.ctaText : THEME.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleResetCamera} style={styles.topIconBtn}>
          <RotateCcw size={16} color={THEME.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Main 3D WebView Canvas */}
      <View style={styles.viewportWrap}>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          source={{ html: viewerHtml }}
          onMessage={handleWebViewMessage}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          allowsInlineMediaPlayback
        />

        {!viewerReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={THEME.accentCyan} />
            <Text style={styles.loadingText}>Calibrating 3D Instrument...</Text>
          </View>
        )}

        {experiment.cameraPresets && experiment.cameraPresets.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.presetsBar}
            contentContainerStyle={{ gap: 6, paddingHorizontal: 10 }}
          >
            {experiment.cameraPresets.map((preset) => (
              <TouchableOpacity
                key={preset.id}
                onPress={() =>
                  sendToViewer({
                    type: 'SET_CAMERA_PRESET',
                    position: preset.position,
                    target: preset.target,
                  })
                }
                style={styles.presetBtn}
              >
                <Text style={styles.presetText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Live Telemetry Strip (Always Visible on Phone) */}
      {readouts.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.readoutBar}
          contentContainerStyle={{ gap: 8, paddingHorizontal: 14, alignItems: 'center' }}
        >
          <View style={styles.liveTag}>
            <Text style={styles.liveTagText}>OUTPUT</Text>
          </View>
          {readouts.map((r) => (
            <View key={r.label} style={styles.readoutCard}>
              <Text style={styles.readoutLabel}>{r.label}</Text>
              <Text style={styles.readoutVal}>
                {r.value} {r.unit || ''}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Interactive Collapsible Controls Deck (Sits cleanly below 3D viewport) */}
      <View style={styles.controlsDeck}>
        {!controlsCollapsed && (
          <ScrollView style={styles.slidersScroll} showsVerticalScrollIndicator={false}>
            {experiment.hasExplodedView && (
              <View style={styles.sliderRow}>
                <View style={styles.sliderHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Layers size={13} color={THEME.amber} />
                    <Text style={styles.sliderLabel}>{t.explodedView}</Text>
                  </View>
                  <Text style={[styles.sliderValue, { color: THEME.amber }]}>
                    {Math.round(exploded * 100)}%
                  </Text>
                </View>
                <Slider
                  minimumValue={0}
                  maximumValue={1}
                  step={0.02}
                  value={exploded}
                  onValueChange={handleExplodedChange}
                  minimumTrackTintColor={THEME.amber}
                  maximumTrackTintColor={THEME.borderStrong}
                  thumbTintColor={THEME.amber}
                  style={styles.slider}
                />
              </View>
            )}

            {experiment.parameters.map((param) => {
              const val = simParams[param.key] ?? param.defaultValue;
              return (
                <View key={param.key} style={styles.sliderRow}>
                  <View style={styles.sliderHeader}>
                    <Text style={styles.sliderLabel}>{param.label}</Text>
                    <Text style={styles.sliderValue}>
                      {Number(val.toFixed(2))} {param.unit}
                    </Text>
                  </View>
                  <Slider
                    minimumValue={param.min}
                    maximumValue={param.max}
                    step={param.step}
                    value={val}
                    onValueChange={(v) => handleParamChange(param.key, v)}
                    minimumTrackTintColor={THEME.accentCyan}
                    maximumTrackTintColor={THEME.borderStrong}
                    thumbTintColor={THEME.accentCyan}
                    style={styles.slider}
                  />
                </View>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.dockActions}>
          <TouchableOpacity
            onPress={() => setControlsCollapsed((c) => !c)}
            style={styles.dockCollapseBtn}
          >
            <Text style={styles.dockCollapseText}>
              {controlsCollapsed ? 'Controls ▲' : 'Hide ▼'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('component');
              setDrawerOpen(true);
            }}
            style={styles.dockBtn}
          >
            <Sliders size={14} color={THEME.accentCyan} />
            <Text style={styles.dockBtnText}>{t.inspectorTab}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('guide');
              setDrawerOpen(true);
            }}
            style={styles.dockBtn}
          >
            <BookOpen size={14} color={THEME.accentCyan} />
            <Text style={styles.dockBtnText}>{t.guideTab}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setActiveTab('quiz');
              setDrawerOpen(true);
            }}
            style={[styles.dockBtn, styles.dockQuizBtn]}
          >
            <HelpCircle size={14} color={THEME.ctaText} />
            <Text style={styles.dockQuizText}>{t.quizTab}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleResetAll} style={styles.dockResetBtn}>
            <RotateCcw size={14} color={THEME.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Inspector / Guide / Quiz Modal */}
      <Modal
        visible={drawerOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setDrawerOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={styles.tabRow}>
                {(['component', 'guide', 'quiz'] as InspectorTab[]).map((tab) => {
                  const active = activeTab === tab;
                  const label =
                    tab === 'component'
                      ? t.inspectorTab
                      : tab === 'guide'
                        ? t.guideTab
                        : t.quizTab;
                  return (
                    <TouchableOpacity
                      key={tab}
                      onPress={() => setActiveTab(tab)}
                      style={[styles.tabBtn, active && styles.tabBtnActive]}
                    >
                      <Text style={[styles.tabBtnText, active && styles.tabBtnTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={() => setDrawerOpen(false)} style={styles.closeBtn}>
                <X size={18} color={THEME.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {activeTab === 'component' && (
                <View>
                  <Text style={styles.modalSectionTitle}>Interactive Components</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 14 }}
                    contentContainerStyle={{ gap: 8 }}
                  >
                    {experiment.components.map((comp) => {
                      const active = comp.meshKey === selectedComp?.meshKey;
                      const hidden = !!hiddenComponents[comp.meshKey];
                      return (
                        <TouchableOpacity
                          key={comp.id}
                          onPress={() => handleSelectComponent(comp.meshKey)}
                          style={[styles.compBtn, active && styles.compBtnActive]}
                        >
                          <Text style={[styles.compBtnText, active && { color: THEME.ctaText }]}>
                            {comp.name}
                          </Text>
                          {hidden && <EyeOff size={12} color={active ? THEME.ctaText : THEME.textMuted} />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {selectedComp && (
                    <View style={styles.inspectorCard}>
                      <View style={styles.inspectorTop}>
                        <Text style={styles.inspectorName}>{selectedComp.name}</Text>
                        <TouchableOpacity
                          onPress={() => handleToggleVisibility(selectedComp.meshKey)}
                          style={styles.visibilityBtn}
                        >
                          {hiddenComponents[selectedComp.meshKey] ? (
                            <EyeOff size={14} color={THEME.amber} />
                          ) : (
                            <Eye size={14} color={THEME.accentCyan} />
                          )}
                          <Text style={styles.visibilityText}>
                            {hiddenComponents[selectedComp.meshKey] ? 'Hidden' : 'Visible'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.inspectorSub}>Description</Text>
                      <Text style={styles.inspectorText}>{selectedComp.description}</Text>

                      <Text style={styles.inspectorSub}>Scientific Function</Text>
                      <Text style={styles.inspectorText}>{selectedComp.functionText}</Text>

                      <Text style={styles.inspectorSub}>Why It Matters</Text>
                      <Text style={styles.inspectorText}>{selectedComp.importance}</Text>
                    </View>
                  )}
                </View>
              )}

              {activeTab === 'guide' && (
                <View>
                  <TouchableOpacity
                    onPress={toggleSpeech}
                    style={[styles.speechBanner, speaking && styles.speechBannerActive]}
                  >
                    {speaking ? (
                      <VolumeX size={17} color={THEME.accentCyan} />
                    ) : (
                      <Volume2 size={17} color={THEME.textPrimary} />
                    )}
                    <Text style={styles.speechBannerText}>
                      {speaking ? t.stopAudio : t.audioGuide}
                    </Text>
                  </TouchableOpacity>

                  <Text style={styles.modalSectionTitle}>Scientific Principle</Text>
                  <Text style={styles.guideBody}>{experiment.scientificPrinciple}</Text>
                  {experiment.formula && (
                    <View style={styles.formulaBox}>
                      <Text style={styles.formulaText}>{experiment.formula}</Text>
                    </View>
                  )}

                  <Text style={[styles.modalSectionTitle, { marginTop: 16 }]}>
                    Lab Procedure
                  </Text>
                  {experiment.steps.map((s) => (
                    <View key={s.step} style={styles.stepCard}>
                      <View style={styles.stepNum}>
                        <Text style={styles.stepNumText}>{s.step}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.stepTitle}>{s.title}</Text>
                        <Text style={styles.stepDesc}>{s.instruction}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {activeTab === 'quiz' && (
                <View>
                  {!quizDone && currentQuestion ? (
                    <View>
                      <Text style={styles.quizCounter}>
                        QUESTION {quizIndex + 1} OF {experiment.quiz.length}
                      </Text>
                      <Text style={styles.quizQuestion}>{currentQuestion.question}</Text>

                      {currentQuestion.options.map((opt, idx) => {
                        const chosen = quizSelected === idx;
                        const correct = quizSubmitted && idx === currentQuestion.correctIndex;
                        const wrong =
                          quizSubmitted && chosen && idx !== currentQuestion.correctIndex;
                        return (
                          <TouchableOpacity
                            key={opt}
                            disabled={quizSubmitted}
                            onPress={() => setQuizSelected(idx)}
                            style={[
                              styles.quizOpt,
                              chosen && styles.quizOptChosen,
                              correct && styles.quizOptCorrect,
                              wrong && styles.quizOptWrong,
                            ]}
                          >
                            <Text style={styles.quizOptText}>{opt}</Text>
                            {correct && <CheckCircle2 size={16} color={THEME.green} />}
                          </TouchableOpacity>
                        );
                      })}

                      {quizSubmitted && (
                        <View style={styles.quizExplain}>
                          <Text style={styles.quizExplainText}>{currentQuestion.explanation}</Text>
                        </View>
                      )}

                      {!quizSubmitted ? (
                        <TouchableOpacity
                          disabled={quizSelected === null}
                          onPress={handleCheckQuiz}
                          style={[
                            styles.quizPrimaryBtn,
                            quizSelected === null && { opacity: 0.45 },
                          ]}
                        >
                          <Text style={styles.quizPrimaryText}>{t.submitAnswer}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity onPress={handleNextQuiz} style={styles.quizPrimaryBtn}>
                          <Text style={styles.quizPrimaryText}>
                            {quizIndex + 1 < experiment.quiz.length
                              ? t.nextQuestion
                              : 'Finish Quiz'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : (
                    <View style={styles.quizSummary}>
                      <CheckCircle2 size={44} color={THEME.green} />
                      <Text style={styles.quizDoneTitle}>{t.completedLabel}!</Text>
                      <Text style={styles.quizDoneScore}>
                        Score: {quizScore} / {experiment.quiz.length}
                      </Text>
                      <TouchableOpacity onPress={handleRestartQuiz} style={styles.quizPrimaryBtn}>
                        <Text style={styles.quizPrimaryText}>Retry Quiz</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bgPrimary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bgPrimary,
  },
  topIconBtn: {
    width: 35,
    height: 35,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topIconActive: {
    backgroundColor: THEME.ctaBg,
    borderColor: THEME.ctaBg,
  },
  topCode: { fontFamily: FONTS.monoBold, fontSize: 10, color: THEME.accentCyan, letterSpacing: 0.5 },
  topTitle: { fontFamily: FONTS.displayBold, fontSize: 14.5, color: THEME.textPrimary },
  viewportWrap: {
    flex: 1,
    minHeight: 240,
    backgroundColor: THEME.bgPrimary,
    position: 'relative',
  },
  webview: { flex: 1, backgroundColor: THEME.bgPrimary },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: { fontFamily: FONTS.monoSemi, fontSize: 12.5, color: THEME.textSecondary },
  presetsBar: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    maxHeight: 34,
  },
  presetBtn: {
    backgroundColor: 'rgba(11, 13, 19, 0.92)',
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 7,
  },
  presetText: { fontFamily: FONTS.monoSemi, fontSize: 11, color: THEME.textPrimary },
  readoutBar: {
    maxHeight: 54,
    backgroundColor: THEME.bgSecondary,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingVertical: 7,
  },
  liveTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
  },
  liveTagText: {
    fontFamily: FONTS.monoBold,
    fontSize: 9.5,
    color: THEME.green,
    letterSpacing: 0.6,
  },
  readoutCard: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  readoutLabel: { fontFamily: FONTS.monoSemi, fontSize: 9.5, color: THEME.textMuted },
  readoutVal: { fontFamily: FONTS.monoBold, fontSize: 12, color: THEME.accentCyan },
  controlsDeck: {
    backgroundColor: THEME.bgPrimary,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 204,
  },
  slidersScroll: { maxHeight: 132, marginBottom: 8 },
  sliderRow: { marginBottom: 6 },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.textPrimary },
  sliderValue: { fontFamily: FONTS.monoBold, fontSize: 11.5, color: THEME.accentCyan },
  slider: { width: '100%', height: 28 },
  dockActions: { flexDirection: 'row', gap: 8 },
  dockBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  dockBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: THEME.textPrimary },
  dockQuizBtn: { backgroundColor: THEME.ctaBg, borderColor: THEME.ctaBg },
  dockQuizText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: THEME.ctaText },
  dockCollapseBtn: {
    paddingHorizontal: 10,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  dockCollapseText: { fontFamily: FONTS.monoSemi, fontSize: 10.5, color: THEME.textSecondary },
  dockResetBtn: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: THEME.bgSecondary,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderColor: THEME.borderStrong,
    maxHeight: '78%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  tabRow: { flexDirection: 'row', gap: 6 },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  tabBtnActive: { backgroundColor: THEME.ctaBg, borderColor: THEME.ctaBg },
  tabBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: THEME.textSecondary },
  tabBtnTextActive: { color: THEME.ctaText },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: { padding: 16 },
  modalSectionTitle: { fontFamily: FONTS.displayBold, fontSize: 15, color: THEME.textPrimary, marginBottom: 10 },
  compBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  compBtnActive: { backgroundColor: THEME.ctaBg, borderColor: THEME.ctaBg },
  compBtnText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: THEME.textPrimary },
  inspectorCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 14,
  },
  inspectorTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  inspectorName: { fontFamily: FONTS.displayBold, fontSize: 15.5, color: THEME.textPrimary, flex: 1 },
  visibilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 7,
  },
  visibilityText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.textPrimary },
  inspectorSub: { fontFamily: FONTS.monoBold, fontSize: 11, color: THEME.accentCyan, marginTop: 8, marginBottom: 3, textTransform: 'uppercase' },
  inspectorText: { fontFamily: FONTS.bodyMedium, fontSize: 12.5, color: THEME.textSecondary, lineHeight: 19 },
  speechBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    marginBottom: 14,
  },
  speechBannerActive: {
    backgroundColor: THEME.accentCyanSoft,
    borderColor: THEME.accentCyan,
  },
  speechBannerText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: THEME.textPrimary },
  guideBody: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: THEME.textSecondary, lineHeight: 20 },
  formulaBox: {
    marginTop: 10,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  formulaText: { fontFamily: FONTS.monoBold, fontSize: 13, color: THEME.accentCyan },
  stepCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: THEME.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 12,
    marginBottom: 8,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: THEME.ctaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: { fontFamily: FONTS.monoBold, color: THEME.ctaText, fontSize: 12 },
  stepTitle: { fontFamily: FONTS.bodyBold, fontSize: 13, color: THEME.textPrimary, marginBottom: 2 },
  stepDesc: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: THEME.textSecondary, lineHeight: 18 },
  quizCounter: { fontFamily: FONTS.monoBold, fontSize: 11, color: THEME.accentCyan, marginBottom: 6 },
  quizQuestion: { fontFamily: FONTS.bodyBold, fontSize: 15, color: THEME.textPrimary, lineHeight: 22, marginBottom: 12 },
  quizOpt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bgCard,
    marginBottom: 8,
  },
  quizOptChosen: { borderColor: THEME.accentCyan, backgroundColor: THEME.accentCyanSoft },
  quizOptCorrect: { borderColor: THEME.green, backgroundColor: THEME.greenSoft },
  quizOptWrong: { borderColor: THEME.rose, backgroundColor: 'rgba(239, 68, 68, 0.14)' },
  quizOptText: { fontFamily: FONTS.bodySemi, fontSize: 13, color: THEME.textPrimary, flex: 1 },
  quizExplain: {
    backgroundColor: THEME.greenSoft,
    borderWidth: 1,
    borderColor: THEME.green,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
  },
  quizExplainText: { fontFamily: FONTS.bodyMedium, fontSize: 12.5, color: THEME.textPrimary, lineHeight: 18 },
  quizPrimaryBtn: {
    marginTop: 10,
    height: 46,
    borderRadius: 8,
    backgroundColor: THEME.ctaBg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  quizPrimaryText: { fontFamily: FONTS.bodyBold, color: THEME.ctaText, fontSize: 14 },
  quizSummary: { alignItems: 'center', paddingVertical: 20, gap: 10 },
  quizDoneTitle: { fontFamily: FONTS.displayBold, fontSize: 20, color: THEME.textPrimary },
  quizDoneScore: { fontFamily: FONTS.monoBold, fontSize: 15, color: THEME.accentCyan },
});
