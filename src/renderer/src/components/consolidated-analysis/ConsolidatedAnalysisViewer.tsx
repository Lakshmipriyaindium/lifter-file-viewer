import React, { useState, useMemo } from 'react';
import { 
  ChevronDown, ChevronRight, Activity, GitBranch, Users, FileCode, 
  AlertCircle, CheckCircle, Database, Server, Shield,
  BookOpen, Target, Tag, Clock, ArrowRight, Info, Search, 
  Download, TrendingUp, Settings
} from 'lucide-react';
import { FeatureAnalysisData, UserStory, BusinessRule, NodeLevelRule, FlowBusinessRules} from './types';

const ConsolidatedAnalysisViewer: React.FC<{ data: FeatureAnalysisData }> = ( { data } ) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    flows: true,
    features: false,
    stories: false,
    rules: false
  });
  
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFlowTabs, setActiveFlowTabs] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState<Record<string, number>>({
    flows: 1,
    features: 1,
    stories: 1,
    rules: 1
  });
  const [itemsPerPage] = useState(5); // Show 5 items per page
  const [showAll, setShowAll] = useState<Record<string, boolean>>({
    flows: false,
    features: false,
    stories: false,
    rules: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleItem = (itemId: string) => {
    setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const setActiveTab = (itemId: string, tabName: string) => {
    setActiveFlowTabs(prev => ({ ...prev, [itemId]: tabName }));
  };

  const getActiveTab = (itemId: string) => {
    return activeFlowTabs[itemId] || 'overview';
  };

  const toggleShowAll = (section: string) => {
    setShowAll(prev => ({ ...prev, [section]: !prev[section] }));
    setCurrentPage(prev => ({ ...prev, [section]: 1 }));
  };

  const getPaginatedItems = <T,>(items: T[], section: string): { paginatedItems: T[], totalPages: number, hasMore: boolean } => {
    if (showAll[section]) {
      return { paginatedItems: items, totalPages: 1, hasMore: false };
    }
    
    const startIndex = (currentPage[section] - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const hasMore = items.length > itemsPerPage;
    
    return { paginatedItems, totalPages, hasMore };
  };

  const changePage = (section: string, page: number) => {
    setCurrentPage(prev => ({ ...prev, [section]: page }));
  };

  // Utility functions
  const getFlowTypeColor = (type: string) => {
    switch (type) {
      case 'user_flow': return 'bg-blue-100 text-blue-800';
      case 'business_flow': return 'bg-green-100 text-green-800';
      case 'technical_flow': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getComplexityColor = (score: number) => {
    if (score <= 2) return 'text-green-600';
    if (score <= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'identified': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter data based on search
  const filteredFlows = useMemo(() => {
    if (!searchTerm) return data?.flows || [];
    const term = searchTerm.toLowerCase();
    return data.flows.filter(flow =>
      flow.flow_name.toLowerCase().includes(term) ||
      flow.description.toLowerCase().includes(term) ||
      flow.purpose.toLowerCase().includes(term)
    );
  }, [searchTerm, data?.flows]);

  const filteredFeatures = useMemo(() => {
    if (!searchTerm) return data?.features || [];
    const term = searchTerm.toLowerCase();
    return data.features.filter(feature =>
      feature.title.toLowerCase().includes(term) ||
      feature.description.toLowerCase().includes(term) ||
      feature.business_value.toLowerCase().includes(term)
    );
  }, [searchTerm, data?.features]);

  const filteredStories = useMemo(() => {
    if (!searchTerm) return data?.user_stories || [];
    const term = searchTerm.toLowerCase();
    return data.user_stories.filter(story =>
      story.title.toLowerCase().includes(term) ||
      story.narrative.toLowerCase().includes(term) ||
      story.as_a.toLowerCase().includes(term)
    );
  }, [searchTerm, data?.user_stories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-lg border-b-4 border-[#fb851e]">
        <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <div className="w-10 h-10 bg-[#fb851e] rounded-lg flex items-center justify-center">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                LIFTR Feature Analysis
              </h1>
              <p className="mt-2 text-gray-600">Legacy Code Analysis & Feature Extraction</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-[#fb851e] text-white rounded-lg hover:bg-[#e97517] transition-all shadow-md hover:shadow-lg">
                <Download className="w-5 h-5" />
                Export Analysis
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search flows, features, stories, or business rules..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fb851e] focus:border-transparent text-sm"
            />
          </div>
        </div>

        {/* Overview Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full px-6 py-4 bg-gradient-to-r from-[#fb851e] to-[#ff9642] text-white flex items-center justify-between hover:from-[#e97517] hover:to-[#ff8530] transition-all"
          >
            <span className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Analysis Overview
            </span>
            {expandedSections.overview ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.overview && (
            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-500">
                  <p className="text-sm text-blue-600 font-medium">Total Nodes</p>
                  <p className="text-2xl font-bold text-blue-900">{data?.summary?.total_nodes || 0}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-sm text-green-600 font-medium">Total Flows</p>
                  <p className="text-2xl font-bold text-green-900">{data?.summary?.total_flows || 0}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-500">
                  <p className="text-sm text-purple-600 font-medium">Features</p>
                  <p className="text-2xl font-bold text-purple-900">{data?.features?.length || 0}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                  <p className="text-sm text-orange-600 font-medium">User Stories</p>
                  <p className="text-2xl font-bold text-orange-900">{data?.user_stories?.length || 0}</p>
                </div>
              </div>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Graph Metrics</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Density</span>
                      <span className="font-medium">{((data?.graph_metrics?.density || 0) * 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Is DAG</span>
                      <span className="font-medium">
                        {data?.graph_metrics?.is_dag ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entry Points</span>
                      <span className="font-medium">{data?.graph_metrics?.entry_points || 0}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Analysis Details</h3>
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Language:</span> {data?.metadata?.language?.toUpperCase()}</p>
                    <p><span className="font-medium">LLM Analysis:</span> {data?.metadata?.use_llm ? 'Enabled' : 'Disabled'}</p>
                    <p><span className="font-medium">Timestamp:</span> {new Date(data?.metadata?.timestamp || '').toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Flows Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('flows')}
            className="w-full px-6 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white flex items-center justify-between hover:from-gray-600 hover:to-gray-800 transition-all"
          >
            <span className="text-lg font-semibold flex items-center gap-2">
              <GitBranch className="w-5 h-5" />
              Business Flows ({filteredFlows.length})
            </span>
            {expandedSections.flows ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.flows && (
            <div className="p-6">
              {filteredFlows.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-gray-600">
                      Showing {showAll.flows ? filteredFlows.length : Math.min(itemsPerPage, filteredFlows.length)} of {filteredFlows.length} flows
                    </p>
                    {filteredFlows.length > itemsPerPage && (
                      <button
                        onClick={() => toggleShowAll('flows')}
                        className="text-sm text-[#fb851e] hover:text-[#e97517] font-medium"
                      >
                        {showAll.flows ? 'Show Less' : `Show All (${filteredFlows.length})`}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {getPaginatedItems(filteredFlows, 'flows').paginatedItems.map((flow) => {
                const activeTab = getActiveTab(flow.flow_id);
                
                return (
                  <div key={flow.flow_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Flow Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getFlowTypeColor(flow.flow_type)}`}>
                          {flow.flow_type.replace('_', ' ')}
                        </div>
                        <span className="font-medium text-gray-900">{flow.flow_name}</span>
                        <span className="text-sm text-gray-500">({flow.total_steps} steps)</span>
                        <div className={`text-sm font-semibold ${getComplexityColor(flow.complexity_score)}`}>
                          Complexity: {flow.complexity_score}
                        </div>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b">
                      <button
                        onClick={() => setActiveTab(flow.flow_id, 'overview')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'overview' 
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Activity className="w-4 h-4" />
                          Overview
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab(flow.flow_id, 'steps')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'steps' 
                            ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          Flow Steps
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab(flow.flow_id, 'rules')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'rules' 
                            ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Business Rules
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 bg-white">
                      {activeTab === 'overview' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                            <p className="text-gray-600">{flow.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Purpose</h4>
                            <p className="text-gray-600">{flow.purpose}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-center mb-1">
                                {flow.has_error_handling ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">Error Handling</span>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-center mb-1">
                                {flow.has_transaction_management ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-red-600" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">Transactions</span>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-center mb-1">
                                {flow.is_idempotent ? (
                                  <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">Idempotent</span>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded">
                              <div className="flex items-center justify-center mb-1">
                                {flow.is_async ? (
                                  <CheckCircle className="w-5 h-5 text-blue-600" />
                                ) : (
                                  <AlertCircle className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                              <span className="text-xs text-gray-600">Async</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'steps' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Flow Execution Steps</h4>
                          <div className="space-y-4">
                            {flow.steps.map((step, index) => (
                              <div key={step.step_id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start gap-3">
                                  <div className="w-8 h-8 bg-[#fb851e] text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium text-gray-900 mb-1">{step.node_name}</h5>
                                    <p className="text-sm text-gray-600 mb-2">{step.action}</p>
                                    {step.description && (
                                      <p className="text-sm text-gray-500 mb-2">{step.description}</p>
                                    )}
                                    
                                    {step.business_rules && step.business_rules.length > 0 && (
                                      <div className="mt-3">
                                        <h6 className="text-xs font-medium text-gray-700 mb-1">Business Rules:</h6>
                                        <ul className="list-disc list-inside space-y-1">
                                          {step.business_rules.map((rule) => (
                                            <li key={`${step.step_id}-business-rule-${rule}`} className="text-xs text-gray-600">{rule}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    <div className="mt-3 flex gap-4 text-xs">
                                      {step.input_data && step.input_data.length > 0 && (
                                        <div>
                                          <span className="font-medium text-gray-700">Input:</span>
                                          <span className="ml-1 text-gray-600">{step.input_data.join(', ')}</span>
                                        </div>
                                      )}
                                      {step.output_data && step.output_data.length > 0 && (
                                        <div>
                                          <span className="font-medium text-gray-700">Output:</span>
                                          <span className="ml-1 text-gray-600">{step.output_data.join(', ')}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeTab === 'rules' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Applied Business Rules</h4>
                          {flow.business_rules_applied && flow.business_rules_applied.length > 0 ? (
                            <ul className="space-y-3">
                              {flow.business_rules_applied.map((rule) => (
                                <li key={`${flow.flow_id}-applied-rule-${rule}`} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                  <Shield className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{rule}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-gray-500 italic">No specific business rules identified for this flow.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
                    })}
                  </div>
                  
                  {/* Pagination for Flows */}
                  {!showAll.flows && getPaginatedItems(filteredFlows, 'flows').totalPages > 1 && (
                    <div className="mt-6 flex justify-center items-center gap-2">
                      <button
                        onClick={() => changePage('flows', Math.max(1, currentPage.flows - 1))}
                        disabled={currentPage.flows === 1}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Previous
                      </button>
                      
                      <div className="flex gap-1">
                        {Array.from({ length: getPaginatedItems(filteredFlows, 'flows').totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => changePage('flows', page)}
                            className={`px-3 py-2 text-sm rounded-lg ${
                              currentPage.flows === page
                                ? 'bg-[#fb851e] text-white'
                                : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={() => changePage('flows', Math.min(getPaginatedItems(filteredFlows, 'flows').totalPages, currentPage.flows + 1))}
                        disabled={currentPage.flows === getPaginatedItems(filteredFlows, 'flows').totalPages}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <GitBranch className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No flows found matching your search criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('features')}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex items-center justify-between hover:from-blue-600 hover:to-blue-800 transition-all"
          >
            <span className="text-lg font-semibold flex items-center gap-2">
              <FileCode className="w-5 h-5" />
              Features ({filteredFeatures.length})
            </span>
            {expandedSections.features ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.features && (
            <div className="p-6">
              {filteredFeatures.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-6">
                    <p className="text-sm text-gray-600">
                      Showing {showAll.features ? filteredFeatures.length : Math.min(itemsPerPage, filteredFeatures.length)} of {filteredFeatures.length} features
                    </p>
                    {filteredFeatures.length > itemsPerPage && (
                      <button
                        onClick={() => toggleShowAll('features')}
                        className="text-sm text-[#fb851e] hover:text-[#e97517] font-medium"
                      >
                        {showAll.features ? 'Show Less' : `Show All (${filteredFeatures.length})`}
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    {getPaginatedItems(filteredFeatures, 'features').paginatedItems.map((feature) => {
                const activeTab = getActiveTab(feature.feature_id);
                
                return (
                  <div key={feature.feature_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Feature Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(feature.priority)}`}>
                          {feature.priority}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(feature.status)}`}>
                          {feature.status}
                        </div>
                        <span className="font-medium text-gray-900">{feature.title}</span>
                        <span className="text-sm text-gray-500 capitalize">({feature.complexity})</span>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b">
                      <button
                        onClick={() => setActiveTab(feature.feature_id, 'overview')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'overview' 
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Overview
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab(feature.feature_id, 'capabilities')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'capabilities' 
                            ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Capabilities
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab(feature.feature_id, 'rules')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'rules' 
                            ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="w-4 h-4" />
                          Rules & Validations
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 bg-white">
                      {activeTab === 'overview' && (
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                              <Target className="w-4 h-4 mr-2 text-[#fb851e]" />
                              Description
                            </h4>
                            <p className="text-gray-600">{feature.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Business Value</h4>
                            <p className="text-gray-600">{feature.business_value}</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-2">Category & Priority</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Category</span>
                                  <span className="font-medium capitalize">{feature.category}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Priority</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(feature.priority)}`}>
                                    {feature.priority}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Complexity</span>
                                  <span className="font-medium capitalize">{feature.complexity}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status</span>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(feature.status)}`}>
                                    {feature.status}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h5 className="font-medium text-gray-900 mb-2">Technical Details</h5>
                              <div className="space-y-2">
                                <div>
                                  <span className="text-gray-600 text-sm">Technologies:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {feature.technologies_used?.map((tech) => (
                                      <span key={`${feature.feature_id}-technology-${tech}`} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                        {tech}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-600 text-sm">User Roles:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {feature.user_roles?.map((role) => (
                                      <span key={`${feature.feature_id}-user-role-${role}`} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                        {role}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'capabilities' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Feature Capabilities</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {feature.capabilities?.map((capability) => (
                                <div key={`${feature.feature_id}-capability-${capability}`} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                                  <span className="text-sm text-gray-700">{capability}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">User Actions</h4>
                              <ul className="space-y-2">
                                {feature.user_actions?.map((action) => (
                                  <li key={`${feature.feature_id}-user-action-${action}`} className="flex items-start gap-3">
                                    <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">System Actions</h4>
                              <ul className="space-y-2">
                                {feature.system_actions?.map((action) => (
                                  <li key={`${feature.feature_id}-system-action-${action}`} className="flex items-start gap-3">
                                    <Server className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Data Entities</h4>
                            <div className="flex flex-wrap gap-2">
                              {feature.data_entities_used?.map((entity) => (
                                <span key={`${feature.feature_id}-data-entity-${entity}`} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                                  <Database className="w-3 h-3 inline mr-1" />
                                  {entity}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {activeTab === 'rules' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <Shield className="w-4 h-4 mr-2 text-purple-600" />
                              Business Rules
                            </h4>
                            <div className="space-y-3">
                              {feature.business_rules?.map((rule) => (
                                <div key={`${feature.feature_id}-business-rule-${rule}`} className="p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                                  <p className="text-sm text-gray-700">{rule}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-2 text-yellow-600" />
                              Validations
                            </h4>
                            <div className="space-y-3">
                              {feature.validations?.map((validation) => (
                                <div key={`${feature.feature_id}-validation-${validation}`} className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                                  <p className="text-sm text-gray-700">{validation}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {feature.integration_points && feature.integration_points.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Integration Points</h4>
                              <ul className="space-y-2">
                                {feature.integration_points.map((point) => (
                                  <li key={`${feature.feature_id}-integration-point-${point}`} className="flex items-start gap-3">
                                    <ArrowRight className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                    <span className="text-sm text-gray-600">{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No features found</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Stories Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('stories')}
            className="w-full px-6 py-4 bg-gradient-to-r from-green-700 to-green-900 text-white flex items-center justify-between hover:from-green-600 hover:to-green-800 transition-all"
          >
            <span className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              User Stories ({filteredStories.length})
            </span>
            {expandedSections.stories ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.stories && (
            <div className="p-6">
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {Math.min((currentPage.stories - 1) * itemsPerPage + 1, filteredStories.length)} - {Math.min(currentPage.stories * itemsPerPage, filteredStories.length)} of {filteredStories.length} stories
                  </span>
                  <button
                    onClick={() => toggleShowAll('stories')}
                    className="text-sm text-[#fb851e] hover:text-orange-600 font-medium"
                  >
                    {showAll.stories ? 'Show Less' : 'Show All'}
                  </button>
                </div>
                {!showAll.stories && getPaginatedItems(filteredStories, 'stories').totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changePage('stories', currentPage.stories - 1)}
                      disabled={currentPage.stories === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: getPaginatedItems(filteredStories, 'stories').totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => changePage('stories', page)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage.stories === page
                              ? 'bg-[#fb851e] text-white border-[#fb851e]'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => changePage('stories', Math.min(getPaginatedItems(filteredStories, 'stories').totalPages, currentPage.stories + 1))}
                      disabled={currentPage.stories === getPaginatedItems(filteredStories, 'stories').totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {getPaginatedItems(filteredStories, 'stories').paginatedItems.map((story: UserStory) => {
                const activeTab = getActiveTab(story.story_id);
                
                return (
                  <div key={story.story_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Story Header */}
                    <div className="px-4 py-3 bg-gray-50 border-b">
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(story.priority)}`}>
                          {story.priority}
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(story.status)}`}>
                          {story.status}
                        </div>
                        <span className="font-medium text-gray-900">{story.title}</span>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {story.story_points} pts
                        </div>
                      </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex border-b">
                      <button
                        onClick={() => setActiveTab(story.story_id, 'story')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'story' 
                            ? 'bg-green-50 text-green-700 border-b-2 border-green-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4" />
                          User Story
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab(story.story_id, 'criteria')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'criteria' 
                            ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Acceptance Criteria
                        </span>
                      </button>
                      <button
                        onClick={() => setActiveTab(story.story_id, 'technical')}
                        className={`px-6 py-3 text-sm font-medium transition-all ${
                          activeTab === 'technical' 
                            ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-500' 
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Settings className="w-4 h-4" />
                          Technical Details
                        </span>
                      </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 bg-white">
                      {activeTab === 'story' && (
                        <div className="space-y-4">
                          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                            <h4 className="font-semibold text-blue-900 mb-3">User Story</h4>
                            <div className="space-y-2">
                              <p className="text-blue-900">
                                <span className="font-medium">As a</span> <span className="text-[#fb851e] font-semibold">{story.as_a}</span>
                              </p>
                              <p className="text-blue-800">
                                <span className="font-medium">I want</span> {story.i_want}
                              </p>
                              <p className="text-blue-700">
                                <span className="font-medium">So that</span> {story.so_that}
                              </p>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Narrative</h4>
                            <p className="text-gray-600">{story.narrative}</p>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-gray-900">{story.story_points}</div>
                              <div className="text-xs text-gray-600">Story Points</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className={`text-lg font-bold ${getPriorityColor(story.priority).replace('bg-', 'text-').replace('-100', '-700')}`}>
                                {story.priority?.toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-600">Priority</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className="text-lg font-bold text-gray-900 capitalize">{story.complexity}</div>
                              <div className="text-xs text-gray-600">Complexity</div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 text-center">
                              <div className={`text-lg font-bold ${getStatusColor(story.status).replace('bg-', 'text-').replace('-100', '-700')}`}>
                                {story.status?.toUpperCase()}
                              </div>
                              <div className="text-xs text-gray-600">Status</div>
                            </div>
                          </div>
                          
                          {story.tags && story.tags.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-2">Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {story.tags.map((tag: string) => (
                                  <span key={`${story.story_id}-tag-${tag}`} className="px-3 py-1 bg-[#fb851e] bg-opacity-10 text-[#fb851e] rounded-full text-sm">
                                    <Tag className="w-3 h-3 inline mr-1" />
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'criteria' && (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 mb-4">Acceptance Criteria</h4>
                          <div className="space-y-3">
                       
                            {story.acceptance_criteria?.map((criteria: string, idx: number) => (
                              <div key={`${story.story_id}-acceptance-criteria-${criteria}`} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                                  {idx + 1}
                                </div>
                                <p className="text-sm text-gray-700">{criteria}</p>
                              </div>
                            ))}
                          </div>
                          
                          {story.assumptions && story.assumptions.length > 0 && (
                            <div className="mt-6">
                              <h4 className="font-semibold text-gray-900 mb-3">Assumptions</h4>
                              <div className="space-y-2">
                           
                                {story.assumptions.map((assumption: string) => (
                                  <div key={`${story.story_id}-assumption-${assumption}`} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                                    <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-gray-700">{assumption}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'technical' && (
                        <div className="space-y-6">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Technical Requirements</h4>
                            <div className="space-y-3">
                    
                              {story.technical_requirements?.map((req: string) => (
                                <div key={`${story.story_id}-technical-requirement-${req}`} className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                                  <Settings className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-700">{req}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-4">Test Scenarios</h4>
                            <div className="space-y-3">
                         
                              {story.test_scenarios?.map((test: string) => (
                                <div key={`${story.story_id}-test-scenario-${test}`} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <p className="text-sm text-gray-700">{test}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {story.related_features && story.related_features.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Related Features</h4>
                              <div className="flex flex-wrap gap-2">
                          
                                {story.related_features.map((feature: string) => (
                                  <span key={`${story.story_id}-related-feature-${feature}`} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                    {feature}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {story.related_flows && story.related_flows.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Related Flows</h4>
                              <div className="flex flex-wrap gap-2">
                      
                                {story.related_flows.map((flow: string) => (
                                  <span key={`${story.story_id}-related-flow-${flow}`} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                    {flow}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              </div>
            </div>
          )}
        </div>

        {/* Business Rules Section */}
        <div className="mb-6 bg-white rounded-xl shadow-md overflow-hidden">
          <button
            onClick={() => toggleSection('rules')}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-700 to-purple-900 text-white flex items-center justify-between hover:from-purple-600 hover:to-purple-800 transition-all"
          >
            <span className="text-lg font-semibold flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Business Rules ({data?.business_rules?.length || 0})
            </span>
            {expandedSections.rules ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
          
          {expandedSections.rules && (
            <div className="p-6">
              {/* Pagination Controls */}
              <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Showing {Math.min((currentPage.rules - 1) * itemsPerPage + 1, data?.business_rules?.length || 0)} - {Math.min(currentPage.rules * itemsPerPage, data?.business_rules?.length || 0)} of {data?.business_rules?.length || 0} rule sets
                  </span>
                  <button
                    onClick={() => toggleShowAll('rules')}
                    className="text-sm text-[#fb851e] hover:text-orange-600 font-medium"
                  >
                    {showAll.rules ? 'Show Less' : 'Show All'}
                  </button>
                </div>
                {!showAll.rules && getPaginatedItems(data?.business_rules || [], 'rules').totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => changePage('rules', currentPage.rules - 1)}
                      disabled={currentPage.rules === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Previous
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {Array.from({ length: getPaginatedItems(data?.business_rules || [], 'rules').totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => changePage('rules', page)}
                          className={`px-3 py-1 text-sm border rounded ${
                            currentPage.rules === page
                              ? 'bg-[#fb851e] text-white border-[#fb851e]'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => changePage('rules', Math.min(getPaginatedItems(data?.business_rules || [], 'rules').totalPages, currentPage.rules + 1))}
                      disabled={currentPage.rules === getPaginatedItems(data?.business_rules || [], 'rules').totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
              
              <div className="space-y-6">
                {getPaginatedItems(data?.business_rules || [], 'rules').paginatedItems.map((ruleSet: FlowBusinessRules) => (
                <div key={ruleSet.flow_id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <button
                    onClick={() => toggleItem(ruleSet.flow_id)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-900">{ruleSet.flow_name}</h3>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span>Total Rules: <span className="font-semibold">{ruleSet.rule_complexity?.total_rules || 0}</span></span>
                        <span>High Confidence: <span className="font-semibold">{ruleSet.rule_complexity?.high_confidence_rules || 0}</span></span>
                        <span className={`font-semibold ${getComplexityColor(ruleSet.rule_complexity?.complexity_score || 0)}`}>
                          Complexity: {ruleSet.rule_complexity?.complexity_score || 0}
                        </span>
                      </div>
                    </div>
                    {expandedItems[ruleSet.flow_id] ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>
                  
                  {expandedItems[ruleSet.flow_id] && (
                    <div className="p-6 bg-white space-y-6">
                      {/* Node Level Rules */}
                      {ruleSet.node_level_rules && ruleSet.node_level_rules.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                            <Info className="w-4 h-4 mr-2 text-[#fb851e]" />
                            Node Level Rules
                          </h4>
                          <div className="space-y-4">
                      
                            {ruleSet.node_level_rules.map((nodeRule: NodeLevelRule) => (
                              <div key={`${ruleSet.flow_id}-node-rule-${nodeRule.node_name}`} className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <div className="flex items-center gap-2 mb-3">
                                  <h5 className="font-medium text-blue-900">{nodeRule.node_name}</h5>
                                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">{nodeRule.node_type}</span>
                                </div>
                                <ul className="space-y-2">
                               
                                  {nodeRule.rules?.map((rule: string) => (
                                    <li key={`${ruleSet.flow_id}-${nodeRule.node_name}-rule-${rule}`} className="flex items-start gap-3">
                                      <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                      <span className="text-sm text-blue-800">{rule}</span>
                                    </li>
                                  ))}
                                </ul>
                                {nodeRule.context && (
                                  <p className="mt-3 text-xs text-blue-600 italic bg-blue-100 p-2 rounded">{nodeRule.context}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flow Level Rules */}
                      {ruleSet.flow_level_rules && ruleSet.flow_level_rules.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Flow Level Rules</h4>
                          <div className="space-y-3">
                            {ruleSet.flow_level_rules.map((rule: BusinessRule) => (
                              <div key={`${ruleSet.flow_id}-flow-level-rule-${rule.rule}`} className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm text-green-800">{rule.rule}</p>
                                    <div className="mt-2 flex items-center gap-4 text-xs text-green-600">
                                      <span>Source: {rule.source}</span>
                                      <span>Scope: {rule.scope}</span>
                                      <span className={`px-2 py-1 rounded ${rule.confidence === 'high' ? 'bg-green-200' : 'bg-yellow-200'}`}>
                                        {rule.confidence} confidence
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rule Categories */}
                      {ruleSet.rule_categories && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Rule Categories</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {Object.entries(ruleSet.rule_categories).map(([category, rules]: [string, any]) => {
                              if (!rules || (Array.isArray(rules) && rules.length === 0)) return null;
                              
                              const getCategoryColor = (cat: string) => {
                                switch (cat) {
                                  case 'validation': return 'border-yellow-500 bg-yellow-50';
                                  case 'authorization': return 'border-red-500 bg-red-50';
                                  case 'business_logic': return 'border-blue-500 bg-blue-50';
                                  case 'data_integrity': return 'border-green-500 bg-green-50';
                                  case 'workflow': return 'border-purple-500 bg-purple-50';
                                  case 'integration': return 'border-indigo-500 bg-indigo-50';
                                  default: return 'border-gray-500 bg-gray-50';
                                }
                              };
                              
                              return (
                                <div key={category} className={`p-4 rounded-lg border-l-4 ${getCategoryColor(category)}`}>
                                  <h5 className="font-medium text-gray-900 mb-2 capitalize flex items-center gap-2">
                                    {category.replace('_', ' ')}
                                    <span className="text-xs bg-[#fb851e] bg-opacity-10 text-[#fb851e] px-2 py-1 rounded">
                                      {Array.isArray(rules) ? rules.length : 0}
                                    </span>
                                  </h5>
                                  <ul className="space-y-2">
                                    {Array.isArray(rules) && rules.map((rule: BusinessRule) => {
                                      const ruleText = typeof rule === 'string' ? rule : rule.rule;
                                      return (
                                        <li key={`${ruleSet.flow_id}-${category}-rule-${ruleText}`} className="text-sm text-gray-700 flex items-start gap-2">
                                          <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0 text-gray-400" />
                                          <span>{ruleText}</span>
                                        </li>
                                      );
                                    })}
                                  </ul>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Synthesized Rules */}
                      {ruleSet.synthesized_rules && ruleSet.synthesized_rules.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-4">Synthesized Rules</h4>
                          <div className="space-y-3">
                            {ruleSet.synthesized_rules.map((rule: BusinessRule) => (
                              <div key={`${ruleSet.flow_id}-synthesized-rule-${rule.rule}`} className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-start gap-3">
                                  <Target className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                  <div className="flex-1">
                                    <p className="text-sm text-purple-800">{rule.rule}</p>
                                    <div className="mt-2 flex items-center gap-4 text-xs text-purple-600">
                                      {rule.node_name && <span>Node: {rule.node_name}</span>}
                                      <span>Source: {rule.source}</span>
                                      <span>Scope: {rule.scope}</span>
                                      <span className={`px-2 py-1 rounded ${rule.confidence === 'high' ? 'bg-purple-200' : 'bg-yellow-200'}`}>
                                        {rule.confidence} confidence
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsolidatedAnalysisViewer;
