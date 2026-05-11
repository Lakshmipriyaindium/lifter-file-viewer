import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  X,
  AlertCircle,
  CheckCircle,
  Code,
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  Shield,
  Zap,
  Target,
  Layers,
  Database,
  Activity,
  BarChart3
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { 
  ClientCustomizationNodeAnalysisData,
  CustomizationNode,
  BusinessRule,
  FilterState,
  SortField,
  SortDirection,
  AggregatedStats,
  ClientLLMAnalysis
} from './type';

export interface NodeAnalysisVisualizerProps {
  data: ClientCustomizationNodeAnalysisData;
}

const NodeAnalysisVisualizer: React.FC<NodeAnalysisVisualizerProps> = ({ data }) => {
  // Convert object to array for easier processing
  const nodesArray = useMemo(() => Object.values(data), [data]);

  // State management
  const [filters, setFilters] = useState<FilterState>({
    complexity: 'all',
    priority: 'all',
    category: 'all',
    riskLevel: 'all',
    requiresReview: 'all',
    chainFilter: 'all',
    searchTerm: '',
    confidenceMin: 0
  });
  
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedCustomizations, setExpandedCustomizations] = useState<Set<string>>(new Set());
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'chains' | 'patterns'>('overview');
  
  const alphabeticalSort = (a: string, b: string) => a.localeCompare(b);

  const increment = (map: Record<string, number>, key: string) => {
    map[key] = (map[key] || 0) + 1;
  };
  const calculateAverageConfidence = (totalConfidence: number,confidenceCount: number): number => {
    if (confidenceCount > 0) {
      return totalConfidence / confidenceCount;
    }
  return 0;
  };

  // Calculate aggregated statistics
  const stats = useMemo<AggregatedStats>(() => {
    const riskDist: Record<string, number> = {};
    const complexityDist: Record<string, number> = {};
    const categoryDist: Record<string, number> = {};
    const chainDist: Record<string, number> = {};
    const typeDist: Record<string, number> = {};
    const chains = new Set<string>();
    
    let totalCustomizations = 0;
    let totalBusinessRules = 0;
    let highConfidenceCount = 0;
    let requiresReviewCount = 0;
    let totalConfidence = 0;
    let confidenceCount = 0;

    for(const node of nodesArray) {
      totalCustomizations += node.total_customizations;
      highConfidenceCount += node.high_confidence_customizations;
      increment(riskDist, node.overall_risk)
      increment(complexityDist, node.maintenance_complexity)
      
      for(const chain of node.chains_involved) { chains.add(chain) }
      for(const type of node.customization_types) {
        increment(typeDist, type)
      }
      
      for(const custom of node.detected_customizations) {
        if (custom.requires_review) requiresReviewCount++;
        totalConfidence += custom.confidence_score;
        confidenceCount++;
        increment(chainDist, custom.chain_identifier);
      }
      
      for(const analysis of Object.values(node.llm_analyses_by_client)) {
        totalBusinessRules += analysis.business_rules.length;
        for(const rule of analysis.business_rules) {
          increment(categoryDist, rule.rule_category)
        }
      }
    }

    return {
      totalNodes: nodesArray.length,
      totalCustomizations,
      totalBusinessRules,
      highConfidenceCount,
      requiresReviewCount,
      averageConfidence: calculateAverageConfidence(totalConfidence,confidenceCount),
      uniqueChains: chains,
      riskDistribution: riskDist,
      complexityDistribution: complexityDist,
      categoryDistribution: categoryDist,
      chainDistribution: chainDist,
      typeDistribution: typeDist
    };
  }, [nodesArray]);

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    const complexities = new Set<string>();
    const priorities = new Set<string>();
    const categories = new Set<string>();
    const chains = new Set<string>();
    const risks = new Set<string>();
    
    for(const node of nodesArray) {
      complexities.add(node.maintenance_complexity);
      risks.add(node.overall_risk);
      for(const chain of node.chains_involved) { chains.add(chain) }
      
      for(const analysis of Object.values(node.llm_analyses_by_client)) {
        for(const rule of analysis.business_rules) {
          priorities.add(rule.priority);
          categories.add(rule.rule_category);
        }
      }
    }

    return {
      complexities: Array.from(complexities).sort(alphabeticalSort),
      priorities: Array.from(priorities).sort(alphabeticalSort),
      categories: Array.from(categories).sort(alphabeticalSort),
      chains: Array.from(chains).sort(alphabeticalSort),
      risks: Array.from(risks).sort(alphabeticalSort)
    };
  }, [nodesArray]);

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    let filtered = [...nodesArray];

    // Apply filters
    if (filters.riskLevel !== 'all') {
      filtered = filtered.filter(node => node.overall_risk === filters.riskLevel);
    }

    if (filters.complexity !== 'all') {
      filtered = filtered.filter(node => node.maintenance_complexity === filters.complexity);
    }

    if (filters.chainFilter !== 'all') {
      filtered = filtered.filter(node => node.chains_involved.includes(filters.chainFilter as string));
    }

    if (filters.requiresReview !== 'all') {
      const requiresReview = filters.requiresReview === 'true';
      filtered = filtered.filter(node => 
        node.detected_customizations.some(c => c.requires_review === requiresReview)
      );
    }

    const confidenceMin = filters.confidenceMin ?? 0;
    if (confidenceMin > 0) {
      filtered = filtered.filter(node =>
        node.pattern_analysis.average_confidence >= confidenceMin / 100
      );
    }

    const matchesFilter = (rule: BusinessRule, filters: FilterState): boolean => {
      const matchesPriority = filters.priority === 'all' || rule.priority === filters.priority;
      const matchesCategory = filters.category === 'all' || rule.rule_category === filters.category;
      return matchesPriority && matchesCategory
    }
    const analysisMatchesFilters = (analysis: ClientLLMAnalysis,filters: FilterState): boolean => {
      return analysis.business_rules.some(rule =>
        matchesFilter(rule, filters)
      );
    };
    if (filters.priority !== 'all' || filters.category !== 'all') {
      filtered = filtered.filter(node => {
        return Object.values(node.llm_analyses_by_client).some(analysis =>
          analysisMatchesFilters(analysis, filters)
        );
      });
    }

    const ruleNameMatchesTerm = (rule: BusinessRule, term: string): boolean => rule.rule_name.toLowerCase().includes(term);
    const analysisMatchesTerm = (analysis: ClientLLMAnalysis, term: string): boolean => {
      return (
        analysis.client_name.toLowerCase().includes(term) ||
        analysis.business_rules.some(rule =>
          ruleNameMatchesTerm(rule, term)
        )
      );
    };
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(node =>
        node.node_name.toLowerCase().includes(term) ||
        node.file_path.toLowerCase().includes(term) ||
        node.customization_summary.toLowerCase().includes(term) ||
        node.detected_customizations.some(c => 
          c.customization_id.toLowerCase().includes(term) ||
          c.chain_name.toLowerCase().includes(term) ||
          c.condition_code.toLowerCase().includes(term)
        ) ||
        Object.values(node.llm_analyses_by_client).some(analysis => analysisMatchesTerm(analysis, term))
      );
    }

    // Apply sorting
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        let aVal: string | number;
        let bVal: string | number;

        switch (sortField) {
          case 'node_name':
            aVal = a.node_name;
            bVal = b.node_name;
            break;
          case 'total_customizations':
            aVal = a.total_customizations;
            bVal = b.total_customizations;
            break;
          case 'overall_risk':
            aVal = a.overall_risk;
            bVal = b.overall_risk;
            break;
          case 'average_confidence':
            aVal = a.pattern_analysis.average_confidence;
            bVal = b.pattern_analysis.average_confidence;
            break;
          case 'chains_count':
            aVal = a.chains_involved.length;
            bVal = b.chains_involved.length;
            break;
          default:
            return 0;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        return 0;
      });
    }

    return filtered;
  }, [nodesArray, filters, sortField, sortDirection]);

  // Group data by chain
  const dataByChain = useMemo(() => {
    const byChain: Record<string, {
      nodes: CustomizationNode[];
      totalCustomizations: number;
      businessRules: BusinessRule[];
      riskLevel: string;
      patterns: string[];
    }> = {};

    for(const node of nodesArray) {
      for(const [chainId, analysis] of Object.entries(node.llm_analyses_by_client)) {
        if (!byChain[chainId]) {
          byChain[chainId] = {
            nodes: [],
            totalCustomizations: 0,
            businessRules: [],
            riskLevel: analysis.risk_assessment,
            patterns: analysis.customization_patterns
          };
        }
        
        byChain[chainId].nodes.push(node);
        byChain[chainId].totalCustomizations += node.detected_customizations.filter(
          c => c.chain_identifier === chainId
        ).length;
        byChain[chainId].businessRules.push(...analysis.business_rules);
      }
    }

    return byChain;
  }, [nodesArray]);

  // Toggle functions
  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const toggleCustomization = (customId: string) => {
    const newExpanded = new Set(expandedCustomizations);
    if (newExpanded.has(customId)) {
      newExpanded.delete(customId);
    } else {
      newExpanded.add(customId);
    }
    setExpandedCustomizations(newExpanded);
  };

  const toggleClient = (clientId: string) => {
    const newExpanded = new Set(expandedClients);
    if (newExpanded.has(clientId)) {
      newExpanded.delete(clientId);
    } else {
      newExpanded.add(clientId);
    }
    setExpandedClients(newExpanded);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      complexity: 'all',
      priority: 'all',
      category: 'all',
      riskLevel: 'all',
      requiresReview: 'all',
      chainFilter: 'all',
      searchTerm: '',
      confidenceMin: 0
    });
    setSortField('none');
    setSortDirection('desc');
  };

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['Node Analysis Summary', ''],
      ['', ''],
      ['Total Nodes', stats.totalNodes],
      ['Total Customizations', stats.totalCustomizations],
      ['Total Business Rules', stats.totalBusinessRules],
      ['High Confidence', stats.highConfidenceCount],
      ['Requires Review', stats.requiresReviewCount],
      ['Average Confidence', `${(stats.averageConfidence * 100).toFixed(2)}%`],
      ['Unique Chains', stats.uniqueChains.size],
      ['', ''],
      ['Risk Distribution', ''],
      ...Object.entries(stats.riskDistribution).map(([k, v]) => [k, v]),
      ['', ''],
      ['Complexity Distribution', ''],
      ...Object.entries(stats.complexityDistribution).map(([k, v]) => [k, v]),
      ['', ''],
      ['Chain Distribution', ''],
      ...Object.entries(stats.chainDistribution).map(([k, v]) => [k, v])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Nodes
    const nodesData = filteredNodes.map(node => ({
      'Node ID': node.node_id,
      'Node Name': node.node_name,
      'File Path': node.file_path,
      'Total Customizations': node.total_customizations,
      'High Confidence': node.high_confidence_customizations,
      'Chains Involved': node.chains_involved.join(', '),
      'Risk Level': node.overall_risk,
      'Complexity': node.maintenance_complexity,
      'Average Confidence': `${(node.pattern_analysis.average_confidence * 100).toFixed(2)}%`,
      'Requires Review': node.pattern_analysis.requires_review_count,
      'Summary': node.customization_summary
    }));
    const wsNodes = XLSX.utils.json_to_sheet(nodesData);
    XLSX.utils.book_append_sheet(wb, wsNodes, 'Nodes');

    // Sheet 3: Customizations
    const customizationsData = filteredNodes.flatMap(node =>
      node.detected_customizations.map(custom => ({
        'Node Name': node.node_name,
        'Customization ID': custom.customization_id,
        'Type': custom.type,
        'Chain ID': custom.chain_identifier,
        'Chain Name': custom.chain_name,
        'Lines': `${custom.line_start}-${custom.line_end}`,
        'Complexity': custom.complexity_level,
        'Confidence': `${(custom.confidence_score * 100).toFixed(0)}%`,
        'Requires Review': custom.requires_review ? 'Yes' : 'No',
        'Condition': custom.condition_code,
        'Code': custom.customization_code.substring(0, 200)
      }))
    );
    const wsCustomizations = XLSX.utils.json_to_sheet(customizationsData);
    XLSX.utils.book_append_sheet(wb, wsCustomizations, 'Customizations');

    // Sheet 4: Business Rules
    const rulesData: unknown[] = [];
    for(const node of filteredNodes) {
      for(const analysis of Object.values(node.llm_analyses_by_client)) {
        for(const rule of analysis.business_rules) {
          rulesData.push({
            'Node Name': node.node_name,
            'Client': analysis.client_name,
            'Rule Name': rule.rule_name,
            'Category': rule.rule_category,
            'Priority': rule.priority,
            'Statement': rule.business_rule_statement,
            'Justification': rule.business_justification,
            'Implementation': rule.implementation_logic,
            'Impact': rule.business_impact,
            'Data Elements': rule.data_elements.join(', ')
          });
        }
      }
    }
    const wsRules = XLSX.utils.json_to_sheet(rulesData);
    XLSX.utils.book_append_sheet(wb, wsRules, 'Business Rules');

    // Auto-size columns
    for(const ws of [wsSummary, wsNodes, wsCustomizations, wsRules]) {
      if (!ws['!ref']) continue;
      const cols = [];
      const range = XLSX.utils.decode_range(ws['!ref']);
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell?.v && String(cell.v).length > maxWidth) {
            const len = String(cell.v).length;
            maxWidth = Math.min(len, 100);
          }
        }
        cols.push({ wch: maxWidth });
      }
      ws['!cols'] = cols;
    }

    XLSX.writeFile(wb, `node_analysis_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Color functions
  const getTabClassName = (tab: string) => {
    return {
      tabClass: activeTab === tab ? 'border-b-2 text-gray-900' : 'text-gray-500 hover:text-gray-700',
      borderClass: activeTab === tab ? '#fb851e' : ''
    }
  }
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'processing': 'bg-blue-100 text-blue-800 border-blue-200',
      'validation': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'compliance': 'bg-purple-100 text-purple-800 border-purple-200',
      'configuration': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'calculation': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskBgColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityColor = (complexity: string) => {
    const colors: Record<string, string> = {
      'simple': 'bg-green-100 text-green-800 border-green-200',
      'moderate': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'complex': 'bg-red-100 text-red-800 border-red-200',
      'high': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[complexity.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getRiskDistributionBgColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high':
        return '#ef4444';
      case 'moderate':
        return '#f59e0b';
      default:
        return '#10b981'
    }
  }
  const getPriorityTextColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600'
      default:
        return 'text-gray-600';
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6" style={{ borderTop: '4px solid #fb851e' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#fb851e' }}>
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Node Customization Analysis
                </h1>
                <p className="text-gray-600 mt-1">
                  {filteredNodes.length} of {stats.totalNodes} nodes • {stats.uniqueChains.size} chains
                </p>
              </div>
            </div>
            <button
              onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors shadow-md"
              style={{ backgroundColor: '#fb851e' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e67819'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fb851e'}
            >
              <Download className="w-4 h-4" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-200">
            <div className="flex flex-wrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium transition-colors ${getTabClassName('overview').tabClass}`}
                style={{borderColor: getTabClassName('overview').borderClass}}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('nodes')}
                className={`px-6 py-3 font-medium transition-colors ${getTabClassName('nodes').tabClass}`}
                style={{borderColor: getTabClassName('nodes').borderClass}}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Nodes ({filteredNodes.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('chains')}
                className={`px-6 py-3 font-medium transition-colors ${getTabClassName('chains').tabClass}`}
                style={{borderColor: getTabClassName('chains').borderClass}}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  By Chain ({Object.keys(dataByChain).length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('patterns')}
                className={`px-6 py-3 font-medium transition-colors ${getTabClassName('patterns').tabClass}`}
                style={{borderColor: getTabClassName('patterns').borderClass}}
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Patterns & Insights
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" style={{ color: '#fb851e' }} />
              <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
                Reset
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showFilters ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by node, chain, customization, or business rule..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                <div>
                  <label htmlFor="risk-level" className="block text-sm font-medium text-gray-700 mb-2">
                    Risk Level
                  </label>
                  <select
                    id="risk-level"
                    value={filters.riskLevel}
                    onChange={(e) => setFilters({ ...filters, riskLevel: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="all">All Risks</option>
                    {uniqueValues.risks.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="complexity" className="block text-sm font-medium text-gray-700 mb-2">
                    Complexity
                  </label>
                  <select
                    id="complexity"
                    value={filters.complexity}
                    onChange={(e) => setFilters({ ...filters, complexity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="all">All Levels</option>
                    {uniqueValues.complexities.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="all">All Priorities</option>
                    {uniqueValues.priorities.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="all">All Categories</option>
                    {uniqueValues.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="chain" className="block text-sm font-medium text-gray-700 mb-2">
                    Chain
                  </label>
                  <select
                    id="chain"
                    value={filters.chainFilter}
                    onChange={(e) => setFilters({ ...filters, chainFilter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2"
                  >
                    <option value="all">All Chains</option>
                    {uniqueValues.chains.map(chain => (
                      <option key={chain} value={chain}>{chain}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Confidence: {filters.confidenceMin}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.confidenceMin}
                    onChange={(e) => setFilters({ ...filters, confidenceMin: Number.parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Nodes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalNodes}</p>
                  </div>
                  <Database className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Customizations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCustomizations}</p>
                  </div>
                  <Code className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Business Rules</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalBusinessRules}</p>
                  </div>
                  <Target className="w-8 h-8 text-green-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Confidence</p>
                    <p className="text-2xl font-bold text-green-600">
                      {(stats.averageConfidence * 100).toFixed(1)}%
                    </p>
                  </div>
                  <Zap className="w-8 h-8 text-yellow-500" />
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">High Confidence</h3>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.highConfidenceCount}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {((stats.highConfidenceCount / stats.totalCustomizations) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Requires Review</h3>
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-yellow-600">{stats.requiresReviewCount}</p>
                <p className="text-xs text-gray-600 mt-1">
                  {((stats.requiresReviewCount / stats.totalCustomizations) * 100).toFixed(1)}% of total
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-gray-700">Unique Chains</h3>
                  <Layers className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.uniqueChains.size}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Client organizations identified
                </p>
              </div>
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Risk Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5" style={{ color: '#fb851e' }} />
                  Risk Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.riskDistribution).map(([risk, count]) => (
                    <div key={risk}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{risk}</span>
                        <span className="text-sm font-bold text-gray-900">{count} nodes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / stats.totalNodes) * 100}%`,
                            backgroundColor: getRiskDistributionBgColor(risk)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Complexity Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" style={{ color: '#fb851e' }} />
                  Complexity Distribution
                </h3>
                <div className="space-y-3">
                  {Object.entries(stats.complexityDistribution).map(([complexity, count]) => (
                    <div key={complexity}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{complexity}</span>
                        <span className="text-sm font-bold text-gray-900">{count} nodes</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / stats.totalNodes) * 100}%`,
                            backgroundColor: '#fb851e'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Category Distribution</h3>
                <div className="space-y-3">
                  {Object.entries(stats.categoryDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([category, count]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / stats.totalBusinessRules) * 100}%`,
                            backgroundColor: '#3b82f6'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chain Distribution */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Top Chains</h3>
                <div className="space-y-3">
                  {Object.entries(stats.chainDistribution)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5)
                    .map(([chain, count]) => (
                    <div key={chain}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{chain}</span>
                        <span className="text-sm font-bold text-gray-900">{count} customizations</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / stats.totalCustomizations) * 100}%`,
                            backgroundColor: '#8b5cf6'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'nodes' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('node_name')}
                    >
                      <div className="flex items-center gap-2">
                        Node Name
                        {sortField === 'node_name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('total_customizations')}
                    >
                      <div className="flex items-center gap-2">
                        Customizations
                        {sortField === 'total_customizations' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('chains_count')}
                    >
                      <div className="flex items-center gap-2">
                        Chains
                        {sortField === 'chains_count' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('overall_risk')}
                    >
                      <div className="flex items-center gap-2">
                        Risk
                        {sortField === 'overall_risk' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('average_confidence')}
                    >
                      <div className="flex items-center gap-2">
                        Confidence
                        {sortField === 'average_confidence' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredNodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No nodes found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredNodes.map((node) => (
                      <React.Fragment key={node.node_id}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleNode(node.node_id)}
                        >
                          <td className="px-6 py-4">
                            {expandedNodes.has(node.node_id) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{node.node_name}</div>
                            <div className="text-xs text-gray-500 font-mono mt-1">
                              {node.file_path.split('/').pop()}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-gray-900">{node.total_customizations}</span>
                              {node.pattern_analysis.requires_review_count > 0 && (
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {node.chains_involved.map(chain => (
                                <span 
                                  key={chain}
                                  className="inline-flex px-2 py-0.5 text-xs font-mono bg-purple-50 text-purple-700 rounded"
                                >
                                  {chain}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded border ${getRiskBgColor(node.overall_risk)}`}>
                              {node.overall_risk}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full"
                                  style={{
                                    width: `${node.pattern_analysis.average_confidence * 100}%`,
                                    backgroundColor: '#10b981'
                                  }}
                                />
                              </div>
                              <span className="text-xs font-semibold text-gray-700">
                                {(node.pattern_analysis.average_confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                        {expandedNodes.has(node.node_id) && (
                          <tr>
                            <td colSpan={6} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-6">
                                {/* Summary */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
                                  <p className="text-sm text-gray-700">{node.customization_summary}</p>
                                </div>

                                {/* Detected Customizations */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Detected Customizations</h4>
                                  <div className="space-y-3">
                                    {node.detected_customizations.map((custom) => (
                                      <div key={custom.customization_id} className="border border-gray-200 rounded-lg">
                                        <button
                                          className="p-3 bg-white cursor-pointer hover:bg-gray-50 transition-colors w-full text-left"
                                          onClick={() => toggleCustomization(custom.customization_id)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              {expandedCustomizations.has(custom.customization_id) ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                              )}
                                              <div>
                                                <span className="text-sm font-mono text-gray-700">
                                                  {custom.customization_id}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                  {custom.chain_identifier} - {custom.chain_name}
                                                </div>
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className={`px-2 py-1 text-xs font-semibold rounded border ${getComplexityColor(custom.complexity_level)}`}>
                                                {custom.complexity_level}
                                              </span>
                                              <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-700 rounded">
                                                {(custom.confidence_score * 100).toFixed(0)}%
                                              </span>
                                              {custom.requires_review && (
                                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                              )}
                                            </div>
                                          </div>
                                        </button>

                                        {expandedCustomizations.has(custom.customization_id) && (
                                          <div className="p-4 border-t border-gray-200 space-y-3">
                                            <div>
                                              <p className="text-xs font-semibold text-gray-600 mb-1">Type</p>
                                              <p className="text-sm text-gray-900">{custom.type}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs font-semibold text-gray-600 mb-1">
                                                Lines {custom.line_start}-{custom.line_end}
                                              </p>
                                              <div className="bg-gray-900 text-gray-100 p-3 rounded font-mono text-xs overflow-x-auto">
                                                <div className="mb-2 text-yellow-400">{custom.condition_code}</div>
                                                <pre className="whitespace-pre-wrap">{custom.customization_code}</pre>
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Client Analyses */}
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Client Analysis</h4>
                                  <div className="space-y-3">
                                    {Object.entries(node.llm_analyses_by_client).map(([clientId, analysis]) => (
                                      <div key={clientId} className="border border-gray-200 rounded-lg bg-white">
                                        <button
                                          className="p-3 cursor-pointer hover:bg-gray-50 transition-colors w-full text-left"
                                          onClick={() => toggleClient(`${node.node_id}-${clientId}`)}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              {expandedClients.has(`${node.node_id}-${clientId}`) ? (
                                                <ChevronUp className="w-4 h-4 text-gray-400" />
                                              ) : (
                                                <ChevronDown className="w-4 h-4 text-gray-400" />
                                              )}
                                              <div>
                                                <span className="text-sm font-semibold text-gray-900">
                                                  {analysis.client_name}
                                                </span>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                  {analysis.business_rules.length} business rules
                                                </div>
                                              </div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs font-semibold rounded border ${getRiskBgColor(analysis.risk_assessment)}`}>
                                              {analysis.risk_assessment} risk
                                            </span>
                                          </div>
                                        </button>

                                        {expandedClients.has(`${node.node_id}-${clientId}`) && (
                                          <div className="p-4 border-t border-gray-200 space-y-4">
                                            {/* Patterns */}
                                            {analysis.customization_patterns.length > 0 && (
                                              <div>
                                                <h5 className="text-xs font-semibold text-gray-700 mb-2">Patterns</h5>
                                                <ul className="space-y-1">
                                                  {analysis.customization_patterns.map((pattern, idx) => (
                                                    <li key={`${idx}-${pattern}`} className="flex items-start gap-2 text-xs text-gray-600">
                                                      <ChevronDown className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: '#fb851e' }} />
                                                      {pattern}
                                                    </li>
                                                  ))}
                                                </ul>
                                              </div>
                                            )}

                                            {/* Business Rules */}
                                            <div>
                                              <h5 className="text-xs font-semibold text-gray-700 mb-2">Business Rules</h5>
                                              <div className="space-y-2">
                                                {analysis.business_rules.map((rule, idx) => (
                                                  <div key={`${idx}-${rule.rule_name}`} className="bg-gray-50 p-3 rounded border border-gray-200">
                                                    <div className="flex items-start justify-between mb-2">
                                                      <h6 className="text-xs font-semibold text-gray-900">{rule.rule_name}</h6>
                                                      <div className="flex gap-1">
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getCategoryColor(rule.rule_category)}`}>
                                                          {rule.rule_category}
                                                        </span>
                                                        <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getPriorityColor(rule.priority)}`}>
                                                          {rule.priority}
                                                        </span>
                                                      </div>
                                                    </div>
                                                    <p className="text-xs text-gray-700 mb-2">{rule.business_rule_statement}</p>
                                                    <div className="text-xs text-gray-600">
                                                      <span className="font-semibold">Impact:</span> {rule.business_impact}
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'chains' && (
          <div className="space-y-4">
            {Object.entries(dataByChain)
              .sort(([,a], [,b]) => b.totalCustomizations - a.totalCustomizations)
              .map(([chainId, chainData]) => (
              <div key={chainId} className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{chainId}</h3>
                    <p className="text-sm text-gray-600">
                      {chainData.totalCustomizations} customizations across {chainData.nodes.length} nodes
                    </p>
                  </div>
                  <span className={`px-3 py-1 text-sm font-semibold rounded border ${getRiskBgColor(chainData.riskLevel)}`}>
                    {chainData.riskLevel} risk
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Patterns */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Customization Patterns</h4>
                    <ul className="space-y-2">
                      {chainData.patterns.map((pattern, idx) => (
                        <li key={`${idx}-${pattern}`} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronDown className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: '#fb851e' }} />
                          {pattern}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Affected Nodes */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Affected Nodes</h4>
                    <div className="space-y-2">
                      {chainData.nodes.map(node => (
                        <div key={node.node_id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 font-mono">{node.node_name}</span>
                          <span className="text-gray-500">
                            {node.detected_customizations.filter(c => c.chain_identifier === chainId).length}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Business Rules Summary */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Business Rules ({chainData.businessRules.length})
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['high', 'medium', 'low'].map(priority => {
                      const count = chainData.businessRules.filter(r => r.priority === priority).length;
                      if (count === 0) return null;
                      return (
                        <div key={priority} className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{count}</p>
                          <p className={`text-xs font-semibold uppercase ${getPriorityTextColor(priority)}`}>{priority} Priority</p>
                        </div>
                      );
                    })}
                    {Object.entries(
                      chainData.businessRules.reduce((acc, rule) => {
                        acc[rule.rule_category] = (acc[rule.rule_category] || 0) + 1;
                        return acc;
                      }, {} as Record<string, number>)
                    ).slice(0, 1).map(([category, count]) => (
                      <div key={category} className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="text-xs font-semibold uppercase text-gray-600">{category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'patterns' && (
          <div className="space-y-6">
            {/* Customization Types */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Customization Type Distribution</h3>
              <div className="space-y-3">
                {Object.entries(stats.typeDistribution)
                  .sort(([,a], [,b]) => b - a)
                  .map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{type.replaceAll('_', ' ')}</span>
                      <span className="text-sm font-bold text-gray-900">{count} occurrences</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${(count / nodesArray.length) * 100}%`,
                          backgroundColor: '#fb851e'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Common Patterns Across Chains */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Common Patterns Across All Chains</h3>
              <div className="space-y-3">
                {Array.from(new Set(
                  nodesArray.flatMap(node =>
                    Object.values(node.llm_analyses_by_client).flatMap(analysis =>
                      analysis.customization_patterns
                    )
                  )
                )).slice(0, 10).map((pattern, idx) => (
                  <div key={`${idx}-${pattern}`} className="flex items-start gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                      style={{ backgroundColor: '#fb851e' }}>
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-700">{pattern}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis Metadata */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Analysis Metadata</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Analyzer Version</p>
                  <p className="text-lg font-bold text-gray-900">{nodesArray[0]?.analyzer_version}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Analysis Timestamp</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(nodesArray[0]?.analysis_timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Files Analyzed</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Set(nodesArray.map(n => n.file_path)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>LIFTR - GenAI-Powered Legacy Modernization Platform</p>
          <p className="mt-1">Node Customization Analysis & Pattern Recognition</p>
        </div>
      </div>
    </div>
  );
};

export default NodeAnalysisVisualizer;
