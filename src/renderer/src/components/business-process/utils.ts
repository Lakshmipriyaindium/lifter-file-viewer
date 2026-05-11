import { BusinessProcessFlow, BusinessProcessStep } from './type';

export function validateFlowData(data: unknown): data is BusinessProcessFlow {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.entry_points) &&
    obj.entry_points.every(item => typeof item === 'string') && 
    typeof obj.total_steps === 'number' &&
    Array.isArray(obj.steps) &&
    typeof obj.executive_summary === 'string' &&
    typeof obj.client_customizations_summary === 'object' && obj.client_customizations_summary !== null && 
    typeof obj.business_rules_summary === 'object' && obj.business_rules_summary !== null && 
    typeof obj.timestamp === 'string' &&
    typeof obj.max_depth_reached === 'number' &&
    typeof obj.nodes_visited === 'number'
  );
}

/**
 * Groups steps by a specific property
 */
export function groupStepsBy<K extends keyof BusinessProcessStep>(
  steps: BusinessProcessStep[],
  property: K
): Map<BusinessProcessStep[K], BusinessProcessStep[]> {
  const grouped = new Map<BusinessProcessStep[K], BusinessProcessStep[]>();
  
  for (const step of steps) {
    const key = step[property];
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(step);
  }
  
  return grouped;
}

/**
 * Calculates statistics for the flow
 */
export interface FlowStatistics {
  totalSteps: number;
  totalRules: number;
  averageRulesPerStep: number;
  stepsWithCustomizations: number;
  stepsByDepth: Map<number, number>;
  stepsBySource: Map<string, number>;
  averageDescriptionLength: number;
}

export function calculateFlowStatistics(data: BusinessProcessFlow): FlowStatistics {
  const stepsByDepth = new Map<number, number>();
  const stepsBySource = new Map<string, number>();
  let totalDescriptionLength = 0;
  let stepsWithCustomizations = 0;

  for (const step of data.steps) {
    // Depth counts
    stepsByDepth.set(step.depth, (stepsByDepth.get(step.depth) || 0) + 1);
    
    // Source counts
    stepsBySource.set(step.source, (stepsBySource.get(step.source) || 0) + 1);
    
    // Description length
    totalDescriptionLength += step.description.length;
    
    // Customizations
    if (step.has_client_customizations) {
      stepsWithCustomizations++;
    }
  }

  return {
    totalSteps: data.total_steps,
    totalRules: data.business_rules_summary.total_rules_applied,
    averageRulesPerStep: data.business_rules_summary.total_rules_applied / data.total_steps,
    stepsWithCustomizations,
    stepsByDepth,
    stepsBySource,
    averageDescriptionLength: totalDescriptionLength / data.steps.length
  };
}

/**
 * Finds critical path (steps with most dependencies)
 */
export function findCriticalPath(steps: BusinessProcessStep[]): BusinessProcessStep[] {
  const callCounts = new Map<string, number>();
  
  for (const step of steps) {
    if (step.called_from) {
      callCounts.set(step.called_from, (callCounts.get(step.called_from) || 0) + 1);
    }
  }
  
  return steps
    .filter(step => (callCounts.get(step.node_id) || 0) > 2)
    .sort((a, b) => {
      const aCount = callCounts.get(a.node_id) || 0;
      const bCount = callCounts.get(b.node_id) || 0;
      return bCount - aCount;
    });
}

/**
 * Exports flow data to various formats
 */
export class FlowExporter {
  constructor(private data: BusinessProcessFlow) {}

  /**
   * Export to CSV format
   */
  toCSV(): string {
    const headers = [
      'Step Number',
      'Title',
      'Node Name',
      'Source',
      'Depth',
      'Business Rules Count',
      'Has Customizations',
      'File Path'
    ];

    const rows = this.data.steps.map(step => [
      step.step_number,
      `"${step.step_title}"`,
      step.node_name,
      step.source,
      step.depth,
      step.business_rules.length,
      step.has_client_customizations,
      `"${step.file_path}"`
    ]);

    return [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
  }

  /**
   * Export to Mermaid diagram format
   */
  toMermaid(): string {
    let mermaid = 'graph TD\n';
    
    for (const step of this.data.steps) {
      const nodeId = `step${step.step_number}`;
      const label = step.step_title.replace(/"/g, "'");
      mermaid += `  ${nodeId}["${step.step_number}. ${label}"]\n`;
      
      if (step.called_from) {
        const callerStep = this.data.steps.find(s => s.node_id === step.called_from);
        if (callerStep) {
          mermaid += `  step${callerStep.step_number} --> ${nodeId}\n`;
        }
      }
    }
    
    return mermaid;
  }

  /**
   * Export summary report
   */
  toReport(): string {
    const stats = calculateFlowStatistics(this.data);
    
    let report = '# Business Process Flow Report\n\n';
    report += `**Generated:** ${new Date().toISOString()}\n\n`;
    report += '## Overview\n\n';
    report += `- Total Steps: ${stats.totalSteps}\n`;
    report += `- Total Business Rules: ${stats.totalRules}\n`;
    report += `- Average Rules per Step: ${stats.averageRulesPerStep.toFixed(2)}\n`;
    report += `- Steps with Customizations: ${stats.stepsWithCustomizations}\n`;
    report += `- Maximum Depth: ${this.data.max_depth_reached}\n\n`;
    
    report += '## Distribution by Depth\n\n';
    for (const [depth, count] of stats.stepsByDepth.entries()) {
      report += `- Depth ${depth}: ${count} steps\n`;
    }
    
    report += '\n## Distribution by Source\n\n';
    for (const [source, count] of stats.stepsBySource.entries()) {
      report += `- ${source}: ${count} steps\n`;
    };
    
    report += '\n## Executive Summary\n\n';
    report += this.data.executive_summary;
    
    return report;
  }
}

/**
 * Search through steps with advanced filtering
 */
export function searchSteps(
  steps: BusinessProcessStep[],
  query: string,
  options?: {
    searchDescription?: boolean;
    searchRules?: boolean;
    caseSensitive?: boolean;
  }
): BusinessProcessStep[] {
  const {
    searchDescription = true,
    searchRules = true,
    caseSensitive = false
  } = options || {};

  const normalizeString = (str: string) => 
    caseSensitive ? str : str.toLowerCase();
  
  const normalizedQuery = normalizeString(query);

  return steps.filter(step => {
    const titleMatch = normalizeString(step.step_title).includes(normalizedQuery);
    const nodeMatch = normalizeString(step.node_name).includes(normalizedQuery);
    
    const descriptionMatch = searchDescription && 
      normalizeString(step.description).includes(normalizedQuery);
    
    const rulesMatch = searchRules &&
      step.business_rules.some(rule => 
        normalizeString(rule).includes(normalizedQuery)
      );

    return titleMatch || nodeMatch || descriptionMatch || rulesMatch;
  });
}

/**
 * Format timestamp to readable date
 */
export function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return timestamp;
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
