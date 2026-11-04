import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import StatusBadge from './shared/StatusBadge';
import { getStatusStyle } from '../constants';
import { normalizeRecommendations } from '../utils';
import type { ChecklistItem } from '../types';

interface Props { item: ChecklistItem; open: boolean; onToggle: () => void }

const ChecklistItemCard: React.FC<Props> = ({ item, open, onToggle }) => {
  const style = getStatusStyle(item.status);
  const Icon = style.icon;
  const Chevron = open ? ChevronDown : ChevronRight;
  const recs = open ? normalizeRecommendations(item.recommendations) : [];
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full text-left p-4 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-5 w-5 shrink-0 ${style.icon_cls}`} />
          <span className="font-semibold text-gray-900 flex-1 min-w-0">{item.title}</span>
          <StatusBadge status={item.status} />
          <Chevron className="h-4 w-4 text-gray-400 shrink-0" />
        </div>
        {!open && <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-700">
          <p>{item.description}</p>
          {(item.citations?.length ?? 0) > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-gray-500">Citations:</span>
              {item.citations.map((c, i) => (
                <span key={`${c}-${i}`} className="font-mono text-xs bg-gray-100 text-gray-700 rounded px-2 py-0.5">{c}</span>
              ))}
            </div>
          )}
          {recs.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-1">Recommendations</p>
              <ul className="list-disc pl-5 space-y-1">
                {recs.map((r, i) => (
                  <li key={`${r.title}-${i}`}><span className="font-medium">{r.title}</span>{r.description && ` — ${r.description}`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChecklistItemCard;
