import React, { useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Search, X } from 'lucide-react-native';
import { searchExperiments } from '../src/data';
import { SUBJECT_LIST } from '../src/data/subjects';
import { TRANSLATIONS } from '../src/data/i18n';
import { useAppStore } from '../src/store/useAppStore';
import { FONTS, THEME } from '../src/theme/colors';
import { ExperimentCard } from '../src/components/ExperimentCard';
import { SubjectId } from '../src/types/stemverse';

export default function SearchScreen() {
  const router = useRouter();
  const { favoriteIds, language } = useAppStore();
  const t = TRANSLATIONS[language];

  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const results = useMemo(() => {
    const base = searchExperiments(query, subjectFilter);
    return onlyFavorites ? base.filter((e) => favoriteIds.includes(e.id)) : base;
  }, [query, subjectFilter, onlyFavorites, favoriteIds]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={19} color={THEME.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All 40 Experiments</Text>
      </View>

      <View style={styles.controls}>
        <View style={styles.searchBox}>
          <Search size={16} color={THEME.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchPlaceholder}
            placeholderTextColor={THEME.textMuted}
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <X size={16} color={THEME.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          <TouchableOpacity
            onPress={() => setSubjectFilter('all')}
            style={[styles.filterBtn, subjectFilter === 'all' && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, subjectFilter === 'all' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {SUBJECT_LIST.map((s) => {
            const active = subjectFilter === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                onPress={() => setSubjectFilter(s.id)}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>
                  {s.shortName}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={() => setOnlyFavorites((v) => !v)}
            style={[styles.filterBtn, onlyFavorites && styles.favBtnActive]}
          >
            <Heart
              size={13}
              color={onlyFavorites ? THEME.ctaText : THEME.accentCyan}
              fill={onlyFavorites ? THEME.ctaText : 'transparent'}
            />
            <Text style={[styles.filterText, onlyFavorites && styles.filterTextActive]}>
              Saved
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.count}>{results.length} MATCHING INSTRUMENTS</Text>
        {results.map((exp) => (
          <ExperimentCard key={exp.id} experiment={exp} />
        ))}
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
  controls: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
    backgroundColor: THEME.bgPrimary,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: THEME.bgCard,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 13.5, color: THEME.textPrimary },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterBtnActive: { backgroundColor: THEME.ctaBg, borderColor: THEME.ctaBg },
  favBtnActive: { backgroundColor: THEME.accentCyan, borderColor: THEME.accentCyan },
  filterText: { fontFamily: FONTS.bodyBold, fontSize: 12, color: THEME.textSecondary },
  filterTextActive: { color: THEME.ctaText },
  scroll: { flex: 1, backgroundColor: THEME.bgSecondary },
  scrollContent: { padding: 16, paddingBottom: 32 },
  count: { fontFamily: FONTS.monoBold, fontSize: 10.5, color: THEME.textMuted, marginBottom: 10, letterSpacing: 0.6 },
});
