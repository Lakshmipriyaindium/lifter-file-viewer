import React, { useState } from 'react';
import { Info, CheckCircle } from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { MigrationStrategy } from '../types';
import { MIGRATION_STRATEGIES } from '../utils';

const MigrationStrategySection: React.FC<{
  recommendedStrategy: MigrationStrategy | string;
  rationale: string;
  projectName: string;
}> = ({
  recommendedStrategy,
  rationale,
  projectName,
}) => {
  const [selected, setSelected] = useState<MigrationStrategy | string>(recommendedStrategy);

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-800">Migration Strategy Recommendation</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
            {projectName}
          </span>
          <Info size={16} className="text-gray-400 cursor-pointer" />
        </div>
      </div>

      {/* 6 R Strategy Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {MIGRATION_STRATEGIES.map((strategy) => {
          const isRecommended = strategy.key === recommendedStrategy;
          const isSelected = strategy.key === selected;

          return (
            <button
              key={strategy.key}
              onClick={() => setSelected(strategy.key)}
              className={cn(
                'relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center',
                isSelected
                  ? 'border-emerald-400 bg-emerald-50/30 shadow-md'
                  : 'border-gray-100 bg-white hover:border-gray-300 hover:shadow-sm',
              )}
            >
              {isRecommended && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs bg-emerald-500 text-white font-semibold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Recommended
                </span>
              )}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ backgroundColor: strategy.color }}
              >
                {isRecommended ? (
                  <CheckCircle size={18} className="text-white" />
                ) : (
                  <span className="text-white text-base font-bold">{strategy.label[0]}</span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{strategy.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{strategy.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Recommendation Summary */}
      <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Info size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-700 mb-2">Recommendation Summary</p>
            <p className="text-sm text-blue-800">
              Based on the analysis,{' '}
              <span className="font-bold">{recommendedStrategy}</span> is recommended for this
              application.
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="mt-4 bg-white border border-blue-100 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-700 mb-1">{projectName}</p>
          <p className="text-xs text-gray-500 mb-2">Here is a concise 3-5 line executive summary:</p>
          <p className="text-sm text-gray-700 leading-relaxed">{rationale}</p>
        </div>
      </div>
    </section>
  );
};

export default MigrationStrategySection;
