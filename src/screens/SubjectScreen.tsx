import React, { useMemo, useState } from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { SUBJECTS } from '../data/subjects';
import { EXPERIMENTS_BY_SUBJECT } from '../data';
import { useAppStore } from '../store/useAppStore';
import { ExperimentCard } from '../components/ExperimentCard';

export const SubjectScreen: React.FC = () => {
  const { activeSubjectId, navigateTo, completedIds } = useAppStore();
  const subject = SUBJECTS[activeSubjectId];
  const allSubjectExps = EXPERIMENTS_BY_SUBJECT[activeSubjectId];

  const [category, setCategory] = useState('All');
  const [query, setQuery] = useState('');

  React.useEffect(() => {
    setCategory('All');
    setQuery('');
  }, [activeSubjectId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSubjectExps.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q)
      );
    });
  }, [allSubjectExps, category, query]);

  const completedCount = allSubjectExps.filter((e) => completedIds.includes(e.id)).length;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 pt-6 space-y-8">
      <button
        type="button"
        onClick={() => navigateTo('home')}
        className="inline-flex items-center gap-2 text-sm text-[#8B93A7] hover:text-[#F4F6FA] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Laboratory Home</span>
      </button>

      {/* Subject Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-stretch bg-[#11141D] border border-[#222736] rounded-2xl overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <p className="text-xs font-mono-tech font-semibold" style={{ color: subject.accentHex }}>
              {allSubjectExps.length} INTERACTIVE LABS · {completedCount} VERIFIED
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#F4F6FA] mt-2">
              {subject.name}
            </h1>
            <p className="text-sm sm:text-base text-[#9CA3B5] mt-3 max-w-2xl leading-relaxed">
              {subject.description}
            </p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Filter ${subject.shortName} experiments...`}
                className="w-full h-11 pl-10 pr-4 rounded-lg bg-[#0B0D13] border border-[#222736] text-sm text-[#F4F6FA] placeholder:text-[#64748B] focus:outline-none focus:border-[#38BDF8]"
              />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 relative min-h-[220px] bg-[#090B10]">
          <img
            src={subject.heroImage}
            alt={subject.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11141D] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#11141D] lg:to-transparent" />
        </div>
      </section>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {subject.categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`h-10 px-4 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              category === cat
                ? 'bg-[#F4F6FA] text-[#06070B] border-[#F4F6FA]'
                : 'bg-[#11141D] text-[#8B93A7] border-[#222736] hover:text-[#F4F6FA] hover:border-[#3A435C]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Experiment Grid */}
      {filtered.length === 0 ? (
        <div className="bg-[#11141D] border border-[#222736] rounded-xl p-10 text-center">
          <p className="text-base font-medium text-[#F4F6FA]">No matching experiments found</p>
          <p className="text-sm text-[#8B93A7] mt-1">Try clearing the filter or search phrase.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((exp) => (
            <ExperimentCard key={exp.id} experiment={exp} />
          ))}
        </div>
      )}
    </main>
  );
};
