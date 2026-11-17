import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, Clock, Cuboid, Heart } from 'lucide-react-native';
import { Experiment } from '../types/stemverse';
import { SUBJECTS } from '../data/subjects';
import { FONTS, THEME } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';

interface ExperimentCardProps {
  experiment: Experiment;
  compact?: boolean;
}

export function ExperimentCard({ experiment, compact = false }: ExperimentCardProps) {
  const router = useRouter();
  const subject = SUBJECTS[experiment.subject];
  const { completedIds, favoriteIds, toggleFavorite } = useAppStore();

  const isCompleted = completedIds.includes(experiment.id);
  const isFavorite = favoriteIds.includes(experiment.id);

  const openDetails = () => router.push(`/experiment/${experiment.id}`);
  const openLab = () => router.push(`/lab/${experiment.id}`);

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={openDetails}
      style={[styles.card, compact && styles.cardCompact]}
    >
      <View style={styles.topRow}>
        <View style={styles.metaTop}>
          <Text style={[styles.codeText, { color: subject.accentHex }]}>{experiment.code}</Text>
          <Text style={styles.dotSep}>·</Text>
          <Text style={styles.categoryText} numberOfLines={1}>
            {experiment.category}
          </Text>
          {isCompleted && <CheckCircle2 size={13} color={THEME.green} />}
        </View>

        <TouchableOpacity
          onPress={() => toggleFavorite(experiment.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={[styles.favBtn, isFavorite && styles.favBtnActive]}
        >
          <Heart
            size={14}
            color={isFavorite ? THEME.accentCyan : THEME.textMuted}
            fill={isFavorite ? THEME.accentCyan : 'transparent'}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {experiment.title}
      </Text>

      {!compact && (
        <Text style={styles.summary} numberOfLines={2}>
          {experiment.summary}
        </Text>
      )}

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Clock size={12} color={THEME.textMuted} />
          <Text style={styles.metaText}>{experiment.estimatedMinutes} min</Text>
        </View>
        <Text style={styles.metaDivider}>/</Text>
        <Text style={styles.metaText}>{experiment.difficulty}</Text>
        <Text style={[styles.subjectLabel, { color: subject.accentHex }]}>
          {subject.shortName}
        </Text>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity activeOpacity={0.85} onPress={openDetails} style={styles.detailsBtn}>
          <Text style={styles.detailsBtnText}>Guide</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.85} onPress={openLab} style={styles.labBtn}>
          <Cuboid size={14} color={THEME.ctaText} />
          <Text style={styles.labBtnText}>3D Lab</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: 15,
    marginBottom: 12,
  },
  cardCompact: {
    width: 266,
    marginRight: 12,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    marginRight: 8,
  },
  codeText: {
    fontFamily: FONTS.monoBold,
    fontSize: 11.5,
    letterSpacing: 0.4,
  },
  dotSep: {
    color: THEME.textMuted,
    fontSize: 12,
  },
  categoryText: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 11.5,
    color: THEME.textSecondary,
    flexShrink: 1,
  },
  favBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.bgSecondary,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  favBtnActive: {
    backgroundColor: THEME.accentCyanSoft,
    borderColor: THEME.accentCyan,
  },
  title: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15.5,
    color: THEME.textPrimary,
    lineHeight: 21,
    marginBottom: 6,
  },
  summary: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 12.5,
    color: THEME.textSecondary,
    lineHeight: 18,
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 13,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontFamily: FONTS.monoSemi,
    fontSize: 11,
    color: THEME.textMuted,
  },
  metaDivider: {
    color: THEME.borderStrong,
    fontSize: 11,
  },
  subjectLabel: {
    marginLeft: 'auto',
    fontFamily: FONTS.monoBold,
    fontSize: 10.5,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailsBtn: {
    flex: 1,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsBtnText: {
    fontFamily: FONTS.bodySemi,
    fontSize: 12.5,
    color: THEME.textPrimary,
  },
  labBtn: {
    flex: 1.4,
    height: 38,
    borderRadius: 8,
    backgroundColor: THEME.ctaBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  labBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 12.5,
    color: THEME.ctaText,
  },
});
