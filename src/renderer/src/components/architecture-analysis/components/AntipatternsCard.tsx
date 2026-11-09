import React from 'react';
import SectionCard from './shared/SectionCard';
import StatusBadge from './shared/StatusBadge';
import { capitalize } from '../utils';
import type { Antipattern } from '../types';

interface Props { total: number; high: number; items: Antipattern[]; summary?: string; urgency?: string }

const AntipatternsCard: React.FC<Props> = ({ total, high, items, summary, urgency }) => (
  <SectionCard
    title="Antipatterns Detected"
    subtitle={`${total} total · ${high} high severity`}
    right={urgency ? <StatusBadge status={urgency} label={`${capitalize(urgency)} Urgency`} /> : undefined}
  >
    {summary && <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-700 mb-4">{summary}</div>}
    {items.length === 0 ? (
      <p className="text-sm text-gray-400 py-6 text-center">No antipatterns detected</p>
    ) : (
      <div className="space-y-3">
        {items.map((ap) => (
          <div key={ap.id} className="rounded-xl border border-red-100 bg-red-50/50 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2 min-w-0">
                <span className="mt-1.5 h-2 w-2 rounded-full bg-red-500 shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{ap.title}</p>
                  <p className="text-xs text-gray-500">{ap.category}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-500">{ap.files_affected} files</span>
                <StatusBadge status={ap.severity} />
              </div>
            </div>
            <p className="text-sm text-gray-700 mt-2">{ap.detail}</p>
          </div>
        ))}
      </div>
    )}
  </SectionCard>
);

export default AntipatternsCard;
