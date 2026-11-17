import React from 'react';
import { ArrowRight, CheckCircle2, Heart } from 'lucide-react';
import { Experiment } from '../types/stemverse';
import { useAppStore } from '../store/useAppStore';

interface ExperimentCardProps {
  experiment: Experiment;
  compact?: boolean;
}

const SUBJECT_ACCENT: Record<string, string> = {
  physics: '#38BDF8',
  chemistry: '#10B981',
  biology: '#EF4444',
  mathematics: '#F59E0B',
};

export const ExperimentCard: React.FC<ExperimentCardProps> = ({ experiment, compact = false }) => {
  const { completedIds, favoriteIds, toggleFavorite, openExperiment, openLaboratory } = useAppStore();
  const isCompleted = completedIds.includes(experiment.id);
  const isFav = favoriteIds.includes(experiment.id);
  const accent = SUBJECT_ACCENT[experiment.subject] ?? '#38BDF8';

  return (
    <div className="group bg-[#11141D] border border-[#222736] rounded-xl p-5 flex flex-col justify-between transition-colors hover:border-[#363E54]">
      <div>
        {/* Zero-pill tabular metadata row */}
        <div className="flex items-center justify-between gap-2 text-xs text-[#8B93A7]">
          <div className="flex items-center gap-1.5 truncate font-mono-tech tabular-nums">
            <span style={{ color: accent }} className="font-semibold">
              {experiment.code}
            </span>
            <span aria-hidden="true">·</span>
            <span className="truncate">{experiment.category}</span>
            <span aria-hidden="true">·</span>
            <span>{experiment.estimatedMinutes} min</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(experiment.id);
            }}
            aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
              isFav ? 'text-[#F59E0B] bg-[#181C28]' : 'text-[#64748B] hover:text-[#F4F6FA] hover:bg-[#181C28]'
            }`}
          >
            <Heart className="w-4 h-4" fill={isFav ? 'currentColor' : 'none'} />
          </button>
        </div>

        <h3 className="font-display text-lg font-bold text-[#F4F6FA] mt-2 leading-snug">
          {experiment.title}
        </h3>

        {!compact && (
          <p className="text-sm text-[#9CA3B5] mt-2 line-clamp-2 leading-relaxed">
            {experiment.summary}
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-[#1D2230] flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-[#8B93A7]">
          <span>{experiment.difficulty}</span>
          {isCompleted && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[#34D399] inline-flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openExperiment(experiment.id)}
            className="h-9 px-3 rounded-lg text-xs font-medium text-[#CBD5E1] hover:text-[#F4F6FA] bg-[#171B26] border border-[#262C3D] hover:border-[#3A435C] transition-colors whitespace-nowrap"
          >
            Brief
          </button>
          <button
            type="button"
            onClick={() => openLaboratory(experiment.id)}
            className="h-9 px-3.5 rounded-lg text-xs font-semibold text-[#06070B] bg-[#F4F6FA] hover:bg-white transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <span>3D Lab</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
