import React, { useState, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { LegacyAnalysisData, DomainStats, FeatureStats, BusinessFeatureFile } from './types';
import { ChevronRight, Home, ZoomIn, ArrowLeft, ChevronLeft, ChevronDown, Info, Download } from 'lucide-react';

interface LegacyVisualizerProps {
  data: LegacyAnalysisData;
}

type DrilldownLevel = 'overview' | 'domain' | 'feature';

interface NavigationState {
  level: DrilldownLevel;
  selectedDomain?: string;
  selectedFeature?: string;
}

// Color palette for visualization
const COLORS = [
  '#fb851e', // Company color
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
  '#6366f1', '#f43f5e', '#0ea5e9', '#22c55e', '#a855f7'
];

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      name: string;
      value: number;
      fileCount?: number;
      domain?: string;
      feature?: string;
      fullName?: string;
      files?: Array<{
        filename: string;
        relative_path: string;
        total_lines: number;
      }>;
      features?: number;
      functions?: number;
      actualLoc?: number;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  const [isFilesExpanded, setIsFilesExpanded] = React.useState(false);

  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-gray-300 max-w-md max-h-96 overflow-y-auto">
        <p className="font-bold text-gray-900 mb-3 text-lg border-b pb-2">{data.fullName || data.name}</p>

        <div className="space-y-2 mb-3">
          <p className="text-sm text-gray-600">
            <span className="font-semibold text-gray-800">Lines of Code:</span> {(data.actualLoc || data.value).toLocaleString()}
          </p>
          {data.fileCount && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Total Files:</span> {data.fileCount}
            </p>
          )}
          {data.features !== undefined && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Features:</span> {data.features}
            </p>
          )}
          {data.functions !== undefined && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Functions:</span> {data.functions}
            </p>
          )}
          {data.domain && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Domain:</span> {data.domain}
            </p>
          )}
          {data.feature && (
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-800">Feature:</span> {data.feature}
            </p>
          )}
        </div>

        {data.files && data.files.length > 0 && (
          <div className="border-t pt-3 mt-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFilesExpanded(!isFilesExpanded);
              }}
              className="flex items-center justify-between w-full text-left hover:bg-gray-50 p-1 rounded transition-colors"
            >
              <p className="font-semibold text-gray-800 text-sm">Files ({data.files.length})</p>
              <ChevronDown
                size={16}
                className={`text-gray-600 transition-transform duration-200 ${isFilesExpanded ? 'rotate-180' : ''
                  }`}
              />
            </button>

            {isFilesExpanded && (
              <div className="max-h-48 overflow-y-auto mt-2">
                <div className="space-y-1">
                  {data.files.slice(0, 10).map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded text-xs hover:bg-gray-100" title={file.relative_path}>
                      <span className="font-medium text-gray-900 truncate flex-1 mr-2">
                        {file.filename}
                      </span>
                      <span className="text-gray-600 font-semibold whitespace-nowrap">
                        {file.total_lines.toLocaleString()} LOC
                      </span>
                    </div>
                  ))}
                </div>
                {data.files.length > 10 && (
                  <p className="text-xs text-gray-500 italic pt-2">
                    ... and {data.files.length - 10} more files
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
  return null;
};

interface CustomContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  fill?: string;
  depth?: number;
  index?: number;
  fileCount?: number;
  features?: number;
  functions?: number;
  domain?: string;
  feature?: string;
  sizeMetric?: 'loc' | 'files';
  actualLoc?: number;
  fontSizeMultiplier?: number;
}

