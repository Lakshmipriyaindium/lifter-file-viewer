export type ViewerCategory = 'system_assessment' | 'functional_analysis';

export interface ViewerCardConfig {
  id: string;
  category: ViewerCategory;
  title: string;
  icon: string;
  description: string;
  mode: string;
  accept?: string;
  buttonText?: string;
}

export const VIEWER_CARDS: ViewerCardConfig[] = [
  // ─── System Assessment ───
  {
    id: 'c4_architecture',
    category: 'system_assessment',
    title: 'C4 Architecture',
    icon: '🏢',
    description: 'Visualize C4 architecture models (Context, Containers, Components) from JSON files.',
    mode: 'c4_architecture',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'cloud',
    category: 'system_assessment',
    title: 'Cloud Readiness',
    icon: '☁️',
    description: 'Evaluate cloud readiness score, 14 architectural factors, and 6R migration strategy recommendations.',
    mode: 'cloud',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'architecture_analysis',
    category: 'system_assessment',
    title: 'Architecture Analysis',
    icon: '🏛️',
    description: 'Visualize architecture style, microservice readiness, antipatterns and the architectural health checklist.',
    mode: 'architecture_analysis',
    accept: '.json',
    buttonText: 'Select JSON File'
  },

  // ─── Functional Analysis ───
  {
    id: 'consolidated_analysis',
    category: 'functional_analysis',
    title: 'Consolidated Analysis',
    icon: '📊',
    description: 'Project-wide business intelligence dashboard. Supports modern flow-based and legacy domain-based formats.',
    mode: 'consolidated_analysis',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'business_terms',
    category: 'functional_analysis',
    title: 'Business Terms',
    icon: '📖',
    description: 'Explore and export project terminology, constants, and data elements from business_terms.json.',
    mode: 'business_terms',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'user_stories',
    category: 'functional_analysis',
    title: 'User Stories',
    icon: '📋',
    description: 'Detailed view of epics, stories, and acceptance criteria from user_stories.json.',
    mode: 'user_stories',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'business_rules',
    category: 'functional_analysis',
    title: 'Business Rules',
    icon: '📝',
    description: 'Analyze extracted business rules and constraints from business_rules.json.',
    mode: 'business_rules',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'total_analysis',
    category: 'functional_analysis',
    title: 'Total Analysis',
    icon: '📈',
    description: 'Comprehensive results dashboard for the entire codebase analysis.',
    mode: 'total_analysis',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'hierarchical_features',
    category: 'functional_analysis',
    title: 'Hierarchical Features',
    icon: '🌳',
    description: 'Multi-level domain and sub-feature hierarchy from hierarchical_features.json.',
    mode: 'hierarchical_features',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'capability_model',
    category: 'functional_analysis',
    title: 'Domain Hierarchy',
    icon: '🏛️',
    description: 'Hierarchical view of Domains, Capabilities, Features, and User Stories.',
    mode: 'capability_model',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'business_process_flow',
    category: 'functional_analysis',
    title: 'Business Process',
    icon: '🔄',
    description: 'Visualize process timelines and swimlane flowcharts from business_process_flow.json.',
    mode: 'business_process_flow',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'd3_graph_v2',
    category: 'functional_analysis',
    title: 'Call Graph',
    icon: '🕸️',
    description: 'Explore interactive call graphs from graph data files (_d3_v2 or call_graph).',
    mode: 'd3_graph_v2',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'kg',
    category: 'functional_analysis',
    title: 'Knowledge Graph',
    icon: '🕸️',
    description: 'Explore entity relationship graphs from unified_knowledge_graph.json.',
    mode: 'kg',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'd3_graph',
    category: 'functional_analysis',
    title: 'D3 Graph (V1)',
    icon: '📉',
    description: 'View interactive force-directed graphs of code relationships from _d3.json files.',
    mode: 'd3_graph',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'mermaid',
    category: 'functional_analysis',
    title: 'Mermaid Viewer',
    icon: '📊',
    description: 'Visualize .mmd or .txt files containing Mermaid diagrams.',
    mode: 'mermaid',
    accept: '.mmd,.txt',
    buttonText: 'Select .mmd File'
  },
  {
    id: 'plantuml',
    category: 'functional_analysis',
    title: 'PlantUML Viewer',
    icon: '🌳',
    description: 'Visualize .puml files using the PlantUML rendering engine.',
    mode: 'plantuml',
    accept: '.puml,.txt',
    buttonText: 'Select .puml File'
  },
  {
    id: 'client_customizations',
    category: 'functional_analysis',
    title: 'Client Customization',
    icon: '🏢',
    description: 'Analyze client-specific code patterns and rules from client_customizations.json.',
    mode: 'client_customizations',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'customizations_by_node',
    category: 'functional_analysis',
    title: 'Node Analysis',
    icon: '📂',
    description: 'View detailed analysis across code nodes from customizations_by_node.json.',
    mode: 'customizations_by_node',
    accept: '.json',
    buttonText: 'Select JSON File'
  },
  {
    id: 'cross_repo',
    category: 'functional_analysis',
    title: 'Cross-Repo Connections',
    icon: '🔗',
    description: 'Visualize API and integration dependencies across multiple repositories.',
    mode: 'cross_repo',
    accept: '.json',
    buttonText: 'Select JSON File'
  }
];
