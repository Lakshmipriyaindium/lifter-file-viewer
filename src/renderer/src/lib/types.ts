export interface Requirement {
  id: string;
  type: 'user_story' | 'functional' | 'non_functional' | 'business';
  title?: string;
  description: string;
  source: string[];
  priority?: 'critical' | 'high' | 'medium' | 'low';
  validated: boolean;
  confidence_score: number;
  validation_notes?: {
    issues?: string[];
    suggestions?: string[];
    category?: string;
    human_notes?: string;
  };
  tags: string[];
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
  validated_at?: string;
  validated_by?: string;
}

export interface ExtractionJob {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  totalRequirements?: number;
  validatedCount?: number;
  errorCount?: number;
  createdAt: string;
  completedAt?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  requirements: number;
  validated: number;
  lastUpdated: string;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'excel' | 'markdown' | 'jira' | 'azure_devops';
  includeMetadata: boolean;
  validatedOnly: boolean;
}

export interface WebSocketMessage {
  type: 'status' | 'progress' | 'job_update' | 'error' | 'complete';
  jobId?: string;
  data: string | number | ExtractionJob | Record<string, unknown>;
  timestamp: string;
}