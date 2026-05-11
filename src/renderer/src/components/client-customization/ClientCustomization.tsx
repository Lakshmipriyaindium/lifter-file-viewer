import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronDown, 
  ChevronUp, 
  X,
  AlertCircle,
  Code,
  Eye,
  EyeOff,
  AlertTriangle,
  TrendingUp,
  GitBranch,
  Shield,
  Zap,
  Target,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type { 
  ClientCustomizationData,
  BusinessRule,
  Customization,
  FilterState,
  SortField,
  SortDirection,
  CustomizationStats
} from './type';

interface ClientCustomizationVisualizerProps {
  data: ClientCustomizationData;
}

const ClientCustomizationVisualizer: React.FC<ClientCustomizationVisualizerProps> = ({ data }) => {
  // State management
  const [filters, setFilters] = useState<FilterState>({
    complexity: 'all',
    priority: 'all',
    category: 'all',
    riskLevel: 'all',
    requiresReview: 'all',
    searchTerm: '',
    fileFilter: 'all'
  });
  
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [expandedCustomizations, setExpandedCustomizations] = useState<Set<string>>(new Set());
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'nodes' | 'rules'>('overview');
  
  const alphabeticalSort = (a: string, b: string) => a.localeCompare(b);

  // Calculate statistics
  const stats = useMemo<CustomizationStats>(() => {
    const allCustomizations: Customization[] = [];
    const allRules: BusinessRule[] = [];
    const files = new Set<string>();
    const complexityCount: Record<string, number> = {};
    const categoryCount: Record<string, number> = {};
    
    for(const node of data.customizations) {
      files.add(node.file_path);
      allCustomizations.push(...node.customizations);
      allRules.push(...node.llm_analysis.business_rules);
      
      for(const custom of node.customizations) {
        complexityCount[custom.complexity_level] = (complexityCount[custom.complexity_level] || 0) + 1;
      }
      
      for(const rule of node.llm_analysis.business_rules) {
        categoryCount[rule.rule_category] = (categoryCount[rule.rule_category] || 0) + 1;
      }
    }

    const avgConfidence = allCustomizations.length > 0
      ? allCustomizations.reduce((sum, c) => sum + c.confidence_score, 0) / allCustomizations.length
      : 0;

    return {
      totalCustomizations: allCustomizations.length,
      highPriorityRules: allRules.filter(r => r.priority === 'high').length,
      requiresReview: allCustomizations.filter(c => c.requires_review).length,
      uniqueFiles: files.size,
      averageConfidence: avgConfidence,
      complexityBreakdown: complexityCount,
      categoryBreakdown: categoryCount,
      riskLevel: data.customizations[0]?.llm_analysis.risk_assessment || 'unknown'
    };
  }, [data]);

  // Extract unique values for filters
  const uniqueValues = useMemo(() => {
    const complexities = new Set<string>();
    const priorities = new Set<string>();
    const categories = new Set<string>();
    const files = new Set<string>();
    
    for(const node of data.customizations) {
      files.add(node.file_path);
      for(const custom of node.customizations) {
        complexities.add(custom.complexity_level);
      }
      for(const rule of node.llm_analysis.business_rules) {
        priorities.add(rule.priority);
        categories.add(rule.rule_category);
      }
    }

    return {
      complexities: Array.from(complexities).sort(alphabeticalSort),
      priorities: Array.from(priorities).sort(alphabeticalSort),
      categories: Array.from(categories).sort(alphabeticalSort),
      files: Array.from(files).sort(alphabeticalSort)
    };
  }, [data]);

  // Flatten all business rules for filtering
  const allBusinessRules = useMemo(() => {
    const rules: (BusinessRule & { node_id: string; node_name: string; file_path: string })[] = [];
    
    for(const node of data.customizations) {
      for(const rule of node.llm_analysis.business_rules) {
        rules.push({
          ...rule,
          node_id: node.node_id,
          node_name: node.node_name,
          file_path: node.file_path
        });
      }
    }

    // Add standalone business rules if they exist
    if (data.business_rules) {
      for(const rule of data.business_rules) {
        rules.push({
          ...rule,
          node_id: rule.node_id || '',
          node_name: rule.node_name || '',
          file_path: rule.file_path || ''
        });
      }
    }
    
    return rules;
  }, [data]);

  // Filtered data
  const filteredNodes = useMemo(() => {
    return data.customizations.filter(node => {
      // File filter
      if (filters.fileFilter !== 'all' && node.file_path !== filters.fileFilter) {
        return false;
      }

      // Search term
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        const matchesNode = 
          node.node_name.toLowerCase().includes(term) ||
          node.file_path.toLowerCase().includes(term);
        
        const matchesCustomization = node.customizations.some(c => 
          c.customization_id.toLowerCase().includes(term) ||
          c.condition_code.toLowerCase().includes(term) ||
          c.customization_code.toLowerCase().includes(term)
        );

        const matchesRule = node.llm_analysis.business_rules.some(r =>
          r.rule_name.toLowerCase().includes(term) ||
          r.business_rule_statement.toLowerCase().includes(term)
        );

        if (!matchesNode && !matchesCustomization && !matchesRule) {
          return false;
        }
      }

      // Complexity filter
      if (filters.complexity !== 'all' && !node.customizations.some(c => c.complexity_level === filters.complexity)) {
        return false;
      }

      // Priority filter
      if (filters.priority !== 'all' && !node.llm_analysis.business_rules.some(r => r.priority === filters.priority)) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && !node.llm_analysis.business_rules.some(r => r.rule_category === filters.category)) {
        return false;
      }

      // Requires review filter
      if (filters.requiresReview !== 'all') {
        const requiresReview = filters.requiresReview === 'true';
        if (!node.customizations.some(c => c.requires_review === requiresReview)) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters]);

  // Filtered business rules
  const filteredBusinessRules = useMemo(() => {
    let filtered = [...allBusinessRules];

    if (filters.priority !== 'all') {
      filtered = filtered.filter(r => r.priority === filters.priority);
    }

    if (filters.category !== 'all') {
      filtered = filtered.filter(r => r.rule_category === filters.category);
    }

    if (filters.fileFilter !== 'all') {
      filtered = filtered.filter(r => r.file_path === filters.fileFilter);
    }

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.rule_name.toLowerCase().includes(term) ||
        r.business_rule_statement.toLowerCase().includes(term) ||
        r.business_justification.toLowerCase().includes(term) ||
        r.implementation_logic.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        const aVal = a[sortField as keyof BusinessRule];
        const bVal = b[sortField as keyof BusinessRule];
        
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        
        return 0;
      });
    }

    return filtered;
  }, [allBusinessRules, filters, sortField, sortDirection]);

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

  const toggleRule = (ruleName: string) => {
    const newExpanded = new Set(expandedRules);
    if (newExpanded.has(ruleName)) {
      newExpanded.delete(ruleName);
    } else {
      newExpanded.add(ruleName);
    }
    setExpandedRules(newExpanded);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
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
      searchTerm: '',
      fileFilter: 'all'
    });
    setSortField('none');
    setSortDirection('asc');
  };

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Summary
    const summaryData = [
      ['Client ID', data.client_id],
      ['Total Customizations', stats.totalCustomizations],
      ['High Priority Rules', stats.highPriorityRules],
      ['Requires Review', stats.requiresReview],
      ['Unique Files', stats.uniqueFiles],
      ['Average Confidence', `${(stats.averageConfidence * 100).toFixed(2)}%`],
      ['Risk Level', stats.riskLevel],
      ['', ''],
      ['Complexity Breakdown', ''],
      ...Object.entries(stats.complexityBreakdown).map(([k, v]) => [k, v]),
      ['', ''],
      ['Category Breakdown', ''],
      ...Object.entries(stats.categoryBreakdown).map(([k, v]) => [k, v])
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

    // Sheet 2: Customizations
    const customizationsData = filteredNodes.flatMap(node =>
      node.customizations.map(custom => ({
        'Node ID': node.node_id,
        'Node Name': node.node_name,
        'File Path': node.file_path,
        'Customization ID': custom.customization_id,
        'Type': custom.type,
        'Chain ID': custom.chain_identifier,
        'Chain Name': custom.chain_name,
        'Line Start': custom.line_start,
        'Line End': custom.line_end,
        'Complexity': custom.complexity_level,
        'Confidence Score': custom.confidence_score,
        'Requires Review': custom.requires_review ? 'Yes' : 'No',
        'Condition': custom.condition_code,
        'Code': custom.customization_code.substring(0, 200) + '...'
      }))
    );
    const wsCustomizations = XLSX.utils.json_to_sheet(customizationsData);
    XLSX.utils.book_append_sheet(wb, wsCustomizations, 'Customizations');

    // Sheet 3: Business Rules
    const rulesData = filteredBusinessRules.map(rule => ({
      'Rule Name': rule.rule_name,
      'Category': rule.rule_category,
      'Priority': rule.priority,
      'Statement': rule.business_rule_statement,
      'Justification': rule.business_justification,
      'Implementation': rule.implementation_logic,
      'Impact': rule.business_impact,
      'Data Elements': rule.data_elements.join(', '),
      'Node Name': rule.node_name,
      'File Path': rule.file_path
    }));
    const wsRules = XLSX.utils.json_to_sheet(rulesData);
    XLSX.utils.book_append_sheet(wb, wsRules, 'Business Rules');

    // Auto-size columns for all sheets
    for(const ws of [wsSummary,wsCustomizations,wsRules]) {
      const cols = [];
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
          if (cell?.v) {
            const len = String(cell.v).length;
            if (len > maxWidth) maxWidth = Math.min(len, 100);
          }
        }
        cols.push({ wch: maxWidth });
      }
      ws['!cols'] = cols;
    }

    XLSX.writeFile(wb, `${data.client_id}_customizations_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Color functions
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
      'calculation': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'reporting': 'bg-pink-100 text-pink-800 border-pink-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity.toLowerCase()) {
      case 'simple': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'complex': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk.toLowerCase()) {
      case 'high': return 'text-red-600';
      case 'moderate': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getComplexityBreakdownColor = (complexityBreakdown: string) => {
    switch(complexityBreakdown.toLowerCase()) {
      case 'simple': return '#10b981';
      case 'moderate': return '#f59e0b';
      default: return '#ef4444';
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
                <Layers className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Client Customization Analyzer
                </h1>
                <p className="text-gray-600 mt-1">
                  {data.client_id} - {data.customizations[0]?.llm_analysis.client_name}
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
            <div className="flex">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === 'overview' ? { borderColor: '#fb851e' } : {}}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Overview
                </div>
              </button>
              <button
                onClick={() => setActiveTab('nodes')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'nodes'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === 'nodes' ? { borderColor: '#fb851e' } : {}}
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Customization Nodes ({filteredNodes.length})
                </div>
              </button>
              <button
                onClick={() => setActiveTab('rules')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'rules'
                    ? 'border-b-2 text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                style={activeTab === 'rules' ? { borderColor: '#fb851e' } : {}}
              >
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Business Rules ({filteredBusinessRules.length})
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
                  placeholder="Search by node name, customization, business rule, or file path..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label htmlFor="complexity" className="block text-sm font-medium text-gray-700 mb-2">
                    Complexity
                  </label>
                  <select
                    value={filters.complexity}
                    id="complexity"
                    onChange={(e) => setFilters({ ...filters, complexity: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
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
                    value={filters.priority}
                    id="priority"
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
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
                    value={filters.category}
                    id="category"
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {uniqueValues.categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="requires-review" className="block text-sm font-medium text-gray-700 mb-2">
                    Requires Review
                  </label>
                  <select
                    value={filters.requiresReview}
                    id="requires-review"
                    onChange={(e) => setFilters({ ...filters, requiresReview: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-2">
                    File
                  </label>
                  <select
                    value={filters.fileFilter}
                    id="file"
                    onChange={(e) => setFilters({ ...filters, fileFilter: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent text-xs"
                  >
                    <option value="all">All Files</option>
                    {uniqueValues.files.map(file => (
                      <option key={file} value={file}>
                        {file.split('/').pop()}
                      </option>
                    ))}
                  </select>
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
                    <p className="text-sm text-gray-600">Total Customizations</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalCustomizations}</p>
                  </div>
                  <Code className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">High Priority</p>
                    <p className="text-2xl font-bold text-red-600">{stats.highPriorityRules}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Requires Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.requiresReview}</p>
                  </div>
                  <AlertTriangle className="w-8 h-8 text-yellow-500" />
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
                  <Zap className="w-8 h-8 text-green-500" />
                </div>
              </div>
            </div>

            {/* Risk Assessment */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6" style={{ color: '#fb851e' }} />
                <h2 className="text-xl font-bold text-gray-900">Risk Assessment</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Risk Level</h3>
                  <p className={`text-3xl font-bold ${getRiskColor(stats.riskLevel)}`}>
                    {stats.riskLevel.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Maintenance Complexity: {data.customizations[0]?.llm_analysis.maintenance_complexity}
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Unique Files Affected</h3>
                  <p className="text-3xl font-bold text-gray-900">{stats.uniqueFiles}</p>
                  <p className="text-sm text-gray-600 mt-2">
                    Files containing client-specific customizations
                  </p>
                </div>
              </div>
            </div>

            {/* Breakdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Complexity Breakdown */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Complexity Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(stats.complexityBreakdown).map(([complexity, count]) => (
                    <div key={complexity}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{complexity}</span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / stats.totalCustomizations) * 100}%`,
                            backgroundColor: getComplexityBreakdownColor(complexity)
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Category Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700 capitalize">{category}</span>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{
                            width: `${(count / allBusinessRules.length) * 100}%`,
                            backgroundColor: '#fb851e'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Customization Patterns */}
            {data.customizations[0]?.llm_analysis.customization_patterns && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Customization Patterns</h3>
                <ul className="space-y-2">
                  {data.customizations[0].llm_analysis.customization_patterns.map((pattern, idx) => (
                    <li key={`customization-pattern-${idx}-${pattern}`} className="flex items-start gap-2">
                      <ChevronDown className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: '#fb851e' }} />
                      <span className="text-sm text-gray-700">{pattern}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {activeTab === 'nodes' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Customization Nodes ({filteredNodes.length})
              </h2>
              {filteredNodes.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900">No nodes found</p>
                  <p className="text-sm text-gray-600">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNodes.map((node) => (
                    <div key={node.node_id} className="border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors text-left w-full"
                        onClick={() => toggleNode(node.node_id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {expandedNodes.has(node.node_id) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{node.node_name}</h3>
                              <p className="text-sm text-gray-600 font-mono">{node.file_path}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                              {node.customizations.length} customizations
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold bg-purple-100 text-purple-800 rounded">
                              {node.llm_analysis.business_rules.length} rules
                            </span>
                          </div>
                        </div>
                      </button>

                      {expandedNodes.has(node.node_id) && (
                        <div className="p-6 border-t border-gray-200">
                          {/* Customizations */}
                          <div className="mb-6">
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Customizations</h4>
                            <div className="space-y-3">
                              {node.customizations.map((custom) => (
                                <div key={custom.customization_id} className="border border-gray-200 rounded-lg">
                                  <button
                                    className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors w-full"
                                    onClick={() => toggleCustomization(custom.customization_id)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        {expandedCustomizations.has(custom.customization_id) ? (
                                          <ChevronUp className="w-4 h-4 text-gray-400" />
                                        ) : (
                                          <ChevronDown className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className="text-sm font-mono text-gray-700">
                                          {custom.customization_id}
                                        </span>
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
                                    <div className="p-4 space-y-3">
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Type</p>
                                        <p className="text-sm text-gray-900">{custom.type}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs font-semibold text-gray-600 mb-1">Chain</p>
                                        <p className="text-sm text-gray-900">
                                          {custom.chain_identifier} - {custom.chain_name}
                                        </p>
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

                          {/* Business Rules */}
                          <div>
                            <h4 className="text-md font-semibold text-gray-900 mb-3">Business Rules</h4>
                            <div className="space-y-2">
                              {node.llm_analysis.business_rules.map((rule, idx) => (
                                <div key={`business-rule-${idx}-${rule.rule_name}`} className="border border-gray-200 rounded-lg p-3">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="text-sm font-semibold text-gray-900">{rule.rule_name}</h5>
                                    <div className="flex gap-2">
                                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getCategoryColor(rule.rule_category)}`}>
                                        {rule.rule_category}
                                      </span>
                                      <span className={`px-2 py-1 text-xs font-semibold rounded border ${getPriorityColor(rule.priority)}`}>
                                        {rule.priority}
                                      </span>
                                    </div>
                                  </div>
                                  <p className="text-xs text-gray-700">{rule.business_rule_statement}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                      
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('rule_name')}
                    >
                      <div className="flex items-center gap-2">
                        Rule Name
                        {sortField === 'rule_name' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center gap-2">
                        Category
                        {sortField === 'category' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('priority')}
                    >
                      <div className="flex items-center gap-2">
                        Priority
                        {sortField === 'priority' && (
                          sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Node
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBusinessRules.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No rules found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBusinessRules.map((rule, idx) => (
                      <React.Fragment key={`${rule.rule_name}-${idx}`}>
                        <tr 
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => toggleRule(`${rule.rule_name}-${idx}`)}
                        >
                          <td className="px-6 py-4">
                            {expandedRules.has(`${rule.rule_name}-${idx}`) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">{rule.rule_name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(rule.rule_category)}`}>
                              {rule.rule_category}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(rule.priority)}`}>
                              {rule.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-gray-600">{rule.node_name}</div>
                          </td>
                        </tr>
                        {expandedRules.has(`${rule.rule_name}-${idx}`) && (
                          <tr>
                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                              <div className="space-y-4">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Business Rule Statement</h4>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                    {rule.business_rule_statement}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Business Justification</h4>
                                  <p className="text-sm text-gray-700">{rule.business_justification}</p>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Implementation Logic</h4>
                                  <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 font-mono text-xs">
                                    {rule.implementation_logic}
                                  </p>
                                </div>

                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Business Impact</h4>
                                  <p className="text-sm text-gray-700">{rule.business_impact}</p>
                                </div>

                                {rule.data_elements.length > 0 && (
                                  <div>
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Data Elements</h4>
                                    <div className="flex flex-wrap gap-2">
                                      {rule.data_elements.map((elem, i) => (
                                        <span 
                                          key={`data-element-${i}-${elem}`}
                                          className="inline-flex px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 rounded border border-blue-200"
                                        >
                                          {elem}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="text-xs text-gray-600">
                                  <span className="font-semibold">File:</span> {rule.file_path}
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

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>LIFTR - GenAI-Powered Legacy Modernization Platform</p>
          <p className="mt-1">Client Customization Analysis & Visualization</p>
        </div>
      </div>
    </div>
  );
};

export default ClientCustomizationVisualizer;
