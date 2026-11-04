import React from 'react';
import { cn } from '../../../../lib/utils';
import type { StatCardProps } from '../../types';

const StatCard: React.FC<StatCardProps & { children?: React.ReactNode }> = ({ label, value, caption, valueClassName, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col">
    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
    {children ?? <span className={cn('text-4xl font-bold mt-2', valueClassName)}>{value}</span>}
    <span className="text-xs text-gray-500 mt-1">{caption}</span>
  </div>
);

export default StatCard;
