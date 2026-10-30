import React, { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { Dimension, Criterion } from '../types';
import { getScoreBadgeClass } from '../utils';

const EVIDENCE_PREVIEW_COUNT = 4;

const CriterionRow: React.FC<{ criterion: Criterion }> = ({ criterion }) => (
  <div className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
    <FileCode size={14} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-700 font-medium truncate">{criterion.display_name}</p>
      {criterion.details && (
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{criterion.details}</p>
      )}
    </div>
    <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full shrink-0', getScoreBadgeClass(criterion.score))}>
      {criterion.score?.toUpperCase()}
    </span>
  </div>
);

const DetailedFactorCard: React.FC<{
  dimension: Dimension;
  rank: number;
}> = ({ dimension, rank }) => {
  const [expanded, setExpanded] = useState(false);
  const [showAllCriteria, setShowAllCriteria] = useState(false);

  const activeCriteria = dimension.criteria ?? [];
  const hasDetails = activeCriteria.length > 0;
  const displayScore = Math.round(dimension.dimension_score ?? dimension.computed_score ?? 0);
  const isActive = dimension.dimension_active;

  const visibleCriteria = showAllCriteria
    ? activeCriteria
    : activeCriteria.slice(0, EVIDENCE_PREVIEW_COUNT);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden self-start h-fit">
      {/* Card header — always visible */}
      <button
        onClick={() => hasDetails && setExpanded((p) => !p)}
        className={cn(
          'w-full text-left p-5',
          hasDetails ? 'cursor-pointer' : 'cursor-default',
        )}
        aria-expanded={expanded}
      >
        <div className="flex items-start justify-between gap-2">
          {/* Left: title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                Critical
              </span>
              <span
                className={cn(
                  'text-xs font-semibold px-2 py-0.5 rounded-full',
                  isActive
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500',
                )}
              >
                {isActive ? 'ACTIVE' : 'INACTIVE'}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-800 leading-snug truncate">
              {dimension.display_name}
            </p>
            {dimension.summary && (
              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{dimension.summary}</p>
            )}
          </div>

          {/* Right: score + chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-lg font-bold text-gray-800">{displayScore}</span>
            {hasDetails ? (
              expanded ? (
                <ChevronDown size={16} className="text-gray-400" />
              ) : (
                <ChevronRight size={16} className="text-gray-400" />
              )
            ) : null}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-400 rounded-full transition-all duration-500"
            style={{ width: `${Math.max(displayScore, displayScore > 0 ? 3 : 0)}%` }}
          />
        </div>

        {/* Rank footer */}
        <p className="text-right text-xs text-gray-400 mt-2">Rank #{rank}</p>
      </button>

      {/* Expanded section */}
      {expanded && hasDetails && (
        <div className="border-t border-gray-100 px-5 pb-5 pt-3">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">
            Evidence ({activeCriteria.length})
          </p>

          <div className="space-y-0">
            {visibleCriteria.map((criterion) => (
              <CriterionRow key={criterion.name} criterion={criterion} />
            ))}
          </div>

          {activeCriteria.length > EVIDENCE_PREVIEW_COUNT && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowAllCriteria((p) => !p);
              }}
              className="mt-3 text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors"
            >
              {showAllCriteria
                ? 'Show less'
                : `Read more (${activeCriteria.length - EVIDENCE_PREVIEW_COUNT} more)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default DetailedFactorCard;
