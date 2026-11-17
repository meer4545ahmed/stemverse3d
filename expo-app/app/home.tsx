import React, { useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Polygon } from 'react-native-svg';
import {
  Atom,
  Award,
  CheckCircle2,
  ChevronRight,
  Compass,
  Flame,
  FlaskConical,
  HeartPulse,
  Search,
  Sigma,
  User,
} from 'lucide-react-native';
import {
  ALL_EXPERIMENTS,
  DAILY_STEM_CHALLENGE,
  FEATURED_EXPERIMENT_ID,
  POPULAR_EXPERIMENT_IDS,
  getExperimentById,
} from '../src/data';
import { SUBJECT_LIST } from '../src/data/subjects';
import { HERO_LAB_SOURCE, SUBJECT_IMAGE_SOURCES } from '../src/data/subjectAssets';
import { TRANSLATIONS } from '../src/data/i18n';
import { useAppStore } from '../src/store/useAppStore';
import { FONTS, THEME } from '../src/theme/colors';
import { ExperimentCard } from '../src/components/ExperimentCard';
import { SubjectId } from '../src/types/stemverse';

const SUBJECT_ICONS: Record<SubjectId, typeof Atom> = {
  physics: Atom,
  chemistry: FlaskConical,
  biology: HeartPulse,
  mathematics: Sigma,
};

