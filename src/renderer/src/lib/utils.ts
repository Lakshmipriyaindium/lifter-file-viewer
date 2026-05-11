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

export const determineChartType = (fileName: string, content: string): string | null => {
  const extension = getFileExtension(fileName);

  // 1. Mermaid (mmd, txt, or content-based)
  if (extension === 'mmd' || fileName.toLowerCase().includes('mermaid') || isMermaidContent(content)) {
    return "mermaid";
  }

  // 2. PlantUML
  if (extension === 'puml' || fileName.toLowerCase().includes('plantuml') || content.includes('@startuml')) {
    return "plantuml";
  }

  // 2. JSON-based visualizations
  if (extension === 'json') {
    const lowerName = fileName.toLowerCase();

    if (lowerName.includes("total_analysis_results")) return "total_analysis";
    if (lowerName.includes("business_rules")) return "business_rules";
    if (lowerName.includes("_d3_v2") || lowerName.includes("call_graph")) return "d3_graph_v2";
    if (lowerName.includes("_d3")) return "d3_graph";
    if (lowerName.includes("client_customizations")) return "client_customizations";
    if (lowerName.includes("customizations_by_node")) return "customizations_by_node";
    if (lowerName.includes("unified_knowledge_graph")) return "kg";
    if (lowerName.includes("user_stories")) return "user_stories";
    if (lowerName.includes("business_process_flow")) return "business_process_flow";
    if (lowerName.includes("consolidated_analysis")) {
      try {
        const data = JSON.parse(content);
        // Legacy format has 'domains' and 'business_features_l1'
        if (data.domains && data.business_features_l1) {
          return "legacy_consolidated_analysis";
        }
        // Modern format has 'flows' and 'features'
        return "consolidated_analysis";
      } catch (e) {
        return "consolidated_analysis";
      }
    }
    if (lowerName.includes("business_terms")) return "business_terms";
    if (lowerName.includes("component-distribution")) return "component_distribution";
    if (lowerName.includes("cyclonedx-sbom")) return "sbom";
    if (lowerName.includes("security-report")) return "security";
  }

  return null;
};
