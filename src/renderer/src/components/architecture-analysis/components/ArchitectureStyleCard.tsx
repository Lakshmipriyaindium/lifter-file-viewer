import React from 'react';
import SectionCard from './shared/SectionCard';
import KeyValueRow from './shared/KeyValueRow';
import { toPct } from '../utils';

interface Props {
  name?: string;
  confidence?: number;
  rows: { label: string; value: string }[];
  tradeOffs?: string;
}

const ArchitectureStyleCard: React.FC<Props> = ({ name, confidence, rows, tradeOffs }) => (
  <SectionCard title="Architecture Style" subtitle="Dominant detected pattern" className="h-full">
    <div className="flex items-center gap-3 mb-4">
      <span className="px-3 py-1 rounded-full bg-indigo-600 text-white text-sm font-semibold">{name ?? 'Unknown'}</span>
      <span className="text-sm text-gray-500">{toPct((confidence ?? 0) * 100)} confidence</span>
    </div>
    <div>{rows.map((r) => <KeyValueRow key={r.label} {...r} />)}</div>
    {tradeOffs && (
      <div className="mt-auto pt-4">
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
          <span className="font-semibold">Trade-offs: </span>{tradeOffs}
        </div>
      </div>
    )}
  </SectionCard>
);

export default ArchitectureStyleCard;
