import { Platform, TextStyle } from 'react-native';

export const FONTS = {
  display: Platform.select({
    ios: 'AvenirNext-Heavy',
    android: 'sans-serif-condensed',
    default: 'System',
  }),
  heading: Platform.select({
    ios: 'AvenirNext-Bold',
    android: 'sans-serif-medium',
    default: 'System',
  }),
  editorial: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  serifDisplay: Platform.select({
    ios: 'Didot-Bold',
    android: 'serif',
    default: 'serif',
  }),
  mono: Platform.select({
    ios: 'Menlo-Bold',
    android: 'monospace',
    default: 'monospace',
  }),
  body: Platform.select({
    ios: 'AvenirNext-Medium',
    android: 'sans-serif',
    default: 'System',
  }),
} as const;

export const TYPE_STYLES: Record<'display' | 'editorial' | 'mono', TextStyle> = {
  display: {
    fontFamily: FONTS.display,
    letterSpacing: -0.6,
  },
  editorial: {
    fontFamily: FONTS.editorial,
    fontStyle: 'italic',
  },
  mono: {
    fontFamily: FONTS.mono,
    fontVariant: ['tabular-nums'],
  },
};
