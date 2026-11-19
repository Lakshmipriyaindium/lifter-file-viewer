import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isMermaidContent = (content: string): boolean => {
  let cleanedContent = content.trim();

  // Remove markdown code block syntax if present
  if (cleanedContent.startsWith("```mermaid")) {
    const mermaidRegex = /```mermaid\s*([\s\S]*?)```/;
    const match = mermaidRegex.exec(cleanedContent);
    if (match?.[1]) {
      cleanedContent = match[1].trim();
    }
  } else if (cleanedContent.startsWith("```")) {
    const codeBlockRegex = /```\s*([\s\S]*?)```/;
    const match = codeBlockRegex.exec(cleanedContent);
    if (match?.[1]) {
      cleanedContent = match[1].trim();
    }
  }

  // Common mermaid diagram types
  const mermaidPatterns = [
    /^graph\s+(TB|TD|BT|RL|LR)/i,
    /^sequenceDiagram/i,
    /^classDiagram/i,
    /^stateDiagram(-v2)?/i,
    /^erDiagram/i,
    /^gantt/i,
    /^pie/i,
    /^flowchart\s+(TB|TD|BT|RL|LR)/i
  ];

  const contentLines = cleanedContent.split('\n');
  // Check if any of the first few lines match mermaid patterns
  for (let i = 0; i < Math.min(5, contentLines.length); i++) {
    if (mermaidPatterns.some(pattern => pattern.test(contentLines[i]))) {
      return true;
    }
  }
  return false;
};

// Helper function to get file extension
const getFileExtension = (fileName: string, extension?: string | null): string | undefined => {
  return extension?.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
};

// Tokenize filename into lowercase word segments (e.g. "architecture_c4.json" -> ["architecture", "c4"])
const tokenize = (fileName: string): string[] => {
  const baseName = fileName.replace(/\.[^.]+$/, '').toLowerCase();
  return baseName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
};

// Prefix-aware token matcher (e.g. "rule" matches "rules", "customiz" matches "customizations")
const hasToken = (tokens: string[], keyword: string): boolean => {
  return tokens.some(token => token === keyword || token.startsWith(keyword));
};

interface ChartRule {
  mode: string;
  require: string[];   // All required tokens must be present
  exclude?: string[]; // None of these tokens can be present
}

const CHART_RULES: ChartRule[] = [
  // C4 Architecture (matches "architecture_c4", "c4_architecture", "c4_model", etc.)
  { mode: 'c4_architecture', require: ['c4'] },

  // Architecture Analysis (requires "architecture", but not "c4")
  { mode: 'architecture_analysis', require: ['architecture', 'analysis'], exclude: ['c4'] },

  // Cloud Readiness
  { mode: 'cloud', require: ['cloud'] },

  // Analysis & Features
  { mode: 'total_analysis', require: ['total', 'analysis'] },
  { mode: 'hierarchical_features', require: ['hierarchical'] },
  { mode: 'focused_analysis', require: ['focused', 'analysis'] },

  // Business Group (differentiated by unique keywords)
  { mode: 'business_terms', require: ['term'] },
  { mode: 'business_process_flow', require: ['process'] },
  { mode: 'business_metrics', require: ['business', 'metric'] },
  { mode: 'consolidated_business_reports', require: ['business', 'report'] },
  { mode: 'business_rules', require: ['rule'], exclude: ['metric', 'summary'] },

  // Customizations
  { mode: 'customizations_by_node', require: ['customiz', 'node'] },
  { mode: 'client_customizations', require: ['customiz'], exclude: ['node'] },

  // Graphs & Stories
  { mode: 'd3_graph_v2', require: ['d3', 'v2'] },
  { mode: 'd3_graph_v2', require: ['call', 'graph'] },
  { mode: 'd3_graph', require: ['d3'], exclude: ['v2'] },
  { mode: 'kg', require: ['knowledge', 'graph'] },
  { mode: 'user_stories', require: ['user', 'stor'] },

  // Project Inventory, Reports & Tools
  { mode: 'project_analysis_result', require: ['project', 'analysis'] },
  { mode: 'consolidated_project_inventory', require: ['project', 'inventory'] },
  { mode: 'component_distribution', require: ['component', 'distribution'] },
  { mode: 'sbom', require: ['sbom'] },
  { mode: 'sbom', require: ['cyclonedx'] },
  { mode: 'security', require: ['security'] },
  { mode: 'legacy_consolidated_analysis', require: ['module', 'analysis'] },
  { mode: 'API-report', require: ['api', 'report'] },
  { mode: 'program_flow', require: ['program', 'flow'] },
  { mode: 'capability_model', require: ['capability'] },
  { mode: 'capability_model', require: ['taxonomy'] },
  { mode: 'capability_model', require: ['l1', 'l2', 'l3'] },
  { mode: 'cross_repo', require: ['cross'] },
];

export const determineChartType = (fileName: string, content: string): string | null => {
  const extension = getFileExtension(fileName);

  // 1. Mermaid (mmd, txt, or content-based)
  if (extension === 'mmd' || fileName.toLowerCase().includes('mermaid') || isMermaidContent(content)) {
    return 'mermaid';
  }

  // 2. PlantUML
  if (extension === 'puml' || fileName.toLowerCase().includes('plantuml') || content.includes('@startuml')) {
    return 'plantuml';
  }

  // 3. JSON-based visualizations
  if (extension === 'json') {
    const tokens = tokenize(fileName);

    // Business rules metrics / summary files should not render as rules charts
    if (hasToken(tokens, 'rule') && (hasToken(tokens, 'metric') || hasToken(tokens, 'summary'))) {
      return null;
    }

    // Consolidated analysis has a special sub-format check (legacy vs modern)
    if (hasToken(tokens, 'consolidated') && hasToken(tokens, 'analysis')) {
      try {
        const data = JSON.parse(content);
        return data.domains && data.business_features_l1
          ? 'legacy_consolidated_analysis'
          : 'consolidated_analysis';
      } catch {
        return 'consolidated_analysis';
      }
    }

    // Match rules table (order-independent token matching)
    const matchedRule = CHART_RULES.find(rule =>
      rule.require.every(req => hasToken(tokens, req)) &&
      (!rule.exclude || !rule.exclude.some(exc => hasToken(tokens, exc)))
    );

    if (matchedRule) {
      return matchedRule.mode;
    }

    // Content-based fallbacks (parsed once for efficiency)
    try {
      const data = JSON.parse(content);
      if (data) {
        // C4 Architecture fallback (matches system_context or containers)
        if (data.system_context || data.containers || (data.metadata && data.metadata.project_name)) {
          return 'c4_architecture';
        }
        // Architecture Analysis fallback
        if (data.architecture_style && Array.isArray(data.checklist_items) && data.microservice_readiness) {
          return 'architecture_analysis';
        }
        // Cloud Readiness fallback
        if (typeof data.overall_score === 'number' && Array.isArray(data.dimensions) && typeof data.recommended_strategy === 'string') {
          return 'cloud';
        }
        // Capability Model fallback
        if (Array.isArray(data) && data.length > 0 && data[0].l2Capabilities) {
          return 'capability_model';
        }
      }
    } catch {
      // Invalid JSON syntax; returns null
    }
  }

  return null;
};
