import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, Line, LinearGradient, Polygon, Stop } from 'react-native-svg';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';
import { FONTS, THEME } from '../src/theme/colors';

const LETTERS = [
  { char: 'V', color: '#EF4444' },
  { char: 'I', color: '#F97316' },
  { char: 'D', color: '#F59E0B' },
  { char: 'Y', color: '#10B981' },
  { char: 'A', color: '#38BDF8' },
  { char: 'V', color: '#3B82F6' },
  { char: 'E', color: '#6366F1' },
  { char: 'R', color: '#8B5CF6' },
  { char: 'S', color: '#EC4899' },
  { char: 'E', color: '#34D399' },
] as const;

function SpectralLetter({
  char,
  color,
  index,
}: {
  char: string;
  color: string;
  index: number;
}) {
  const progress = useSharedValue(0);
  const settle = useSharedValue(0);

  useEffect(() => {
    const startDelay = 520 + index * 95;
    progress.value = withDelay(
      startDelay,
      withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) })
    );
    settle.value = withDelay(
      startDelay + 240,
      withTiming(1, { duration: 420, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      { translateY: (1 - progress.value) * 16 },
      { scale: 0.85 + progress.value * 0.15 },
    ],
  }));

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(settle.value, [0, 1], [color, THEME.textPrimary]),
  }));

  return (
    <Animated.View style={animStyle}>
      <Animated.Text style={[styles.letter, textStyle]}>{char}</Animated.Text>
    </Animated.View>
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const prismScale = useSharedValue(0.6);
  const prismOpacity = useSharedValue(0);
  const barWidth = useSharedValue(0);
  const tagOpacity = useSharedValue(0);

  useEffect(() => {
    prismOpacity.value = withTiming(1, { duration: 500 });
    prismScale.value = withSequence(
      withTiming(1.06, { duration: 420, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 260 })
    );
    barWidth.value = withDelay(1500, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }));
    tagOpacity.value = withDelay(1750, withTiming(1, { duration: 500 }));

    const timer = setTimeout(() => {
      router.replace('/home');
    }, 3400);
    return () => clearTimeout(timer);
  }, []);

  const prismStyle = useAnimatedStyle(() => ({
    opacity: prismOpacity.value,
    transform: [{ scale: prismScale.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: barWidth.value }],
  }));

  const tagStyle = useAnimatedStyle(() => ({
    opacity: tagOpacity.value,
    transform: [{ translateY: (1 - tagOpacity.value) * 8 }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        {/* Converging Science Spectrum Beams + Precision Prism */}
        <Animated.View style={[styles.prismStage, prismStyle]}>
          <Svg width={240} height={120} viewBox="0 0 240 120">
            <Defs>
              <LinearGradient id="specBar" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#EF4444" />
                <Stop offset="0.28" stopColor="#F59E0B" />
                <Stop offset="0.52" stopColor="#10B981" />
                <Stop offset="0.76" stopColor="#38BDF8" />
                <Stop offset="1" stopColor="#8B5CF6" />
              </LinearGradient>
            </Defs>
            {/* Left converging beams */}
            <Line x1="12" y1="26" x2="104" y2="56" stroke="#EF4444" strokeWidth="2.2" strokeOpacity="0.85" />
            <Line x1="8" y1="48" x2="102" y2="59" stroke="#F59E0B" strokeWidth="2.2" strokeOpacity="0.85" />
            <Line x1="10" y1="70" x2="102" y2="62" stroke="#10B981" strokeWidth="2.2" strokeOpacity="0.85" />
            <Line x1="16" y1="92" x2="104" y2="65" stroke="#38BDF8" strokeWidth="2.2" strokeOpacity="0.85" />
            {/* Optical Glass Prism */}
            <Polygon
              points="120,22 152,86 88,86"
              fill="rgba(56,189,248,0.12)"
              stroke="#F4F6FA"
              strokeWidth="2.2"
            />
            {/* Right emerging spectrum */}
            <Line x1="138" y1="54" x2="226" y2="28" stroke="#EF4444" strokeWidth="2" strokeOpacity="0.9" />
            <Line x1="140" y1="58" x2="230" y2="48" stroke="#F59E0B" strokeWidth="2" strokeOpacity="0.9" />
            <Line x1="142" y1="62" x2="232" y2="64" stroke="#10B981" strokeWidth="2" strokeOpacity="0.9" />
            <Line x1="144" y1="66" x2="228" y2="82" stroke="#38BDF8" strokeWidth="2" strokeOpacity="0.9" />
            <Line x1="146" y1="70" x2="220" y2="98" stroke="#8B5CF6" strokeWidth="2" strokeOpacity="0.9" />
          </Svg>
        </Animated.View>

        {/* Sequential Series Wordmark Reveal */}
        <View style={styles.wordmarkRow}>
          {LETTERS.map((item, idx) => (
            <SpectralLetter key={`${item.char}-${idx}`} char={item.char} color={item.color} index={idx} />
          ))}
        </View>

        {/* Spectral Horizon Line */}
        <Animated.View style={[styles.spectralLineWrap, barStyle]}>
          <Svg width={240} height={3} viewBox="0 0 240 3">
            <Defs>
              <LinearGradient id="lineG" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="#EF4444" />
                <Stop offset="0.25" stopColor="#F59E0B" />
                <Stop offset="0.5" stopColor="#10B981" />
                <Stop offset="0.75" stopColor="#38BDF8" />
                <Stop offset="1" stopColor="#8B5CF6" />
              </LinearGradient>
            </Defs>
            <Polygon points="0,0 240,0 240,3 0,3" fill="url(#lineG)" />
          </Svg>
        </Animated.View>

        <Animated.View style={[styles.copyWrap, tagStyle]}>
          <Text style={styles.tagline}>A Virtual Platform for a Better Future.</Text>
          <Text style={styles.subcopy}>
            40 interactive 3D instruments across Physics, Chemistry, Biology & Mathematics. Offline-ready inside Expo Go.
          </Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.replace('/home')}
          style={styles.enterBtn}
        >
          <Text style={styles.enterBtnText}>Launch Laboratories</Text>
          <ArrowRight size={17} color={THEME.ctaText} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgPrimary,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prismStage: {
    marginBottom: 18,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 14,
  },
  letter: {
    fontFamily: FONTS.displayExtra,
    fontSize: 31,
    letterSpacing: 1.5,
  },
  spectralLineWrap: {
    width: 240,
    height: 3,
    marginBottom: 18,
  },
  copyWrap: {
    alignItems: 'center',
  },
  tagline: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: THEME.accentCyan,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  subcopy: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: THEME.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  footer: {
    paddingBottom: 12,
  },
  enterBtn: {
    height: 52,
    borderRadius: 10,
    backgroundColor: THEME.ctaBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  enterBtnText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: THEME.ctaText,
  },
});
