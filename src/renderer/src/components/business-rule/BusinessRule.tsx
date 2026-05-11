// Adapted for Lifter-File-Viewer

import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  FileText,
  AlertCircle,
  CheckCircle,
  Code,
  Eye,
  EyeOff
} from 'lucide-react';
import * as XLSX from 'xlsx';
import type {
  BusinessRulesData,
  FilterState,
  SortField,
  SortDirection
} from './type';

interface BusinessRulesVisualizerProps {
  data: BusinessRulesData;
}

const BusinessRulesVisualizer: React.FC<BusinessRulesVisualizerProps> = ({ data }) => {
  // State management
  const [filters, setFilters] = useState<FilterState>({
    category: 'all',
    priority: 'all',
    is_mandatory: 'all',
    language: 'all',
    searchTerm: ''
  });

  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(true);


  // Extract unique values for filter dropdowns
  const uniqueValues = useMemo(() => {
    const categories = new Set<string>();
    const priorities = new Set<string>();
    const languages = new Set<string>();

    for (const rule of data.business_rules) {
      categories.add(rule.category);
      priorities.add(rule.priority);
      if (rule.citations) {
        for (const citation of rule.citations) {
          languages.add(citation.language);
        }
      }
    }

    return {
      categories: Array.from(categories).sort((a,b) => a.localeCompare(b)),
      priorities: Array.from(priorities).sort((a,b) => a.localeCompare(b)),
      languages: Array.from(languages).sort((a,b) => a.localeCompare(b))
    };
  }, [data]);

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let filtered = [...data.business_rules];

    // Apply filters
    if (filters.category !== 'all') {
      filtered = filtered.filter(rule => rule.category === filters.category);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(rule => rule.priority === filters.priority);
    }
    if (filters.is_mandatory !== 'all') {
      filtered = filtered.filter(rule => rule.is_mandatory === filters.is_mandatory);
    }
    if (filters.language !== 'all') {
      filtered = filtered.filter(rule =>
        rule.citations?.some(citation => citation.language === filters.language)
      );
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(term) ||
        rule.description.toLowerCase().includes(term) ||
        rule.statement.toLowerCase().includes(term) ||
        rule.rule_id.toLowerCase().includes(term)
      );
    }

    // Apply sorting
    if (sortField !== 'none') {
      filtered.sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return 0;
      });
    }

    return filtered;
  }, [data, filters, sortField, sortDirection]);

  // Toggle row expansion
  const toggleRow = (ruleId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRows(newExpanded);
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
      category: 'all',
      priority: 'all',
      is_mandatory: 'all',
      language: 'all',
      searchTerm: ''
    });
    setSortField('none');
    setSortDirection('asc');
  };

  // Export to Excel
  const exportToExcel = () => {
    const exportData = processedData.map(rule => ({
      'Rule ID': rule.rule_id,
      'Name': rule.name,
      'Category': rule.category,
      'Priority': rule.priority,
      'Mandatory': rule.is_mandatory,
      'Description': rule.description,
      'Statement': rule.statement,
      'Conditions': Array.isArray(rule.conditions) ? rule.conditions.join('; ') : rule.conditions || 'None',
      'Actions': Array.isArray(rule.actions) ? rule.actions.join('; ') : rule.actions || 'None',
      'Exceptions': Array.isArray(rule.exceptions) ? rule.exceptions.join('; ') : rule.exceptions || 'None',
      'Applies To': rule.applies_to?.join(', ') || '',
      'Data Elements': rule.data_elements?.join(', ') || '',
      'Implementation Details': rule.implementation_details,
      'File Path': rule.citations?.[0]?.file_path || '',
      'Language': rule.citations?.[0]?.language || '',
      'Line Range': rule.citations?.[0] ? `${rule.citations[0].line_start}-${rule.citations[0].line_end}` : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Business Rules');

    // Auto-size columns
    const maxWidth = 100;
    const colWidths = Object.keys(exportData[0] || {}).map(key => ({
      wch: Math.min(
        maxWidth,
        Math.max(
          key.length,
          ...exportData.map(row => String(row[key as keyof typeof row] || '').length)
        )
      )
    }));
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `business_rules_export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get category badge color
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'constraint': 'bg-purple-100 text-purple-800 border-purple-200',
      'workflow': 'bg-blue-100 text-blue-800 border-blue-200',
      'calculation': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'validation': 'bg-cyan-100 text-cyan-800 border-cyan-200',
      'policy': 'bg-pink-100 text-pink-800 border-pink-200',
      'data_processing': 'bg-teal-100 text-teal-800 border-teal-200'
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6" style={{ borderTop: '4px solid #fb851e' }}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ backgroundColor: '#fb851e' }}>
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  The Lifter Business Rules Analyzer
                </h1>
                <p className="text-gray-600 mt-1">
                  {processedData.length} of {data.business_rules.length} rules displayed
                </p>
              </div>
            </div>
            {true && (
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
            )}
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
                  placeholder="Search by name, description, statement, or rule ID..."
                  value={filters.searchTerm}
                  onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#fb851e] focus:border-transparent transition-all"
                />
              </div>

              {/* Filter Dropdowns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    id="category"
                    value={filters.category}
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
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={filters.priority}
                    onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  >
                    <option value="all">All Priorities</option>
                    {uniqueValues.priorities.map(pri => (
                      <option key={pri} value={pri}>{pri}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="mandatory" className="block text-sm font-medium text-gray-700 mb-2">
                    Mandatory
                  </label>
                  <select
                    id="mandatory"
                    value={filters.is_mandatory}
                    onChange={(e) => setFilters({ ...filters, is_mandatory: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="True">Mandatory</option>
                    <option value="False">Optional</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    id="language"
                    value={filters.language}
                    onChange={(e) => setFilters({ ...filters, language: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  >
                    <option value="all">All Languages</option>
                    {uniqueValues.languages.map(lang => (
                      <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Rules</p>
                <p className="text-2xl font-bold text-gray-900">{processedData.length}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-red-600">
                  {processedData.filter(r => r.priority === 'high').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mandatory</p>
                <p className="text-2xl font-bold text-green-600">
                  {processedData.filter(r => r.is_mandatory === 'True').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-purple-600">
                  {uniqueValues.categories.length}
                </p>
              </div>
              <Code className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Rules Table */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">

                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {sortField === 'name' && (
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
                    Mandatory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Language
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium">No rules found</p>
                      <p className="text-sm">Try adjusting your filters or search term</p>
                    </td>
                  </tr>
                ) : (
                  processedData.map((rule, index) => (
                    <React.Fragment key={`${rule.rule_id}-${index}`}>
                      <tr
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => toggleRow(rule.rule_id)}
                      >
                        <td className="px-6 py-4">
                          {expandedRows.has(rule.rule_id) ? (
                            <ChevronUp className="w-5 h-5 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{rule.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{rule.rule_id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getCategoryColor(rule.category)}`}>
                            {rule.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(rule.priority)}`}>
                            {rule.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {rule.is_mandatory === 'True' ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <X className="w-5 h-5 text-gray-400" />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2 py-1 text-xs font-mono bg-gray-100 text-gray-800 rounded border border-gray-300">
                            {rule.citations?.[0]?.language?.toUpperCase() || 'N/A'}
                          </span>
                        </td>
                      </tr>
                      {expandedRows.has(rule.rule_id) && (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 bg-gray-50">
                            <div className="space-y-4">
                              {/* Description */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Description</h4>
                                <p className="text-sm text-gray-700">{rule.description}</p>
                              </div>

                              {/* Statement */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Statement</h4>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200">
                                  {rule.statement}
                                </p>
                              </div>

                              {/* Conditions */}
                              {rule.conditions && rule.conditions !== 'None' && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Conditions</h4>
                                  {Array.isArray(rule.conditions) ? (
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                      {rule.conditions.map((cond, idx) => (
                                        <li key={`${idx}-${cond}`}>{cond}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-700">{rule.conditions}</p>
                                  )}
                                </div>
                              )}

                              {/* Actions */}
                              {rule.actions && rule.actions !== 'None' && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Actions</h4>
                                  {Array.isArray(rule.actions) ? (
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                      {rule.actions.map((action, idx) => (
                                        <li key={`${idx}-${action}`}>{action}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-700">{rule.actions}</p>
                                  )}
                                </div>
                              )}

                              {/* Exceptions */}
                              {rule.exceptions && rule.exceptions !== 'None' && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Exceptions</h4>
                                  {Array.isArray(rule.exceptions) ? (
                                    <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                                      {rule.exceptions.map((exc, idx) => (
                                        <li key={`${idx}-${exc}`}>{exc}</li>
                                      ))}
                                    </ul>
                                  ) : (
                                    <p className="text-sm text-gray-700">{rule.exceptions}</p>
                                  )}
                                </div>
                              )}

                              {/* Data Elements */}
                              {rule.data_elements && rule.data_elements.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Data Elements</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {rule.data_elements.map((elem, idx) => (
                                      <span
                                        key={`${idx}-${elem}`}
                                        className="inline-flex px-2 py-1 text-xs font-mono bg-blue-50 text-blue-700 rounded border border-blue-200"
                                      >
                                        {elem}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Implementation Details */}
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Implementation Details</h4>
                                <p className="text-sm text-gray-700 bg-white p-3 rounded border border-gray-200 font-mono text-xs">
                                  {rule.implementation_details}
                                </p>
                              </div>

                              {/* Citations */}
                              {rule.citations && rule.citations.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Source Citations</h4>
                                  <div className="space-y-2">
                                    {rule.citations.map((citation, idx) => (
                                      <div key={`${idx}-${citation.file_path}`} className="bg-white p-3 rounded border border-gray-200 text-xs">
                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <span className="font-semibold">File:</span> {citation.file_path}
                                          </div>
                                          <div>
                                            <span className="font-semibold">Lines:</span> {citation.line_start}-{citation.line_end}
                                          </div>
                                          <div>
                                            <span className="font-semibold">Node:</span> {citation.node_name}
                                          </div>
                                          <div>
                                            <span className="font-semibold">Language:</span> {citation.language.toUpperCase()}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Applies To */}
                              {rule.applies_to && rule.applies_to.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Applies To</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {rule.applies_to.map((item, idx) => (
                                      <span
                                        key={`${idx}-${item}`}
                                        className="inline-flex px-2 py-1 text-xs bg-purple-50 text-purple-700 rounded border border-purple-200"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
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

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>The Lifter - GenAI-Powered Legacy Modernization Platform</p>
          <p className="mt-1">Business Rules Analysis & Visualization</p>
        </div>
      </div>
    </div>
  );
};

export default BusinessRulesVisualizer;