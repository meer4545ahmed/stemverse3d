import React from 'react';
import { Search, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { SubjectId } from '../types/stemverse';

const SUBJECT_LINKS: { id: SubjectId; label: string }[] = [
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
  { id: 'mathematics', label: 'Mathematics' },
];

export const TopNavBar: React.FC = () => {
  const { screen, activeSubjectId, navigateTo, openSubject } = useAppStore();

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B0D13]/95 border-b border-[#222736]">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
        {/* Zone 1: VidyaVerse Spectral Prism Wordmark */}
        <button
          type="button"
          onClick={() => navigateTo('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-[#38BDF8] rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[#11141D] border border-[#222736] flex items-center justify-center">
            <svg viewBox="0 0 28 28" className="w-4 h-4">
              <polygon points="14,4 24,22 4,22" fill="none" stroke="#F4F6FA" strokeWidth="2" strokeLinejoin="round" />
              <line x1="2" y1="15" x2="10" y2="15" stroke="#EF4444" strokeWidth="1.6" />
              <line x1="18" y1="13" x2="26" y2="11" stroke="#38BDF8" strokeWidth="1.6" />
              <line x1="18" y1="17" x2="26" y2="19" stroke="#10B981" strokeWidth="1.6" />
            </svg>
          </span>
          <span className="font-display text-lg font-extrabold tracking-tight text-[#F4F6FA] whitespace-nowrap shrink-0">
            VIDYAVERSE
          </span>
        </button>

        {/* Zone 2: Clean Single-Line Navigation */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          <button
            type="button"
            onClick={() => navigateTo('home')}
            className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
              screen === 'home'
                ? 'text-[#F4F6FA] border-[#38BDF8] font-semibold'
                : 'text-[#8B93A7] border-transparent hover:text-[#F4F6FA]'
            }`}
          >
            Home
          </button>
          {SUBJECT_LINKS.map((item) => {
            const active = screen === 'subject' && activeSubjectId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => openSubject(item.id)}
                className={`whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 ${
                  active
                    ? 'text-[#F4F6FA] border-[#38BDF8] font-semibold'
                    : 'text-[#8B93A7] border-transparent hover:text-[#F4F6FA]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Compact Utility Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('search')}
            aria-label="Search experiments"
            className={`h-10 px-3 rounded-lg border text-sm font-medium flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
              screen === 'search'
                ? 'bg-[#F4F6FA] text-[#06070B] border-[#F4F6FA]'
                : 'bg-[#11141D] text-[#9CA3B5] border-[#222736] hover:border-[#3A435C] hover:text-[#F4F6FA]'
            }`}
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">Search</span>
          </button>
          <button
            type="button"
            onClick={() => navigateTo('profile')}
            aria-label="Student profile and progress"
            className={`h-10 w-10 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
              screen === 'profile'
                ? 'bg-[#38BDF8] text-[#06070B] border-[#38BDF8]'
                : 'bg-[#11141D] text-[#9CA3B5] border-[#222736] hover:border-[#3A435C] hover:text-[#F4F6FA]'
            }`}
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
