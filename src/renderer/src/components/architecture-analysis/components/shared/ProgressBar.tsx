import React from 'react';
import { cn } from '../../../../lib/utils';
import { getStatusStyle } from '../../constants';

interface Props { value: number; status?: string }

const ProgressBar: React.FC<Props> = ({ value, status }) => {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="h-2.5 w-full rounded-full bg-gray-100 overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full', getStatusStyle(status).bar)} style={{ width: `${pct}%` }} />
    </div>
  );
};

export default ProgressBar;
