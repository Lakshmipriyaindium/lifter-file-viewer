import React, { useState, useMemo } from 'react';
import {
  Users, Search, Settings, Filter, Download, FileDown,
  ChevronDown, ChevronRight, Calendar, Clock, Star, Tag,
  CheckCircle, AlertCircle, Circle, User, Target, Lightbulb,
  Code, TestTube, FileText, ArrowRight, BarChart3, Flag, Eye, Edit
} from 'lucide-react';
import { UserStoriesViewProps } from './type';

interface Filters {
  status: string[];
  priority: string[];
  complexity: string[];
  epic: string[];
  tags: string[];
}

const UserStoriesView: React.FC<UserStoriesViewProps> = ({
  stories,
  businessRules,
  language,
  codebasePath,
  timestamp,
  onExportMarkdown,
  onExportExcel,
  isExporting,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedStories, setExpandedStories] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    status: [],
    priority: [],
    complexity: [],
    epic: [],
    tags: []
  });
  const [sortBy, setSortBy] = useState<'story_id' | 'created_date' | 'priority' | 'story_points' | 'title'>('story_id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Derived data
  const epics = useMemo(() => [...new Set((stories || []).map(s => s.epic).filter(Boolean))], [stories]);
  const allTags = useMemo(() => [...new Set((stories || []).flatMap(s => s.tags || []))], [stories]);

  const statusCounts = useMemo(() => {
    const counts = { draft: 0, ready: 0, 'in-progress': 0, done: 0, blocked: 0 };
    for (const story of stories || []) {
      const status = (story.status || 'draft').toLowerCase() as keyof typeof counts;
      if (counts.hasOwnProperty(status)) {
        counts[status] = (counts[status] || 0) + 1;
      }
    }
    return counts;
  }, [stories]);

  const filteredAndSortedStories = useMemo(() => {
    const filtered = (stories || []).filter(story => {
      // Text search
      const searchMatch = !searchTerm ||
        story.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.narrative.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.as_a.toLowerCase().includes(searchTerm.toLowerCase()) ||
        story.epic.toLowerCase().includes(searchTerm.toLowerCase());

      // Filters
      const statusMatch = filters.status.length === 0 || filters.status.includes(story.status);
      const priorityMatch = filters.priority.length === 0 || filters.priority.includes(story.priority);
      const complexityMatch = filters.complexity.length === 0 || filters.complexity.includes(story.complexity);
      const epicMatch = filters.epic.length === 0 || filters.epic.includes(story.epic);
      const tagsMatch = filters.tags.length === 0 || (story.tags || []).some((tag: string) => filters.tags.includes(tag));

      return searchMatch && statusMatch && priorityMatch && complexityMatch && epicMatch && tagsMatch;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: number | string, bValue: number | string;

      switch (sortBy) {
        case 'story_id': {
          const aNum = parseInt(a.story_id.replace(/\D/g, '')) || 0;
          const bNum = parseInt(b.story_id.replace(/\D/g, '')) || 0;
          aValue = aNum;
          bValue = bNum;
          break;
        }
        case 'priority': {
          const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority.toLowerCase()] || 0;
          bValue = priorityOrder[b.priority.toLowerCase()] || 0;
          break;
        }
        case 'story_points':
          aValue = a.story_points;
          bValue = b.story_points;
          break;
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'created_date':
        default:
          aValue = new Date(a.created_date || '').getTime();
          bValue = new Date(b.created_date || '').getTime();
          break;
      }

      if (aValue === bValue) return 0;
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [stories, searchTerm, filters, sortBy, sortOrder]);

  const toggleStory = (storyId: string) => {
    setExpandedStories(prev => ({ ...prev, [storyId]: !prev[storyId] }));
  };

  const setActiveStoryTab = (storyId: string, tab: string) => {
    setActiveTab(prev => ({ ...prev, [storyId]: tab }));
  };

  const getActiveStoryTab = (storyId: string) => {
    return activeTab[storyId] || 'overview';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'ready': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'done': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      case 'ready': return <Circle className="w-4 h-4" />;
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'blocked': return <AlertCircle className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'complex': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'simple': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const toggleFilter = (category: keyof Filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Users className="w-7 h-7 text-white" />
                </div>
                User Stories Analysis
              </h1>
              <p className="mt-2 text-gray-600">Comprehensive view of user stories, epics, and requirements</p>
              {timestamp && <p className="text-xs text-gray-400 mt-1">Last generated: {new Date(timestamp).toLocaleString()}</p>}
              <div className="mt-3 flex items-center gap-6 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {(stories || []).length} Total Stories
                </span>
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-4 h-4" />
                  {(stories || []).reduce((sum, story) => sum + (story.story_points || 0), 0)} Story Points
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="w-4 h-4" />
                  {epics.length} Epics
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onExportExcel}
                disabled={isExporting}
                className={`flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg transition-all shadow-md hover:shadow-lg ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
              >
                <Download className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export Excel'}
              </button>
              <button
                onClick={onExportMarkdown}
                disabled={isExporting}
                className={`flex items-center gap-2 px-6 py-3 bg-gray-700 text-white rounded-lg transition-all shadow-md hover:shadow-lg ${isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
              >
                <FileDown className={`w-5 h-5 ${isExporting ? 'animate-bounce' : ''}`} />
                {isExporting ? 'Exporting...' : 'Export Markdown'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search stories, epics, narratives..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="story_id">Sort by Story ID</option>
                <option value="created_date">Sort by Date</option>
                <option value="priority">Sort by Priority</option>
                <option value="story_points">Sort by Story Points</option>
                <option value="title">Sort by Title</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Status Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Status</h4>
                  <div className="space-y-1">
                    {['draft', 'ready', 'in-progress', 'done', 'blocked'].map(status => (
                      <label key={status} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.status.includes(status)}
                          onChange={() => toggleFilter('status', status)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{status.replace('-', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Priority Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Priority</h4>
                  <div className="space-y-1">
                    {['critical', 'high', 'medium', 'low'].map(priority => (
                      <label key={priority} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.priority.includes(priority)}
                          onChange={() => toggleFilter('priority', priority)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{priority}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Complexity Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Complexity</h4>
                  <div className="space-y-1">
                    {['simple', 'medium', 'complex'].map(complexity => (
                      <label key={complexity} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.complexity.includes(complexity)}
                          onChange={() => toggleFilter('complexity', complexity)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{complexity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Epic Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Epic</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {epics.map(epic => (
                      <label key={epic} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.epic.includes(epic)}
                          onChange={() => toggleFilter('epic', epic)}
                          className="mr-2"
                        />
                        <span className="text-sm">{epic}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tags Filter */}
                <div>
                  <h4 className="font-medium text-gray-700 mb-2">Tags</h4>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {allTags.map(tag => (
                      <label key={tag} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.tags.includes(tag)}
                          onChange={() => toggleFilter('tags', tag)}
                          className="mr-2"
                        />
                        <span className="text-sm">{tag}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Summary Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 capitalize">
                    {status.replace('-', ' ')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
                <div className={`p-2 rounded-lg ${getStatusColor(status)}`}>
                  {getStatusIcon(status)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stories List */}
        <div className="space-y-6">
          {filteredAndSortedStories.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No stories found</h3>
              <p className="text-gray-500">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAndSortedStories.map(story => {
              const isExpanded = expandedStories[story.story_id];
              const activeStoryTab = getActiveStoryTab(story.story_id);

              return (
                <div key={story.story_id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {/* Story Header */}
                  <button
                    className="w-full px-6 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-b cursor-pointer hover:from-gray-100 hover:to-blue-100 transition-colors"
                    onClick={() => toggleStory(story.story_id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                          <h3 className="text-lg font-semibold text-gray-900">{story.title}</h3>
                        </div>
                        <span className="text-sm text-gray-500">({story.story_id})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(story.status)}`}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(story.status)}
                            {story.status.charAt(0).toUpperCase() + story.status.slice(1).replace('-', ' ')}
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getPriorityColor(story.priority)}`}>
                          {story.priority.charAt(0).toUpperCase() + story.priority.slice(1)}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-medium border ${getComplexityColor(story.complexity)}`}>
                          {story.complexity}
                        </div>
                        {story.has_client_customizations && (
                          <div className="px-3 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-800 border-orange-200">
                            <div className="flex items-center gap-1">
                              <Settings className="w-3 h-3" />
                              Client Customizations
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-4 h-4" />
                          {story.story_points}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <Flag className="w-4 h-4" />
                        {story.epic}
                      </span>
                      {story.created_date && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(story.created_date).toLocaleDateString()}
                        </span>
                      )}
                        {(story.tags || []).length > 0 && (
                          <div className="flex items-center gap-1">
                            <Tag className="w-4 h-4" />
                            <div className="flex gap-1">
                              {(story.tags || []).slice(0, 3).map((tag: string, idx: number) => (
                                <span key={`${tag}-${idx}`} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {tag}
                                </span>
                              ))}
                              {(story.tags || []).length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{(story.tags || []).length - 3}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div>
                      {/* Tab Navigation */}
                      <div className="flex border-b bg-gray-50">
                        {[
                          { id: 'overview', label: 'Overview', icon: Eye },
                          { id: 'criteria', label: 'Acceptance Criteria', icon: CheckCircle },
                          { id: 'technical', label: 'Technical', icon: Code },
                          { id: 'testing', label: 'Testing', icon: TestTube },
                          { id: 'relationships', label: 'Relationships', icon: ArrowRight },
                          ...(story.has_client_customizations ? [{ id: 'customizations', label: 'Client Customizations', icon: Settings }] : []),
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setActiveStoryTab(story.story_id, tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all ${activeStoryTab === tab.id
                              ? 'bg-white text-blue-700 border-b-2 border-blue-500'
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                              }`}
                          >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      {/* Tab Content */}
                      <div className="p-6">
                        {activeStoryTab === 'overview' && (
                          <div className="space-y-6">
                            {/* User Story Format */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                              <h4 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                User Story
                              </h4>
                              <div className="space-y-3 text-blue-800">
                                <p><span className="font-medium">As a</span> {story.as_a}</p>
                                <p><span className="font-medium">I want</span> {story.i_want}</p>
                                <p><span className="font-medium">So that</span> {story.so_that}</p>
                              </div>
                            </div>

                            {/* Narrative */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <FileText className="w-5 h-5" />
                                Narrative
                              </h4>
                              <p className="text-gray-700 leading-relaxed">{story.narrative}</p>
                            </div>

                            {/* Background */}
                            {story.background && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Lightbulb className="w-5 h-5" />
                                  Background
                                </h4>
                                <p className="text-gray-700 leading-relaxed">{story.background}</p>
                              </div>
                            )}

                            {/* Assumptions */}
                            {(story.assumptions || []).length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                  <Target className="w-5 h-5" />
                                  Assumptions
                                </h4>
                                <ul className="space-y-2">
                                  {story.assumptions.map((assumption) => (
                                    <li key={`${story.story_id}-assumption-${assumption}`} className="flex items-start gap-2">
                                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">{assumption}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}

                        {activeStoryTab === 'criteria' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5" />
                              Acceptance Criteria
                            </h4>
                            {(story.acceptance_criteria || []).length > 0 ? (
                              <div className="space-y-3">
                                {story.acceptance_criteria.map((criteria, idx) => (
                                  <div key={`${story.story_id}-acceptance-criteria-${criteria}`} className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                      {idx + 1}
                                    </div>
                                    <p className="text-green-800">{criteria}</p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No acceptance criteria defined.</p>
                            )}
                          </div>
                        )}

                        {activeStoryTab === 'technical' && (
                          <div className="space-y-6">
                            {/* Technical Requirements */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Code className="w-5 h-5" />
                                Technical Requirements
                              </h4>
                              {(story.technical_requirements || []).length > 0 ? (
                                <ul className="space-y-2">
                                  {story.technical_requirements?.map((req: string) => (
                                    <li key={`${story.story_id}-technical-requirement-${req}`} className="flex items-start gap-2">
                                      <span className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></span>
                                      <span className="text-gray-700">{req}</span>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-gray-500 italic">No technical requirements specified.</p>
                              )}
                            </div>

                            {/* Implementation Notes */}
                            {story.implementation_notes && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Implementation Notes</h4>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                  <p className="text-yellow-800">{story.implementation_notes}</p>
                                </div>
                              </div>
                            )}

                            {/* Data Inputs & Outputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Data Inputs</h4>
                                {(story.data_inputs || []).length > 0 ? (
                                  <ul className="space-y-1">
                                    {story.data_inputs.map((input) => (
                                      <li key={`${story.story_id}-data-input-${input}`} className="text-sm text-gray-600">• {input}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 italic text-sm">No data inputs specified.</p>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Data Outputs</h4>
                                {(story.data_outputs || []).length > 0 ? (
                                  <ul className="space-y-1">
                                    {story.data_outputs.map((output) => (
                                      <li key={`${story.story_id}-data-output-${output}`} className="text-sm text-gray-600">• {output}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <p className="text-gray-500 italic text-sm">No data outputs specified.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeStoryTab === 'testing' && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                              <TestTube className="w-5 h-5" />
                              Test Scenarios
                            </h4>
                            {(story.test_scenarios || []).length > 0 ? (
                              <div className="space-y-3">
                                {story.test_scenarios.map((scenario, idx) => (
                                  <div key={`${story.story_id}-test-scenario-${scenario}`} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                    <div className="flex items-start gap-3">
                                      <div className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                                        T{idx + 1}
                                      </div>
                                      <p className="text-purple-800">{scenario}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-gray-500 italic">No test scenarios defined.</p>
                            )}
                          </div>
                        )}

                        {activeStoryTab === 'relationships' && (
                          <div className="space-y-6">
                            {/* Related Features */}
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Related Features</h4>
                              {(story.related_features || []).length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {story.related_features.map(feature => (
                                    <span key={feature} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                      {feature}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-500 italic">No related features.</p>
                              )}
                            </div>

                            {/* Dependencies */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Depends On</h4>
                                {(story.depends_on || []).length > 0 ? (
                                  <div className="space-y-2">
                                    {story.depends_on.map(dep => (
                                      <div key={dep} className="flex items-center gap-2 text-sm">
                                        <ArrowRight className="w-4 h-4 text-red-500" />
                                        <span className="text-gray-700">{dep}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 italic text-sm">No dependencies.</p>
                                )}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Blocks</h4>
                                {(story.blocks || []).length > 0 ? (
                                  <div className="space-y-2">
                                    {story.blocks.map(block => (
                                      <div key={block} className="flex items-center gap-2 text-sm">
                                        <ArrowRight className="w-4 h-4 text-orange-500" />
                                        <span className="text-gray-700">{block}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-gray-500 italic text-sm">Doesn't block anything.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}

                        {activeStoryTab === 'customizations' && story.has_client_customizations && (
                          <div className="space-y-6">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Settings className="w-5 h-5 text-orange-600" />
                                <h4 className="font-semibold text-orange-900">Client Customizations Required</h4>
                              </div>
                              <p className="text-orange-800 text-sm">
                                This story requires specific customizations for different clients.
                              </p>
                            </div>

                            {story.customization_type && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-3">Customization Type</h4>
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                  <span className="text-blue-800 font-medium">{story.customization_type}</span>
                                </div>
                              </div>
                            )}

                            {story.client_specific_requirements && story.client_specific_requirements.length > 0 && (
                              <div>
                                <h4 className="font-semibold text-gray-900 mb-4">
                                  Client-Specific Requirements ({story.client_specific_requirements.length})
                                </h4>
                                <div className="space-y-3">
                                  {story.client_specific_requirements.map((req, idx) => (
                                    <div key={idx} className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                      <p className="text-purple-800">{req}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStoriesView;