const CustomContent = (props: CustomContentProps) => {
  const { x = 0, y = 0, width = 0, height = 0, name = '', value = 0, fill = '#8884d8', fileCount, features, functions, sizeMetric = 'loc', actualLoc, fontSizeMultiplier = 1 } = props;

  // Determine what to show based on size
  const showName = width >= 40 && height >= 25;
  const showBasicMetrics = width >= 80 && height >= 50;
  const showDetailedMetrics = width >= 150 && height >= 100;

  const fontSize = Math.max(Math.min(width / 10, height / 5, 13), 9) * fontSizeMultiplier;
  const subFontSize = Math.max(Math.min(width / 12, height / 6, 10), 8) * fontSizeMultiplier;
  const metricFontSize = Math.max(Math.min(width / 14, height / 8, 11), 8) * fontSizeMultiplier;

  return (
    <g
      style={{ cursor: 'pointer' }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: '#fff',
          strokeWidth: 1,
          strokeOpacity: 1,
        }}
        className="transition-opacity hover:opacity-95"
      />
      {showName && (
        <>
          {/* Title */}
          <text
            x={x + width / 2}
            y={showDetailedMetrics ? y + height / 2 - 30 : showBasicMetrics ? y + height / 2 - 6 : y + height / 2}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize}
            fontWeight="bold"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
            stroke="rgba(0, 0, 0, 0.3)"
            strokeWidth="0.5"
          >
            {width < 100 ? name.substring(0, Math.floor(width / 8)) : name}
          </text>

          {/* Metric for basic size */}
          {showBasicMetrics && !showDetailedMetrics && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill="#fff"
              fontSize={subFontSize}
              stroke="rgba(0, 0, 0, 0.3)"
              strokeWidth="0.5"
            >
              {value.toLocaleString()} {sizeMetric === 'loc' ? 'LOC' : 'files'}
            </text>
          )}

          {/* Detailed metrics for larger tiles - centered vertically */}
          {showDetailedMetrics && (
            <>
              <text
                x={x + width / 2}
                y={y + height / 2 - 8}
                textAnchor="middle"
                fill="#fff"
                fontSize={subFontSize}
                fontWeight="600"
                stroke="rgba(0, 0, 0, 0.3)"
                strokeWidth="0.5"
              >
                {sizeMetric === 'loc' ? `${value.toLocaleString()} LOC` : `${value} files`}
              </text>

              {/* Show LOC as secondary metric when sizing by files */}
              {sizeMetric === 'files' && actualLoc && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 8}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={metricFontSize}
                  stroke="rgba(0, 0, 0, 0.3)"
                  strokeWidth="0.5"
                >
                  {actualLoc.toLocaleString()} LOC
                </text>
              )}

              {/* Show file count only when sizing by LOC */}
              {sizeMetric === 'loc' && fileCount && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 10}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={metricFontSize}
                  stroke="rgba(0, 0, 0, 0.3)"
                  strokeWidth="0.5"
                >
                  📄 {fileCount} files
                </text>
              )}

              {features !== undefined && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 27}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={metricFontSize}
                  stroke="rgba(0, 0, 0, 0.3)"
                  strokeWidth="0.5"
                >
                  ⚡ {features} features
                </text>
              )}

              {functions !== undefined && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 27}
                  textAnchor="middle"
                  fill="#fff"
                  fontSize={metricFontSize}
                  stroke="rgba(0, 0, 0, 0.3)"
                  strokeWidth="0.5"
                >
                  ⚙️ {functions} functions
                </text>
              )}
            </>
          )}
        </>
      )}
      {/* Click icon for larger boxes */}
      {width >= 100 && height >= 80 && (
        <g opacity="0.7">
          <circle
            cx={x + width - 20}
            cy={y + 20}
            r="12"
            fill="rgba(255, 255, 255, 0.3)"
          />
          <text
            x={x + width - 20}
            y={y + 25}
            textAnchor="middle"
            fill="#fff"
            fontSize="16"
            fontWeight="bold"
          >
            +
          </text>
        </g>
      )}
    </g>
  );
};

