import React, { useState } from 'react';
import { BusinessProcessFlow } from './type';
import ProcessFlowVisualizer from './ProcessFlowVisualizer';
import FlowchartVisualizer from './FlowchartVisualizer';
import { LayoutList, GitGraph } from 'lucide-react';

interface BusinessProcessViewerProps {
  data: BusinessProcessFlow;
}

const BusinessProcessViewer: React.FC<BusinessProcessViewerProps> = ({ data }) => {
  const [viewMode, setViewMode] = useState<'timeline' | 'flowchart'>('timeline');

  return (
    <div className="flex flex-col h-full">
      <div className="bg-white border-b px-6 py-2 flex items-center justify-between">
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'timeline'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <LayoutList className="w-4 h-4" />
            Timeline View
          </button>
          <button
            onClick={() => setViewMode('flowchart')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === 'flowchart'
                ? 'bg-white text-orange-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <GitGraph className="w-4 h-4" />
            Flowchart View
          </button>
        </div>
        <div className="text-xs text-gray-400">
          Viewing: {data.process_name || 'Business Process Flow'}
        </div>
      </div>

      <div className="flex-grow overflow-auto">
        {viewMode === 'timeline' ? (
          <ProcessFlowVisualizer data={data} />
        ) : (
          <FlowchartVisualizer data={data} />
        )}
      </div>
    </div>
  );
};

export default BusinessProcessViewer;
