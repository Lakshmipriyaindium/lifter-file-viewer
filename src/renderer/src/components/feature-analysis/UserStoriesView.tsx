// Adapted for Lifter-File-Viewer
import React, { useState, useMemo } from 'react';
import { FileText } from 'lucide-react';

interface UserStory {
  story_id: string;
  title: string;
  epic: string;
  priority: string;
  complexity: string;
  story_points: number;
  status: string;
  as_a: string;
  i_want: string;
  so_that: string;
  narrative: string;
  background?: string | null;
  acceptance_criteria: string[];
  assumptions: string[];
  test_scenarios: string[];
  technical_requirements?: string[];
  data_inputs: string[];
  data_outputs: string[];
  has_client_customizations?: boolean;
  affected_clients?: string[];
  customization_type?: string;
  client_specific_requirements?: string[];
  implementation_notes?: string | null;
  related_business_rules?: string[];
  reference_documents?: Array<{
    document_id: string | number;
    confidence: number;
    relationship?: string;
    reason?: string;
  }>;
  depends_on: string[];
  blocks: string[];
  citations?: Array<{
    source_type: string;
    node_name: string;
    file_path: string;
    line_start: number;
    line_end: number;
    language: string;
  }>;
}

interface BusinessRule {
  rule_id: string;
  name: string;
  category?: string;
  priority?: string;
  is_mandatory?: boolean;
  description?: string;
  statement?: string;
  conditions?: string[];
  actions?: string[];
}

interface UserStoriesViewProps {
  stories: UserStory[];
  businessRules: BusinessRule[];
  language?: string;
  codebasePath?: string;
  timestamp?: string;
  onExportMarkdown: () => void;
  onExportExcel: () => void;
  isExporting: boolean;
}

const ITEMS_PER_PAGE = 10;

