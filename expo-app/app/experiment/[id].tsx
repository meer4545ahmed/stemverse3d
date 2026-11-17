import React, { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import * as Speech from 'expo-speech';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Cuboid,
  Heart,
  Volume2,
  VolumeX,
} from 'lucide-react-native';
import { getExperimentById } from '../../src/data';
import { SUBJECTS } from '../../src/data/subjects';
import { TRANSLATIONS } from '../../src/data/i18n';
import { useAppStore } from '../../src/store/useAppStore';
import { FONTS, THEME } from '../../src/theme/colors';
import { buildViewerHtml } from '../../src/viewer/buildViewerHtml';

export default function ExperimentDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const experiment = getExperimentById(params.id || 'B01');
  const subject = SUBJECTS[experiment.subject];

  const {
    favoriteIds,
    toggleFavorite,
    markExplored,
    language,
    lightweight3D,
  } = useAppStore();
  const t = TRANSLATIONS[language];

  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    markExplored(experiment.id);
    return () => {
      Speech.stop();
    };
  }, [experiment.id]);

  const initialParams = useMemo(() => {
    const map: Record<string, number> = {};
    experiment.parameters.forEach((p) => {
      map[p.key] = p.defaultValue;
    });
    return map;
  }, [experiment]);

  const previewHtml = useMemo(
    () => buildViewerHtml(experiment.id, initialParams, lightweight3D, false, false),
    [experiment.id, initialParams, lightweight3D]
  );

  const isFavorite = favoriteIds.includes(experiment.id);

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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <ArrowLeft size={19} color={THEME.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerCode, { color: subject.accentHex }]}>
            {experiment.code} · {subject.shortName}
          </Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {experiment.title}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => toggleFavorite(experiment.id)}
          style={[styles.iconBtn, isFavorite && styles.favActive]}
        >
          <Heart
            size={17}
            color={isFavorite ? THEME.accentCyan : THEME.textMuted}
            fill={isFavorite ? THEME.accentCyan : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.previewBox}>
          <WebView
            originWhitelist={['*']}
            source={{ html: previewHtml }}
            style={styles.webview}
            javaScriptEnabled
            domStorageEnabled
            scrollEnabled={false}
            allowsInlineMediaPlayback
          />
          <View style={styles.previewOverlay}>
            <Text style={styles.previewLabel}>3D PREVIEW</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Clock size={13} color={THEME.accentCyan} />
            <Text style={styles.metaText}>{experiment.estimatedMinutes} min</Text>
          </View>
          <Text style={styles.metaSep}>/</Text>
          <Text style={styles.metaText}>{experiment.difficulty}</Text>
          <Text style={styles.metaSep}>/</Text>
          <Text style={styles.metaText}>{experiment.category}</Text>
        </View>

        <View style={styles.ctaRow}>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push(`/lab/${experiment.id}`)}
            style={styles.launchBtn}
          >
            <Cuboid size={18} color={THEME.ctaText} />
            <Text style={styles.launchBtnText}>{t.openLab}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={toggleSpeech}
            style={[styles.audioBtn, speaking && styles.audioBtnActive]}
          >
            {speaking ? (
              <VolumeX size={17} color={THEME.accentCyan} />
            ) : (
              <Volume2 size={17} color={THEME.textPrimary} />
            )}
            <Text style={[styles.audioBtnText, speaking && { color: THEME.accentCyan }]}>
              {speaking ? t.stopAudio : 'Audio'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Introduction</Text>
          <Text style={styles.bodyText}>{experiment.introduction}</Text>
        </View>

        <View style={[styles.card, styles.principleCard]}>
          <View style={styles.principleHeader}>
            <BookOpen size={15} color={THEME.accentCyan} />
            <Text style={styles.cardTitle}>Scientific Principle</Text>
          </View>
          <Text style={styles.bodyText}>{experiment.scientificPrinciple}</Text>
          {experiment.formula && (
            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>{experiment.formula}</Text>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Learning Objectives</Text>
          {experiment.learningObjectives.map((obj, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <CheckCircle2 size={15} color={THEME.green} style={{ marginTop: 2 }} />
              <Text style={styles.bulletText}>{obj}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>What You Will Learn</Text>
          {experiment.whatYouWillLearn.map((item, idx) => (
            <View key={idx} style={styles.bulletRow}>
              <View style={styles.cyanSquare} />
              <Text style={styles.bulletText}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Real-World Applications</Text>
          <View style={styles.tagWrap}>
            {experiment.realWorldApps.map((app) => (
              <View key={app} style={styles.appItem}>
                <Text style={styles.appItemText}>{app}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: THEME.bgPrimary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bgPrimary,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favActive: {
    backgroundColor: THEME.accentCyanSoft,
    borderColor: THEME.accentCyan,
  },
  headerCode: { fontFamily: FONTS.monoBold, fontSize: 11, textTransform: 'uppercase' },
  headerTitle: { fontFamily: FONTS.displayBold, fontSize: 16, color: THEME.textPrimary },
  scroll: { flex: 1, backgroundColor: THEME.bgSecondary },
  scrollContent: { padding: 16, paddingBottom: 36 },
  previewBox: {
    height: 245,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bgPrimary,
    marginBottom: 12,
  },
  webview: { flex: 1, backgroundColor: THEME.bgPrimary },
  previewOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(11, 13, 19, 0.9)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
  },
  previewLabel: { fontFamily: FONTS.monoBold, fontSize: 10, color: THEME.accentCyan, letterSpacing: 0.6 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: FONTS.monoSemi, fontSize: 11.5, color: THEME.textSecondary },
  metaSep: { color: THEME.borderStrong, fontSize: 12 },
  ctaRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  launchBtn: {
    flex: 1.8,
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.ctaBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  launchBtnText: { fontFamily: FONTS.bodyBold, fontSize: 14.5, color: THEME.ctaText },
  audioBtn: {
    flex: 0.9,
    height: 48,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  audioBtnActive: {
    backgroundColor: THEME.accentCyanSoft,
    borderColor: THEME.accentCyan,
  },
  audioBtnText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: THEME.textPrimary },
  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 15,
    marginBottom: 12,
  },
  principleCard: {
    borderColor: THEME.borderStrong,
  },
  principleHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  cardTitle: { fontFamily: FONTS.displayBold, fontSize: 15, color: THEME.textPrimary, marginBottom: 8 },
  bodyText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: THEME.textSecondary, lineHeight: 20 },
  formulaBox: {
    marginTop: 10,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  formulaText: { fontFamily: FONTS.monoBold, fontSize: 13.5, color: THEME.accentCyan },
  bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  bulletText: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 13, color: THEME.textSecondary, lineHeight: 19 },
  cyanSquare: {
    width: 6,
    height: 6,
    borderRadius: 2,
    backgroundColor: THEME.accentCyan,
    marginTop: 7,
  },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  appItem: {
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  appItemText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.textPrimary },
});
