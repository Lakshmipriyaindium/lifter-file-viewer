'use client';

import React, { useState, useMemo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
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
  const handleTreemapClick = (itemData: unknown) => {
    console.log('Treemap clicked:', itemData);
    console.log('Navigation level:', navigation.level);
    console.log('View:', view);

    const data = itemData as { domain?: string; feature?: string };

    if (navigation.level === 'overview' && view === 'domain' && data.domain) {
      console.log('Setting navigation to domain:', data.domain);
      setNavigation({ level: 'domain', selectedDomain: data.domain });
    } else if (navigation.level === 'domain' && data.feature) {
      console.log('Setting navigation to feature:', data.feature);
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

  // Export treemap as image
  const handleExportImage = async () => {
    if (!treemapRef.current) return;

    try {
      // Import html-to-image dynamically
      const { toPng } = await import('html-to-image');

      // Generate filename based on current view
      let filename = 'treemap';
      if (navigation.level === 'feature' && navigation.selectedFeature) {
        filename = `functions-${navigation.selectedFeature.replaceAll(/[^a-z0-9]/gi, '_')}`;
      } else if (navigation.level === 'domain' && navigation.selectedDomain) {
        filename = `features-${navigation.selectedDomain.replaceAll(/[^a-z0-9]/gi, '_')}`;
      } else {
        filename = view === 'domain' ? 'domains-overview' : 'features-overview';
      }

      // Generate image
      const dataUrl = await toPng(treemapRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      // Download image
      const link = document.createElement('a');
      link.download = `${filename}-${new Date().toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error exporting image:', error);
      alert('Failed to export image. Please try again.');
    }
  };

  // Export as standalone HTML
  const handleExportHTML = async () => {
    try {
      // Serialize current state
      const exportState = {
        view,
        navigation,
        sizeMetric,
        fontSizeMultiplier,
        isTooltipEnabled,
        data
      };

      // Generate filename
      let filename = 'legacy-visualizer';
      if (navigation.level === 'feature' && navigation.selectedFeature) {
        filename = `functions-${navigation.selectedFeature.replaceAll(/[^a-z0-9]/gi, '_')}`;
      } else if (navigation.level === 'domain' && navigation.selectedDomain) {
        filename = `features-${navigation.selectedDomain.replaceAll(/[^a-z0-9]/gi, '_')}`;
      } else {
        filename = view === 'domain' ? 'domains-overview' : 'features-overview';
      }
      filename = `${filename}-${new Date().toISOString().split('T')[0]}.html`;

      // Load and convert logo to base64
      let logoBase64 = '';
      try {
        const response = await fetch('/assets/logo-light.png');
        if (response.ok) {
          const blob = await response.blob();
          logoBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              resolve(base64String);
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (logoError) {
        console.warn('Could not load logo image:', logoError);
        // Continue without logo if it fails to load
      }

      // Load and convert favicon to base64
      let faviconBase64 = '';
      try {
        const response = await fetch('/favicon-3.webp');
        if (response.ok) {
          const blob = await response.blob();
          faviconBase64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              resolve(base64String);
            };
            reader.readAsDataURL(blob);
          });
        }
      } catch (faviconError) {
        console.warn('Could not load favicon image:', faviconError);
      }

      // Generate the HTML content
      const htmlContent = generateStandaloneHTML(exportState, logoBase64, faviconBase64);

      // Create and download the file
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting HTML:', error);
      alert('Failed to export HTML. Please try again.');
    }
  };

  // Generate standalone HTML with embedded component
  const generateStandaloneHTML = (state: {
    view: 'domain' | 'feature';
    navigation: NavigationState;
    sizeMetric: 'loc' | 'files';
    fontSizeMultiplier: number;
    isTooltipEnabled: boolean;
    data: LegacyAnalysisData;
  }, logoBase64: string = '', faviconBase64: string = ''): string => {
    const dataJson = JSON.stringify(state.data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
    const initialStateJson = JSON.stringify({
      view: state.view,
      navigation: state.navigation,
      sizeMetric: state.sizeMetric,
      fontSizeMultiplier: state.fontSizeMultiplier,
      isTooltipEnabled: state.isTooltipEnabled
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LIFTR.ai Legacy System Analysis</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/prop-types@15/prop-types.min.js"></script>
  <script src="https://unpkg.com/recharts@1.6.2/umd/Recharts.js"></script>
  <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
  <style>
    body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script>
    // Ensure PropTypes is available for Recharts
    if (typeof PropTypes !== 'undefined' && typeof React !== 'undefined') {
      React.PropTypes = PropTypes;
    }
    const { createElement: h, useState, useMemo, useRef } = React;
    const { Treemap, ResponsiveContainer, Tooltip } = Recharts;

    // Embedded data
    const DATA = ${dataJson};
    const INITIAL_STATE = ${initialStateJson};
    const LOGO_BASE64 = ${logoBase64 ? `'${logoBase64}'` : "''"};
    const FAVICON_BASE64 = ${faviconBase64 ? `'${faviconBase64}'` : "''"};

    // Color palette
    const COLORS = [
      '#fb851e', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
      '#ec4899', '#14b8a6', '#f97316', '#06b6d4', '#84cc16',
      '#6366f1', '#f43f5e', '#0ea5e9', '#22c55e', '#a855f7'
    ];

    // Icons (using Lucide)
    const icons = {
      ChevronRight: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('path', { d: 'm9 18 6-6-6-6' })),
      Home: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('path', { d: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' }), h('polyline', { points: '9 22 9 12 15 12 15 22' })),
      ZoomIn: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('circle', { cx: 11, cy: 11, r: 8 }), h('path', { d: 'm21 21-4.35-4.35' }), h('line', { x1: 11, y1: 8, x2: 11, y2: 14 }), h('line', { x1: 8, y1: 11, x2: 14, y2: 11 })),
      ArrowLeft: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('line', { x1: 19, y1: 12, x2: 5, y2: 12 }), h('polyline', { points: '12 19 5 12 12 5' })),
      ChevronLeft: () => h('svg', { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('polyline', { points: '15 18 9 12 15 6' })),
      ChevronDown: () => h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('polyline', { points: '6 9 12 15 18 9' })),
      Info: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('circle', { cx: 12, cy: 12, r: 10 }), h('line', { x1: 12, y1: 16, x2: 12, y2: 12 }), h('line', { x1: 12, y1: 8, x2: 12.01, y2: 8 })),
      Download: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }, h('path', { d: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4' }), h('polyline', { points: '7 10 12 15 17 10' }), h('line', { x1: 12, y1: 15, x2: 12, y2: 3 }))
    };

    // Custom Tooltip Component
    function CustomTooltip({ active, payload }) {
      const [isFilesExpanded, setIsFilesExpanded] = useState(false);

      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return h('div', { className: 'bg-white p-4 rounded-lg shadow-xl border-2 border-gray-300 max-w-md max-h-96 overflow-y-auto' },
          h('p', { className: 'font-bold text-gray-900 mb-3 text-lg border-b pb-2' }, data.fullName || data.name),
          h('div', { className: 'space-y-2 mb-3' },
            h('p', { className: 'text-sm text-gray-600' },
              h('span', { className: 'font-semibold text-gray-800' }, 'Lines of Code: '),
              ((data.actualLoc || data.value) || 0).toLocaleString()
            ),
            data.fileCount && h('p', { className: 'text-sm text-gray-600' },
              h('span', { className: 'font-semibold text-gray-800' }, 'Total Files: '),
              data.fileCount
            ),
            data.features !== undefined && h('p', { className: 'text-sm text-gray-600' },
              h('span', { className: 'font-semibold text-gray-800' }, 'Features: '),
              data.features
            ),
            data.functions !== undefined && h('p', { className: 'text-sm text-gray-600' },
              h('span', { className: 'font-semibold text-gray-800' }, 'Functions: '),
              data.functions
            ),
            data.domain && h('p', { className: 'text-sm text-gray-600' },
              h('span', { className: 'font-semibold text-gray-800' }, 'Domain: '),
              data.domain
            ),
            data.feature && h('p', { className: 'text-sm text-gray-600' },
              h('span', { className: 'font-semibold text-gray-800' }, 'Feature: '),
              data.feature
            )
          ),
          data.files && data.files.length > 0 && h('div', { className: 'border-t pt-3 mt-3' },
            h('button', {
              onClick: (e) => { e.stopPropagation(); setIsFilesExpanded(!isFilesExpanded); },
              className: 'flex items-center justify-between w-full text-left hover:bg-gray-50 p-1 rounded transition-colors'
            },
              h('p', { className: 'font-semibold text-gray-800 text-sm' }, 'Files (' + data.files.length + ')'),
              h('div', {
                className: 'transition-transform duration-200' + (isFilesExpanded ? ' rotate-180' : ''),
                dangerouslySetInnerHTML: { __html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>' }
              })
            ),
            isFilesExpanded && h('div', { className: 'max-h-48 overflow-y-auto mt-2' },
              h('div', { className: 'space-y-1' },
                data.files.slice(0, 10).map((file, idx) =>
                  h('div', { key: idx, className: 'flex items-center justify-between bg-gray-50 px-2 py-1.5 rounded text-xs hover:bg-gray-100', title: file.relative_path },
                    h('span', { className: 'font-medium text-gray-900 truncate flex-1 mr-2' }, file.filename),
                    h('span', { className: 'text-gray-600 font-semibold whitespace-nowrap' }, file.total_lines.toLocaleString() + ' LOC')
                  )
                )
              ),
              data.files.length > 10 && h('p', { className: 'text-xs text-gray-500 italic pt-2' },
                '... and ' + (data.files.length - 10) + ' more files'
              )
            )
          )
        );
      }
      return null;
    }

    // Custom Content Component
    function CustomContent(props) {
      const { x = 0, y = 0, width = 0, height = 0, name = '', value = 0, fill = '#8884d8', fileCount, features, functions, sizeMetric = 'loc', actualLoc, fontSizeMultiplier = 1 } = props;

      const showName = width >= 40 && height >= 25;
      const showBasicMetrics = width >= 80 && height >= 50;
      const showDetailedMetrics = width >= 150 && height >= 100;

      const fontSize = Math.max(Math.min(width / 10, height / 5, 13), 9) * fontSizeMultiplier;
      const subFontSize = Math.max(Math.min(width / 12, height / 6, 10), 8) * fontSizeMultiplier;
      const metricFontSize = Math.max(Math.min(width / 14, height / 8, 11), 8) * fontSizeMultiplier;

      return h('g', { style: { cursor: 'pointer' } },
        h('rect', {
          x, y, width, height,
          style: { fill, stroke: '#fff', strokeWidth: 1, strokeOpacity: 1 },
          className: 'transition-opacity hover:opacity-95'
        }),
        showName && [
          h('text', {
            x: x + width / 2,
            y: showDetailedMetrics ? y + height / 2 - 30 : showBasicMetrics ? y + height / 2 - 6 : y + height / 2,
            textAnchor: 'middle',
            fill: '#fff',
            fontSize,
            fontWeight: 'bold',
            style: { textShadow: '0 1px 3px rgba(0,0,0,0.5)' },
            stroke: 'rgba(0, 0, 0, 0.3)',
            strokeWidth: '0.5'
          }, width < 100 ? name.substring(0, Math.floor(width / 8)) : name),
          showBasicMetrics && !showDetailedMetrics && h('text', {
            x: x + width / 2,
            y: y + height / 2 + 10,
            textAnchor: 'middle',
            fill: '#fff',
            fontSize: subFontSize,
            stroke: 'rgba(0, 0, 0, 0.3)',
            strokeWidth: '0.5'
          }, value.toLocaleString() + ' ' + (sizeMetric === 'loc' ? 'LOC' : 'files')),
          showDetailedMetrics && [
            h('text', {
              x: x + width / 2,
              y: y + height / 2 - 8,
              textAnchor: 'middle',
              fill: '#fff',
              fontSize: subFontSize,
              fontWeight: '600',
              stroke: 'rgba(0, 0, 0, 0.3)',
              strokeWidth: '0.5'
            }, sizeMetric === 'loc' ? value.toLocaleString() + ' LOC' : value + ' files'),
            sizeMetric === 'files' && actualLoc && h('text', {
              x: x + width / 2,
              y: y + height / 2 + 8,
              textAnchor: 'middle',
              fill: '#fff',
              fontSize: metricFontSize,
              stroke: 'rgba(0, 0, 0, 0.3)',
              strokeWidth: '0.5'
            }, actualLoc.toLocaleString() + ' LOC'),
            sizeMetric === 'loc' && fileCount && h('text', {
              x: x + width / 2,
              y: y + height / 2 + 10,
              textAnchor: 'middle',
              fill: '#fff',
              fontSize: metricFontSize,
              stroke: 'rgba(0, 0, 0, 0.3)',
              strokeWidth: '0.5'
            }, '📄 ' + fileCount + ' files'),
            features !== undefined && h('text', {
              x: x + width / 2,
              y: y + height / 2 + 27,
              textAnchor: 'middle',
              fill: '#fff',
              fontSize: metricFontSize,
              stroke: 'rgba(0, 0, 0, 0.3)',
              strokeWidth: '0.5'
            }, '⚡ ' + features + ' features'),
            functions !== undefined && h('text', {
              x: x + width / 2,
              y: y + height / 2 + 27,
              textAnchor: 'middle',
              fill: '#fff',
              fontSize: metricFontSize,
              stroke: 'rgba(0, 0, 0, 0.3)',
              strokeWidth: '0.5'
            }, '⚙️ ' + functions + ' functions')
          ]
        ],
        width >= 100 && height >= 80 && h('g', { opacity: 0.7 },
          h('circle', { cx: x + width - 20, cy: y + 20, r: 12, fill: 'rgba(255, 255, 255, 0.3)' }),
          h('text', { x: x + width - 20, y: y + 25, textAnchor: 'middle', fill: '#fff', fontSize: 16, fontWeight: 'bold' }, '+')
        )
      );
    }

    // Main Component
    function LegacyVisualizer() {
      const [view, setView] = useState(INITIAL_STATE.view);
      const [navigation, setNavigation] = useState(INITIAL_STATE.navigation);
      const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
      const [isTooltipEnabled, setIsTooltipEnabled] = useState(INITIAL_STATE.isTooltipEnabled);
      const [sizeMetric, setSizeMetric] = useState(INITIAL_STATE.sizeMetric);
      const [fontSizeMultiplier, setFontSizeMultiplier] = useState(INITIAL_STATE.fontSizeMultiplier);

      // Transform data for domain view
      const domainTreemapData = useMemo(() => {
        const children = Object.entries(DATA.domains).map(([name, domain], index) => ({
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
      }, [sizeMetric]);

      // Transform data for business feature view
      const featureTreemapData = useMemo(() => {
        const children = Object.entries(DATA.business_features_l1).map(([name, feature], index) => ({
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
      }, [sizeMetric]);

      // Calculate domain statistics
      const domainStats = useMemo(() => {
        const totalLines = DATA.summary.total_lines_of_code;
        return Object.entries(DATA.domains)
          .map(([name, domain]) => ({
            name,
            files: domain.file_count,
            lines: domain.total_lines,
            percentage: (domain.total_lines / totalLines) * 100,
            features: domain.features
          }))
          .sort((a, b) => b.lines - a.lines);
      }, []);

      // Calculate feature statistics
      const featureStats = useMemo(() => {
        const totalLines = DATA.summary.total_lines_of_code;
        return Object.entries(DATA.business_features_l1)
          .map(([name, feature]) => {
            const domains = Array.from(new Set(feature.files.map(f => f.primary_domain)));
            return {
              name,
              files: feature.file_count,
              lines: feature.total_lines,
              percentage: (feature.total_lines / totalLines) * 100,
              domains
            };
          })
          .sort((a, b) => b.lines - a.lines);
      }, []);

      // Filter data for domain drill-down
      const filteredFeatureData = useMemo(() => {
        if (navigation.level !== 'domain' || !navigation.selectedDomain) return null;

        const domainData = DATA.domains[navigation.selectedDomain];
        if (!domainData) return null;

        const children = Object.entries(DATA.business_features_l1)
          .filter(([, feature]) => feature.files.some(f => f.primary_domain === navigation.selectedDomain))
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

        return { name: navigation.selectedDomain, children };
      }, [navigation, sizeMetric]);

      // Filter data for feature drill-down
      const filteredFunctionData = useMemo(() => {
        if (navigation.level !== 'feature' || !navigation.selectedFeature) return null;

        const featureData = DATA.business_features_l1[navigation.selectedFeature];
        if (!featureData) return null;

        const functionGroups = {};
        featureData.files.forEach(file => {
          const fileFunctions = featureData.functions_l2 || [];
          if (fileFunctions.length === 0) {
            if (!functionGroups['Other']) {
              functionGroups['Other'] = { files: [], lines: 0 };
            }
            functionGroups['Other'].files.push(file);
            functionGroups['Other'].lines += file.total_lines;
          } else {
            fileFunctions.forEach(func => {
              if (!functionGroups[func]) {
                functionGroups[func] = { files: [], lines: 0 };
              }
              const proportion = 1 / fileFunctions.length;
              functionGroups[func].files.push(file);
              functionGroups[func].lines += Math.round(file.total_lines * proportion);
            });
          }
        });

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

        return { name: navigation.selectedFeature, children };
      }, [navigation, sizeMetric]);

      // Get current treemap data
      const currentTreemapData = useMemo(() => {
        if (navigation.level === 'feature' && filteredFunctionData) return filteredFunctionData;
        if (navigation.level === 'domain' && filteredFeatureData) return filteredFeatureData;
        return view === 'domain' ? domainTreemapData : featureTreemapData;
      }, [navigation, filteredFeatureData, filteredFunctionData, view, domainTreemapData, featureTreemapData]);

      // Handle treemap click
      const handleTreemapClick = (itemData) => {
        const data = itemData;
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

      return h('div', { className: 'w-full h-full bg-gray-50 p-6' },
        // Header
        h('div', { className: 'mb-6 relative' },
          h('div', { className: 'flex items-start justify-between' },
            h('div', { className: 'flex-1' },
              h('h1', { className: 'text-3xl font-bold text-gray-900 mb-2' }, 'LIFTR.ai Legacy System Analysis'),
              h('p', { className: 'text-gray-600' }, 'Analyzed on ' + new Date(DATA.consolidation_date).toLocaleDateString())
            )
          )
        ),
        // Summary Cards
        h('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4 mb-6' },
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('p', { className: 'text-sm text-gray-600 mb-1' }, 'Total Files'),
            h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.summary.total_files.toLocaleString())
          ),
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('p', { className: 'text-sm text-gray-600 mb-1' }, 'Lines of Code'),
            h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.summary.total_lines_of_code.toLocaleString())
          ),
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('p', { className: 'text-sm text-gray-600 mb-1' }, 'Domains'),
            h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.summary.unique_domains)
          ),
          h('div', { className: 'bg-white p-4 rounded-lg shadow' },
            h('p', { className: 'text-sm text-gray-600 mb-1' }, 'Business Features'),
            h('p', { className: 'text-2xl font-bold text-gray-900' }, DATA.summary.unique_business_features_l1)
          )
        ),
        // Breadcrumb Navigation
        navigation.level !== 'overview' && h('div', { className: 'mb-4 flex items-center gap-3 bg-white p-4 rounded-lg shadow' },
          h('button', {
            onClick: handleHomeClick,
            className: 'flex items-center gap-1 text-gray-600 hover:text-[#fb851e] transition-colors'
          }, icons.Home(), h('span', { className: 'text-sm font-medium' }, 'Overview')),
          navigation.selectedDomain && [
            h('div', { dangerouslySetInnerHTML: { __html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>' } }),
            h('button', {
              onClick: () => setNavigation({ level: 'domain', selectedDomain: navigation.selectedDomain }),
              className: 'text-sm font-medium text-gray-700 hover:text-[#fb851e] transition-colors'
            }, navigation.selectedDomain)
          ],
          navigation.selectedFeature && [
            h('div', { dangerouslySetInnerHTML: { __html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-gray-400"><path d="m9 18 6-6-6-6"/></svg>' } }),
            h('div', { className: 'flex items-center gap-2' },
              h('span', { className: 'text-sm font-semibold text-[#fb851e]' }, navigation.selectedFeature),
              h('span', { className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded' }, 'Functions in this feature')
            )
          ],
          navigation.selectedDomain && !navigation.selectedFeature && h('span', { className: 'text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2' }, 'Features in this domain'),
          h('button', {
            onClick: handleBackClick,
            className: 'ml-auto flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium'
          }, icons.ArrowLeft(), 'Back')
        ),
        // View Toggle
        navigation.level === 'overview' && h('div', { className: 'flex gap-2 mb-4' },
          h('button', {
            onClick: () => { setView('domain'); setNavigation({ level: 'overview' }); },
            className: 'px-4 py-2 rounded-lg font-medium transition-colors ' + (view === 'domain' ? 'bg-[#fb851e] text-white' : 'bg-white text-gray-700 hover:bg-gray-100')
          }, 'By Domain'),
          h('button', {
            onClick: () => { setView('feature'); setNavigation({ level: 'overview' }); },
            className: 'px-4 py-2 rounded-lg font-medium transition-colors ' + (view === 'feature' ? 'bg-[#fb851e] text-white' : 'bg-white text-gray-700 hover:bg-gray-100')
          }, 'By Business Feature')
        ),
        // Size Metric Toggle
        h('div', { className: 'flex gap-4 mb-4 items-center' },
          h('div', { className: 'flex gap-2 items-center' },
            h('span', { className: 'text-sm text-gray-600 font-medium' }, 'Size by:'),
            h('button', {
              onClick: () => setSizeMetric('loc'),
              className: 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (sizeMetric === 'loc' ? 'bg-[#fb851e] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300')
            }, 'Lines of Code'),
            h('button', {
              onClick: () => setSizeMetric('files'),
              className: 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (sizeMetric === 'files' ? 'bg-[#fb851e] text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300')
            }, 'Number of Files')
          ),
          h('div', { className: 'flex gap-2 items-center border-l pl-4' },
            h('span', { className: 'text-sm text-gray-600 font-medium' }, 'Font Size:'),
            h('button', {
              onClick: () => setFontSizeMultiplier(Math.max(0.5, fontSizeMultiplier - 0.1)),
              disabled: fontSizeMultiplier <= 0.5,
              className: 'px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold'
            }, 'A−'),
            h('span', { className: 'text-xs text-gray-500 min-w-[3rem] text-center' }, Math.round(fontSizeMultiplier * 100) + '%'),
            h('button', {
              onClick: () => setFontSizeMultiplier(Math.min(2, fontSizeMultiplier + 0.1)),
              disabled: fontSizeMultiplier >= 2,
              className: 'px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold'
            }, 'A+'),
            h('button', {
              onClick: () => setFontSizeMultiplier(1),
              className: 'px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 text-xs'
            }, 'Reset')
          )
        ),
        // Main Content Grid
        h('div', { className: 'grid gap-6 transition-all duration-300 ' + (isPanelCollapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3') },
          // Treemap Visualization
          h('div', { className: 'bg-white rounded-lg shadow p-4 ' + (isPanelCollapsed ? '' : 'lg:col-span-2') },
            h('div', { className: 'flex items-center justify-between mb-4' },
              h('h2', { className: 'text-xl font-bold text-gray-900' },
                navigation.level === 'feature' ? 'Functions in ' + navigation.selectedFeature :
                navigation.level === 'domain' ? 'Features in ' + navigation.selectedDomain :
                view === 'domain' ? 'Domain Distribution' : 'Business Feature Distribution'
              ),
              h('div', { className: 'flex items-center gap-3' },
                navigation.level === 'overview' && view === 'domain' && h('div', { className: 'flex items-center gap-2 text-sm text-gray-500' },
                  icons.ZoomIn(),
                  h('span', null, 'Click a domain to explore features')
                ),
                navigation.level === 'domain' && h('div', { className: 'flex items-center gap-2 text-sm text-gray-500' },
                  icons.ZoomIn(),
                  h('span', null, 'Click a feature to explore functions')
                ),
                h('button', {
                  onClick: () => setIsTooltipEnabled(!isTooltipEnabled),
                  className: 'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' + (isTooltipEnabled ? 'bg-[#fb851e] text-white hover:bg-[#e67510]' : 'bg-gray-200 text-gray-600 hover:bg-gray-300')
                }, icons.Info(), h('span', null, isTooltipEnabled ? 'Tooltip On' : 'Tooltip Off'))
              )
            ),
            h(ResponsiveContainer, { width: '100%', height: 800 },
              h(Treemap, {
                data: currentTreemapData.children,
                dataKey: 'value',
                aspectRatio: 2,
                stroke: '#fff',
                content: h(CustomContent, { sizeMetric, fontSizeMultiplier }),
                isAnimationActive: false,
                onClick: (data) => {
                  const payload = data?.payload || data?.node?.data || data;
                  if (payload) handleTreemapClick(payload);
                }
              },
                isTooltipEnabled && h(Tooltip, { content: h(CustomTooltip) })
              )
            )
          ),
          // Statistics Panel
          h('div', {
            className: 'bg-white rounded-lg shadow p-4 overflow-auto max-h-[600px] transition-all duration-300 ' + (isPanelCollapsed ? 'lg:fixed lg:right-6 lg:top-32 lg:w-12 lg:h-12 lg:p-0 lg:flex lg:items-center lg:justify-center lg:cursor-pointer lg:hover:bg-gray-50' : ''),
            onClick: () => isPanelCollapsed && setIsPanelCollapsed(false)
          },
            h('div', { className: 'flex items-center justify-between mb-4' },
              h('h2', { className: 'text-xl font-bold text-gray-900 ' + (isPanelCollapsed ? 'hidden' : '') },
                view === 'domain' ? 'Domain Statistics' : 'Feature Statistics'
              ),
              h('button', {
                onClick: (e) => { e.stopPropagation(); setIsPanelCollapsed(!isPanelCollapsed); },
                className: 'text-gray-600 hover:text-[#fb851e] transition-colors ' + (isPanelCollapsed ? 'text-2xl' : '')
              }, isPanelCollapsed ? icons.ChevronLeft() : icons.ChevronDown())
            ),
            !isPanelCollapsed && (view === 'domain' ? h('div', { className: 'space-y-4' },
              domainStats.map((stat, index) =>
                h('div', { key: stat.name, className: 'border-b border-gray-200 pb-3' },
                  h('div', { className: 'flex items-start justify-between mb-2' },
                    h('h3', { className: 'font-semibold text-gray-900 text-sm flex-1' }, stat.name),
                    h('div', {
                      className: 'w-4 h-4 rounded ml-2 flex-shrink-0',
                      style: { backgroundColor: COLORS[index % COLORS.length] }
                    })
                  ),
                  h('div', { className: 'space-y-1 text-xs text-gray-600' },
                    h('p', null, h('span', { className: 'font-medium' }, 'Files: '), stat.files),
                    h('p', null, h('span', { className: 'font-medium' }, 'LOC: '), stat.lines.toLocaleString()),
                    h('p', null, h('span', { className: 'font-medium' }, '% of Total: '), stat.percentage.toFixed(1) + '%'),
                    h('p', null, h('span', { className: 'font-medium' }, 'Features: '), stat.features.length)
                  ),
                  h('div', { className: 'mt-2' },
                    h('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                      h('div', {
                        className: 'h-2 rounded-full',
                        style: { width: stat.percentage + '%', backgroundColor: COLORS[index % COLORS.length] }
                      })
                    )
                  )
                )
              )
            ) : h('div', { className: 'space-y-4' },
              featureStats.map((stat, index) =>
                h('div', { key: stat.name, className: 'border-b border-gray-200 pb-3' },
                  h('div', { className: 'flex items-start justify-between mb-2' },
                    h('h3', { className: 'font-semibold text-gray-900 text-sm flex-1' }, stat.name),
                    h('div', {
                      className: 'w-4 h-4 rounded ml-2 flex-shrink-0',
                      style: { backgroundColor: COLORS[index % COLORS.length] }
                    })
                  ),
                  h('div', { className: 'space-y-1 text-xs text-gray-600' },
                    h('p', null, h('span', { className: 'font-medium' }, 'Files: '), stat.files),
                    h('p', null, h('span', { className: 'font-medium' }, 'LOC: '), stat.lines.toLocaleString()),
                    h('p', null, h('span', { className: 'font-medium' }, '% of Total: '), stat.percentage.toFixed(1) + '%'),
                    h('p', null, h('span', { className: 'font-medium' }, 'Domains: '), stat.domains.length)
                  ),
                  h('div', { className: 'mt-2' },
                    h('div', { className: 'w-full bg-gray-200 rounded-full h-2' },
                      h('div', {
                        className: 'h-2 rounded-full',
                        style: { width: stat.percentage + '%', backgroundColor: COLORS[index % COLORS.length] }
                      })
                    )
                  )
                )
              )
            ))
          )
        ),
        // Footer with Logo and Favicon
        h('div', { className: 'mt-2 mb-4 p-3 border-t border-gray-200' },
          h('div', { className: 'flex justify-end items-center gap-3' },
            LOGO_BASE64 && h('img', {
              src: LOGO_BASE64,
              alt: 'LIFTR.ai Logo',
              className: 'h-6 w-auto object-contain',
              style: { maxHeight: '36px' }
            }),
            LOGO_BASE64 && FAVICON_BASE64 && h('div', {
              className: 'h-6 w-px bg-gray-300'
            }),
            FAVICON_BASE64 && h('img', {
              src: FAVICON_BASE64,
              alt: 'Favicon',
              className: 'h-6 w-6 object-contain',
              style: { maxHeight: '24px', maxWidth: '24px' }
            })
          )
        )
      );
    }

    // Render the app
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(LegacyVisualizer));
  </script>
</body>
</html>`;
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          The Lifter Legacy System Analysis
        </h1>
        <p className="text-gray-600">
          Analyzed on {new Date(data.consolidation_date).toLocaleDateString()}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Total Files</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.summary.total_files.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Lines of Code</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.summary.total_lines_of_code.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Domains</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.summary.unique_domains}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-1">Business Features</p>
          <p className="text-2xl font-bold text-gray-900">
            {data.summary.unique_business_features_l1}
          </p>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {navigation.level !== 'overview' && (
        <div className="mb-4 flex items-center gap-3 bg-white p-4 rounded-lg shadow">
          <button
            onClick={handleHomeClick}
            className="flex items-center gap-1 text-gray-600 hover:text-[#fb851e] transition-colors"
            title="Go to overview"
          >
            <Home size={16} />
            <span className="text-sm font-medium">Overview</span>
          </button>

          {navigation.selectedDomain && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <button
                onClick={() => setNavigation({ level: 'domain', selectedDomain: navigation.selectedDomain })}
                className="text-sm font-medium text-gray-700 hover:text-[#fb851e] transition-colors"
              >
                {navigation.selectedDomain}
              </button>
            </>
          )}

          {navigation.selectedFeature && (
            <>
              <ChevronRight size={16} className="text-gray-400" />
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-[#fb851e]">
                  {navigation.selectedFeature}
                </span>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Functions in this feature
                </span>
              </div>
            </>
          )}

          {navigation.selectedDomain && !navigation.selectedFeature && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded ml-2">
              Features in this domain
            </span>
          )}

          <button
            onClick={handleBackClick}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      )}

      {/* View Toggle */}
      {navigation.level === 'overview' && (
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => {
              setView('domain');
              setNavigation({ level: 'overview' });
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'domain'
              ? 'bg-[#fb851e] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            By Domain
          </button>
          <button
            onClick={() => {
              setView('feature');
              setNavigation({ level: 'overview' });
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${view === 'feature'
              ? 'bg-[#fb851e] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
          >
            By Business Feature
          </button>
        </div>
      )}

      {/* Size Metric Toggle */}
      <div className="flex gap-4 mb-4 items-center">
        <div className="flex gap-2 items-center">
          <span className="text-sm text-gray-600 font-medium">Size by:</span>
          <button
            onClick={() => setSizeMetric('loc')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sizeMetric === 'loc'
              ? 'bg-[#fb851e] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            Lines of Code
          </button>
          <button
            onClick={() => setSizeMetric('files')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${sizeMetric === 'files'
              ? 'bg-[#fb851e] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
          >
            Number of Files
          </button>
        </div>

        <div className="flex gap-2 items-center border-l pl-4">
          <span className="text-sm text-gray-600 font-medium">Font Size:</span>
          <button
            onClick={() => setFontSizeMultiplier(Math.max(0.5, fontSizeMultiplier - 0.1))}
            disabled={fontSizeMultiplier <= 0.5}
            className="px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            title="Decrease font size"
          >
            A−
          </button>
          <span className="text-xs text-gray-500 min-w-[3rem] text-center">{Math.round(fontSizeMultiplier * 100)}%</span>
          <button
            onClick={() => setFontSizeMultiplier(Math.min(2, fontSizeMultiplier + 0.1))}
            disabled={fontSizeMultiplier >= 2}
            className="px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold"
            title="Increase font size"
          >
            A+
          </button>
          <button
            onClick={() => setFontSizeMultiplier(1)}
            className="px-2 py-1 rounded bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 text-xs"
            title="Reset font size"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={`grid gap-6 transition-all duration-300 ${isPanelCollapsed ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
        }`}>
        {/* Treemap Visualization */}
        <div

          className={`bg-white rounded-lg shadow p-4 ${isPanelCollapsed ? '' : 'lg:col-span-2'
            }`}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              {navigation.level === 'feature'
                ? `Functions in ${navigation.selectedFeature}`
                : navigation.level === 'domain'
                  ? `Features in ${navigation.selectedDomain}`
                  : view === 'domain'
                    ? 'Domain Distribution'
                    : 'Business Feature Distribution'}
            </h2>
            <div className="flex items-center gap-3">
              {navigation.level === 'overview' && view === 'domain' && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ZoomIn size={16} />
                  <span>Click a domain to explore features</span>
                </div>
              )}
              {navigation.level === 'domain' && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ZoomIn size={16} />
                  <span>Click a feature to explore functions</span>
                </div>
              )}
              <button
                onClick={() => setIsTooltipEnabled(!isTooltipEnabled)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isTooltipEnabled
                  ? 'bg-[#fb851e] text-white hover:bg-[#e67510]'
                  : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                  }`}
                title={isTooltipEnabled ? 'Disable tooltip' : 'Enable tooltip'}
              >
                <Info size={16} />
                <span>{isTooltipEnabled ? 'Tooltip On' : 'Tooltip Off'}</span>
              </button>
              <button
                onClick={handleExportHTML}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                title="Export as standalone HTML"
              >
                <Download size={16} />
                <span>Export HTML</span>
              </button>
              <button
                onClick={handleExportImage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                title="Export as image"
              >
                <Download size={16} />
                <span>Export PNG</span>
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={800} ref={treemapRef}>
            <Treemap
              data={currentTreemapData.children}
              dataKey="value"
              aspectRatio={2}
              stroke="#fff"
              content={<CustomContent sizeMetric={sizeMetric} fontSizeMultiplier={fontSizeMultiplier} />}
              isAnimationActive={false}
              onClick={(data: unknown) => {
                console.log('Treemap onClick event:', data);
                // Recharts passes the data in different ways, try multiple paths
                const payload = (data as Record<string, unknown>)?.payload || (data as Record<string, Record<string, unknown>>)?.node?.data || data;
                console.log('Extracted payload:', payload);
                if (payload) {
                  handleTreemapClick(payload);
                }
              }}
            >
              {isTooltipEnabled && <Tooltip content={<CustomTooltip />} />}
            </Treemap>
          </ResponsiveContainer>
        </div>

        {/* Statistics Panel */}
        <div className={`bg-white rounded-lg shadow p-4 overflow-auto max-h-[600px] transition-all duration-300 ${isPanelCollapsed ? 'lg:fixed lg:right-6 lg:top-32 lg:w-12 lg:h-12 lg:p-0 lg:flex lg:items-center lg:justify-center lg:cursor-pointer lg:hover:bg-gray-50' : ''
          }`}
          onClick={() => isPanelCollapsed && setIsPanelCollapsed(false)}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold text-gray-900 ${isPanelCollapsed ? 'hidden' : ''
              }`}>
              {view === 'domain' ? 'Domain Statistics' : 'Feature Statistics'}
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsPanelCollapsed(!isPanelCollapsed);
              }}
              className={`text-gray-600 hover:text-[#fb851e] transition-colors ${isPanelCollapsed ? 'text-2xl' : ''
                }`}
              title={isPanelCollapsed ? 'Expand statistics panel' : 'Collapse statistics panel'}
            >
              {isPanelCollapsed ? <ChevronLeft size={24} /> : <ChevronDown size={20} />}
            </button>
          </div>

          <div className={isPanelCollapsed ? 'hidden' : ''}>

            {view === 'domain' ? (
              <div className="space-y-4">
                {domainStats.map((stat, index) => (
                  <div
                    key={stat.name}
                    className="border-b border-gray-200 pb-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm flex-1">
                        {stat.name}
                      </h3>
                      <div
                        className="w-4 h-4 rounded ml-2 flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>
                        <span className="font-medium">Files:</span> {stat.files}
                      </p>
                      <p>
                        <span className="font-medium">LOC:</span>{' '}
                        {stat.lines.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">% of Total:</span>{' '}
                        {stat.percentage.toFixed(1)}%
                      </p>
                      <p>
                        <span className="font-medium">Features:</span> {stat.features.length}
                      </p>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${stat.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {featureStats.map((stat, index) => (
                  <div
                    key={stat.name}
                    className="border-b border-gray-200 pb-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-900 text-sm flex-1">
                        {stat.name}
                      </h3>
                      <div
                        className="w-4 h-4 rounded ml-2 flex-shrink-0"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                    </div>
                    <div className="space-y-1 text-xs text-gray-600">
                      <p>
                        <span className="font-medium">Files:</span> {stat.files}
                      </p>
                      <p>
                        <span className="font-medium">LOC:</span>{' '}
                        {stat.lines.toLocaleString()}
                      </p>
                      <p>
                        <span className="font-medium">% of Total:</span>{' '}
                        {stat.percentage.toFixed(1)}%
                      </p>
                      <p>
                        <span className="font-medium">Domains:</span> {stat.domains.length}
                      </p>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${stat.percentage}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Procedures 
      {/*
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Code Assets</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Total Procedures
            </p>
            <p className="text-3xl font-bold text-[#fb851e]">
              {data.summary.unique_procedures}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Local Procedures
            </p>
            <p className="text-3xl font-bold text-[#fb851e]">
              {data.summary.unique_local_procedures}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">
              Common Routines
            </p>
            <p className="text-3xl font-bold text-[#fb851e]">
              {data.summary.unique_common_routines}
            </p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
