import React from 'react';
import SectionCard from './shared/SectionCard';
import ProgressBar from './shared/ProgressBar';
import { READINESS_SCROLL_MAX_H } from '../constants';
import { scoreTone, toPct } from '../utils';
import type { ReadinessDimension } from '../types';

interface Props { overall: number; dimensions: ReadinessDimension[]; phases: string[] }

const MicroserviceReadinessCard: React.FC<Props> = ({ overall, dimensions, phases }) => (
  <SectionCard
    title="Microservice Readiness"
    subtitle="Score per architectural dimension"
    right={<span className={`text-3xl font-bold ${scoreTone(overall)}`}>{toPct(overall)}</span>}
  >
    {dimensions.length === 0 ? (
      <p className="text-sm text-gray-400 py-6 text-center">No readiness data available</p>
    ) : (
      <div className={`${READINESS_SCROLL_MAX_H} overflow-y-auto overscroll-contain pr-2 space-y-3`}>
        {dimensions.map((d) => (
          <div key={d.name} className="grid grid-cols-[180px_1fr_48px] items-center gap-3 text-sm">
            <span className="text-gray-700 truncate" title={d.label}>{d.label}</span>
            <ProgressBar value={d.score_pct} status={d.status} />
            <span className="text-right font-semibold text-gray-900">{toPct(d.score_pct)}</span>
          </div>
        ))}
      </div>
    )}
    {phases.length > 0 && (
      <div className="mt-5 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold tracking-wide text-gray-500 mb-2">MIGRATION PHASING</p>
        <div className="space-y-2">
          {phases.map((p, i) => (
            <div key={`${i}-${p.slice(0, 20)}`} className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-700">{p}</div>
          ))}
        </div>
      </div>
    )}
  </SectionCard>
);

export default MicroserviceReadinessCard;