export default function HomeScreen() {
  const router = useRouter();
  const {
    student,
    exploredIds,
    completedIds,
    recentlyViewedIds,
    streakDays,
    dailyChallengeAnswered,
    setDailyChallengeAnswered,
    language,
  } = useAppStore();

  const t = TRANSLATIONS[language];
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [challengeSubmitted, setChallengeSubmitted] = useState(dailyChallengeAnswered);

  const featuredExp = getExperimentById(FEATURED_EXPERIMENT_ID);
  const popularExperiments = POPULAR_EXPERIMENT_IDS.map((id) => getExperimentById(id));
  const recentExperiments = recentlyViewedIds.map((id) => getExperimentById(id));
  const continueExp = recentExperiments[0] ?? featuredExp;

  const progressPercent = Math.round((completedIds.length / ALL_EXPERIMENTS.length) * 100);

  const handleSubmitChallenge = () => {
    if (selectedChoice === null) return;
    setChallengeSubmitted(true);
    setDailyChallengeAnswered();
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Precision Obsidian Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIcon}>
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Polygon
                points="12,3 21,19 3,19"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.2"
              />
            </Svg>
          </View>
          <View>
            <Text style={styles.brandTitle}>VIDYAVERSE</Text>
            <Text style={styles.welcomeText}>Welcome, {student.name.split(' ')[0]} · Local Ready</Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push('/search')}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <Search size={18} color={THEME.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/profile')}
            style={styles.iconBtn}
            activeOpacity={0.8}
          >
            <User size={18} color={THEME.accentCyan} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Optical Bench Card */}
        <View style={styles.heroCard}>
          <Image source={HERO_LAB_SOURCE} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroBody}>
            <Text style={styles.heroKicker}>VIRTUAL INSTRUMENTATION STUDIO</Text>
            <Text style={styles.heroTitle}>{t.heroTitle}</Text>
            <Text style={styles.heroSubtitle}>{t.heroSubtitle}</Text>

            <View style={styles.heroButtons}>
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => router.push(`/lab/${featuredExp.id}`)}
                style={styles.heroPrimaryBtn}
              >
                <Text style={styles.heroPrimaryText}>{t.exploreFeatured}</Text>
                <ChevronRight size={16} color={THEME.ctaText} />
              </TouchableOpacity>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => router.push('/lab/P06')}
                style={styles.heroSecondaryBtn}
              >
                <Text style={styles.heroSecondaryText}>Ohm&apos;s Scope</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Four Subject Labs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.subjectLabs}</Text>
          <Text style={styles.sectionMeta}>40 MODULES</Text>
        </View>

        <View style={styles.subjectGrid}>
          {SUBJECT_LIST.map((subject) => {
            const Icon = SUBJECT_ICONS[subject.id];
            return (
              <TouchableOpacity
                key={subject.id}
                activeOpacity={0.88}
                onPress={() => router.push(`/subject/${subject.id}`)}
                style={styles.subjectCard}
              >
                <Image
                  source={SUBJECT_IMAGE_SOURCES[subject.id]}
                  style={styles.subjectArt}
                  resizeMode="cover"
                />
                <View style={styles.subjectBody}>
                  <View style={styles.subjectTop}>
                    <Icon size={16} color={subject.accentHex} />
                    <Text style={[styles.subjectCount, { color: subject.accentHex }]}>10 LABS</Text>
                  </View>
                  <Text style={styles.subjectName}>{subject.name}</Text>
                  <Text style={styles.subjectTagline} numberOfLines={2}>
                    {subject.tagline}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Continue Exploring */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.continueExploring}</Text>
          <TouchableOpacity onPress={() => router.push(`/lab/${continueExp.id}`)}>
            <Text style={styles.linkText}>Resume</Text>
          </TouchableOpacity>
        </View>
        <ExperimentCard experiment={continueExp} />

        {/* Learning Journey */}
        <View style={styles.journeyCard}>
          <View style={styles.journeyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Award size={17} color={THEME.accentCyan} />
              <Text style={styles.journeyTitle}>{t.learningJourney}</Text>
            </View>
            <View style={styles.streakRow}>
              <Flame size={13} color={THEME.amber} />
              <Text style={styles.streakText}>{streakDays}D STREAK</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(8, progressPercent)}%` }]} />
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{exploredIds.length}/40</Text>
              <Text style={styles.statLabel}>Explored</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: THEME.green }]}>{completedIds.length}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: THEME.accentCyan }]}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Mastery</Text>
            </View>
          </View>
        </View>

        {/* Popular Experiments */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.popularExperiments}</Text>
          <TouchableOpacity onPress={() => router.push('/search')}>
            <Text style={styles.linkText}>All 40</Text>
          </TouchableOpacity>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {popularExperiments.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} compact />
          ))}
        </ScrollView>

        {/* Featured 3D Experience */}
        <View style={styles.featuredCard}>
          <View style={styles.featuredHeader}>
            <View style={styles.featuredMetaRow}>
              <Compass size={14} color={THEME.accentCyan} />
              <Text style={styles.featuredKicker}>{t.featuredExperience}</Text>
            </View>
            <Text style={styles.featuredCode}>{featuredExp.code}</Text>
          </View>
          <Text style={styles.featuredTitle}>{featuredExp.title}</Text>
          <Text style={styles.featuredDesc}>{featuredExp.introduction}</Text>
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => router.push(`/lab/${featuredExp.id}`)}
            style={styles.featuredBtn}
          >
            <Text style={styles.featuredBtnText}>{t.openLab}</Text>
            <ChevronRight size={16} color={THEME.ctaText} />
          </TouchableOpacity>
        </View>

        {/* Recently Viewed */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{t.recentlyViewed}</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
          {recentExperiments.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} compact />
          ))}
        </ScrollView>

        {/* Daily STEM Challenge */}
        <View style={styles.challengeCard}>
          <View style={styles.challengeTop}>
            <Text style={styles.challengeKicker}>{t.dailyChallenge}</Text>
            <TouchableOpacity onPress={() => router.push(`/lab/${DAILY_STEM_CHALLENGE.experimentId}`)}>
              <Text style={styles.linkText}>Verify in 3D</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.challengeQuestion}>{DAILY_STEM_CHALLENGE.question}</Text>

          {DAILY_STEM_CHALLENGE.options.map((opt, idx) => {
            const isSelected = selectedChoice === idx;
            const isCorrect = challengeSubmitted && idx === DAILY_STEM_CHALLENGE.correctIndex;
            const isWrong = challengeSubmitted && isSelected && idx !== DAILY_STEM_CHALLENGE.correctIndex;
            return (
              <TouchableOpacity
                key={opt}
                disabled={challengeSubmitted}
                onPress={() => setSelectedChoice(idx)}
                style={[
                  styles.optionBtn,
                  isSelected && styles.optionSelected,
                  isCorrect && styles.optionCorrect,
                  isWrong && styles.optionWrong,
                ]}
              >
                <Text
                  style={[
                    styles.optionText,
                    isCorrect && { color: THEME.greenLight, fontFamily: FONTS.bodyBold },
                  ]}
                >
                  {opt}
                </Text>
                {isCorrect && <CheckCircle2 size={16} color={THEME.green} />}
              </TouchableOpacity>
            );
          })}

          {!challengeSubmitted ? (
            <TouchableOpacity
              disabled={selectedChoice === null}
              onPress={handleSubmitChallenge}
              style={[
                styles.submitChallengeBtn,
                selectedChoice === null && { opacity: 0.45 },
              ]}
            >
              <Text style={styles.submitChallengeText}>{t.submitAnswer}</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.explanationBox}>
              <Text style={styles.explanationText}>{DAILY_STEM_CHALLENGE.explanation}</Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bgPrimary,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: { fontFamily: FONTS.displayExtra, fontSize: 16, color: THEME.textPrimary, letterSpacing: 1 },
  welcomeText: { fontFamily: FONTS.monoSemi, fontSize: 10.5, color: THEME.textMuted },
  headerActions: { flexDirection: 'row', gap: 8 },
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
  scroll: { flex: 1, backgroundColor: THEME.bgSecondary },
  scrollContent: { padding: 16, paddingBottom: 38 },
  heroCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 22,
  },
  heroImage: { width: '100%', height: 176 },
  heroBody: { padding: 16 },
  heroKicker: {
    fontFamily: FONTS.monoBold,
    fontSize: 10.5,
    color: THEME.accentCyan,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: FONTS.displayBold,
    fontSize: 21,
    color: THEME.textPrimary,
    lineHeight: 27,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: THEME.textSecondary,
    lineHeight: 19,
    marginBottom: 15,
  },
  heroButtons: { flexDirection: 'row', gap: 8 },
  heroPrimaryBtn: {
    flex: 1.5,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.ctaBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroPrimaryText: { fontFamily: FONTS.bodyBold, color: THEME.ctaText, fontSize: 13 },
  heroSecondaryBtn: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSecondaryText: { fontFamily: FONTS.bodyBold, color: THEME.textPrimary, fontSize: 12.5 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: { fontFamily: FONTS.displayBold, fontSize: 16.5, color: THEME.textPrimary },
  sectionMeta: { fontFamily: FONTS.monoBold, fontSize: 11, color: THEME.textMuted, letterSpacing: 0.6 },
  linkText: { fontFamily: FONTS.bodyBold, fontSize: 12.5, color: THEME.accentCyan },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  subjectCard: {
    width: '48.4%',
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  subjectArt: { width: '100%', height: 96 },
  subjectBody: { padding: 12 },
  subjectTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  subjectCount: { fontFamily: FONTS.monoBold, fontSize: 10.5, letterSpacing: 0.5 },
  subjectName: { fontFamily: FONTS.bodyBold, fontSize: 14, color: THEME.textPrimary, marginBottom: 3 },
  subjectTagline: { fontFamily: FONTS.bodyMedium, fontSize: 11.5, color: THEME.textSecondary, lineHeight: 16 },
  journeyCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  journeyTitle: { fontFamily: FONTS.bodyBold, fontSize: 14.5, color: THEME.textPrimary },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakText: { fontFamily: FONTS.monoBold, fontSize: 11, color: THEME.amber },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.bgSecondary,
    overflow: 'hidden',
    marginBottom: 14,
  },
  progressFill: { height: '100%', backgroundColor: THEME.accentCyan, borderRadius: 3 },
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    backgroundColor: THEME.bgSecondary,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statValue: { fontFamily: FONTS.monoBold, fontSize: 16, color: THEME.textPrimary },
  statLabel: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: THEME.textMuted, marginTop: 2 },
  horizontalList: { marginBottom: 18 },
  featuredCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    padding: 16,
    marginBottom: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  featuredMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredKicker: { fontFamily: FONTS.monoBold, fontSize: 10.5, color: THEME.accentCyan, textTransform: 'uppercase' },
  featuredCode: { fontFamily: FONTS.monoBold, fontSize: 11.5, color: THEME.textMuted },
  featuredTitle: { fontFamily: FONTS.displayBold, fontSize: 17.5, color: THEME.textPrimary, marginBottom: 6 },
  featuredDesc: { fontFamily: FONTS.bodyMedium, fontSize: 12.5, color: THEME.textSecondary, lineHeight: 19, marginBottom: 14 },
  featuredBtn: {
    height: 42,
    borderRadius: 8,
    backgroundColor: THEME.ctaBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  featuredBtnText: { fontFamily: FONTS.bodyBold, fontSize: 13.5, color: THEME.ctaText },
  challengeCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginTop: 4,
  },
  challengeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  challengeKicker: { fontFamily: FONTS.monoBold, fontSize: 11, color: THEME.amber, textTransform: 'uppercase' },
  challengeQuestion: {
    fontFamily: FONTS.bodySemi,
    fontSize: 13.5,
    color: THEME.textPrimary,
    lineHeight: 20,
    marginBottom: 12,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bgSecondary,
    marginBottom: 8,
  },
  optionSelected: { borderColor: THEME.accentCyan, backgroundColor: THEME.accentCyanSoft },
  optionCorrect: { borderColor: THEME.green, backgroundColor: THEME.greenSoft },
  optionWrong: { borderColor: THEME.rose, backgroundColor: 'rgba(239, 68, 68, 0.14)' },
  optionText: { fontFamily: FONTS.bodyMedium, fontSize: 13, color: THEME.textPrimary, flex: 1 },
  submitChallengeBtn: {
    marginTop: 6,
    height: 42,
    borderRadius: 8,
    backgroundColor: THEME.ctaBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitChallengeText: { fontFamily: FONTS.bodyBold, color: THEME.ctaText, fontSize: 13.5 },
  explanationBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: THEME.greenSoft,
    borderWidth: 1,
    borderColor: THEME.green,
  },
  explanationText: { fontFamily: FONTS.bodyMedium, fontSize: 12.5, color: THEME.textPrimary, lineHeight: 18 },
});
