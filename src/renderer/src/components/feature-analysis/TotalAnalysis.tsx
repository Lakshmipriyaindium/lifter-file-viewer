// Adapted for Lifter-File-Viewer
import React, { useState, useMemo, useEffect } from 'react';
import { TotalAnalysisData, ReferenceDocument } from './type';
import * as XLSX from 'xlsx';
import UserStoriesView from './UserStoriesView';

interface Citation {
  source_type: string;
  node_name: string;
  file_path: string;
  line_start: number;
  line_end: number;
  language: string;
}

interface UserStory {
  story_id: string;
  title: string;
  priority: string;
  complexity: string;
  story_points: number;
  as_a: string;
  i_want: string;
  so_that: string;
  acceptance_criteria: string[];
  epic?: string | null;
  status?: string | null;
  narrative?: string | null;
  background?: string | null;
  assumptions?: string[] | null;
  test_scenarios?: string[] | null;
  data_inputs?: string[] | null;
  data_outputs?: string[] | null;
  has_client_customizations?: boolean | null;
  affected_clients?: string[] | null;
  customization_type?: string | null;
  client_specific_requirements?: string[] | null;
  technical_requirements?: string[] | null;
  implementation_notes?: string | null;
  related_business_rules?: string[] | null;
  reference_documents?: ReferenceDocument[] | null;
  depends_on?: string[] | null;
  blocks?: string[] | null;
}

interface BusinessRule {
  rule_id: string;
  name: string;
  category?: string | null;
  priority?: string | null;
  is_mandatory?: boolean | null;
  description?: string | null;
  statement?: string | null;
  conditions?: string[] | null;
  actions?: string[] | null;
}

interface ExportData {
  codebase_path: string;
  language: string;
  timestamp: string;
  user_stories: UserStory[];
  business_rules: BusinessRule[];
}

interface Flow {
  flow_id: string;
  flow_name: string;
  flow_type: string;
  total_steps: number;
  complexity_score: number;
}

interface Feature {
  feature_id: string;
  title: string;
  category: string;
  priority: string;
  complexity: string;
  status: string;
  description: string;
  business_value: string;
  citations?: Citation[];
  capabilities: string[];
  user_actions: string[];
  system_actions: string[];
  validations: string[];
  data_inputs: string[];
  data_outputs: string[];
  data_entities_used: string[];
  technologies_used: string[];
  integration_points: string[];
  user_story_ids?: string[];
  business_rule_ids?: string[];
  related_flows: string[];
}

interface AnalysisData {
  codebase_path: string;
  language: string;
  timestamp: string;
  features: Feature[];
  user_stories: UserStory[];
  business_rules: BusinessRule[];
  flows: Flow[];
}

// Helper functions
const generateHeader = (data: AnalysisData): string => {
  let markdown = `# The Lifter Feature Analysis Report\n\n`;
  markdown += `**Codebase:** ${data.codebase_path}\n`;
  markdown += `**Language:** ${data.language.toUpperCase()}\n`;
  markdown += `**Analysis Date:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
  markdown += `---\n\n`;
  return markdown;
};

const generateTableOfContents = (features: Feature[]): string => {
  let markdown = `## Table of Contents\n\n`;
  for (const [idx, feature] of features.entries()) {
    markdown += `${idx + 1}. [${feature.title}](#${feature.feature_id.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')})\n`;
  }
  markdown += `\n---\n\n`;
  return markdown;
};

const generateFeatureHeader = (feature: Feature, idx: number): string => {
  let markdown = `## ${idx + 1}. ${feature.title}\n\n`;
  markdown += `**Feature ID:** ${feature.feature_id}\n`;
  markdown += `**Category:** ${feature.category}\n`;
  markdown += `**Priority:** ${feature.priority}\n`;
  markdown += `**Complexity:** ${feature.complexity}\n`;
  markdown += `**Status:** ${feature.status}\n\n`;
  markdown += `### Description\n\n${feature.description}\n\n`;
  markdown += `### Business Value\n\n${feature.business_value}\n\n`;
  return markdown;
};

