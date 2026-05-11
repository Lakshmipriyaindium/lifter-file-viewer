// Adapted for Lifter-File-Viewer (removed 'use client')
import React, { useState, useMemo } from 'react';
import { BusinessProcessFlow, BusinessProcessStep } from './type';
import { ArrowRight, Database, FileCode, Shield, ZoomIn, ZoomOut } from 'lucide-react';

interface FlowchartVisualizerProps {
  data: BusinessProcessFlow;
}

const FlowchartVisualizer: React.FC<FlowchartVisualizerProps> = ({ data }) => {
  const [selectedStep, setSelectedStep] = useState<BusinessProcessStep | null>(null);
  const [zoom, setZoom] = useState(1);

  // Group steps by depth
  const stepsByDepth = useMemo(() => {
    const grouped: { [key: number]: BusinessProcessStep[] } = {};
    for (const step of data.steps) {
      if (!grouped[step.depth]) {
        grouped[step.depth] = [];
      }
      grouped[step.depth].push(step);
    }
    return grouped;
  }, [data.steps]);

  const depths = Object.keys(stepsByDepth).map(Number).sort((a, b) => a - b);

  const getNodeColor = (step: BusinessProcessStep) => {
    if (step.source === 'database') return 'bg-purple-500';
    if (step.has_client_customizations) return 'bg-yellow-500';
    if (step.business_rules.length > 5) return 'bg-red-500';
    if (step.business_rules.length > 0) return 'bg-blue-500';
    return 'bg-gray-500';
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-full mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Process Flowchart</h1>
            <p className="text-gray-600">Compact swimlane visualization</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <span className="px-4 py-2 bg-white rounded-lg shadow flex items-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-2 bg-white rounded-lg shadow hover:bg-gray-50"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <h3 className="font-semibold mb-3">Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded" />
              <span>Database</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span>Has Rules</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded" />
              <span>Many Rules (5+)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded" />
              <span>Customizable</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-500 rounded" />
              <span>Standard</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 overflow-x-auto">
          <div 
            className="inline-block min-w-full transition-transform"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {/* Swimlanes */}
            <div className="flex gap-8">
              {depths.map(depth => (
                <div key={depth} className="flex flex-col" style={{ minWidth: '200px' }}>
                  {/* Depth Header */}
                  <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-3 rounded-t-lg font-bold text-center mb-4">
                    Depth {depth}
                  </div>

                  {/* Steps in this depth */}
                  <div className="space-y-4 flex-1">
                    {stepsByDepth[depth].map(step => (
                      <div key={step.step_number} className="relative">
                        <button
                          onClick={() => setSelectedStep(step)}
                          className={`w-full ${getNodeColor(step)} text-white rounded-lg p-3 shadow-md hover:shadow-lg transition-all text-left ${
                            selectedStep?.step_number === step.step_number ? 'ring-4 ring-orange-300' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <span className="text-xs font-bold">#{step.step_number}</span>
                            {step.source === 'database' ? (
                              <Database className="w-4 h-4" />
                            ) : (
                              <FileCode className="w-4 h-4" />
                            )}
                          </div>
                          <div className="text-sm font-semibold line-clamp-2 mb-1">
                            {step.step_title}
                          </div>
                          <div className="text-xs opacity-90 line-clamp-1">
                            {step.node_name}
                          </div>
                          {step.business_rules.length > 0 && (
                            <div className="mt-2 flex items-center gap-1 text-xs">
                              <Shield className="w-3 h-3" />
                              <span>{step.business_rules.length} rules</span>
                            </div>
                          )}
                        </button>

                        {/* Connection arrow to next depth */}
                        {depth < Math.max(...depths) && (
                          <div className="absolute top-1/2 -right-6 transform -translate-y-1/2">
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        {selectedStep && (
          <div className="mt-6 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Step {selectedStep.step_number}: {selectedStep.step_title}
                </h2>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedStep.source === 'database'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {selectedStep.source}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    Depth {selectedStep.depth}
                  </span>
                  {selectedStep.has_client_customizations && (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                      Customizable
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedStep(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Description */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {selectedStep.description}
                </p>
              </div>

              {/* Business Rules */}
              {selectedStep.business_rules.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Business Rules ({selectedStep.business_rules.length})
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {selectedStep.business_rules.map((rule, idx) => (
                      <li key={idx} className="text-sm text-gray-700">{rule}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Info */}
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">Node Name</h4>
                  <p className="text-sm text-gray-900">{selectedStep.node_name}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-1">File Path</h4>
                  <p className="text-sm text-gray-900 break-all">{selectedStep.file_path}</p>
                </div>
                {selectedStep.called_from && (
                  <div className="col-span-2">
                    <h4 className="font-semibold text-sm text-gray-600 mb-1">Called From</h4>
                    <p className="text-sm text-gray-900">{selectedStep.called_from}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowchartVisualizer;
