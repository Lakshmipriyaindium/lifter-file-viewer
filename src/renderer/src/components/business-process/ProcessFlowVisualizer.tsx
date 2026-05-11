// Adapted for Lifter-File-Viewer (removed 'use client')
import React, { useState, useMemo } from 'react';
import { BusinessProcessFlow, BusinessProcessStep } from './type';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Filter, 
  Database, 
  FileCode, 
  AlertCircle,
  Shield,
  FileText,
  FileSpreadsheet,
  Layers,
  Target
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProcessFlowVisualizerProps {
  data: BusinessProcessFlow;
}

const ProcessFlowVisualizer: React.FC<ProcessFlowVisualizerProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [filterDepth, setFilterDepth] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);
  const [showRulesOnly, setShowRulesOnly] = useState(false);

  // Get unique sources and max depth
  const sources = useMemo(() => {
    return Array.from(new Set(data.steps.map(step => step.source)));
  }, [data.steps]);

  const maxDepth = data.max_depth_reached;

  // Filter steps
  const filteredSteps = useMemo(() => {
    return data.steps.filter(step => {
      const matchesSearch = searchTerm === '' || 
        step.step_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        step.node_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDepth = filterDepth === null || step.depth === filterDepth;
      const matchesSource = filterSource === null || step.source === filterSource;
      const matchesRules = !showRulesOnly || step.business_rules.length > 0;

      return matchesSearch && matchesDepth && matchesSource && matchesRules;
    });
  }, [data.steps, searchTerm, filterDepth, filterSource, showRulesOnly]);

  const toggleStep = (stepNumber: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepNumber)) {
      newExpanded.delete(stepNumber);
    } else {
      newExpanded.add(stepNumber);
    }
    setExpandedSteps(newExpanded);
  };

  const expandAll = () => {
    setExpandedSteps(new Set(filteredSteps.map(s => s.step_number)));
  };

  const collapseAll = () => {
    setExpandedSteps(new Set());
  };

  const exportToMarkdown = () => {
    let markdown = `# Business Process Flow Analysis\n\n`;
    
    // Process Overview
    if (data.process_name) {
      markdown += `## ${data.process_name}\n\n`;
    }
    
    if (data.purpose) {
      markdown += `**Purpose:** ${data.purpose}\n\n`;
    }
    
    markdown += `**Entry Points:** ${data.entry_points.join(', ')}\n`;
    markdown += `**Total Steps:** ${data.total_steps}\n`;
    markdown += `**Nodes Visited:** ${data.nodes_visited}\n`;
    markdown += `**Max Depth:** ${data.max_depth_reached}\n`;
    markdown += `**Total Business Rules:** ${data.business_rules_summary?.total_rules_applied}\n`;
    markdown += `**Steps with Customizations:** ${data.client_customizations_summary.total_steps_with_customizations}\n\n`;
    markdown += `---\n\n`;

    // Business Value
    if (data.business_value) {
      markdown += `## Business Value\n\n`;
      markdown += `${data.business_value}\n\n`;
      markdown += `---\n\n`;
    }

    // Key Phases
    if (data.key_phases && data.key_phases.length > 0) {
      markdown += `## Key Phases\n\n`;
      for (const [idx, phase] of data.key_phases.entries()) {
        markdown += `${idx + 1}. ${phase}\n`;
      }
      markdown += `\n---\n\n`;
    }

    // Critical Business Rules
    if (data.critical_business_rules && data.critical_business_rules.length > 0) {
      markdown += `## Critical Business Rules\n\n`;
      for (const [idx, rule] of data.critical_business_rules.entries()) {
        markdown += `${idx + 1}. ${rule}\n`;
      }
      markdown += `\n---\n\n`;
    }

    // Executive Summary
    markdown += `## Executive Summary\n\n`;
    markdown += `${data.executive_summary}\n\n`;
    markdown += `---\n\n`;

    // Process Steps
    markdown += `## Process Flow Steps\n\n`;
    for (const step of filteredSteps) {
      markdown += `### Step ${step.step_number}: ${step.step_title}\n\n`;
      markdown += `**Source:** ${step.source}\n`;
      markdown += `**Node:** ${step.node_name}\n`;
      markdown += `**Depth:** ${step.depth}\n`;
      if (step.has_client_customizations) {
        markdown += `**Customizable:** Yes\n`;
      }
      markdown += `\n**Description:**\n${step.description}\n\n`;

      if (step.business_rules.length > 0) {
        markdown += `**Business Rules:**\n`;
        for (const [rIdx, rule] of step.business_rules.entries()) {
          markdown += `${rIdx + 1}. ${rule}\n`;
        }
        markdown += `\n`;
      }

      markdown += `**Technical Details:**\n`;
      markdown += `- File Path: ${step.file_path}\n`;
      markdown += `- Node ID: ${step.node_id}\n`;
      if (step.called_from) {
        markdown += `- Called From: ${step.called_from}\n`;
      }
      if (step.call_reason) {
        markdown += `- Call Reason: ${step.call_reason}\n`;
      }

      markdown += `\n---\n\n`;
    }

    // Business Rules Summary
    markdown += `## Business Rules Summary\n\n`;
    markdown += `**Total Rules Applied:** ${data.business_rules_summary?.total_rules_applied}\n\n`;

    // Client Customizations Summary
    markdown += `## Client Customizations Summary\n\n`;
    markdown += `**Total Steps with Customizations:** ${data.client_customizations_summary.total_steps_with_customizations}\n`;
    markdown += `**Clients Affected:** ${data.client_customizations_summary.clients_affected.join(', ')}\n`;

    // Download
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-process-flow-${data.entry_points[0]?.replaceAll(/[^a-z0-9]/gi, '-') || 'flow'}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const summaryData = [
      ['Business Process Flow Analysis'],
      ['']
    ];

    // Add process name if available
    if (data.process_name) {
      summaryData.push(['Process Name', data.process_name]);
    }

    // Add purpose if available
    if (data.purpose) {
      summaryData.push(['Purpose', data.purpose]);
    }

    summaryData.push(
      ['Entry Points', data.entry_points.join(', ')],
      ['Total Steps', data.total_steps.toString()],
      ['Nodes Visited', data.nodes_visited.toString()],
      ['Max Depth', data.max_depth_reached.toString()],
      ['Total Business Rules', data.business_rules_summary?.total_rules_applied.toString()],
      ['Steps with Customizations', data.client_customizations_summary.total_steps_with_customizations.toString()],
      // ['Clients Affected', data.client_customizations_summary.clients_affected.join(', ')],
      ['']
    );

    // Add Business Value if available
    if (data.business_value) {
      summaryData.push(
        ['Business Value'],
        [data.business_value],
        ['']
      );
    }

    // Add Key Phases if available
    if (data.key_phases && data.key_phases.length > 0) {
      summaryData.push(['Key Phases']);
      for (const [idx, phase] of data.key_phases.entries()) {
        summaryData.push([`${idx + 1}. ${phase}`]);
      }
      summaryData.push(['']);
    }

    // Add Critical Business Rules if available
    if (data.critical_business_rules && data.critical_business_rules.length > 0) {
      summaryData.push(['Critical Business Rules']);
      for (const [idx, rule] of data.critical_business_rules.entries()) {
        summaryData.push([`${idx + 1}. ${rule}`]);
      }
      summaryData.push(['']);
    }

    summaryData.push(
      ['Executive Summary'],
      [data.executive_summary]
    );

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');

    // Process Steps Sheet
    const stepsData = [
      ['Step Number', 'Title', 'Source', 'Node Name', 'Depth', 'Description', 'Business Rules', 'Customizable', 'File Path', 'Node ID', 'Called From', 'Call Reason']
    ];
    
    for (const step of filteredSteps) {
      stepsData.push([
        step.step_number.toString(),
        step.step_title,
        step.source,
        step.node_name,
        step.depth.toString(),
        step.description,
        step.business_rules.join('; '),
        step.has_client_customizations ? 'Yes' : 'No',
        step.file_path,
        step.node_id,
        step.called_from || '',
        step.call_reason || ''
      ]);
    }

    const stepsSheet = XLSX.utils.aoa_to_sheet(stepsData);
    
    // Set column widths
    stepsSheet['!cols'] = [
      { wch: 12 }, // Step Number
      { wch: 30 }, // Title
      { wch: 12 }, // Source
      { wch: 25 }, // Node Name
      { wch: 8 },  // Depth
      { wch: 50 }, // Description
      { wch: 50 }, // Business Rules
      { wch: 12 }, // Customizable
      { wch: 40 }, // File Path
      { wch: 30 }, // Node ID
      { wch: 25 }, // Called From
      { wch: 30 }  // Call Reason
    ];

    XLSX.utils.book_append_sheet(wb, stepsSheet, 'Process Steps');

    // Business Rules and Customizations Sheet
    const rulesData = [
      ['Business Rules Summary'],
      [''],
      ['Total Rules Applied', data.business_rules_summary?.total_rules_applied.toString()],
      ['']
    ];

    // Add Critical Business Rules if available
    if (data.critical_business_rules && data.critical_business_rules.length > 0) {
      rulesData.push(['Critical Business Rules'], ['']);
      for (const [idx, rule] of data.critical_business_rules.entries()) {
        rulesData.push([`${idx + 1}`, rule]);
      }
      rulesData.push(['']);
    }

    rulesData.push(
      ['Client Customizations Summary'],
      [''],
      ['Total Steps with Customizations', data.client_customizations_summary.total_steps_with_customizations.toString()],
      ['Clients Affected', data.client_customizations_summary.clients_affected.join(', ')]
    );

    const rulesSheet = XLSX.utils.aoa_to_sheet(rulesData);
    XLSX.utils.book_append_sheet(wb, rulesSheet, 'Summary Details');

    // Download
    XLSX.writeFile(wb, `business-process-flow-${data.entry_points[0]?.replaceAll(/[^a-z0-9]/gi, '-') || 'flow'}-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const getSourceColor = (source: string): string => {
    const colors: { [key: string]: string } = {
      'codebase': 'bg-blue-100 text-blue-800 border-blue-300',
      'database': 'bg-purple-100 text-purple-800 border-purple-300',
      'default': 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return colors[source] || colors.default;
  };

  const getDepthColor = (depth: number): string => {
    const colors = [
      'bg-orange-500', // depth 0
      'bg-blue-500',   // depth 1
      'bg-green-500',  // depth 2
      'bg-purple-500', // depth 3
      'bg-pink-500',   // depth 4+
    ];
    return colors[Math.min(depth, colors.length - 1)];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-9xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {data.process_name || 'Business Process Flow Analysis'}
          </h1>
          {data.purpose && (
            <p className="text-lg text-gray-600 mt-2">{data.purpose}</p>
          )}
        </div>

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Steps</p>
                <p className="text-3xl font-bold text-gray-900">{data.total_steps}</p>
              </div>
              <Layers className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Business Rules</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.business_rules_summary?.total_rules_applied}
                </p>
              </div>
              <Shield className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Key Phases</p>
                <p className="text-3xl font-bold text-gray-900">
                  {data.key_phases?.length || 0}
                </p>
              </div>
              <Target className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Business Value */}
        {data.business_value && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 mb-8 border-l-4 border-blue-500">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-500" />
              Business Value
            </h2>
            <p className="text-gray-700 leading-relaxed">{data.business_value}</p>
          </div>
        )}

        {/* Key Phases */}
        {data.key_phases && data.key_phases.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <ChevronRight className="w-5 h-5 mr-2 text-purple-500" />
              Key Phases
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {data.key_phases.map((phase, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-tight">{phase}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Critical Business Rules */}
        {data.critical_business_rules && data.critical_business_rules.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-orange-500" />
              Critical Business Rules
            </h2>
            <div className="space-y-2">
              {data.critical_business_rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-700 leading-relaxed">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Executive Summary */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-orange-500" />
            Executive Summary
          </h2>
          <div className="prose max-w-none text-gray-700 text-md leading-relaxed">
            {data.executive_summary?.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="mb-3">{paragraph}</p>
            ))}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search steps, descriptions, or node names..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Depth Filter */}
            <div className="w-full lg:w-48">
              <select
                value={filterDepth ?? ''}
                onChange={(e) => setFilterDepth(e.target.value === '' ? null : Number.parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Depths</option>
                {Array.from({ length: maxDepth + 1 }, (_, i) => (
                  <option key={i} value={i}>Depth {i}</option>
                ))}
              </select>
            </div>

            {/* Source Filter */}
            <div className="w-full lg:w-48">
              <select
                value={filterSource ?? ''}
                onChange={(e) => setFilterSource(e.target.value === '' ? null : e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">All Sources</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            {/* Rules Filter */}
            <button
              onClick={() => setShowRulesOnly(!showRulesOnly)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                showRulesOnly
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Filter className="w-4 h-4 inline mr-2" />
              Rules Only
            </button>

            {/* Expand/Collapse */}
            <div className="flex gap-2">
              <button
                onClick={expandAll}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Expand All
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Collapse All
              </button>
            </div>
          </div>

          {/* Export Buttons */}
          <div className="mt-4 flex gap-3">
            <button
              onClick={exportToMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
            >
              <FileText className="w-4 h-4" />
              Export to Markdown
            </button>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors font-medium"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Export to Excel
            </button>
          </div>

          {/* Results count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredSteps.length} of {data.total_steps} steps
          </div>
        </div>

        {/* Process Flow Timeline */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Process Flow Timeline</h2>
          
          <div className="relative">
            {filteredSteps.map((step, index) => (
              <StepCard
                key={step.step_number}
                step={step}
                isExpanded={expandedSteps.has(step.step_number)}
                onToggle={() => toggleStep(step.step_number)}
                isLast={index === filteredSteps.length - 1}
                getSourceColor={getSourceColor}
                getDepthColor={getDepthColor}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

interface StepCardProps {
  step: BusinessProcessStep;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
  getSourceColor: (source: string) => string;
  getDepthColor: (depth: number) => string;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  isExpanded,
  onToggle,
  isLast,
  getSourceColor,
  getDepthColor
}) => {
  return (
    <div className="relative pb-8">
      {/* Connection line */}
      {!isLast && (
        <div className="absolute left-5 top-12 w-0.5 bg-gray-300 h-full" />
      )}

      {/* Step content */}
      <div className="relative flex items-start gap-4">
        {/* Step number bubble */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-full ${getDepthColor(step.depth)} text-white flex items-center justify-center font-bold text-sm shadow-lg z-10`}>
          {step.step_number}
        </div>

        {/* Card */}
        <div className="flex-1 min-w-0">
          <div 
            className={`border-2 rounded-lg transition-all cursor-pointer hover:shadow-lg ${
              isExpanded ? 'shadow-md' : ''
            } ${getSourceColor(step.source)}`}
            onClick={onToggle}
          >
            {/* Header */}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-2 mb-2">
                    <h3 className="font-bold text-lg">{step.step_title}</h3>
                    {step.has_client_customizations && (
                      <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-medium">
                        Customizable
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium flex items-center">
                      {step.source === 'database' ? (
                        <Database className="w-3 h-3 mr-1" />
                      ) : (
                        <FileCode className="w-3 h-3 mr-1" />
                      )}
                      {step.source}
                    </span>
                    <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium">
                      {step.node_name}
                    </span>
                    {step.business_rules.length > 0 && (
                      <span className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs font-medium flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        {step.business_rules.length} rules
                      </span>
                    )}
                  </div>

                  {!isExpanded && (
                    <p className="text-sm opacity-75 line-clamp-2 pr-2">
                      {step.description}
                    </p>
                  )}
                </div>

                <button className="flex-shrink-0 text-gray-600">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-current border-opacity-20 p-4 bg-white bg-opacity-30">
                {/* Description */}
                <div className="mb-4">
                  <h4 className="font-semibold text-sm mb-2">Description</h4>
                  <p className="text-sm leading-relaxed">{step.description}</p>
                </div>

                {/* Business Rules */}
                {step.business_rules.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-sm mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-1" />
                      Business Rules
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {step.business_rules.map((rule, idx) => (
                        <li key={idx} className="text-sm">{rule}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technical Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold">File Path:</span>
                    <p className="text-gray-700 break-all mt-1">{step.file_path}</p>
                  </div>
                  <div>
                    <span className="font-semibold">Node ID:</span>
                    <p className="text-gray-700 break-all mt-1">{step.node_id}</p>
                  </div>
                  {step.called_from && (
                    <div>
                      <span className="font-semibold">Called From:</span>
                      <p className="text-gray-700 break-all mt-1">{step.called_from}</p>
                    </div>
                  )}
                  {step.call_reason && (
                    <div>
                      <span className="font-semibold">Call Reason:</span>
                      <p className="text-gray-700 break-all mt-1">{step.call_reason}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessFlowVisualizer;