const generateCitations = (citations?: Citation[]): string => {
  if (citations && citations.length > 0) {
    let markdown = `### Source Citations\n\n`;
    markdown += `| Source Type | Node Name | File Path | Lines | Language |\n`;
    markdown += `|-------------|-----------|-----------|-------|----------|\n`;
    for (const citation of citations) {
      markdown += `| ${citation.source_type} | ${citation.node_name} | ${citation.file_path} | ${citation.line_start}-${citation.line_end} | ${citation.language} |\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateCapabilities = (capabilities: string[]): string => {
  if (capabilities.length > 0) {
    let markdown = `### Capabilities\n\n`;
    for (const cap of capabilities) {
      markdown += `- ${cap}\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateUserActions = (userActions: string[]): string => {
  if (userActions.length > 0) {
    let markdown = `### User Actions\n\n`;
    for (const action of userActions) {
      markdown += `- ${action}\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateSystemActions = (systemActions: string[]): string => {
  if (systemActions.length > 0) {
    let markdown = `### System Actions\n\n`;
    for (const action of systemActions) {
      markdown += `- ${action}\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateValidations = (validations: string[]): string => {
  if (validations.length > 0) {
    let markdown = `### Validations\n\n`;
    for (const validation of validations) {
      markdown += `- ${validation}\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateDataInformation = (feature: Feature): string => {
  if (feature.data_inputs.length > 0 || feature.data_outputs.length > 0 || feature.data_entities_used.length > 0) {
    let markdown = `### Data Information\n\n`;
    if (feature.data_inputs.length > 0) {
      markdown += `**Inputs:** ${feature.data_inputs.join(', ')}\n\n`;
    }
    if (feature.data_outputs.length > 0) {
      markdown += `**Outputs:** ${feature.data_outputs.join(', ')}\n\n`;
    }
    if (feature.data_entities_used.length > 0) {
      markdown += `**Entities Used:** ${feature.data_entities_used.join(', ')}\n\n`;
    }
    return markdown;
  }
  return '';
};

const generateTechnologies = (technologiesUsed: string[]): string => {
  if (technologiesUsed.length > 0) {
    const technologies = technologiesUsed
      .map(t => `\`${t}\``)
      .join(', ');
    return `### Technologies\n\n${technologies}\n\n`;
  }
  return '';
};

const generateIntegrationPoints = (integrationPoints: string[]): string => {
  if (integrationPoints.length > 0) {
    let markdown = `### Integration Points\n\n`;
    for (const point of integrationPoints) {
      markdown += `- ${point}\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateRelatedUserStories = (feature: Feature, userStories: UserStory[]): string => {
  const relatedStories = userStories.filter(s =>
    feature.user_story_ids?.includes(s.story_id)
  );
  if (relatedStories.length > 0) {
    let markdown = `### Related User Stories\n\n`;
    markdown += `| Story ID | Title | Priority | Complexity | Story Points |\n`;
    markdown += `|----------|-------|----------|------------|-------------|\n`;
    for (const story of relatedStories) {
      markdown += `| ${story.story_id} | ${story.title} | ${story.priority} | ${story.complexity} | ${story.story_points} |\n`;
    }
    markdown += `\n`;

    for (const story of relatedStories) {
      markdown += `#### ${story.story_id}: ${story.title}\n\n`;
      markdown += `**As a** ${story.as_a}\n`;
      markdown += `**I want** ${story.i_want}\n`;
      markdown += `**So that** ${story.so_that}\n\n`;

      if (story.acceptance_criteria.length > 0) {
        markdown += `**Acceptance Criteria:**\n`;
        for (const criteria of story.acceptance_criteria) {
          markdown += `- ${criteria}\n`;
        }
        markdown += `\n`;
      }
    }
    return markdown;
  }
  return '';
};

// Helper function to generate the business rules table header
const generateBusinessRulesTableHeader = (): string => {
  let markdown = `### Related Business Rules\n\n`;
  markdown += `| Rule ID | Name | Category | Priority | Mandatory |\n`;
  markdown += `|---------|------|----------|----------|----------|\n`;
  return markdown;
};

// Helper function to generate a single table row for a business rule
const generateBusinessRuleTableRow = (rule: BusinessRule): string => {
  return `| ${rule.rule_id} | ${rule.name} | ${rule.category || 'N/A'} | ${rule.priority || 'N/A'} | ${rule.is_mandatory ? 'Yes' : 'No'} |\n`;
};

// Helper function to generate the table section
const generateBusinessRulesTable = (relatedRules: BusinessRule[]): string => {
  let markdown = generateBusinessRulesTableHeader();
  for (const rule of relatedRules) {
    markdown += generateBusinessRuleTableRow(rule);
  }
  markdown += `\n`;
  return markdown;
};

// Helper function to generate conditions section
const generateConditionsSection = (conditions: string[]): string => {
  let markdown = `**Conditions:**\n`;
  for (const condition of conditions) {
    markdown += `- ${condition}\n`;
  }
  markdown += `\n`;
  return markdown;
};

// Helper function to generate actions section
const generateActionsSection = (actions: string[]): string => {
  let markdown = `**Actions:**\n`;
  for (const action of actions) {
    markdown += `- ${action}\n`;
  }
  markdown += `\n`;
  return markdown;
};

// Helper function to generate detailed information for a single business rule
const generateBusinessRuleDetails = (rule: BusinessRule): string => {
  let markdown = `#### ${rule.rule_id}: ${rule.name}\n\n`;
  if (rule.description) {
    markdown += `**Description:** ${rule.description}\n\n`;
  }
  if (rule.statement) {
    markdown += `**Statement:** ${rule.statement}\n\n`;
  }
  if (rule.conditions && rule.conditions.length > 0) {
    markdown += generateConditionsSection(rule.conditions);
  }
  if (rule.actions && rule.actions.length > 0) {
    markdown += generateActionsSection(rule.actions);
  }
  return markdown;
};

// Helper function to generate all business rules details
const generateAllBusinessRulesDetails = (relatedRules: BusinessRule[]): string => {
  let markdown = '';
  for (const rule of relatedRules) {
    markdown += generateBusinessRuleDetails(rule);
  }
  return markdown;
};

// Main function with reduced cognitive complexity
const generateRelatedBusinessRules = (feature: Feature, businessRules: BusinessRule[]): string => {
  const relatedRules = businessRules.filter(r =>
    feature.business_rule_ids?.includes(r.rule_id)
  );
  if (relatedRules.length > 0) {
    let markdown = generateBusinessRulesTable(relatedRules);
    markdown += generateAllBusinessRulesDetails(relatedRules);
    return markdown;
  }
  return '';
};

const generateRelatedFlows = (feature: Feature, flows: Flow[]): string => {
  const relatedFlows = flows.filter(f => feature.related_flows.includes(f.flow_id));
  if (relatedFlows.length > 0) {
    let markdown = `### Related Flows\n\n`;
    markdown += `| Flow ID | Flow Name | Type | Steps | Complexity |\n`;
    markdown += `|---------|-----------|------|-------|------------|\n`;
    for (const flow of relatedFlows) {
      markdown += `| ${flow.flow_id} | ${flow.flow_name} | ${flow.flow_type} | ${flow.total_steps} | ${flow.complexity_score.toFixed(0)} |\n`;
    }
    markdown += `\n`;
    return markdown;
  }
  return '';
};

const generateFeatureSection = (feature: Feature, idx: number, data: AnalysisData): string => {
  let markdown = generateFeatureHeader(feature, idx);
  markdown += generateCitations(feature.citations);
  markdown += generateCapabilities(feature.capabilities);
  markdown += generateUserActions(feature.user_actions);
  markdown += generateSystemActions(feature.system_actions);
  markdown += generateValidations(feature.validations);
  markdown += generateDataInformation(feature);
  markdown += generateTechnologies(feature.technologies_used);
  markdown += generateIntegrationPoints(feature.integration_points);
  markdown += generateRelatedUserStories(feature, data.user_stories);
  markdown += generateRelatedBusinessRules(feature, data.business_rules);
  markdown += generateRelatedFlows(feature, data.flows);
  markdown += `---\n\n`;
  return markdown;
};

const downloadMarkdownFile = (markdown: string, language: string): void => {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `feature-analysis-${language}-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};



interface TotalAnalysisVisualizerProps {
  data: TotalAnalysisData;
  projectId?: string;
  artifactId?: string;
}
// Helper Functions
const getFeatureRelations = (featureId: string, data: TotalAnalysisData) => {
  const feature = data.features.find(f => f.feature_id === featureId);
  if (!feature) return null;

  const relatedFlows = data.flows.filter(f => feature.related_flows.includes(f.flow_id));
  const relatedRules = data.business_rules.filter(r => feature.business_rule_ids?.includes(r.rule_id));
  const relatedStories = data.user_stories.filter(s => feature.user_story_ids?.includes(s.story_id));

  return { feature, relatedFlows, relatedRules, relatedStories };
};

// Priority badge colors
const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800 border-red-300';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'low': return 'bg-green-100 text-green-800 border-green-300';
    default: return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

// Load More Button Component
const LoadMoreButton: React.FC<{
  visible: number;
  total: number;
  onLoadMore: () => void;
  itemType: string;
}> = ({ visible, total, onLoadMore, itemType }) => {
  if (visible >= total) return null;

  return (
    <div className="flex justify-center my-6">
      <button
        onClick={onLoadMore}
        className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
      >
        <span>Load More {itemType}</span>
        <span className="bg-white bg-opacity-20 px-2 py-0.5 rounded text-sm">
          {visible} / {total}
        </span>
      </button>
    </div>
  );
};

const FeatureDetails: React.FC<{ featureId: string, data: TotalAnalysisData }> = ({ featureId, data }) => {
  const relations = getFeatureRelations(featureId, data);
  if (!relations) return null;
  const { feature, relatedFlows, relatedRules, relatedStories } = relations;
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
      {feature.user_roles.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 text-sm mb-2">User Roles</h4>
          <div className="flex flex-wrap gap-2">
            {feature.user_roles.map((role) => (
              <span key={`${feature.feature_id}-user-role-${role}`} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">{role}</span>
            ))}
          </div>
        </div>
      )}
      {relatedFlows.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Related Flows ({relatedFlows.length})</h4>
          <div className="space-y-2">
            {relatedFlows.map(flow => (
              <div key={flow.flow_id} className="bg-gray-50 rounded p-2 text-sm">
                <span className="font-semibold">{flow.flow_name}</span>
                <span className="text-gray-500 ml-2">({flow.total_steps} steps)</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {relatedRules.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Business Rules ({relatedRules.length})</h4>
          <div className="space-y-2">
            {relatedRules.map(rule => (
              <div key={rule.rule_id} className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{rule.name || 'Unnamed Rule'}</span>
                  {rule.priority && <span className={`px-2 py-0.5 rounded text-xs border ${getPriorityColor(rule.priority)}`}>{rule.priority}</span>}
                </div>
                <p className="text-gray-600">{rule.statement || rule.rule}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {relatedStories.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-800 text-sm mb-2">User Stories ({relatedStories.length})</h4>
          <div className="space-y-2">
            {relatedStories.map(story => (
              <div key={story.story_id} className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{story.title}</span>
                  <span className="px-2 py-0.5 bg-green-200 text-green-800 rounded text-xs">{story.story_points} pts</span>
                </div>
                <p className="text-gray-600 italic">{story.narrative}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const TotalAnalysisVisualizer: React.FC<TotalAnalysisVisualizerProps> = ({ data, projectId, artifactId }) => {

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [selectedFlow, setSelectedFlow] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, Record<string, boolean>>>({});
  const [showSideNav, setShowSideNav] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [expandAll, setExpandAll] = useState(true);
  const [showQuickNav, setShowQuickNav] = useState(false);

  // Items to show with load more functionality
  const [featuresItemsToShow, setFeaturesItemsToShow] = useState(20);
  const [rulesItemsToShow, setRulesItemsToShow] = useState(20);
  const [storiesItemsToShow, setStoriesItemsToShow] = useState(20);
  const LOAD_MORE_INCREMENT = 20;

  const brandColor = '#fb851e';

  // Scroll to top handler
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.pageYOffset > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to toggle quick nav
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickNav(prev => !prev);
      }
      // Escape to close quick nav
      if (e.key === 'Escape' && showQuickNav) {
        setShowQuickNav(false);
      }
    };
    globalThis.addEventListener('keydown', handleKeyDown);
    return () => globalThis.removeEventListener('keydown', handleKeyDown);
  }, [showQuickNav]);

  // Reset items to show when search changes
  useEffect(() => {
    setFeaturesItemsToShow(20);
    setRulesItemsToShow(20);
    setStoriesItemsToShow(20);
  }, [searchTerm]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSection = (featureId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [featureId]: {
        ...prev[featureId],
        [section]: !(prev[featureId]?.[section] || false)
      }
    }));
  };

  const isSectionExpanded = (featureId: string, section: string) => {
    if (expandAll) return true;
    return expandedSections[featureId]?.[section] || false;
  };

  const scrollToFeature = (featureId: string) => {
    setSelectedFeature(featureId);

    // Find the index of the feature in filtered list
    const featureIndex = filteredFeatures.findIndex(f => f.feature_id === featureId);
    if (featureIndex === -1) return;

    // Make sure enough items are loaded to show this feature
    if (featureIndex >= featuresItemsToShow) {
      setFeaturesItemsToShow(featureIndex + LOAD_MORE_INCREMENT);
      // Wait for DOM to update, then scroll
      setTimeout(() => {
        scrollToElement(`feature-${featureId}`, 'ring-orange-300');
      }, 200);
    } else {
      // Item is already loaded, just scroll
      setTimeout(() => {
        scrollToElement(`feature-${featureId}`, 'ring-orange-300');
      }, 100);
    }
  };

  const scrollToElement = (elementId: string, ringClass: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      const yOffset = -100; // Offset for sticky header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // Highlight briefly
      element.classList.add('ring-4', ringClass);
      setTimeout(() => {
        element.classList.remove('ring-4', ringClass);
      }, 2000);
    }
  };

  const scrollToStory = (storyId: string) => {
    // Find the index of the story in the CURRENT filtered list
    const storyIndex = filteredUserStories.findIndex(s => s.story_id === storyId);

    // If story is not in filtered list, it means something is wrong
    if (storyIndex === -1) {
      console.error('Story not found in filtered list:', storyId);
      return;
    }

    // Make sure enough items are loaded to show this story
    if (storyIndex >= storiesItemsToShow) {
      // Need to load more items first
      setStoriesItemsToShow(storyIndex + LOAD_MORE_INCREMENT);
      // Wait for DOM to update, then scroll
      setTimeout(() => {
        const element = document.getElementById(`story-${storyId}`);
        if (element) {
          const yOffset = -100;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });

          // Highlight briefly
          element.classList.add('ring-4', 'ring-green-300');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-green-300');
          }, 2000);
        } else {
          console.error('Story element not found after loading more:', `story-${storyId}`);
        }
      }, 300);
    } else {
      // Item is already loaded, just scroll immediately
      setTimeout(() => {
        const element = document.getElementById(`story-${storyId}`);
        if (element) {
          const yOffset = -100;
          const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
          window.scrollTo({ top: y, behavior: 'smooth' });

          // Highlight briefly
          element.classList.add('ring-4', 'ring-green-300');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-green-300');
          }, 2000);
        } else {
          console.error('Story element not found:', `story-${storyId}`);
        }
      }, 50);
    }
  };

  const scrollToRule = (ruleId: string) => {
    // Find the index of the rule in filtered list
    const ruleIndex = filteredBusinessRules.findIndex(r => r.rule_id === ruleId);
    if (ruleIndex === -1) return;

    // Make sure enough items are loaded to show this rule
    if (ruleIndex >= rulesItemsToShow) {
      setRulesItemsToShow(ruleIndex + LOAD_MORE_INCREMENT);
      // Wait for DOM to update, then scroll
      setTimeout(() => {
        scrollToElement(`rule-${ruleId}`, 'ring-yellow-300');
      }, 200);
    } else {
      // Item is already loaded, just scroll
      setTimeout(() => {
        scrollToElement(`rule-${ruleId}`, 'ring-yellow-300');
      }, 100);
    }
  };

  const exportToMarkdown = (): void => {
    setIsExporting(true);
    try {
      let markdown = generateHeader(data);
      markdown += generateTableOfContents(data.features);

      for (const [idx, feature] of data.features.entries()) {
        markdown += generateFeatureSection(feature, idx, data);
      }

      downloadMarkdownFile(markdown, data.language);
    } catch (error) {
      console.error('Error exporting markdown:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Helper function to generate table of contents
  const generateTableOfContent = (userStories: UserStory[]): string => {
    let markdown = `## Table of Contents\n\n`;
    for (const [idx, story] of userStories.entries()) {
      markdown += `${idx + 1}. [${story.title}](#${story.story_id.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')})\n`;
    }
    markdown += `\n---\n\n`;
    return markdown;
  };

  // Helper function to generate user story header
  const generateUserStoryHeader = (story: UserStory, idx: number): string => {
    let markdown = `## ${idx + 1}. ${story.title}\n\n`;
    markdown += `**Story ID:** ${story.story_id}\n`;
    if (story.epic) {
      markdown += `**Epic:** ${story.epic}\n`;
    }
    markdown += `**Priority:** ${story.priority} | **Complexity:** ${story.complexity} | **Story Points:** ${story.story_points}\n`;
    if (story.status) {
      markdown += `**Status:** ${story.status}\n`;
    }
    markdown += `\n`;
    return markdown;
  };

  // Helper function to generate user story format section
  const generateUserStoryFormat = (story: UserStory): string => {
    let markdown = `### User Story\n\n`;
    markdown += `**As a** ${story.as_a}\n\n`;
    markdown += `**I want** ${story.i_want}\n\n`;
    markdown += `**So that** ${story.so_that}\n\n`;
    return markdown;
  };

  // Helper function to generate narrative and background
  const generateNarrativeAndBackground = (story: UserStory): string => {
    let markdown = '';
    if (story.narrative) {
      markdown += `### Narrative\n\n${story.narrative}\n\n`;
    }
    if (story.background) {
      markdown += `### Background\n\n${story.background}\n\n`;
    }
    return markdown;
  };

  // Helper function to generate acceptance criteria
  const generateAcceptanceCriteria = (acceptanceCriteria: string[] | undefined | null): string => {
    if (!acceptanceCriteria || acceptanceCriteria.length === 0) return '';

    let markdown = `### Acceptance Criteria\n\n`;
    for (const [idx, criteria] of acceptanceCriteria.entries()) {
      markdown += `${idx + 1}. ${criteria}\n`;
    }
    markdown += `\n`;
    return markdown;
  };

  // Helper function to generate assumptions
  const generateAssumptions = (assumptions: string[] | undefined | null): string => {
    if (!assumptions || assumptions.length === 0) return '';

    let markdown = `### Assumptions\n\n`;
    for (const assumption of assumptions) {
      markdown += `- ${assumption}\n`;
    }
    markdown += `\n`;
    return markdown;
  };

  // Helper function to generate test scenarios
  const generateTestScenarios = (testScenarios: string[] | undefined | null): string => {
    if (!testScenarios || testScenarios.length === 0) return '';

    let markdown = `### Test Scenarios\n\n`;
    for (const [idx, scenario] of testScenarios.entries()) {
      markdown += `${idx + 1}. ${scenario}\n`;
    }
    markdown += `\n`;
    return markdown;
  };

  // Helper function to generate data information
  const generateDataInformation = (dataInputs: string[] | undefined | null, dataOutputs: string[] | undefined | null): string => {
    if ((!dataInputs || dataInputs.length === 0) && (!dataOutputs || dataOutputs.length === 0)) return '';

    let markdown = `### Data Information\n\n`;
    if (dataInputs && dataInputs.length > 0) {
      markdown += `**Inputs:** ${dataInputs.join(', ')}\n\n`;
    }
    if (dataOutputs && dataOutputs.length > 0) {
      markdown += `**Outputs:** ${dataOutputs.join(', ')}\n\n`;
    }
    return markdown;
  };

  // Helper function to generate client customizations
  const generateClientCustomizations = (story: UserStory): string => {
    if (!story.has_client_customizations || !story.affected_clients || story.affected_clients.length === 0) {
      return '';
    }

    let markdown = `### Client Customizations\n\n`;
    markdown += `**Affected Clients:** ${story.affected_clients.join(', ')}\n\n`;
    if (story.customization_type) {
      markdown += `**Customization Type:** ${story.customization_type}\n\n`;
    }
    if (story.client_specific_requirements && story.client_specific_requirements.length > 0) {
      markdown += `**Client-Specific Requirements:**\n\n`;
      for (const req of story.client_specific_requirements) {
        markdown += `- ${req}\n`;
      }
      markdown += `\n`;
    }
    return markdown;
  };

  // Helper function to generate technical requirements
  const generateTechnicalRequirements = (technicalRequirements: string[] | undefined | null): string => {
    if (!technicalRequirements || technicalRequirements.length === 0) return '';

    let markdown = `### Technical Requirements\n\n`;
    for (const req of technicalRequirements) {
      markdown += `- ${req}\n`;
    }
    markdown += `\n`;
    return markdown;
  };

  // Helper function to generate implementation notes
  const generateImplementationNotes = (implementationNotes: string | undefined | null): string => {
    if (!implementationNotes) return '';

    return `### Implementation Notes\n\n${implementationNotes}\n\n`;
  };

  // Helper function to generate business rule details
  const generateBusinessRuleDetails = (rule: BusinessRule): string => {
    let markdown = `#### ${rule.rule_id}: ${rule.name}\n\n`;
    if (rule.description) {
      markdown += `**Description:** ${rule.description}\n\n`;
    }
    if (rule.statement) {
      markdown += `**Statement:** ${rule.statement}\n\n`;
    }
    if (rule.conditions && rule.conditions.length > 0) {
      markdown += `**Conditions:**\n`;
      for (const condition of rule.conditions) {
        markdown += `- ${condition}\n`;
      }
      markdown += `\n`;
    }
    if (rule.actions && rule.actions.length > 0) {
      markdown += `**Actions:**\n`;
      for (const action of rule.actions) {
        markdown += `- ${action}\n`;
      }
      markdown += `\n`;
    }
    return markdown;
  };

  // Helper function to generate related business rules
  const generateRelatedBusinessRules = (story: UserStory, businessRules: BusinessRule[]): string => {
    const relatedRules = story.related_business_rules
      ? businessRules.filter(r => story.related_business_rules!.includes(r.rule_id))
      : [];

    if (relatedRules.length === 0) return '';

    let markdown = `### Related Business Rules\n\n`;
    markdown += `| Rule ID | Name | Category | Priority | Mandatory |\n`;
    markdown += `|---------|------|----------|----------|----------|\n`;
    for (const rule of relatedRules) {
      markdown += `| ${rule.rule_id} | ${rule.name} | ${rule.category || 'N/A'} | ${rule.priority || 'N/A'} | ${rule.is_mandatory ? 'Yes' : 'No'} |\n`;
    }
    markdown += `\n`;

    for (const rule of relatedRules) {
      markdown += generateBusinessRuleDetails(rule);
    }
    return markdown;
  };

  // Helper function to generate reference documents
  const generateReferenceDocuments = (referenceDocuments: ReferenceDocument[] | undefined | null): string => {
    if (!referenceDocuments || referenceDocuments.length === 0) return '';

    let markdown = `### Reference Documents\n\n`;
    for (const doc of referenceDocuments) {
      markdown += `#### ${doc.document_id}\n\n`;
      markdown += `**Confidence:** ${(doc.confidence * 100).toFixed(0)}%\n\n`;
      markdown += `**Relationship:** ${doc.relationship}\n\n`;
      markdown += `**Reason:** ${doc.reason}\n\n`;
    }
    return markdown;
  };

  // Helper function to generate dependencies
  const generateDependencies = (dependsOn: string[] | undefined | null, blocks: string[] | undefined | null): string => {
    let markdown = '';
    if (dependsOn && dependsOn.length > 0) {
      markdown += `**Depends On:** ${dependsOn.join(', ')}\n\n`;
    }
    if (blocks && blocks.length > 0) {
      markdown += `**Blocks:** ${blocks.join(', ')}\n\n`;
    }
    return markdown;
  };

  // Helper function to generate single user story section
  const generateUserStorySection = (story: UserStory, idx: number, businessRules: BusinessRule[]): string => {
    let markdown = generateUserStoryHeader(story, idx);
    markdown += generateUserStoryFormat(story);
    markdown += generateNarrativeAndBackground(story);
    markdown += generateAcceptanceCriteria(story.acceptance_criteria);
    markdown += generateAssumptions(story.assumptions);
    markdown += generateTestScenarios(story.test_scenarios);
    markdown += generateDataInformation(story.data_inputs, story.data_outputs);
    markdown += generateClientCustomizations(story);
    markdown += generateTechnicalRequirements(story.technical_requirements);
    markdown += generateImplementationNotes(story.implementation_notes);
    markdown += generateRelatedBusinessRules(story, businessRules);
    markdown += generateReferenceDocuments(story.reference_documents);
    markdown += generateDependencies(story.depends_on, story.blocks);
    markdown += `---\n\n`;
    return markdown;
  };

  // Helper function to generate all user stories
  const generateAllUserStories = (userStories: UserStory[], businessRules: BusinessRule[]): string => {
    let markdown = '';
    for (const [idx, story] of userStories.entries()) {
      markdown += generateUserStorySection(story, idx, businessRules);
    }
    return markdown;
  };

  // Helper function to generate document header
  const generateDocumentHeader = (data: ExportData): string => {
    let markdown = `# User Stories - Business Documentation\n\n`;
    markdown += `**Project:** ${data.codebase_path}\n`;
    markdown += `**Language:** ${data.language.toUpperCase()}\n`;
    markdown += `**Date:** ${new Date(data.timestamp).toLocaleString()}\n\n`;
    markdown += `---\n\n`;
    return markdown;
  };

  // Helper function to trigger download
  const triggerDownload = (markdown: string, language: string): void => {
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user-stories-business-${language}-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Main export function with reduced cognitive complexity
  const exportBusinessUserStories = (): void => {
    setIsExporting(true);
    try {
      let markdown = generateDocumentHeader(data);
      markdown += generateTableOfContent(data.user_stories);
      markdown += generateAllUserStories(data.user_stories, data.business_rules);
      triggerDownload(markdown, data.language);
    } catch (error) {
      console.error('Error exporting user stories:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportUserStoriesToExcel = () => {
    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Sheet 1: User Stories Overview
      const storiesData = data.user_stories.map(story => ({
        'Story ID': story.story_id,
        'Title': story.title,
        'Epic': story.epic,
        'Priority': story.priority,
        'Complexity': story.complexity,
        'Story Points': story.story_points,
        'Status': story.status,
        'As A': story.as_a,
        'I Want': story.i_want,
        'So That': story.so_that,
        'Narrative': story.narrative || '',
        'Background': story.background || '',
        'Has Client Customizations': story.has_client_customizations ? 'Yes' : 'No',
        'Affected Clients': story.affected_clients?.join(', ') || '',
        'Customization Type': story.customization_type || '',
        'Implementation Notes': story.implementation_notes || '',
        'Depends On': story.depends_on.join(', '),
        'Blocks': story.blocks.join(', '),
      }));
      const storiesSheet = XLSX.utils.json_to_sheet(storiesData);
      XLSX.utils.book_append_sheet(workbook, storiesSheet, 'User Stories');

      // Sheet 2: Acceptance Criteria
      const acceptanceCriteriaData: unknown[] = [];
      for (const story of data.user_stories) {
        for (const [idx, criteria] of story.acceptance_criteria.entries()) {
          acceptanceCriteriaData.push({
            'Story ID': story.story_id,
            'Story Title': story.title,
            'Criterion #': idx + 1,
            'Acceptance Criterion': criteria,
          });
        };
      };
      if (acceptanceCriteriaData.length > 0) {
        const criteriaSheet = XLSX.utils.json_to_sheet(acceptanceCriteriaData);
        XLSX.utils.book_append_sheet(workbook, criteriaSheet, 'Acceptance Criteria');
      }

      // Sheet 3: Test Scenarios
      const testScenariosData: unknown[] = [];
      for (const story of data.user_stories) {
        for (const [idx, scenario] of story.test_scenarios.entries()) {
          testScenariosData.push({
            'Story ID': story.story_id,
            'Story Title': story.title,
            'Scenario #': idx + 1,
            'Test Scenario': scenario,
          });
        };
      };
      if (testScenariosData.length > 0) {
        const scenariosSheet = XLSX.utils.json_to_sheet(testScenariosData);
        XLSX.utils.book_append_sheet(workbook, scenariosSheet, 'Test Scenarios');
      }

      // Sheet 4: Story-Feature Relationships
      const storyFeatureData: unknown[] = [];
      for (const story of data.user_stories) {
        // Find features linked to this story
        const linkedFeatures = data.features.filter(f =>
          f.user_story_ids?.includes(story.story_id)
        );
        for (const feature of linkedFeatures) {
          storyFeatureData.push({
            'Story ID': story.story_id,
            'Story Title': story.title,
            'Feature ID': feature.feature_id,
            'Feature Title': feature.title,
            'Feature Category': feature.category,
            'Feature Priority': feature.priority,
            'Feature Complexity': feature.complexity,
            'Feature Status': feature.status,
          });
        };
      };
      if (storyFeatureData.length > 0) {
        const storyFeatureSheet = XLSX.utils.json_to_sheet(storyFeatureData);
        XLSX.utils.book_append_sheet(workbook, storyFeatureSheet, 'Story-Feature Links');
      }

      // Sheet 5: Feature-Business Rule Relationships (deduplicated at feature level)
      const featureRuleData: unknown[] = [];
      const processedFeatureRulePairs = new Set<string>();

      for (const feature of data.features) {
        // Get business rules associated with this feature
        const featureRuleIds = feature.business_rule_ids || [];

        for (const ruleId of featureRuleIds) {
          const pairKey = `${feature.feature_id}-${ruleId}`;

          // Skip if this feature-rule pair has already been processed
          if (processedFeatureRulePairs.has(pairKey)) {
            return;
          }
          processedFeatureRulePairs.add(pairKey);

          const rule = data.business_rules.find(r => r.rule_id === ruleId);

          if (rule) {
            // Find all user stories linked to this feature
            const linkedStories = data.user_stories.filter(s =>
              s.related_features.includes(feature.feature_id)
            );

            featureRuleData.push({
              'Feature ID': feature.feature_id,
              'Feature Title': feature.title,
              'Feature Category': feature.category,
              'Rule ID': rule.rule_id,
              'Rule Name': rule.name,
              'Rule Category': rule.category || '',
              'Rule Priority': rule.priority || '',
              'Is Mandatory': rule.is_mandatory ? 'Yes' : 'No',
              'Rule Description': rule.description || '',
              'Rule Statement': rule.statement || '',
              'Linked User Stories': linkedStories.map(s => s.story_id).join(', '),
              'Number of Stories': linkedStories.length,
            });
          }
        };
      };

      if (featureRuleData.length > 0) {
        const featureRuleSheet = XLSX.utils.json_to_sheet(featureRuleData);
        XLSX.utils.book_append_sheet(workbook, featureRuleSheet, 'Feature-Rule Links');
      }

      // Sheet 6: Story-Flow Relationships (via Features)
      const storyFlowData: unknown[] = [];
      for (const story of data.user_stories) {
        // Find features linked to this story
        const linkedFeatures = data.features.filter(f =>
          f.user_story_ids?.includes(story.story_id)
        );
        // For each feature, find its flows
        for (const feature of linkedFeatures) {
          const relatedFlows = data.flows.filter(f => feature.related_flows.includes(f.flow_id));
          for (const flow of relatedFlows) {
            storyFlowData.push({
              'Story ID': story.story_id,
              'Story Title': story.title,
              'Feature ID': feature.feature_id,
              'Feature Title': feature.title,
              'Flow ID': flow.flow_id,
              'Flow Name': flow.flow_name,
              'Flow Type': flow.flow_type,
              'Total Steps': flow.total_steps,
              'Complexity Score': flow.complexity_score.toFixed(2),
            });
          };
        };
      };
      if (storyFlowData.length > 0) {
        const storyFlowSheet = XLSX.utils.json_to_sheet(storyFlowData);
        XLSX.utils.book_append_sheet(workbook, storyFlowSheet, 'Story-Flow Links');
      }

      // Sheet 7: Technical Requirements
      const techReqData: unknown[] = [];
      for (const story of data.user_stories) {
        if (story.technical_requirements && story.technical_requirements.length > 0) {
          for (const [idx, req] of story.technical_requirements.entries() as Iterable<[number, string]>) {
            techReqData.push({
              'Story ID': story.story_id,
              'Story Title': story.title,
              'Requirement #': idx + 1,
              'Technical Requirement': req,
            });
          };
        }
      };
      if (techReqData.length > 0) {
        const techReqSheet = XLSX.utils.json_to_sheet(techReqData);
        XLSX.utils.book_append_sheet(workbook, techReqSheet, 'Technical Requirements');
      }

      // Sheet 8: Client Customizations (deduplicated at feature level)
      const customizationData: unknown[] = [];
      const processedFeatureCustomizations = new Set<string>();

      for (const feature of data.features) {
        // Get all user stories linked to this feature that have customizations
        const linkedStoriesWithCustomizations = data.user_stories.filter(s =>
          s.related_features.includes(feature.feature_id) &&
          s.has_client_customizations &&
          s.client_specific_requirements &&
          s.client_specific_requirements.length > 0
        );

        if (linkedStoriesWithCustomizations.length === 0) {
          return;
        }

        // Collect unique customization requirements for this feature
        const customizationMap = new Map<string, {
          clients: Set<string>,
          types: Set<string>,
          stories: Set<string>
        }>();

        for (const story of linkedStoriesWithCustomizations) {
          for (const req of (story.client_specific_requirements ?? []) as Iterable<string>) {
            if (!customizationMap.has(req)) {
              customizationMap.set(req, {
                clients: new Set(),
                types: new Set(),
                stories: new Set()
              });
            }

            const customInfo = customizationMap.get(req)!;

            // Add affected clients
            if (story.affected_clients) {
              for (const client of story.affected_clients) customInfo.clients.add(client)
            }

            // Add customization type
            if (story.customization_type) {
              customInfo.types.add(story.customization_type);
            }

            // Add story ID
            customInfo.stories.add(story.story_id);
          };
        };

        // Create rows for each unique customization requirement
        let reqNumber = 1;
        for (const [requirement, info] of customizationMap) {
          const featureCustomKey = `${feature.feature_id}-${requirement}`;

          // Skip if already processed
          if (processedFeatureCustomizations.has(featureCustomKey)) {
            return;
          }
          processedFeatureCustomizations.add(featureCustomKey);

          customizationData.push({
            'Feature ID': feature.feature_id,
            'Feature Title': feature.title,
            'Feature Category': feature.category,
            'Requirement #': reqNumber++,
            'Client Requirement': requirement,
            'Affected Clients': Array.from(info.clients).join(', '),
            'Customization Types': Array.from(info.types).join(', '),
            'Linked User Stories': Array.from(info.stories).join(', '),
            'Number of Stories': info.stories.size,
          });
        };
      };

      if (customizationData.length > 0) {
        const customizationSheet = XLSX.utils.json_to_sheet(customizationData);
        XLSX.utils.book_append_sheet(workbook, customizationSheet, 'Client Customizations');
      }

      // Sheet 9: Data Inputs & Outputs
      const dataIOData: unknown[] = [];
      for (const story of data.user_stories) {
        if (story.data_inputs.length > 0 || story.data_outputs.length > 0) {
          const maxLength = Math.max(story.data_inputs.length, story.data_outputs.length);
          for (let i = 0; i < maxLength; i++) {
            dataIOData.push({
              'Story ID': story.story_id,
              'Story Title': story.title,
              'Data Input': story.data_inputs[i] || '',
              'Data Output': story.data_outputs[i] || '',
            });
          }
        }
      };
      if (dataIOData.length > 0) {
        const dataIOSheet = XLSX.utils.json_to_sheet(dataIOData);
        XLSX.utils.book_append_sheet(workbook, dataIOSheet, 'Data Inputs-Outputs');
      }

      // Sheet 10: Reference Documents
      const refDocData: unknown[] = [];
      for (const story of data.user_stories) {
        if (story.reference_documents && story.reference_documents.length > 0) {
          for (const doc of story.reference_documents as Iterable<ReferenceDocument>) {
            refDocData.push({
              'Story ID': story.story_id,
              'Story Title': story.title,
              'Document ID': doc.document_id,
              'Confidence': `${(doc.confidence * 100).toFixed(0)}%`,
              'Relationship': doc.relationship,
              'Reason': doc.reason,
            });
          };
        }
      };
      if (refDocData.length > 0) {
        const refDocSheet = XLSX.utils.json_to_sheet(refDocData);
        XLSX.utils.book_append_sheet(workbook, refDocSheet, 'Reference Documents');
      }

      // Sheet 11: Assumptions
      const assumptionsData: unknown[] = [];
      for (const story of data.user_stories) {
        for (const [idx, assumption] of story.assumptions.entries()) {
          assumptionsData.push({
            'Story ID': story.story_id,
            'Story Title': story.title,
            'Assumption #': idx + 1,
            'Assumption': assumption,
          });
        };
      };
      if (assumptionsData.length > 0) {
        const assumptionsSheet = XLSX.utils.json_to_sheet(assumptionsData);
        XLSX.utils.book_append_sheet(workbook, assumptionsSheet, 'Assumptions');
      }

      // Sheet 12: Source Citations
      const citationsData: unknown[] = [];
      for (const story of data.user_stories) {
        if (story.citations && story.citations.length > 0) {
          for (const [idx, citation] of story.citations.entries()) {
            citationsData.push({
              'Story ID': story.story_id,
              'Story Title': story.title,
              'Citation #': idx + 1,
              'Source Type': citation.source_type || '',
              'Source Name': citation.source_name || '',
              'Node Name': citation.node_name || '',
              'File Path': citation.file_path || '',
              'Line Start': citation.line_start || '',
              'Line End': citation.line_end || '',
              'Language': citation.language || '',
              'Entity Name': citation.entity_name || '',
              'Entity Type': citation.entity_type || '',
              'Schema Name': citation.schema_name || '',
              'Database': citation.database || '',
              'Document Name': citation.document_name || '',
              'Document Path': citation.document_path || '',
              'Document Type': citation.document_type || '',
            });
          };
        }
      };
      if (citationsData.length > 0) {
        const citationsSheet = XLSX.utils.json_to_sheet(citationsData);
        XLSX.utils.book_append_sheet(workbook, citationsSheet, 'Source Citations');
      }

      // Download the workbook
      const fileName = `user-stories-complete-${data.language}-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (error) {
      console.error('Error exporting user stories to Excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Compute statistics
  const stats = useMemo(() => {
    const avgComplexity = data.flows?.length > 0
      ? data.flows?.reduce((sum, f) => sum + f.complexity_score, 0) / data.flows?.length
      : 0;

    return {
      totalFlows: data.metrics.flow_count,
      totalFlowGroups: data.metrics.flow_group_count,
      totalFeatures: data.metrics.feature_count,
      totalBusinessRules: data.metrics.business_rule_count,
      totalUserStories: data.metrics.story_count,
      flowCoverage: (data.metrics.flow_coverage * 100).toFixed(2),
      avgComplexity: avgComplexity.toFixed(0),
      clientsAffected: data.client_customizations?.clients_affected.length,
    };
  }, [data]);

  // Filter functions
  const filteredFeatures = useMemo(() => {
    const filtered = searchTerm ? data.features.filter(f =>
      f.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.description.toLowerCase().includes(searchTerm.toLowerCase())
    ) : data.features;
    return filtered;
  }, [data.features, searchTerm]);

  const filteredBusinessRules = useMemo(() => {
    const filtered = searchTerm ? data.business_rules.filter(r =>
      (r.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : data.business_rules;
    return filtered;
  }, [data.business_rules, searchTerm]);

  // User stories filtering is now handled by UserStoriesView component
  const filteredUserStories = useMemo(() => data.user_stories, [data.user_stories]);

  // Visible data with load more
  const visibleFeatures = useMemo(() =>
    filteredFeatures.slice(0, featuresItemsToShow),
    [filteredFeatures, featuresItemsToShow]
  );

  const visibleBusinessRules = useMemo(() =>
    filteredBusinessRules.slice(0, rulesItemsToShow),
    [filteredBusinessRules, rulesItemsToShow]
  );


  const getComplexityColor = (complexity: string) => {
    switch (complexity?.toLowerCase()) {
      case 'complex': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'moderate': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'simple': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // RENDER TABS
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">The Lifter Analysis Overview</h2>
        <p className="text-gray-600">Codebase: <span className="font-mono text-sm">{data.codebase_path}</span></p>
        <p className="text-gray-600">Language: <span className="font-semibold">{data.language.toUpperCase()}</span></p>
        <p className="text-gray-600">Analyzed: <span className="font-semibold">{new Date(data.timestamp).toLocaleString()}</span></p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <MetricCard label="Flows" value={stats.totalFlows} icon="🔀" color={brandColor} />
        <MetricCard label="Flow Groups" value={stats.totalFlowGroups} icon="📂" color={brandColor} />
        <MetricCard label="Features" value={stats.totalFeatures} icon="🌟" color={brandColor} />
        <MetricCard label="Business Rules" value={stats.totalBusinessRules} icon="📜" color={brandColor} />
        <MetricCard label="User Stories" value={stats.totalUserStories} icon="👥" color={brandColor} />
        {/* <MetricCard label="Flow Coverage" value={`${stats.flowCoverage}%`} icon="🎯" color={brandColor} /> */}
        {/* <MetricCard label="Avg. Complexity" value={stats.avgComplexity} icon="🤯" color={brandColor} /> */}
        <MetricCard label="Clients Affected" value={stats.clientsAffected} icon="🏢" color={brandColor} />
      </div>

      {/* Traceability Summary */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Traceability Matrix</h3>
        <div className="space-y-3">
          <TraceabilityStat label="Flows mapped to Groups" value={Object.keys(data.traceability_map?.flows_to_groups || {}).length} />
          <TraceabilityStat label="Groups mapped to Features" value={Object.keys(data.traceability_map?.groups_to_features || {}).length} />
          <TraceabilityStat label="Features mapped to Stories" value={Object.keys(data.traceability_map?.features_to_stories || {}).length} />
          <TraceabilityStat label="Rules mapped to Features" value={Object.keys(data.traceability_map?.rules_to_features || {}).length} />
        </div>
      </div>

      {/* Client Customizations */}
      {data.client_customizations?.enabled && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Client Customizations</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Total Customizations</p>
              <p className="text-2xl font-bold" style={{ color: brandColor }}>{data.client_customizations?.total_nodes_with_customizations}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Affected Clients</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {data.client_customizations?.clients_affected.map(client => (
                  <span key={client} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">{client}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFlows = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Execution Flows</h2>
        <span className="text-sm text-gray-600">{data.flows?.length} flows</span>
      </div>
      <div className="space-y-4">
        {data.flows?.map(flow => (
          <div key={flow.flow_id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow relative">
            <div className="p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 pr-24">
                  <h3 className="text-lg font-bold text-gray-800">{flow.flow_name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{flow.description}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>
                    {flow.flow_type}
                  </span>
                  <span className="text-xs text-gray-500">Complexity: {flow.complexity_score.toFixed(0)}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div><span className="text-gray-500">Steps:</span> <span className="ml-2 font-semibold text-gray-800">{flow.total_steps}</span></div>
                <div><span className="text-gray-500">Entry:</span> <span className="ml-2 font-mono text-xs text-gray-800">{flow.entry_point}</span></div>
                <div><span className="text-gray-500">Error Handling:</span> <span className="ml-2 font-semibold text-gray-800">{flow.has_error_handling ? 'Yes' : 'No'}</span></div>
                <div><span className="text-gray-500">Async:</span> <span className="ml-2 font-semibold text-gray-800">{flow.is_async ? 'Yes' : 'No'}</span></div>
              </div>

              <button onClick={() => setSelectedFlow(selectedFlow === flow.flow_id ? null : flow.flow_id)} className="mt-4 text-sm font-semibold" style={{ color: brandColor }}>
                {selectedFlow === flow.flow_id ? 'Hide Steps' : 'Show Steps'}
              </button>

              {selectedFlow === flow.flow_id && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="font-semibold text-gray-800 mb-2">Flow Steps</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {flow.steps?.map(step => (
                      <div key={step.step_id} className="bg-gray-50 rounded p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 rounded text-xs font-bold text-white" style={{ backgroundColor: brandColor }}>{step.step_number}</span>
                          <span className="font-semibold">{step.node_name}</span>
                          <span className="text-gray-500">({step.node_type})</span>
                        </div>
                        <p className="text-gray-600 mt-1 ml-8">{step.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderFeatures = () => (
    <div className="flex gap-6">
      {/* Side Navigation */}
      {showSideNav && (
        <div className="w-72 flex-shrink-0 sticky top-20 self-start max-h-[calc(100vh-120px)] overflow-y-auto">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800">Features</h3>
              <button
                onClick={() => setShowSideNav(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2">
              {filteredFeatures.map((feature, idx) => (
                <button
                  key={feature.feature_id}
                  onClick={() => scrollToFeature(feature.feature_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm group ${selectedFeature === feature.feature_id
                    ? 'bg-orange-100 text-orange-800 border-l-4 border-orange-600'
                    : 'hover:bg-orange-50 hover:text-orange-700'
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-semibold flex-shrink-0 ${selectedFeature === feature.feature_id
                      ? 'text-orange-600'
                      : 'text-gray-400 group-hover:text-orange-500'
                      }`}>
                      {idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{feature.title}</div>
                      <div className="text-xs text-gray-500 flex gap-2 mt-1">
                        <span className={`px-1.5 py-0.5 rounded ${getPriorityColor(feature.priority)}`}>
                          {feature.priority}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded ${getComplexityColor(feature.complexity)}`}>
                          {feature.complexity}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            {!showSideNav && (
              <button
                onClick={() => setShowSideNav(true)}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
              >
                ☰ Show Navigation
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-800">Features</h2>
            <span className="text-sm text-gray-500">({filteredFeatures.length} total)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
            >
              {expandAll ? '▼ Collapse All' : '▶ Expand All'}
            </button>
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={exportToMarkdown}
              disabled={isExporting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 disabled:bg-gray-400"
            >
              <span>📥</span>
              {isExporting ? 'Exporting...' : 'Export to Markdown'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {visibleFeatures.map(feature => (
            <div id={`feature-${feature.feature_id}`} key={feature.feature_id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all relative scroll-mt-24">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1 pr-24">
                    <h3 className="text-xl font-bold text-gray-800">{feature.title}</h3>
                    <p className="text-sm text-gray-500 mb-2">ID: {feature.feature_id} | Category: {feature.category} | Status: {feature.status}</p>
                    <p className="text-gray-600 mt-2">{feature.description}</p>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(feature.priority)}`}>{feature.priority}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getComplexityColor(feature.complexity)}`}>{feature.complexity}</span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded p-3 mb-4">
                  <h4 className="font-semibold text-gray-800 text-sm mb-2">Business Value</h4>
                  <p className="text-sm text-gray-700">{feature.business_value}</p>
                </div>

                {/* Citations Section */}
                {feature.citations && feature.citations.length > 0 && (
                  <div className="bg-purple-50 border border-purple-200 rounded p-4 mb-4">
                    <button
                      onClick={() => toggleSection(feature.feature_id, 'citations')}
                      className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <span className="text-purple-600">📎</span>
                        Source Citations ({feature.citations.length})
                      </h4>
                      <span className="text-purple-600 font-bold">
                        {isSectionExpanded(feature.feature_id, 'citations') ? '−' : '+'}
                      </span>
                    </button>
                    {isSectionExpanded(feature.feature_id, 'citations') && (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {feature.citations.map((citation) => (
                          <div key={`${citation.file_path}-${citation.node_name}-${citation.line_start}-${citation.line_end}`} className="bg-white border border-purple-100 rounded p-3 text-xs">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-purple-200 text-purple-800 rounded font-semibold">{citation.source_type}</span>
                                <span className="font-mono text-purple-700">{citation.node_name}</span>
                              </div>
                              <span className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded font-semibold">{citation.language}</span>
                            </div>
                            <div className="text-gray-600 font-mono text-xs mb-1">
                              {citation.file_path}
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                              <span>Lines: {citation.line_start} - {citation.line_end}</span>
                              <span>({citation.line_end - citation.line_start + 1} lines)</span>
                            </div>
                            {(citation.entity_name || citation.database || citation.schema_name) && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {citation.entity_name && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">Entity: {citation.entity_name}</span>}
                                {citation.database && <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">DB: {citation.database}</span>}
                                {citation.schema_name && <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded">Schema: {citation.schema_name}</span>}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {feature.client_specific_requirements && feature.client_specific_requirements.length > 0 && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4 mb-4 shadow-sm">
                    <button
                      onClick={() => toggleSection(feature.feature_id, 'requirements')}
                      className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                        <span className="text-indigo-500">🎯</span>
                        Client-Specific Requirements ({feature.client_specific_requirements.length})
                      </h4>
                      <span className="text-orange-500 font-bold text-lg">
                        {isSectionExpanded(feature.feature_id, 'requirements') ? '−' : '+'}
                      </span>
                    </button>
                    {isSectionExpanded(feature.feature_id, 'requirements') && (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                        {feature.client_specific_requirements.map((requirement, idx) => {
                          // Extract chain code from requirement text (e.g., [HI])
                          const chainMatch = /^\[([^\]]+)\]/.exec(requirement);
                          const chainCode = chainMatch ? chainMatch[1] : null;
                          const requirementText = chainCode
                            ? requirement.replace(`[${chainCode}]`, '').trim()
                            : requirement;

                          return (
                            <div
                              key={`${feature.feature_id}-client-requirement-${requirement}`}
                              className="bg-white border-l-4 border-orange-200 rounded-r-lg p-3 shadow-sm hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-6 h-6 bg-orange-200 text-black rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="flex-1">
                                  {chainCode && (
                                    <span className="inline-block px-2.5 py-1 bg-gradient-to-r from-orange-200 to-orange-300 text-black rounded-full text-[10px] font-bold mb-2 shadow-sm">
                                      {chainCode}
                                    </span>
                                  )}
                                  <p className="text-gray-700 text-sm leading-relaxed">
                                    {requirementText}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Capabilities */}
                  {feature.capabilities?.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <button
                        onClick={() => toggleSection(feature.feature_id, 'capabilities')}
                        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                      >
                        <h4 className="font-semibold text-gray-800 text-sm">Capabilities ({feature.capabilities.length})</h4>
                        <span className="text-gray-600 font-bold">
                          {isSectionExpanded(feature.feature_id, 'capabilities') ? '−' : '+'}
                        </span>
                      </button>
                      {isSectionExpanded(feature.feature_id, 'capabilities') && (
                        <ul className="list-disc list-inside space-y-1">
                          {feature.capabilities.map((cap) => (
                            <li key={`${feature.feature_id}-capability-${cap}`} className="text-sm text-gray-600">{cap}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* User Actions */}
                  {feature.user_actions?.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <button
                        onClick={() => toggleSection(feature.feature_id, 'userActions')}
                        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                      >
                        <h4 className="font-semibold text-gray-800 text-sm">User Actions ({feature.user_actions?.length})</h4>
                        <span className="text-gray-600 font-bold">
                          {isSectionExpanded(feature.feature_id, 'userActions') ? '−' : '+'}
                        </span>
                      </button>
                      {isSectionExpanded(feature.feature_id, 'userActions') && (
                        <ul className="list-disc list-inside space-y-1">
                          {feature.user_actions.map((action) => (
                            <li key={`${feature.feature_id}-user-action-${action}`} className="text-sm text-gray-600">{action}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* System Actions */}
                  {feature.system_actions.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <button
                        onClick={() => toggleSection(feature.feature_id, 'systemActions')}
                        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                      >
                        <h4 className="font-semibold text-gray-800 text-sm">System Actions ({feature.system_actions.length})</h4>
                        <span className="text-gray-600 font-bold">
                          {isSectionExpanded(feature.feature_id, 'systemActions') ? '−' : '+'}
                        </span>
                      </button>
                      {isSectionExpanded(feature.feature_id, 'systemActions') && (
                        <ul className="list-disc list-inside space-y-1">
                          {feature.system_actions.map((action) => (
                            <li key={`${feature.feature_id}-system-action-${action}`} className="text-sm text-gray-600">{action}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {/* Validations */}
                  {feature.validations.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded p-3">
                      <button
                        onClick={() => toggleSection(feature.feature_id, 'validations')}
                        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                      >
                        <h4 className="font-semibold text-gray-800 text-sm">Validations ({feature.validations.length})</h4>
                        <span className="text-gray-600 font-bold">
                          {isSectionExpanded(feature.feature_id, 'validations') ? '−' : '+'}
                        </span>
                      </button>
                      {isSectionExpanded(feature.feature_id, 'validations') && (
                        <ul className="list-disc list-inside space-y-1">
                          {feature.validations.map((validation) => (
                            <li key={`${feature.feature_id}-validation-${validation}`} className="text-sm text-gray-600">{validation}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Data Section */}
                {(feature.data_inputs.length > 0 || feature.data_outputs.length > 0 || feature.data_entities_used.length > 0) && (
                  <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                    <button
                      onClick={() => toggleSection(feature.feature_id, 'dataInfo')}
                      className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="font-semibold text-gray-800 text-sm">Data Information</h4>
                      <span className="text-green-600 font-bold">
                        {isSectionExpanded(feature.feature_id, 'dataInfo') ? '−' : '+'}
                      </span>
                    </button>
                    {isSectionExpanded(feature.feature_id, 'dataInfo') && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {feature.data_inputs.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-green-700 mb-1">Inputs</div>
                            <div className="flex flex-wrap gap-1">
                              {feature.data_inputs.map((input) => (
                                <span key={`${feature.feature_id}-data-input-${input}`} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{input}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {feature.data_outputs.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-blue-700 mb-1">Outputs</div>
                            <div className="flex flex-wrap gap-1">
                              {feature.data_outputs.map((output) => (
                                <span key={`${feature.feature_id}-data-output-${output}`} className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">{output}</span>
                              ))}
                            </div>
                          </div>
                        )}
                        {feature.data_entities_used.length > 0 && (
                          <div>
                            <div className="text-xs font-semibold text-purple-700 mb-1">Entities ({feature.data_entities_used.length})</div>
                            <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                              {feature.data_entities_used.map((entity) => (
                                <span key={`${feature.feature_id}-data-entity-${entity}`} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-xs">{entity}</span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Technologies & Integration */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {feature.technologies_used.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-3">
                      <button
                        onClick={() => toggleSection(feature.feature_id, 'technologies')}
                        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                      >
                        <h4 className="font-semibold text-gray-800 text-sm">Technologies ({feature.technologies_used.length})</h4>
                        <span className="text-orange-600 font-bold">
                          {isSectionExpanded(feature.feature_id, 'technologies') ? '−' : '+'}
                        </span>
                      </button>
                      {isSectionExpanded(feature.feature_id, 'technologies') && (
                        <div className="flex flex-wrap gap-2">
                          {feature.technologies_used.map((tech) => (
                            <span key={`${feature.feature_id}-technology-${tech}`} className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-semibold">{tech}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {feature.integration_points.length > 0 && (
                    <div className="bg-cyan-50 border border-cyan-200 rounded p-3">
                      <button
                        onClick={() => toggleSection(feature.feature_id, 'integrations')}
                        className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                      >
                        <h4 className="font-semibold text-gray-800 text-sm">Integration Points ({feature.integration_points.length})</h4>
                        <span className="text-cyan-600 font-bold">
                          {isSectionExpanded(feature.feature_id, 'integrations') ? '−' : '+'}
                        </span>
                      </button>
                      {isSectionExpanded(feature.feature_id, 'integrations') && (
                        <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
                          {feature.integration_points.map((point) => (
                            <span key={`${feature.feature_id}-integration-point-${point}`} className="px-2 py-1 bg-cyan-100 text-cyan-800 rounded text-xs">{point}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Related Nodes */}
                {feature.related_nodes.length > 0 && (
                  <div className="mb-4 bg-gray-50 border border-gray-200 rounded p-3">
                    <button
                      onClick={() => toggleSection(feature.feature_id, 'relatedNodes')}
                      className="w-full flex items-center justify-between mb-2 hover:opacity-80 transition-opacity"
                    >
                      <h4 className="font-semibold text-gray-800 text-sm">Related Nodes ({feature.related_nodes.length})</h4>
                      <span className="text-gray-600 font-bold">
                        {isSectionExpanded(feature.feature_id, 'relatedNodes') ? '−' : '+'}
                      </span>
                    </button>
                    {isSectionExpanded(feature.feature_id, 'relatedNodes') && (
                      <div className="max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-1">
                          {feature.related_nodes.map((node) => (
                            <span key={`${feature.feature_id}-related-node-${node}`} className="px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs font-mono">{node}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics Summary */}
                <div className="flex flex-wrap gap-4 text-sm text-gray-600 bg-gray-50 rounded p-3">
                  <div><span className="font-semibold">Related Flows:</span> {feature.related_flows.length}</div>
                  <div><span className="font-semibold">Related Nodes:</span> {feature.related_nodes.length}</div>
                  <div><span className="font-semibold">Business Rules:</span> {feature.business_rule_ids?.length || 0}</div>
                  <div><span className="font-semibold">User Stories:</span> {feature.user_story_ids?.length || 0}</div>
                  {feature.citations && <div><span className="font-semibold">Citations:</span> {feature.citations.length}</div>}
                </div>

                <button onClick={() => setSelectedFeature(selectedFeature === feature.feature_id ? null : feature.feature_id)} className="mt-4 px-4 py-2 text-sm font-semibold rounded hover:bg-gray-100 transition-colors" style={{ color: brandColor }}>
                  {selectedFeature === feature.feature_id ? 'Hide Detailed Relationships' : 'Show Detailed Relationships'}
                </button>
                {selectedFeature === feature.feature_id && <FeatureDetails featureId={feature.feature_id} data={data} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBusinessRules = () => {
    const categories = Array.from(new Set(data.business_rules.map(r => r.category || 'General')));

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-800">Business Rules</h2>
            <span className="text-sm text-gray-500">({filteredBusinessRules.length} total)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setExpandAll(!expandAll)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
            >
              {expandAll ? '▼ Collapse All' : '▶ Expand All'}
            </button>
            <input
              type="text"
              placeholder="Search rules..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-10 gap-1">
          {categories.map((category, categoryIdx) => (
            <div key={`category-${categoryIdx}-${category}`} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="text-sm text-gray-600 text-center">{category}</div>
              <div className="text-xl font-bold text-center" style={{ color: brandColor }}>
                {data.business_rules.filter(r => (r.category || 'General') === category).length}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {visibleBusinessRules.map((rule, ruleIndex) => (
            <div id={`rule-${rule.rule_id}`} key={`rule-${rule.rule_id}-${ruleIndex}`} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow relative scroll-mt-24">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{rule.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-2">
                      {rule.priority && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(rule.priority)}`}>
                          {rule.priority}
                        </span>
                      )}
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                      >
                        {rule.category || 'General'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-3">
                  <h4 className="font-semibold text-gray-800 text-sm mb-1">Rule Statement</h4>
                  <p className="text-sm text-gray-700">{rule.statement}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rule.conditions && rule.conditions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-2">Conditions</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {rule.conditions.map((condition, conditionIdx) => (
                          <li key={`${rule.rule_id}-condition-${conditionIdx}`} className="text-sm text-gray-600">
                            {condition}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rule.actions && rule.actions.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 text-sm mb-2">Actions</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {rule.actions.map((action, actionIdx) => (
                          <li key={`${rule.rule_id}-action-${actionIdx}`} className="text-sm text-gray-600">
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {rule.data_elements && rule.data_elements.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-gray-800 text-sm mb-2">Data Elements</h4>
                    <div className="flex flex-wrap gap-2">
                      {rule.data_elements.map((element, elementIdx) => (
                        <span
                          key={`${rule.rule_id}-element-${elementIdx}-${element}`}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-mono"
                        >
                          {element}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="mt-3 text-sm text-gray-600">
                  <span className="font-semibold">Mandatory:</span> {rule.is_mandatory ? 'Yes' : 'No'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <LoadMoreButton
          visible={visibleBusinessRules.length}
          total={filteredBusinessRules.length}
          onLoadMore={() => setRulesItemsToShow(prev => prev + LOAD_MORE_INCREMENT)}
          itemType="Business Rules"
        />
      </div>
    );
  };

  const renderTraceability = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Traceability Matrix</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TraceabilityCard title="Flows -> Flow Groups" count={Object.keys(data.traceability_map.flows_to_groups).length} color={brandColor}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(data.traceability_map.flows_to_groups).slice(0, 10).map(([flowId, groupId]) => (
              <div key={flowId} className="bg-gray-50 rounded p-2 text-sm flex justify-between">
                <span className="font-mono text-xs text-gray-600 truncate">{flowId.split('.').pop()}</span>
                <span className="font-semibold" style={{ color: brandColor }}>{groupId}</span>
              </div>
            ))}
            {Object.keys(data.traceability_map.flows_to_groups).length > 10 && <p className="text-xs text-gray-500 italic text-center">{Object.keys(data.traceability_map.flows_to_groups).length - 10} more...</p>}
          </div>
        </TraceabilityCard>
        <TraceabilityCard title="Flow Groups -> Features" count={Object.keys(data.traceability_map.groups_to_features).length} color={brandColor}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(data.traceability_map.groups_to_features).map(([groupId, featureIds]) => (
              <div key={groupId} className="bg-gray-50 rounded p-2 text-sm">
                <div className="font-semibold text-gray-800 mb-1">{groupId}</div>
                <div className="flex flex-wrap gap-1">
                  {(featureIds).map(fid => <span key={fid} className="px-2 py-0.5 rounded text-xs" style={{ backgroundColor: `${brandColor}20`, color: brandColor }}>{fid}</span>)}
                </div>
              </div>
            ))}
          </div>
        </TraceabilityCard>
        <TraceabilityCard title="Features -> User Stories" count={Object.keys(data.traceability_map.features_to_stories).length} color={brandColor}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(data.traceability_map.features_to_stories).map(([featureId, storyIds]) => (
              <div key={featureId} className="bg-gray-50 rounded p-2 text-sm">
                <div className="font-semibold text-gray-800 mb-1">{featureId}</div>
                <div className="flex flex-wrap gap-1">
                  {(storyIds).map(sid => <span key={sid} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{sid}</span>)}
                </div>
              </div>
            ))}
          </div>
        </TraceabilityCard>
        <TraceabilityCard title="Business Rules -> Features" count={Object.keys(data.traceability_map.rules_to_features).length} color={brandColor}>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {Object.entries(data.traceability_map.rules_to_features).slice(0, 10).map(([ruleId, features]) => (
              <div key={ruleId} className="bg-gray-50 rounded p-2 text-sm">
                <div className="font-mono text-xs text-gray-600 mb-1">{ruleId}</div>
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(features) ? features.map(fid => <span key={fid} className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">{fid}</span>)
                    : <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">{features as string}</span>}
                </div>
              </div>
            ))}
          </div>
        </TraceabilityCard>
      </div>
    </div>
  );

  // TAB NAVIGATION
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'flows', label: 'Flows', icon: '🔀' },
    { id: 'features', label: 'Features', icon: '🌟' },
    { id: 'rules', label: 'Business Rules', icon: '📜' },
    { id: 'stories', label: 'User Stories', icon: '👥' },
    { id: 'traceability', label: 'Traceability', icon: '🔗' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white py-6 px-8 shadow-lg" style={{ backgroundColor: brandColor }}>
        <h1 className="text-3xl font-bold">LIFTR Analysis Dashboard</h1>
        <p className="text-orange-100 mt-2">Legacy Insights and Feasibility for Transformation Evaluation and Recommendation</p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-8">
          <div className="flex items-center justify-between">
            <div className="flex space-x-1 overflow-x-auto flex-1">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSearchTerm(''); setSelectedFeature(null); setSelectedFlow(null); }}
                  className={`px-6 py-4 font-semibold whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-b-4 text-gray-900' : 'text-gray-600 hover:text-gray-900'}`}
                  style={{ borderColor: activeTab === tab.id ? brandColor : 'transparent' }}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowQuickNav(true)}
              className="ml-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
              title="Quick Navigation (Ctrl+K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              Quick Nav
              <kbd className="hidden sm:inline px-2 py-0.5 bg-white rounded border border-gray-300 text-xs">⌘K</kbd>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'flows' && renderFlows()}
        {activeTab === 'features' && renderFeatures()}
        {activeTab === 'rules' && renderBusinessRules()}
        {activeTab === 'stories' && (
          <UserStoriesView
            stories={data.user_stories}
            businessRules={data.business_rules}
            language={data.language}
            codebasePath={data.codebase_path}
            timestamp={data.timestamp}
            onExportMarkdown={exportBusinessUserStories}
            onExportExcel={exportUserStoriesToExcel}
            isExporting={isExporting}
          />
        )}
        {activeTab === 'traceability' && renderTraceability()}
      </div>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 p-4 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-lg transition-all hover:scale-110 z-50"
          title="Back to top"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}

      {/* Quick Navigation Panel */}
      {showQuickNav && (
        <button className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20 text-left cursor-default" onClick={() => setShowQuickNav(false)}>
          <button className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[70vh] overflow-y-auto text-left cursor-default select-text" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quick Navigation</h3>
                <p className="text-xs text-gray-500 mt-1">Press <kbd className="px-2 py-0.5 bg-gray-100 rounded border border-gray-300 text-xs">Esc</kbd> to close</p>
              </div>
              <button onClick={() => setShowQuickNav(false)} className="text-gray-400 hover:text-gray-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Quick Nav for Features */}
              {activeTab === 'features' && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Jump to Feature</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredFeatures.map((feature, idx) => (
                      <button
                        key={feature.feature_id}
                        onClick={() => {
                          scrollToFeature(feature.feature_id);
                          setShowQuickNav(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-orange-50 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-orange-600">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{feature.title}</div>
                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                              <span className={`px-2 py-0.5 rounded ${getPriorityColor(feature.priority)}`}>
                                {feature.priority}
                              </span>
                              <span className={`px-2 py-0.5 rounded ${getComplexityColor(feature.complexity)}`}>
                                {feature.complexity}
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Nav for Business Rules */}
              {activeTab === 'rules' && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Jump to Business Rule</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredBusinessRules.map((rule, idx) => (
                      <button
                        key={rule.rule_id}
                        onClick={() => {
                          scrollToRule(rule.rule_id);
                          setShowQuickNav(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-yellow-50 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-yellow-600">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{rule.name}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {rule.category && <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">{rule.category}</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Nav for User Stories */}
              {activeTab === 'stories' && (
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Jump to User Story</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredUserStories.map((story, idx) => (
                      <button
                        key={story.story_id}
                        onClick={() => {
                          scrollToStory(story.story_id);
                          setShowQuickNav(false);
                        }}
                        className="w-full text-left px-4 py-3 rounded-lg hover:bg-green-50 transition-colors border border-gray-200"
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-bold text-green-600">{idx + 1}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{story.title}</div>
                            <div className="text-xs text-gray-500 mt-1 flex gap-2">
                              <span className={`px-2 py-0.5 rounded ${getPriorityColor(story.priority)}`}>
                                {story.priority}
                              </span>
                              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800">
                                {story.story_points} pts
                              </span>
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tab Switcher */}
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Switch Section</h4>
                <div className="grid grid-cols-2 gap-2">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setShowQuickNav(false);
                        scrollToTop();
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${activeTab === tab.id
                        ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </button>
        </button>
      )}
    </div>
  );
};


// Helper Components
interface MetricCardProps { label: string; value: string | number; icon: string; color: string; }
const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{icon}</span>
      <span className="text-3xl font-bold" style={{ color }}>{value}</span>
    </div>
    <div className="text-sm text-gray-600">{label}</div>
  </div>
);

interface TraceabilityStatProps { label: string; value: number; }
const TraceabilityStat: React.FC<TraceabilityStatProps> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-700">{label}</span>
    <span className="font-bold text-gray-900">{value}</span>
  </div>
);

interface TraceabilityCardProps { title: string; count: number; color: string; children: React.ReactNode; }
const TraceabilityCard: React.FC<TraceabilityCardProps> = ({ title, count, color, children }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-5">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-lg font-bold text-gray-800">{title}</h3>
      <span className="px-3 py-1 rounded-full text-sm font-bold text-white" style={{ backgroundColor: color }}>{count}</span>
    </div>
    {children}
  </div>
);

export default TotalAnalysisVisualizer;