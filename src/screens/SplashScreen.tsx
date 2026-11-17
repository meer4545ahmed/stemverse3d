import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';

const LETTERS = [
  { char: 'V', color: '#EF4444' },
  { char: 'I', color: '#F97316' },
  { char: 'D', color: '#F59E0B' },
  { char: 'Y', color: '#84CC16' },
  { char: 'A', color: '#10B981' },
  { char: 'V', color: '#06B6D4' },
  { char: 'E', color: '#38BDF8' },
  { char: 'R', color: '#3B82F6' },
  { char: 'S', color: '#6366F1' },
  { char: 'E', color: '#8B5CF6' },
];

const BEAMS = [
  { color: '#EF4444', startX: -360, startY: -180, rotate: -24, delay: 0.04 },
  { color: '#F59E0B', startX: 360, startY: -150, rotate: 20, delay: 0.1 },
  { color: '#10B981', startX: -380, startY: 40, rotate: 6, delay: 0.16 },
  { color: '#3B82F6', startX: 380, startY: 70, rotate: -10, delay: 0.22 },
  { color: '#8B5CF6', startX: 0, startY: -260, rotate: 90, delay: 0.28 },
];

export const SplashScreen: React.FC = () => {
  const { navigateTo } = useAppStore();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      navigateTo('home');
    }, 3400);
    return () => window.clearTimeout(timer);
  }, [navigateTo]);

  return (
    <div className="relative min-h-screen bg-[#06070B] text-[#F4F6FA] flex flex-col items-center justify-center px-6 overflow-hidden select-none">
      {/* Subtle Optical Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #1D2230 1px, transparent 1px), linear-gradient(to bottom, #1D2230 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Converging Science Spectrum Beams */}
      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center">
        <div className="relative h-28 w-full flex items-center justify-center mb-3">
          {BEAMS.map((beam, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: beam.startX, y: beam.startY, scaleX: 0.4 }}
              animate={{
                opacity: [0, 0.95, 0.9, 0],
                x: [beam.startX, 0, 0, 0],
                y: [beam.startY, 0, 0, 0],
                scaleX: [0.4, 1.15, 0.2, 0],
              }}
              transition={{
                duration: 0.95,
                delay: beam.delay,
                times: [0, 0.45, 0.78, 1],
                ease: [0.16, 1, 0.3, 1],
              }}
              style={{
                background: `linear-gradient(90deg, transparent, ${beam.color}, #FFFFFF)`,
                transform: `rotate(${beam.rotate}deg)`,
              }}
              className="absolute w-52 h-[2px] rounded-full"
            />
          ))}

          {/* Spectral Prism Mark */}
          <motion.svg
            viewBox="0 0 80 80"
            className="w-16 h-16"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <polygon
              points="40,10 68,62 12,62"
              fill="#0E1118"
              stroke="#F4F6FA"
              strokeWidth="2.5"
              strokeLinejoin="round"
            />
            <polygon
              points="40,22 54,54 26,54"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="1.5"
              opacity="0.7"
            />
          </motion.svg>
        </div>

        {/* Sequential Letter-by-Letter Spectral Reveal: V -> I -> D -> Y -> A -> V -> E -> R -> S -> E */}
        <div
          className="flex items-center justify-center gap-1 sm:gap-2"
          aria-label="VIDYAVERSE"
        >
          {LETTERS.map((item, idx) => (
            <motion.span
              key={`${item.char}-${idx}`}
              initial={{ opacity: 0, y: 18, scale: 0.78, color: item.color }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
                color: [item.color, item.color, '#F4F6FA'],
              }}
              transition={{
                duration: 0.42,
                delay: 0.58 + idx * 0.085,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="font-display text-4xl sm:text-6xl font-extrabold tracking-tight inline-block"
              style={{ textShadow: `0 0 18px ${item.color}44` }}
            >
              {item.char}
            </motion.span>
          ))}
        </div>

        {/* Spectral Convergence Line */}
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ duration: 0.65, delay: 1.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 h-[2px] w-64 sm:w-80 origin-center rounded-full"
          style={{
            background:
              'linear-gradient(90deg, #EF4444, #F59E0B, #10B981, #38BDF8, #8B5CF6)',
          }}
        />

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 1.65 }}
          className="mt-5 text-sm sm:text-base text-[#9CA3B5] font-medium tracking-wide text-center"
        >
          A Virtual Platform for a Better Future.
        </motion.p>

        <motion.button
          type="button"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 1.9 }}
          onClick={() => navigateTo('home')}
          className="mt-8 h-11 px-6 rounded-lg bg-[#F4F6FA] hover:bg-white text-[#06070B] font-semibold text-sm inline-flex items-center gap-2 transition-colors whitespace-nowrap"
        >
          <span>Launch Laboratories</span>
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </div>
    </div>
  );
};
