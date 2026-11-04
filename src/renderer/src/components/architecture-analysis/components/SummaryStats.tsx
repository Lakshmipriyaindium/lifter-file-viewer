import React from 'react';
import StatCard from './shared/StatCard';
import type { StatCardProps } from '../types';

const SummaryStats: React.FC<{ stats: StatCardProps[] }> = ({ stats }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.map((s) => <StatCard key={s.label} {...s} />)}
  </div>
);

export default SummaryStats;
