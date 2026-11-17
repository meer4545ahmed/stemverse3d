import React, { useMemo, useState } from 'react';
import { Heart, Search } from 'lucide-react';
import { searchExperiments } from '../data';
import { TRANSLATIONS } from '../data/i18n';
import { useAppStore } from '../store/useAppStore';
import { SubjectId } from '../types/stemverse';
import { ExperimentCard } from '../components/ExperimentCard';

const FILTER_TABS: { id: SubjectId | 'all'; label: string }[] = [
  { id: 'all', label: 'All (40)' },
  { id: 'physics', label: 'Physics' },
  { id: 'chemistry', label: 'Chemistry' },
  { id: 'biology', label: 'Biology' },
  { id: 'mathematics', label: 'Mathematics' },
];

export const SearchScreen: React.FC = () => {
  const { language, favoriteIds } = useAppStore();
  const t = TRANSLATIONS[language];
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<SubjectId | 'all'>('all');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const results = useMemo(() => {
    const matches = searchExperiments(query, subjectFilter);
    return onlyFavorites ? matches.filter((e) => favoriteIds.includes(e.id)) : matches;
  }, [query, subjectFilter, onlyFavorites, favoriteIds]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-6 space-y-6">
      <div>
        <h1 className="font-display text-3xl font-extrabold text-[#F4F6FA]">Experiment Index</h1>
        <p className="text-sm text-[#8B93A7] mt-1">
          Search 40 calibrated 3D laboratories across Physics, Chemistry, Biology, and Mathematics.
        </p>
      </div>

      {/* Search Bar & Favourites Toggle */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full h-12 pl-11 pr-4 rounded-lg bg-[#11141D] border border-[#222736] text-sm text-[#F4F6FA] placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]"
          />
        </div>
        <button
          type="button"
          onClick={() => setOnlyFavorites((v) => !v)}
          className={`h-12 px-4 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            onlyFavorites
              ? 'bg-[#1F170A] border-[#F59E0B] text-[#F59E0B]'
              : 'bg-[#11141D] border-[#222736] text-[#9CA3B5] hover:border-[#F59E0B]'
          }`}
        >
          <Heart className="w-4 h-4" fill={onlyFavorites ? 'currentColor' : 'none'} />
          <span>Saved ({favoriteIds.length})</span>
        </button>
      </div>

      {/* Subject Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSubjectFilter(tab.id)}
            className={`h-10 px-4 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              subjectFilter === tab.id
                ? 'bg-[#F4F6FA] text-[#06070B] border-[#F4F6FA]'
                : 'bg-[#11141D] text-[#8B93A7] border-[#222736] hover:text-[#F4F6FA] hover:border-[#3A435C]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-10 text-center">
          <p className="text-base font-medium text-[#F4F6FA]">No experiments matched your search</p>
          <p className="text-sm text-[#8B93A7] mt-1">Try searching "Heart", "Eye", "Ohm", "Prism", or "Quadratic".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </div>
      )}
    </main>
  );
};
