import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Cpu, Flame, Globe, User } from 'lucide-react-native';
import { ALL_EXPERIMENTS } from '../src/data';
import { LANGUAGE_LABELS, TRANSLATIONS } from '../src/data/i18n';
import { useAppStore } from '../src/store/useAppStore';
import { FONTS, THEME } from '../src/theme/colors';
import { LanguageCode } from '../src/types/stemverse';

export default function ProfileScreen() {
  const router = useRouter();
  const {
    student,
    exploredIds,
    completedIds,
    favoriteIds,
    streakDays,
    language,
    setLanguage,
    lightweight3D,
    setLightweight3D,
  } = useAppStore();

  const t = TRANSLATIONS[language];
  const mastery = Math.round((completedIds.length / ALL_EXPERIMENTS.length) * 100);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={19} color={THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile & Preferences</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <User size={28} color={THEME.accentCyan} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{student.name}</Text>
            <Text style={styles.meta}>{student.grade} · Local Offline Mode</Text>
            <Text style={styles.school}>
              {student.school} · {student.city}
            </Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Flame size={18} color={THEME.amber} />
            <Text style={styles.statNum}>{streakDays}d</Text>
            <Text style={styles.statLbl}>Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={18} color={THEME.green} />
            <Text style={styles.statNum}>{completedIds.length}/40</Text>
            <Text style={styles.statLbl}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: THEME.accentCyan }]}>{mastery}%</Text>
            <Text style={styles.statLbl}>Mastery</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <Globe size={16} color={THEME.accentCyan} />
            <Text style={styles.cardTitle}>Interface Language</Text>
          </View>
          <View style={styles.langRow}>
            {(['en', 'hi', 'kn'] as LanguageCode[]).map((code) => {
              const active = language === code;
              return (
                <TouchableOpacity
                  key={code}
                  onPress={() => setLanguage(code)}
                  style={[styles.langBtn, active && styles.langBtnActive]}
                >
                  <Text style={[styles.langText, active && styles.langTextActive]}>
                    {LANGUAGE_LABELS[code]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <View style={styles.cardHead}>
                <Cpu size={16} color={THEME.accentCyan} />
                <Text style={styles.cardTitle}>{t.lightweightMode}</Text>
              </View>
              <Text style={styles.cardSub}>
                Reduces shadow map & pixel ratio for smoother 3D frame rates on entry-level devices.
              </Text>
            </View>
            <Switch
              value={lightweight3D}
              onValueChange={setLightweight3D}
              trackColor={{ false: THEME.borderStrong, true: THEME.accentCyan }}
              thumbColor="#F4F6FA"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Local Progress Summary</Text>
          <Text style={styles.cardSub}>
            Explored Labs: {exploredIds.length} · Saved Favorites: {favoriteIds.length} · No Google Sign-In Required
          </Text>
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
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontFamily: FONTS.displayBold, fontSize: 17, color: THEME.textPrimary },
  scroll: { flex: 1, backgroundColor: THEME.bgSecondary },
  scrollContent: { padding: 16, paddingBottom: 32 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: { fontFamily: FONTS.displayBold, fontSize: 17, color: THEME.textPrimary },
  meta: { fontFamily: FONTS.monoSemi, fontSize: 11.5, color: THEME.accentCyan, marginTop: 2 },
  school: { fontFamily: FONTS.bodyMedium, fontSize: 12, color: THEME.textMuted, marginTop: 2 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1,
    backgroundColor: THEME.bgCard,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statNum: { fontFamily: FONTS.monoBold, fontSize: 17, color: THEME.textPrimary },
  statLbl: { fontFamily: FONTS.bodyMedium, fontSize: 11, color: THEME.textMuted },
  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 16,
    marginBottom: 12,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  cardTitle: { fontFamily: FONTS.displayBold, fontSize: 14.5, color: THEME.textPrimary },
  cardSub: { fontFamily: FONTS.bodyMedium, fontSize: 12.5, color: THEME.textSecondary, lineHeight: 18 },
  langRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  langBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.border,
    alignItems: 'center',
  },
  langBtnActive: { backgroundColor: THEME.ctaBg, borderColor: THEME.ctaBg },
  langText: { fontFamily: FONTS.bodyBold, fontSize: 12.5, color: THEME.textPrimary },
  langTextActive: { color: THEME.ctaText },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
});