export default function LegacyVisualizer({ data }: Readonly<LegacyVisualizerProps>) {
  const [view, setView] = useState<'domain' | 'feature'>('domain');
  const [navigation, setNavigation] = useState<NavigationState>({ level: 'overview' });
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isTooltipEnabled, setIsTooltipEnabled] = useState(true);
  const [sizeMetric, setSizeMetric] = useState<'loc' | 'files'>('loc');
  const [fontSizeMultiplier, setFontSizeMultiplier] = useState(1);
  const treemapRef = React.useRef<HTMLDivElement>(null);

  // Transform data for domain view
  const domainTreemapData = useMemo(() => {
    const children = Object.entries(data.domains).map(([name, domain], index) => ({
      name: name.length > 30 ? name.substring(0, 27) + '...' : name,
      fullName: name,
      value: sizeMetric === 'loc' ? domain.total_lines : domain.file_count,
      actualLoc: domain.total_lines,
      fill: COLORS[index % COLORS.length],
      fileCount: domain.file_count,
      domain: name,
      features: domain.features.length,
      files: domain.files
    }));

    return {
      name: 'Root',
      children: children.sort((a, b) => b.value - a.value)
    };
  }, [data.domains, sizeMetric]);

  // Transform data for business feature view
  const featureTreemapData = useMemo(() => {
    const children = Object.entries(data.business_features_l1).map(([name, feature], index) => ({
      name: name.length > 30 ? name.substring(0, 27) + '...' : name,
      fullName: name,
      value: sizeMetric === 'loc' ? feature.total_lines : feature.file_count,
      actualLoc: feature.total_lines,
      fill: COLORS[index % COLORS.length],
      fileCount: feature.file_count,
      feature: name,
      functions: feature.functions_l2.length,
      files: feature.files
    }));

    return {
      name: 'Root',
      children: children.sort((a, b) => b.value - a.value)
    };
  }, [data.business_features_l1, sizeMetric]);

  // Calculate domain statistics
  const domainStats: DomainStats[] = useMemo(() => {
    const totalLines = data.summary.total_lines_of_code;
    return Object.entries(data.domains)
      .map(([name, domain]) => ({
        name,
        files: domain.file_count,
        lines: domain.total_lines,
        percentage: (domain.total_lines / totalLines) * 100,
        features: domain.features
      }))
      .sort((a, b) => b.lines - a.lines);
  }, [data.domains, data.summary.total_lines_of_code]);

  // Calculate feature statistics
  const featureStats: FeatureStats[] = useMemo(() => {
    const totalLines = data.summary.total_lines_of_code;
    return Object.entries(data.business_features_l1)
      .map(([name, feature]) => {
        // Get unique domains for this feature
        const domains = Array.from(new Set(
          feature.files.map(f => f.primary_domain)
        ));
        return {
          name,
          files: feature.file_count,
          lines: feature.total_lines,
          percentage: (feature.total_lines / totalLines) * 100,
          domains
        };
      })
      .sort((a, b) => b.lines - a.lines);
  }, [data.business_features_l1, data.summary.total_lines_of_code]);

  // Filter data for domain drill-down
  const filteredFeatureData = useMemo(() => {
    if (navigation.level !== 'domain' || !navigation.selectedDomain) {
      return null;
    }

    const domainData = data.domains[navigation.selectedDomain];
    if (!domainData) return null;

    const children = Object.entries(data.business_features_l1)
      .filter(([, feature]) =>
        feature.files.some(f => f.primary_domain === navigation.selectedDomain)
      )
      .map(([name, feature], index) => {
        const domainFiles = feature.files.filter(f => f.primary_domain === navigation.selectedDomain);
        const domainLines = domainFiles.reduce((sum, f) => sum + f.total_lines, 0);
        return {
          name: name.length > 30 ? name.substring(0, 27) + '...' : name,
          fullName: name,
          value: sizeMetric === 'loc' ? domainLines : domainFiles.length,
          actualLoc: domainLines,
          fill: COLORS[index % COLORS.length],
          fileCount: domainFiles.length,
          feature: name,
          domain: navigation.selectedDomain,
          files: domainFiles
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      name: navigation.selectedDomain,
      children
    };
  }, [navigation, data.domains, data.business_features_l1, sizeMetric]);

  // Filter data for feature drill-down to show functions
  const filteredFunctionData = useMemo(() => {
    if (navigation.level !== 'feature' || !navigation.selectedFeature) {
      return null;
    }

    const featureData = data.business_features_l1[navigation.selectedFeature];
    if (!featureData) return null;

    // Group files by function (functions_l2)
    const functionGroups: Record<string, { files: BusinessFeatureFile[], lines: number }> = {};

    for (const file of featureData.files) {
      // Find which functions this file belongs to based on feature
      const fileFunctions = featureData.functions_l2 || [];

      if (fileFunctions.length === 0) {
        // If no functions, group under "Other"
        if (!functionGroups['Other']) {
          functionGroups['Other'] = { files: [], lines: 0 };
        }
        functionGroups['Other'].files.push(file);
        functionGroups['Other'].lines += file.total_lines;
      } else {
        // Assign to first function (simplified - in real scenario might need better logic)
        for (const func of fileFunctions) {
          if (!functionGroups[func]) {
            functionGroups[func] = { files: [], lines: 0 };
          }
          // Add proportional lines if file belongs to multiple functions
          const proportion = 1 / fileFunctions.length;
          functionGroups[func].files.push(file);
          functionGroups[func].lines += Math.round(file.total_lines * proportion);
        }
      }
    }

    const children = Object.entries(functionGroups)
      .map(([name, data], index) => ({
        name: name.length > 30 ? name.substring(0, 27) + '...' : name,
        fullName: name,
        value: sizeMetric === 'loc' ? data.lines : data.files.length,
        actualLoc: data.lines,
        fill: COLORS[index % COLORS.length],
        fileCount: data.files.length,
        function: name,
        feature: navigation.selectedFeature,
        domain: navigation.selectedDomain,
        files: data.files
      }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);

    return {
      name: navigation.selectedFeature,
      children
    };
  }, [navigation, data.business_features_l1, sizeMetric]);

  // Get current treemap data based on navigation level
  const currentTreemapData = useMemo(() => {
    if (navigation.level === 'feature' && filteredFunctionData) {
      return filteredFunctionData;
    }
    if (navigation.level === 'domain' && filteredFeatureData) {
      return filteredFeatureData;
    }
    return view === 'domain' ? domainTreemapData : featureTreemapData;
  }, [navigation, filteredFeatureData, filteredFunctionData, view, domainTreemapData, featureTreemapData]);

  // Handle treemap item click
  const handleTreemapClick = (itemData: any) => {
    const data = itemData as { domain?: string; feature?: string };

    if (navigation.level === 'overview' && view === 'domain' && data.domain) {
      setNavigation({ level: 'domain', selectedDomain: data.domain });
    } else if (navigation.level === 'domain' && data.feature) {
      setNavigation({
        level: 'feature',
        selectedDomain: navigation.selectedDomain,
        selectedFeature: data.feature
      });
    }
  };

  // Navigation handlers
  const handleBackClick = () => {
    if (navigation.level === 'feature') {
      setNavigation({ level: 'domain', selectedDomain: navigation.selectedDomain });
    } else if (navigation.level === 'domain') {
      setNavigation({ level: 'overview' });
    }
  };

  const handleHomeClick = () => {
    setNavigation({ level: 'overview' });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      {/* Header Bar */}
      <header className="bg-white border-b px-6 py-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-orange-50 rounded-lg">
             <Info className="w-6 h-6 text-[#fb851e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Legacy System Analysis</h1>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{data.consolidation_date}</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>{data.summary.total_files} Files</span>
              <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
              <span>{data.summary.total_lines_of_code.toLocaleString()} LOC</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => { setView('domain'); setNavigation({ level: 'overview' }); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'domain' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Domain View
            </button>
            <button
              onClick={() => { setView('feature'); setNavigation({ level: 'overview' }); }}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${view === 'feature' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Feature View
            </button>
          </div>
          
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          
          <button
            onClick={() => setIsTooltipEnabled(!isTooltipEnabled)}
            className={`p-2 rounded-lg transition-colors ${isTooltipEnabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-400'}`}
            title="Toggle Tooltips"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Navigation & Stats */}
        <aside className={`bg-white border-r transition-all duration-300 flex flex-col ${isPanelCollapsed ? 'w-0 opacity-0' : 'w-80 opacity-100'}`}>
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8 overflow-hidden whitespace-nowrap">
              <button onClick={handleHomeClick} className="hover:text-[#fb851e] transition-colors flex items-center gap-1">
                <Home className="w-4 h-4" />
                Overview
              </button>
              {navigation.level !== 'overview' && (
                <>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  <button
                    onClick={() => navigation.level === 'feature' ? handleBackClick() : null}
                    className={`truncate ${navigation.level === 'domain' ? 'text-gray-900 font-semibold' : 'hover:text-[#fb851e] transition-colors'}`}
                  >
                    {navigation.selectedDomain}
                  </button>
                </>
              )}
              {navigation.level === 'feature' && (
                <>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  <span className="text-gray-900 font-semibold truncate">{navigation.selectedFeature}</span>
                </>
              )}
            </nav>

            {/* Drilldown Back Button */}
            {navigation.level !== 'overview' && (
              <button
                onClick={handleBackClick}
                className="mb-6 flex items-center gap-2 text-sm font-medium text-[#fb851e] hover:translate-x-1 transition-transform"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to {navigation.level === 'feature' ? 'Domain' : 'Overview'}
              </button>
            )}

            {/* View Stats */}
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">
                  {view === 'domain' ? 'Domain Distribution' : 'Feature Distribution'}
                </h3>
                <div className="space-y-3">
                  {(view === 'domain' ? domainStats : featureStats).slice(0, 10).map((stat, idx) => (
                    <div key={stat.name} className="group cursor-pointer" onClick={() => handleTreemapClick(view === 'domain' ? { domain: stat.name } : { feature: stat.name })}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 font-medium truncate flex-1 pr-2">{stat.name}</span>
                        <span className="text-gray-400">{stat.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all duration-1000"
                          style={{
                            width: `${stat.percentage}%`,
                            backgroundColor: COLORS[idx % COLORS.length]
                          }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                        <span>{stat.files} files</span>
                        <span>{stat.lines.toLocaleString()} LOC</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Metric Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Size By</span>
                    <select
                      value={sizeMetric}
                      onChange={(e) => setSizeMetric(e.target.value as 'loc' | 'files')}
                      className="text-sm border-gray-200 rounded-md bg-gray-50 focus:ring-[#fb851e] focus:border-[#fb851e]"
                    >
                      <option value="loc">Lines of Code</option>
                      <option value="files">File Count</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Label Size</span>
                      <span>{fontSizeMultiplier.toFixed(1)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={fontSizeMultiplier}
                      onChange={(e) => setFontSizeMultiplier(parseFloat(e.target.value))}
                      className="w-full accent-[#fb851e]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Analysis Visualizer</span>
            </div>
          </div>
        </aside>

        {/* Treemap Visualization Section */}
        <main className="flex-1 relative bg-white flex flex-col min-w-0">
          {/* Panel Toggle Button */}
          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-l-0 rounded-r-md p-1 shadow-md hover:text-[#fb851e] transition-colors"
          >
            {isPanelCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Treemap Container */}
          <div ref={treemapRef} className="flex-1 p-6 min-h-0">
            <div className="w-full h-full border border-gray-100 rounded-xl overflow-hidden bg-gray-50 shadow-inner p-2">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={currentTreemapData.children}
                  dataKey="value"
                  stroke="#fff"
                  fill="#8884d8"
                  onClick={(e: any) => handleTreemapClick(e)}
                  content={
                    <CustomContent
                      sizeMetric={sizeMetric}
                      fontSizeMultiplier={fontSizeMultiplier}
                    />
                  }
                >
                  {isTooltipEnabled && <RechartsTooltip content={<CustomTooltip />} />}
                </Treemap>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Floating Action Hint */}
          <div className="absolute bottom-10 right-10 flex items-center gap-3 bg-white/80 backdrop-blur-sm border shadow-lg px-4 py-2 rounded-full text-xs font-medium text-gray-600 animate-bounce pointer-events-none">
            <ZoomIn className="w-4 h-4 text-[#fb851e]" />
            Click any block to drill down
          </div>
        </main>
      </div>
    </div>
  );
}
