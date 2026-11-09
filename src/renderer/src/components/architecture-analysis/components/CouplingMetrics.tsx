import React from 'react';
import StatCard from './shared/StatCard';
import ArcGauge from './shared/ArcGauge';
import type { StatCardProps } from '../types';

interface Props { stats: StatCardProps[]; cohesion: number }

const CouplingMetrics: React.FC<Props> = ({ stats, cohesion }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {stats.slice(0, 2).map((s) => <StatCard key={s.label} {...s} />)}
    <StatCard label="Cohesion" value="" caption="Internal functional unity">
      <div className="flex flex-col items-center">
        <ArcGauge value={cohesion} />
        <span className="text-xl font-bold text-gray-900 -mt-1">{cohesion.toFixed(1)}%</span>
      </div>
    </StatCard>
    {stats.slice(2).map((s) => <StatCard key={s.label} {...s} />)}
  </div>
);

export default CouplingMetrics;
