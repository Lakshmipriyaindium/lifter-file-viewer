import React from 'react';
import { cn } from '../../../../lib/utils';
import { getStatusStyle } from '../../constants';

interface Props { status?: string; label?: string; className?: string }

const StatusBadge: React.FC<Props> = ({ status, label, className }) => {
  const s = getStatusStyle(status);
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full border text-[11px] font-semibold uppercase whitespace-nowrap', s.badge, className)}>
      {label ?? s.label}
    </span>
  );
};

export default StatusBadge;
