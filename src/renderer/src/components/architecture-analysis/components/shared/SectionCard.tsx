import React from 'react';
import { cn } from '../../../../lib/utils';

interface Props {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const SectionCard: React.FC<Props> = ({ title, subtitle, right, className, children }) => (
  <section className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col', className)}>
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </div>
    {children}
  </section>
);

export default SectionCard;
