import React, { useMemo, useState } from 'react';
import type { CloudNativeData, Dimension, RoadmapItem, ViewMode } from './types';
import { VIEW_MODES } from './types';
import { getProjectName, getRoadmapItems, computeDimensionRanks } from './utils';
import { cn } from '../../lib/utils';
import CloudScoreGauge from './components/CloudScoreGauge';
import CloudFactorsRadar from './components/CloudFactorsRadar';
import DetailedFactorCard from './components/DetailedFactorCard';
import MigrationStrategySection from './components/MigrationStrategySection';
import FullDiagnosticReportModal from './components/FullDiagnosticReportModal';
import RoadmapTasksTable from './components/RoadmapTasksTable';
import { Info, ChevronDown } from 'lucide-react';
import { VIEW_MODE_LABELS } from './constant';

const CloudReadinessViewer: React.FC<{ data: CloudNativeData }> = ({ data }) => {
  const projectName = useMemo(() => getProjectName(data.repo_path ?? ''), [data.repo_path]);
  const dimensions = useMemo(() => data.dimensions ?? [], [data.dimensions]);

  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<ViewMode>('factor-wise');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const displayedFactors = useMemo<Dimension[]>(() => {
    if (viewMode === 'factor-wise') {
      return dimensions;
    }
    if (viewMode === 'active-only') {
      return dimensions.filter((d) => d.dimension_active);
    }
    return [];
  }, [viewMode, dimensions]);

  const displayedRoadmap = useMemo<RoadmapItem[]>(() => {
    if (viewMode === 'roadmap-tasks') {
      return getRoadmapItems(data);
    }
    return [];
  }, [viewMode, data]);

  const rankMap = useMemo(() => computeDimensionRanks(dimensions), [dimensions]);


  return (
    <div className="min-h-screen bg-gray-50 p-6 space-y-6">
      {/* Top Grid: Score Gauge + Radar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CloudScoreGauge
          score={data.overall_score ?? 0}
          onViewDetails={() => setShowReportModal(true)}
        />
        <CloudFactorsRadar dimensions={dimensions} />
      </div>

      {/* Detailed Factor Analysis */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-base font-semibold text-gray-800">Detailed Factor Analysis</h3>
          <div className="flex items-center gap-3">
            {/* VIEW label outside the box */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                VIEW:
              </span>
              <div
                className="relative"
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                    setIsDropdownOpen(false);
                  }
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 border border-gray-300 hover:border-gray-400 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors focus:outline-none"
                >
                  <span>{VIEW_MODE_LABELS[viewMode]}</span>
                  <ChevronDown
                    size={14}
                    className={cn(
                      'text-gray-400 transition-transform duration-200',
                      isDropdownOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isDropdownOpen && (
                  <>
                    {/* Backdrop to capture outside clicks without window/document listeners */}
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setIsDropdownOpen(false)}
                      aria-hidden="true"
                    />
                    <div className="absolute right-0 top-full mt-1.5 w-40 bg-gray-200/95 backdrop-blur-md border border-gray-300/80 rounded-xl shadow-lg py-1.5 z-30">
                      {VIEW_MODES.map((mode) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => {
                            setViewMode(mode);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full flex items-center px-3 py-1.5 text-xs text-left font-medium text-gray-800 hover:bg-gray-300/60 transition-colors"
                        >
                          <span className="w-5 text-gray-900 font-bold shrink-0">
                            {viewMode === mode ? '✓' : ''}
                          </span>
                          <span>{VIEW_MODE_LABELS[mode]}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
            <Info size={16} className="text-gray-400 cursor-pointer" />
          </div>
        </div>

        {/* Content based on viewMode */}
        {viewMode === 'roadmap-tasks' ? (
          <RoadmapTasksTable items={displayedRoadmap} variant="section" />
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
            {displayedFactors.length > 0 ? (
              displayedFactors.map((dimension, index) => (
                <DetailedFactorCard
                  key={dimension.dimension}
                  dimension={dimension}
                  rank={rankMap.get(dimension.dimension) ?? (index + 1)}
                />
              ))
            ) : (
              <div className="col-span-full py-8 text-center text-sm text-gray-500">
                No factors found for this filter.
              </div>
            )}
          </div>
        )}
      </section>

      {/* Migration Strategy */}
      <MigrationStrategySection
        recommendedStrategy={data.recommended_strategy ?? 'Replatform'}
        rationale={data.recommendation_rationale ?? ''}
        projectName={projectName}
      />

      {/* Full Diagnostic Report Modal (1st Image) */}
      {showReportModal && (
        <FullDiagnosticReportModal
          data={data}
          onClose={() => setShowReportModal(false)}
        />
      )}
    </div>
  );
};

export default CloudReadinessViewer;
