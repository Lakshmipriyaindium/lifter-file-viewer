import React, { useMemo } from 'react';
import { X, AlertCircle, List, ListOrdered } from 'lucide-react';
import type { CloudNativeData } from '../types';
import {
  getReadinessStatus,
  getAreasNeedingAttention,
  getRoadmapItems,
} from '../utils';
import RoadmapTasksTable from './RoadmapTasksTable';

const FullDiagnosticReportModal: React.FC<{
  data: CloudNativeData;
  onClose: () => void;
}> = ({ data, onClose }) => {
  const dimensions = useMemo(() => data.dimensions ?? [], [data.dimensions]);

  const overallScore = data.overall_score ?? 0;
  const status = getReadinessStatus(overallScore);
  const formattedScore = overallScore % 1 === 0 ? `${overallScore}.0%` : `${overallScore.toFixed(1)}%`;

  const recommendedStrategy = data.recommended_strategy ?? 'Rearchitect';
  const deploymentModel = data.deployment_model || '—';
  const confidencePercent = Math.round(
    (data.deployment_confidence ?? 0) > 1
      ? data.deployment_confidence
      : (data.deployment_confidence ?? 0) * 100
  );

  const totalEvaluators = dimensions.length;
  const activeEvaluators = dimensions.filter((d) => d.dimension_active).length;

  const attentionItems = useMemo(() => getAreasNeedingAttention(data), [data]);
  const roadmapItems = useMemo(() => getRoadmapItems(data), [data]);

  return (
    <div
      ref={(el) => el?.focus()}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
      className="fixed inset-0 z-50 overscroll-contain flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 outline-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <List className="text-orange-500 shrink-0" size={22} />
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Cloud Readiness Full Diagnostic Report
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors focus:outline-none"
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto overscroll-contain px-6 py-6 space-y-6 flex-1">
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Overall Score */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">Overall Score</span>
              <div className="my-1">
                <span className={`text-2xl font-extrabold ${status.textColor}`}>
                  {formattedScore}
                </span>
              </div>
              <span className="text-xs text-gray-400">{status.label}</span>
            </div>

            {/* Card 2: Strategy */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">Strategy</span>
              <div className="my-1">
                <span className="text-2xl font-extrabold text-purple-600">
                  {recommendedStrategy}
                </span>
              </div>
              <span className="text-xs text-gray-400">AWS 6 Rs</span>
            </div>

            {/* Card 3: Deployment Model */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">Deployment Model</span>
              <div className="my-1">
                <span className="text-2xl font-extrabold text-gray-800">
                  {deploymentModel}
                </span>
              </div>
              <span className="text-xs text-gray-400">Confidence: {confidencePercent}%</span>
            </div>

            {/* Card 4: Evaluators */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col justify-between">
              <span className="text-xs text-gray-500 font-medium">Evaluators</span>
              <div className="my-1">
                <span className="text-2xl font-extrabold text-gray-800">
                  {totalEvaluators} Evaluators
                </span>
              </div>
              <span className="text-xs text-gray-400">{activeEvaluators} Active</span>
            </div>
          </div>

          {/* Section 1: Areas Needing Attention */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={17} className="text-red-500 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                Areas Needing Attention ({attentionItems.length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {attentionItems.map((item, idx) => (
                <div
                  key={`${item.name}-${idx}`}
                  className="rounded-lg border border-red-200/80 bg-red-50/20 hover:bg-red-50/40 px-3.5 py-2.5 text-xs text-red-600 font-medium transition-colors"
                >
                  <span>
                    {item.name} ({item.scoreText})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Recommended Modernization Roadmap */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ListOrdered size={17} className="text-orange-500 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-gray-800">
                Recommended Modernization Roadmap ({roadmapItems.length} Steps)
              </h3>
            </div>

            <RoadmapTasksTable items={roadmapItems} variant="modal" />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-900 text-white font-medium text-sm px-6 py-2 rounded-lg transition-colors focus:outline-none shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullDiagnosticReportModal;
