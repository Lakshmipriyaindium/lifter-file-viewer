import React from 'react';
import type { RoadmapItem, RoadmapVariant } from '../types';
import { getImpactBadgeClass } from '../utils';
import { cn } from '../../../lib/utils';

const RoadmapTasksTable: React.FC<{
  items: RoadmapItem[];
  variant?: RoadmapVariant;
  className?: string;
}> = ({
  items,
  variant = 'section',
  className,
}) => {
  const isSection = variant === 'section';

  if (!items || items.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500">
        No modernization roadmap items found.
      </div>
    );
  }

  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-gray-100 bg-white', className)}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/50">
            <th className={cn(
              'py-3.5 px-4 font-semibold text-gray-500 w-20',
              isSection ? 'text-xs uppercase tracking-wider' : 'text-xs text-gray-700'
            )}>
              {isSection ? 'PRIORITY' : '#'}
            </th>
            <th className={cn(
              'py-3.5 px-4 font-semibold text-gray-500',
              isSection ? 'text-xs uppercase tracking-wider' : 'text-xs text-gray-700'
            )}>
              {isSection ? 'DIMENSION' : 'Dimension'}
            </th>
            <th className={cn(
              'py-3.5 px-4 font-semibold text-gray-500',
              isSection ? 'text-xs uppercase tracking-wider' : 'text-xs text-gray-700'
            )}>
              {isSection ? 'ACTION ITEM' : 'Action'}
            </th>
            <th className={cn(
              'py-3.5 px-4 font-semibold text-gray-500 w-28',
              isSection ? 'text-xs uppercase tracking-wider' : 'text-xs text-gray-700'
            )}>
              {isSection ? 'IMPACT' : 'Impact'}
            </th>
            <th className={cn(
              'py-3.5 px-4 font-semibold text-gray-500 w-28',
              isSection ? 'text-xs uppercase tracking-wider' : 'text-xs text-gray-700'
            )}>
              {isSection ? 'EFFORT' : 'Effort'}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {items.map((item, index) => {
            const priorityNumber = item.priority ?? index + 1;
            const priorityDisplay = isSection ? `#${priorityNumber}` : priorityNumber;

            return (
              <tr
                key={`${item.dimension}-${item.action}-${index}`}
                className="hover:bg-gray-50/60 transition-colors"
              >
                <td className="py-3 px-4 text-xs font-bold text-gray-800 whitespace-nowrap">
                  {priorityDisplay}
                </td>
                <td className="py-3 px-4 text-xs text-gray-600 font-medium">
                  {item.dimension}
                </td>
                <td className="py-3 px-4 text-xs text-gray-700 font-medium">
                  {item.action}
                </td>
                <td className="py-3 px-4 text-xs whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-block px-2.5 py-0.5 rounded text-xs font-semibold',
                      getImpactBadgeClass(item.impact)
                    )}
                  >
                    {item.impact}
                  </span>
                </td>
                <td className="py-3 px-4 text-xs text-gray-600 font-normal whitespace-nowrap">
                  {item.effort}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RoadmapTasksTable;
