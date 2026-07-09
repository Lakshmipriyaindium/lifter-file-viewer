// types/project-analysis.ts
export interface ProjectMetadata {
  generatedAt: string;
  totalProjects: number;
  description: string;
}

export interface Summary {
  totalFiles: number;
  totalLOC: number;
  totalComponents: number;
  totalServices: number;
  totalControllers: number;
  totalModels: number;
  totalVulnerabilities: number;
  totalBundleSize: number;
  averageComplexity: number;
  totalBundleSizeFormatted: string;
}

export interface FileTypeDistribution {
  [key: string]: {
    count: number;
    lines: number;
  };
}

export interface ComponentTypeDistribution {
  [key: string]: number;
}

export interface ComplexityLevelDistribution {
  very_complex: number;
  complex: number;
  simple: number;
  medium: number;
}

export interface AggregatedMetrics {
  fileTypeDistribution: FileTypeDistribution;
  componentTypeDistribution: ComponentTypeDistribution;
  complexityLevelDistribution: ComplexityLevelDistribution;
  securityIssuesDistribution: Record<string, unknown>;
}

export interface ProjectSecurity {
  hardcodedCredentialsCount: number;
  unsafePatternsCount: number;
  vulnerabilitiesCount: number;
  deprecatedDependenciesCount: number;
  vulnerabilities: string[];
}

export interface Project {
  projectName: string;
  loc: {
    totalFiles: number;
    totalLOC: number;
    averageLOC: number;
    fileTypeDistribution: FileTypeDistribution;
  };
  inventory: {
    totalComponents: number;
    totalServices: number;
    totalControllers: number;
    totalModels: number;
    componentTypeDistribution: ComponentTypeDistribution;
    percentageDistribution: {
      components: number;
      services: number;
      controllers: number;
      models: number;
    };
  };
  security: ProjectSecurity;
  bundle: {
    totalSize: number;
    totalSizeFormatted: string;
    bundleCount: number;
  };
  complexity: {
    totalFiles: number;
    totalLOC: number;
    averageLOC: number;
    averageComplexity: number;
    averageMaintainability: number;
    complexityLevelDistribution: Partial<ComplexityLevelDistribution>;
    totalCognitive: number;
    averageCognitive: number;
  };
}

export interface ProjectAnalysisData {
  metadata: ProjectMetadata;
  summary: Summary;
  aggregatedMetrics: AggregatedMetrics;
  projects: Project[];
}