const UserStoriesView: React.FC<UserStoriesViewProps> = ({
  stories,
  businessRules,
  onExportMarkdown,
  onExportExcel,
  isExporting,
}) => {
  const [showSideNav, setShowSideNav] = useState(true);
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEpic, setSelectedEpic] = useState<string>('all');
  const [showClientCustomizations, setShowClientCustomizations] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'overview' | 'assumptions' | 'technical' | 'citations' | 'tests' | 'rules'>('overview');

  const epics = useMemo(() => Array.from(new Set(stories.map(s => s.epic))), [stories]);
  const hasClientCustomizations = useMemo(() => stories.some(s => s.has_client_customizations), [stories]);

  // Filter stories
  const filteredStories = useMemo(() => {
    let filtered = stories;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.narrative.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.story_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedEpic !== 'all') {
      filtered = filtered.filter(s => s.epic === selectedEpic);
    }

    if (showClientCustomizations === 'yes') {
      filtered = filtered.filter(s => s.has_client_customizations);
    } else if (showClientCustomizations === 'no') {
      filtered = filtered.filter(s => !s.has_client_customizations);
    }

    return filtered;
  }, [stories, searchTerm, selectedEpic, showClientCustomizations]);

  // Pagination
  const totalPages = Math.ceil(filteredStories.length / ITEMS_PER_PAGE);
  const paginatedStories = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStories.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStories, currentPage]);

  // Get selected story
  const selectedStory = useMemo(() => {
    if (!selectedStoryId) return paginatedStories[0] || null;
    return filteredStories.find(s => s.story_id === selectedStoryId) || paginatedStories[0] || null;
  }, [selectedStoryId, paginatedStories, filteredStories]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedEpic, showClientCustomizations]);

  // Auto-select first story on page change
  React.useEffect(() => {
    if (paginatedStories.length > 0) {
      setSelectedStoryId(paginatedStories[0].story_id);
    }
  }, [currentPage, paginatedStories]);

  const handleStoryClick = (storyId: string) => {
    setSelectedStoryId(storyId);
    setActiveTab('overview');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedEpic('all');
    setShowClientCustomizations('all');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity?.toLowerCase()) {
      case 'complex': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'moderate': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'simple': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    const endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-6">
        <button
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          First
        </button>
        <button
          onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ←
        </button>
        {startPage > 1 && <span className="px-2">...</span>}
        {pages.map(page => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded border ${
              currentPage === page
                ? 'bg-green-500 text-white border-green-600'
                : 'border-gray-300 hover:bg-gray-100'
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < totalPages && <span className="px-2">...</span>}
        <button
          onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          →
        </button>
        <button
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Last
        </button>
      </div>
    );
  };

  //User Stories Tabs
  const renderOverviewTab = () => {
    return(
      <div className="space-y-6">
        {/* User Story Format */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
          <div className="space-y-3">
            <p className="text-base">
              <span className="font-semibold text-gray-800">As a</span>{' '}
              <span className="text-gray-700">{selectedStory.as_a}</span>
            </p>
            <p className="text-base">
              <span className="font-semibold text-gray-800">I want</span>{' '}
              <span className="text-gray-700">{selectedStory.i_want}</span>
            </p>
            <p className="text-base">
              <span className="font-semibold text-gray-800">So that</span>{' '}
              <span className="text-gray-700">{selectedStory.so_that}</span>
            </p>
          </div>
        </div>

        {/* Narrative */}
        {selectedStory.narrative && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📖 Narrative</h4>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700">{selectedStory.narrative}</div>
          </div>
        )}

        {/* Background */}
        {selectedStory.background && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🎯 Background</h4>
            <div className="bg-gray-50 rounded-lg p-4 text-gray-700">{selectedStory.background}</div>
          </div>
        )}

        {/* Acceptance Criteria */}
        {selectedStory.acceptance_criteria.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">✓ Acceptance Criteria ({selectedStory.acceptance_criteria.length})</h4>
            <ul className="space-y-2">
              {selectedStory.acceptance_criteria.map((criteria) => (
                <li key={`${selectedStory.story_id}-acceptance-criteria-${criteria}`} className="flex items-start bg-gray-50 rounded p-3">
                  <span className="mr-2 mt-1 text-green-600">✓</span>
                  <span className="text-gray-700">{criteria}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Data I/O */}
        {(selectedStory.data_inputs.length > 0 || selectedStory.data_outputs.length > 0) && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">📊 Data Information</h4>
            <div className="grid grid-cols-2 gap-4">
              {selectedStory.data_inputs.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Inputs:</p>
                  <ul className="space-y-1">
                    {selectedStory.data_inputs.map((input) => (
                      <li key={`${selectedStory.story_id}-data-input-${input}`} className="text-sm text-gray-600 bg-blue-50 rounded px-2 py-1">→ {input}</li>
                    ))}
                  </ul>
                </div>
              )}
              {selectedStory.data_outputs.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Outputs:</p>
                  <ul className="space-y-1">
                    {selectedStory.data_outputs.map((output) => (
                      <li key={`${selectedStory.story_id}-data-output-${output}`} className="text-sm text-gray-600 bg-green-50 rounded px-2 py-1">← {output}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Implementation Notes */}
        {selectedStory.implementation_notes && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">💡 Implementation Notes</h4>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-gray-700">
              {selectedStory.implementation_notes}
            </div>
          </div>
        )}

        {/* Client Customizations */}
        {selectedStory.has_client_customizations && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🏢 Client Customizations</h4>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <p className="text-sm mb-2">
                <span className="font-medium">Affected Clients:</span> {selectedStory.affected_clients?.join(', ')}
              </p>
              {selectedStory.customization_type && (
                <p className="text-sm mb-2">
                  <span className="font-medium">Type:</span> {selectedStory.customization_type}
                </p>
              )}
              {selectedStory.client_specific_requirements && selectedStory.client_specific_requirements.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Requirements:</p>
                  <ul className="space-y-1">
                    {selectedStory.client_specific_requirements.map((req) => (
                      <li key={`${selectedStory.story_id}-client-requirement-${req}`} className="text-sm text-gray-700">• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dependencies */}
        {(selectedStory.depends_on.length > 0 || selectedStory.blocks.length > 0) && (
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">🔗 Dependencies</h4>
            <div className="grid grid-cols-2 gap-4">
              {selectedStory.depends_on.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Depends On:</p>
                  <div className="space-y-1">
                    {selectedStory.depends_on.map((dep) => (
                      <div key={`${selectedStory.story_id}-depends-on-${dep}`} className="text-sm text-gray-600 bg-orange-50 rounded px-2 py-1">{dep}</div>
                    ))}
                  </div>
                </div>
              )}
              {selectedStory.blocks.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Blocks:</p>
                  <div className="space-y-1">
                    {selectedStory.blocks.map((block) => (
                      <div key={`${selectedStory.story_id}-blocks-${block}`} className="text-sm text-gray-600 bg-red-50 rounded px-2 py-1">{block}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }
  const renderAssumptionsTab = () => {
    return(
      <div>
        <h4 className="font-semibold text-gray-800 mb-4">💭 Assumptions ({selectedStory.assumptions.length})</h4>
        {selectedStory.assumptions.length > 0 ? (
          <ul className="space-y-3">
            {selectedStory.assumptions.map((assumption, idx) => (
              <li key={`${selectedStory.story_id}-assumption-${assumption}`} className="flex items-start bg-blue-50 border border-blue-200 rounded-lg p-4">
                <span className="font-bold text-blue-600 mr-3">{idx + 1}.</span>
                <span className="text-gray-700">{assumption}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">No assumptions documented for this story.</p>
        )}
      </div>
    )
  }
  const renderTechnicalTab = () => {
    return(
      <div>
        <h4 className="font-semibold text-gray-800 mb-4">⚙️ Technical Requirements</h4>
        {selectedStory.technical_requirements && selectedStory.technical_requirements.length > 0 ? (
          <ul className="space-y-3">
            {selectedStory.technical_requirements.map((req, idx) => (
              <li key={`${selectedStory.story_id}-technical_requirements-${req}`} className="flex items-start bg-purple-50 border border-purple-200 rounded-lg p-4">
                <span className="font-bold text-purple-600 mr-3">{idx + 1}.</span>
                <span className="text-gray-700">{req}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center py-8">No technical requirements specified for this story.</p>
        )}
      </div>
    )
  }
  const renderCitationsTab = () => {
    return(
      <div>
        <h4 className="font-semibold text-gray-800 mb-4">📎 Source Citations</h4>
        {selectedStory.citations && selectedStory.citations.length > 0 ? (
          <div className="space-y-3">
            {selectedStory.citations.map((citation) => (
              <div key={`${selectedStory.story_id}-citation-${citation.node_name}-${citation.file_path}-${citation.line_start}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Source Type:</span>
                    <span className="ml-2 text-gray-600">{citation.source_type}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Language:</span>
                    <span className="ml-2 text-gray-600">{citation.language}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Node Name:</span>
                    <span className="ml-2 text-gray-600 font-mono">{citation.node_name}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">File Path:</span>
                    <span className="ml-2 text-gray-600 font-mono text-xs">{citation.file_path}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Lines:</span>
                    <span className="ml-2 text-gray-600">{citation.line_start} - {citation.line_end}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No source citations available for this story.</p>
        )}
      </div>
    )
  }
  const renderTestsTab = () => {
    return(
    <div>
      <h4 className="font-semibold text-gray-800 mb-4">🧪 Test Scenarios ({selectedStory.test_scenarios.length})</h4>
      {selectedStory.test_scenarios.length > 0 ? (
        <ul className="space-y-3">
          {selectedStory.test_scenarios.map((scenario, idx) => (
            <li key={`${selectedStory.story_id}-test-scenario-${scenario}`} className="flex items-start bg-green-50 border border-green-200 rounded-lg p-4">
              <span className="font-bold text-green-600 mr-3">T{idx + 1}</span>
              <span className="text-gray-700">{scenario}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500 text-center py-8">No test scenarios defined for this story.</p>
      )}
    </div>
    )
  }
  const renderRulesTab = () => {
    const relatedRules = selectedStory.related_business_rules
      ? businessRules.filter(r => selectedStory.related_business_rules!.includes(r.rule_id))
      : [];
    return(
      <div>
        <h4 className="font-semibold text-gray-800 mb-4">📜 Related Business Rules ({relatedRules.length})</h4>
        {relatedRules.length > 0 ? (
          <div className="space-y-4">
            {relatedRules.map((rule) => (
              <div key={rule.rule_id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-semibold text-gray-800">{rule.name}</h5>
                    <p className="text-sm text-gray-500">{rule.rule_id}</p>
                  </div>
                  <div className="flex gap-2">
                    {rule.category && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">{rule.category}</span>
                    )}
                    {rule.priority && (
                      <span className={`px-2 py-1 rounded text-xs ${getPriorityColor(rule.priority)}`}>
                        {rule.priority}
                      </span>
                    )}
                    {rule.is_mandatory && (
                      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">Mandatory</span>
                    )}
                  </div>
                </div>
                {rule.description && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Description:</p>
                    <p className="text-sm text-gray-600">{rule.description}</p>
                  </div>
                )}
                {rule.statement && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Statement:</p>
                    <p className="text-sm text-gray-600">{rule.statement}</p>
                  </div>
                )}
                {rule.conditions && rule.conditions.length > 0 && (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Conditions:</p>
                    <ul className="ml-4 mt-1">
                      {rule.conditions.map((condition) => (
                        <li key={`${rule.rule_id}-condition-${condition}`} className="text-sm text-gray-600">• {condition}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {rule.actions && rule.actions.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Actions:</p>
                    <ul className="ml-4 mt-1">
                      {rule.actions.map((action) => (
                        <li key={`${rule.rule_id}-action-${action}`} className="text-sm text-gray-600">• {action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No business rules linked to this story.</p>
        )}
      </div>
    )
  }
  const renderStoryContent = () => {
    if (!selectedStory) {
      return (
        <div className="text-center py-12 text-gray-500">
          No user stories found. Try adjusting your filters.
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        return renderOverviewTab();

      case 'assumptions':
        return renderAssumptionsTab();

      case 'technical':
        return renderTechnicalTab();

      case 'citations':
        return renderCitationsTab();

      case 'tests':
        return renderTestsTab();

      case 'rules':
        return renderRulesTab();

      default:
        return null;
    }
  };
  const getTabClassName = (tab: string) => {
    return activeTab === tab ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }

  return (
    <div className="flex gap-6">
      {/* Floating Side Navigation */}
      {showSideNav && (
        <div style={{ width: '320px' }} className="flex-shrink-0 sticky top-24 h-fit">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">User Stories</h3>
              <button
                onClick={() => setShowSideNav(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title="Hide navigation"
              >
                ✕
              </button>
            </div>

            {/* Export Buttons */}
            <div className="space-y-2 mb-4 pb-4 border-b border-gray-200">
              <button
                onClick={onExportMarkdown}
                disabled={isExporting}
                className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <FileText size={16} />
                {isExporting ? 'Exporting...' : 'Export Markdown'}
              </button>

              <button
                onClick={onExportExcel}
                disabled={isExporting}
                className="w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M12,19L8,15H10.5V12H13.5V15H16L12,19Z" />
                </svg>
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Filters */}
            <div className="space-y-3 mb-4 pb-4 border-b border-gray-200">
              <div>
                <label htmlFor="filter-by-epic" className="block text-xs font-semibold text-gray-700 mb-1">Filter by Epic</label>
                <select
                  value={selectedEpic}
                  id="filter-by-epic"
                  onChange={e => setSelectedEpic(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Epics ({stories.length})</option>
                  {epics.map(epic => (
                    <option key={epic} value={epic}>
                      {epic} ({stories.filter(s => s.epic === epic).length})
                    </option>
                  ))}
                </select>
              </div>

              {hasClientCustomizations && (
                <div>
                  <label htmlFor="client-customization" className="block text-xs font-semibold text-gray-700 mb-1">Client Customizations</label>
                  <select
                    value={showClientCustomizations}
                    id="client-customization"
                    onChange={e => setShowClientCustomizations(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="all">All Stories</option>
                    <option value="yes">With Customizations ({stories.filter(s => s.has_client_customizations).length})</option>
                    <option value="no">Without Customizations ({stories.filter(s => !s.has_client_customizations).length})</option>
                  </select>
                </div>
              )}

              {(selectedEpic !== 'all' || showClientCustomizations !== 'all' || searchTerm) && (
                <button
                  onClick={clearFilters}
                  className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              )}
            </div>

            {/* Story List */}
            <div className="space-y-1">
              <div className="text-xs font-semibold text-gray-500 mb-2 px-2">
                Page {currentPage} of {totalPages} ({filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'})
              </div>
              {paginatedStories.map((story, idx) => (
                <button
                  key={story.story_id}
                  onClick={() => handleStoryClick(story.story_id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                    selectedStoryId === story.story_id
                      ? 'bg-green-100 text-green-800 border-l-4 border-green-600'
                      : 'hover:bg-green-50 hover:text-green-700'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`font-semibold mt-0.5 text-xs ${selectedStoryId === story.story_id ? 'text-green-600' : 'text-gray-400'}`}>
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs leading-tight mb-1 line-clamp-2">{story.title}</div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`px-1.5 py-0.5 rounded text-xs ${getPriorityColor(story.priority)}`}>
                          {story.priority}
                        </span>
                        <span className="text-xs text-gray-500">{story.story_points} pts</span>
                        {story.has_client_customizations && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700" title="Has client customizations">
                            🏢
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-gray-600 whitespace-nowrap">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            {!showSideNav && (
              <button
                onClick={() => setShowSideNav(true)}
                className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2"
              >
                <span className="text-lg">☰</span> Show Navigation
              </button>
            )}
            <h2 className="text-2xl font-bold text-gray-800">User Stories</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {filteredStories.length} {filteredStories.length === 1 ? 'story' : 'stories'}
            </span>
          </div>
        </div>

        {/* Story Details */}
        {selectedStory ? (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Story Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{selectedStory.title}</h3>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                      {selectedStory.story_points} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm text-gray-500">{selectedStory.story_id}</p>
                    <span className="text-gray-300">•</span>
                    <p className="text-sm text-gray-500">{selectedStory.epic}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(selectedStory.priority)}`}>
                    {selectedStory.priority}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getComplexityColor(selectedStory.complexity)}`}>
                    {selectedStory.complexity}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
                    {selectedStory.status}
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getTabClassName('overview')
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setActiveTab('assumptions')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getTabClassName('assumptions')
                  }`}
                >
                  Assumptions ({selectedStory.assumptions?.length})
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getTabClassName('technical')
                  }`}
                >
                  Technical ({selectedStory.technical_requirements?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('citations')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getTabClassName('citations')
                  }`}
                >
                  Citations ({selectedStory.citations?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getTabClassName('tests')
                  }`}
                >
                  Test Scenarios ({selectedStory.test_scenarios?.length})
                </button>
                <button
                  onClick={() => setActiveTab('rules')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    getTabClassName('rules')
                  }`}
                >
                  Business Rules ({selectedStory.related_business_rules?.length || 0})
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {renderStoryContent()}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-12 text-center text-gray-500">
            No user stories found. Try adjusting your filters.
          </div>
        )}

        {/* Bottom Pagination */}
        {renderPagination()}
      </div>
    </div>
  );
};

export default UserStoriesView;
