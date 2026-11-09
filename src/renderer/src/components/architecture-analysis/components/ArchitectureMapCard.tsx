import React, { useMemo } from 'react';
import SectionCard from './shared/SectionCard';
import MermaidViewer from '../../MermaidViewer';
import { DIAGRAM_HEIGHT } from '../constants';
import { sanitizeMermaid } from '../utils';

const ArchitectureMapCard: React.FC<{ source?: string }> = ({ source }) => {
  const code = useMemo(() => sanitizeMermaid(source ?? ''), [source]);
  return (
    <SectionCard title="Extracted Architecture Map" subtitle="Modules and their dependencies" className="h-full">
      <div className={`${DIAGRAM_HEIGHT} overflow-hidden rounded-xl border border-gray-100 bg-gray-50`}>
        {code.trim() ? (
          <MermaidViewer code={code} />
        ) : (
          <div className="h-full flex items-center justify-center text-sm text-gray-400">No diagram available</div>
        )}
      </div>
    </SectionCard>
  );
};

export default ArchitectureMapCard;
