import React, { useMemo, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { EXPERIMENTS_BY_SUBJECT } from '../../src/data';
import { SUBJECTS } from '../../src/data/subjects';
import { SUBJECT_IMAGE_SOURCES } from '../../src/data/subjectAssets';
import { FONTS, THEME } from '../../src/theme/colors';
import { ExperimentCard } from '../../src/components/ExperimentCard';
import { SubjectId } from '../../src/types/stemverse';

export default function SubjectScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const subjectId = (params.id as SubjectId) || 'physics';
  const subject = SUBJECTS[subjectId] ?? SUBJECTS.physics;
  const experiments = EXPERIMENTS_BY_SUBJECT[subject.id] ?? EXPERIMENTS_BY_SUBJECT.physics;

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return experiments.filter((exp) => {
      if (selectedCategory !== 'All' && exp.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        exp.title.toLowerCase().includes(q) ||
        exp.code.toLowerCase().includes(q) ||
        exp.summary.toLowerCase().includes(q)
      );
    });
  }, [experiments, query, selectedCategory]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={19} color={THEME.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{subject.name}</Text>
          <Text style={styles.headerSub}>10 Interactive 3D Instruments</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Image
            source={SUBJECT_IMAGE_SOURCES[subject.id]}
            style={styles.heroImg}
            resizeMode="cover"
          />
          <View style={styles.heroContent}>
            <Text style={[styles.heroTag, { color: subject.accentHex }]}>{subject.tagline}</Text>
            <Text style={styles.heroDesc}>{subject.description}</Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Search size={16} color={THEME.textMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={`Search in ${subject.name}...`}
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
          style={styles.filterRow}
          contentContainerStyle={{ gap: 8 }}
        >
          {subject.categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.filterBtn, active && styles.filterBtnActive]}
              >
                <Text style={[styles.filterText, active && styles.filterTextActive]}>{cat}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <Text style={styles.countText}>SHOWING {filtered.length} OF 10 LABS</Text>

        {filtered.map((exp) => (
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
    backgroundColor: THEME.bgPrimary,
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
  headerSub: { fontFamily: FONTS.monoSemi, fontSize: 11, color: THEME.textMuted },
  scroll: { flex: 1, backgroundColor: THEME.bgSecondary },
  scrollContent: { padding: 16, paddingBottom: 32 },
  heroCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: 14,
  },
  heroImg: { width: '100%', height: 148 },
  heroContent: { padding: 14 },
  heroTag: { fontFamily: FONTS.monoBold, fontSize: 11, marginBottom: 4, textTransform: 'uppercase' },
  heroDesc: { fontFamily: FONTS.bodyMedium, fontSize: 12.5, color: THEME.textSecondary, lineHeight: 19 },
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
    marginBottom: 12,
  },
  searchInput: { flex: 1, fontFamily: FONTS.bodyMedium, fontSize: 13.5, color: THEME.textPrimary },
  filterRow: { marginBottom: 14 },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  filterBtnActive: {
    backgroundColor: THEME.ctaBg,
    borderColor: THEME.ctaBg,
  },
  filterText: { fontFamily: FONTS.bodySemi, fontSize: 12, color: THEME.textSecondary },
  filterTextActive: { fontFamily: FONTS.bodyBold, color: THEME.ctaText },
  countText: { fontFamily: FONTS.monoBold, fontSize: 10.5, color: THEME.textMuted, marginBottom: 10, letterSpacing: 0.6 },
});
