import React, { useMemo, useState } from 'react';
import SectionCard from './shared/SectionCard';
import ChecklistItemCard from './ChecklistItemCard';
import { CHECKLIST_FILTERS, CHECKLIST_PREVIEW_COUNT } from '../constants';
import { countChecklistByStatus, filterChecklist } from '../utils';
import { cn } from '../../../lib/utils';
import type { ChecklistFilter, ChecklistItem } from '../types';

const HealthChecklist: React.FC<{ items: ChecklistItem[] }> = ({ items }) => {
  const [filter, setFilter] = useState<ChecklistFilter>('all');
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const counts = useMemo(() => countChecklistByStatus(items), [items]);
  const filtered = useMemo(() => filterChecklist(items, filter), [items, filter]);
  const visible = showAll ? filtered : filtered.slice(0, CHECKLIST_PREVIEW_COUNT);

  const changeFilter = (f: ChecklistFilter) => { setFilter(f); setShowAll(false); };
  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  return (
    <SectionCard
      title={`Architectural Health Checklist (${items.length} items)`}
      subtitle="Automated review of architecture quality criteria"
      right={
        <div role="tablist" className="flex bg-gray-100 rounded-lg p-1 flex-wrap">
          {CHECKLIST_FILTERS.map((f) => (
            <button
              key={f.key} type="button" role="tab" aria-selected={filter === f.key}
              onClick={() => changeFilter(f.key)}
              className={cn('px-3 py-1 rounded-md text-xs font-semibold transition-all',
                filter === f.key ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700')}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>
      }
    >
      {items.length === 0 ? (
        <p className="text-sm text-gray-400 py-6 text-center">No checklist items available</p>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {visible.map((item, i) => {
              const key = `${item.title}-${i}`;
              return <ChecklistItemCard key={key} item={item} open={expanded.has(key)} onToggle={() => toggle(key)} />;
            })}
          </div>
          {filtered.length > CHECKLIST_PREVIEW_COUNT && (
            <button type="button" onClick={() => setShowAll((s) => !s)} className="mt-4 self-center text-sm font-semibold text-indigo-600 hover:text-indigo-800">
              {showAll ? 'Show less' : `Show all ${filtered.length} checks`}
            </button>
          )}
        </>
      )}
    </SectionCard>
  );
};

export default HealthChecklist;
