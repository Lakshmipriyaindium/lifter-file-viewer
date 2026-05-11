import React, { useState, useMemo, useCallback, useEffect } from 'react';
import * as XLSX from 'xlsx';

// ============================================================================
// Type Definitions
// ============================================================================

type TermType = string;

interface BusinessTermsMetadata {
  total_procedures: number;
  files_analyzed: number;
  business_domains: string[];
  business_terms_count?: number;
  domain_constants_count?: number;
}

interface BusinessTerm {
  term: string;
  type: TermType;
  description: string;
  originalDescription: string;
  citation: string;
  domain: string;
  procedure: string;
  filePath: string;
  rating?: 'up' | 'down' | null;
  isModified: boolean;
}

interface FlatBusinessTerm {
  term: string;
  meaning: string;
  procedure: string;
  file_path: string;
  source: string;
}

interface FlatDomainConstant {
  constant: string;
  procedure: string;
  file_path: string;
  source: string;
}

interface FlatDataElement {
  element: string;
  procedure: string;
  file_path: string;
  source: string;
}

interface AnalysisNode {
  node_name: string;
  file_path: string;
  citation: string;
  start_line?: number;
  end_line?: number;
  analysis: {
    procedure_purpose?: string;
    business_domain: string;
    [key: string]: string[] | Record<string, string> | string | number | undefined;
  };
}

export interface BusinessTermsDataFlat {
  metadata: BusinessTermsMetadata;
  procedures_by_file?: Record<string, AnalysisNode[]>;
  business_terms?: FlatBusinessTerm[];
  domain_constants?: FlatDomainConstant[];
  data_elements?: FlatDataElement[];
  [key: string]: unknown;
}

interface BusinessTermsDataNested {
  metadata: BusinessTermsMetadata;
  nodes: AnalysisNode[];
}

export type BusinessTermsData = BusinessTermsDataFlat | BusinessTermsDataNested;

type FilterType = 'startsWith' | 'notStartsWith' | 'contains' | 'notContains';

interface FilterConfig {
  type: FilterType;
  value: string;
  termTypes: TermType[];
}

interface BusinessTermsVisualizerProps {
  data: BusinessTermsData;
}

// ============================================================================
// Helper Components
// ============================================================================

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    orange: 'text-orange-600 bg-orange-50',
    green: 'text-green-600 bg-green-50',
    red: 'text-red-600 bg-red-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  };

  return (
    <div className={`p-4 rounded-lg shadow-sm border border-gray-100 ${colorMap[color] || 'bg-gray-50'}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value.toLocaleString()}</p>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

const BusinessTermsVisualizer: React.FC<BusinessTermsVisualizerProps> = ({ data }) => {
  
  const isFlattened = useCallback((data: BusinessTermsData): data is BusinessTermsDataFlat => {
    return 'business_terms' in data || 'domain_constants' in data || 'data_elements' in data || 'procedures_by_file' in data;
  }, []);

  const extractDomainFromFile = useCallback((filePath: string): string => {
    const pathParts = filePath.split('/');
    const fileName = pathParts[pathParts.length - 1].toLowerCase();
    if (fileName.includes('finance') || fileName.includes('budget')) return 'finance';
    if (fileName.includes('hr') || fileName.includes('employee')) return 'hr';
    if (fileName.includes('sales') || fileName.includes('order')) return 'sales';
    if (fileName.includes('inventory')) return 'inventory';
    if (fileName.includes('customer')) return 'customer service';
    return 'general';
  }, []);

  const discoverTermTypes = useCallback((data: BusinessTermsData): TermType[] => {
    const termTypes = new Set<TermType>();
    if (isFlattened(data)) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'metadata' || key === 'procedures_by_file') continue;
        if (Array.isArray(value) && value.length > 0) termTypes.add(key);
      }
      if (data.procedures_by_file) {
        for (const procedures of Object.values(data.procedures_by_file)) {
          for (const node of procedures) {
            for (const [key, value] of Object.entries(node.analysis)) {
              if (Array.isArray(value) && value.length > 0) termTypes.add(key);
              else if (typeof value === 'object' && value !== null && !Array.isArray(value)) termTypes.add(key);
            }
          }
        }
      }
    } else {
      for (const node of data.nodes) {
        for (const [key, value] of Object.entries(node.analysis)) {
          if (Array.isArray(value) && value.length > 0) termTypes.add(key);
          else if (typeof value === 'object' && value !== null && !Array.isArray(value)) termTypes.add(key);
        }
      }
    }
    return Array.from(termTypes);
  }, [isFlattened]);

  const discoverDomains = useCallback((data: BusinessTermsData): string[] => {
    const domains = new Set<string>();
    if (isFlattened(data)) {
      for (const [key, value] of Object.entries(data)) {
        if (key === 'metadata' || key === 'procedures_by_file') continue;
        if (Array.isArray(value)) {
          for (const item of value as any[]) {
            if (item.file_path) domains.add(extractDomainFromFile(item.file_path));
          }
        }
      }
      if (data.procedures_by_file) {
        for (const procedures of Object.values(data.procedures_by_file)) {
          for (const node of procedures) {
            domains.add(node.analysis.business_domain || extractDomainFromFile(node.file_path));
          }
        }
      }
    } else {
      for (const node of data.nodes) {
        domains.add(node.analysis.business_domain || extractDomainFromFile(node.file_path));
      }
    }
    return Array.from(domains);
  }, [isFlattened, extractDomainFromFile]);

  const extractTerms = useCallback((data: BusinessTermsData): BusinessTerm[] => {
    const termsMap = new Map<string, BusinessTerm>();

    if (isFlattened(data)) {
      for (const [arrayName, arrayData] of Object.entries(data)) {
        if (arrayName === 'metadata' || arrayName === 'procedures_by_file') continue;
        if (Array.isArray(arrayData)) {
          for (const item of arrayData as any[]) {
            let term = item.term || item.constant || item.element;
            let description = item.meaning || `${arrayName.replace(/_/g, ' ')}: ${term}`;
            let filePath = item.file_path;
            let procedure = item.procedure;
            let source = item.source;
            if (!term) continue;

            const key = `${arrayName}:${term}:${source}`;
            if (!termsMap.has(key)) {
              termsMap.set(key, {
                term, type: arrayName, description, originalDescription: description,
                citation: source, domain: extractDomainFromFile(filePath),
                procedure, filePath, rating: null, isModified: false
              });
            }
          }
        }
      }
      if (data.procedures_by_file) {
        for (const procedures of Object.values(data.procedures_by_file)) {
          for (const node of procedures) {
            const domain = node.analysis.business_domain || extractDomainFromFile(node.file_path);
            for (const [fieldName, fieldValue] of Object.entries(node.analysis)) {
              if (Array.isArray(fieldValue)) {
                fieldValue.forEach((item, index) => {
                  if (typeof item !== 'string') return;
                  const key = `${fieldName}:${item}:${node.citation}:${index}`;
                  if (!termsMap.has(key)) {
                    termsMap.set(key, {
                      term: item, type: fieldName, description: `${fieldName.replace(/_/g, ' ')}: ${item}`,
                      originalDescription: `${fieldName.replace(/_/g, ' ')}: ${item}`,
                      citation: node.citation, domain, procedure: node.node_name, filePath: node.file_path,
                      rating: null, isModified: false
                    });
                  }
                });
              } else if (typeof fieldValue === 'object' && fieldValue !== null) {
                for (const [term, desc] of Object.entries(fieldValue as Record<string, string>)) {
                  const key = `${fieldName}:${term}:${node.citation}`;
                  if (!termsMap.has(key)) {
                    termsMap.set(key, {
                      term, type: fieldName, description: desc, originalDescription: desc,
                      citation: node.citation, domain, procedure: node.node_name, filePath: node.file_path,
                      rating: null, isModified: false
                    });
                  }
                }
              }
            }
          }
        }
      }
    } else {
      for (const node of data.nodes) {
        const domain = node.analysis.business_domain || extractDomainFromFile(node.file_path);
        for (const [fieldName, fieldValue] of Object.entries(node.analysis)) {
          if (Array.isArray(fieldValue)) {
            fieldValue.forEach((item, index) => {
              if (typeof item !== 'string') return;
              const key = `${fieldName}:${item}:${node.citation}:${index}`;
              if (!termsMap.has(key)) {
                termsMap.set(key, {
                  term: item, type: fieldName, description: `${fieldName.replace(/_/g, ' ')}: ${item}`,
                  originalDescription: `${fieldName.replace(/_/g, ' ')}: ${item}`,
                  citation: node.citation, domain, procedure: node.node_name, filePath: node.file_path,
                  rating: null, isModified: false
                });
              }
            });
          } else if (typeof fieldValue === 'object' && fieldValue !== null) {
            for (const [term, desc] of Object.entries(fieldValue as Record<string, string>)) {
              const key = `${fieldName}:${term}:${node.citation}`;
              if (!termsMap.has(key)) {
                termsMap.set(key, {
                  term, type: fieldName, description: desc, originalDescription: desc,
                  citation: node.citation, domain, procedure: node.node_name, filePath: node.file_path,
                  rating: null, isModified: false
                });
              }
            }
          }
        }
      }
    }
    return Array.from(termsMap.values());
  }, [isFlattened, extractDomainFromFile]);

  const [terms, setTerms] = useState<BusinessTerm[]>([]);
  const [availableTermTypes, setAvailableTermTypes] = useState<TermType[]>([]);
  const [availableDomains, setAvailableDomains] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterConfig>({ type: 'contains', value: '', termTypes: [] });
  const [domainFilter, setDomainFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  useEffect(() => {
    const extractedTerms = extractTerms(data);
    const termTypes = discoverTermTypes(data);
    const domains = discoverDomains(data);
    setTerms(extractedTerms);
    setAvailableTermTypes(termTypes);
    setAvailableDomains(domains);
    setFilters(prev => ({ ...prev, termTypes: termTypes }));
  }, [data, extractTerms, discoverTermTypes, discoverDomains]);

  const filteredTerms = useMemo(() => {
    let result = terms;
    if (filters.termTypes.length > 0) result = result.filter(term => filters.termTypes.includes(term.type));
    if (domainFilter) result = result.filter(term => term.domain.toLowerCase().includes(domainFilter.toLowerCase()));
    if (filters.value.trim()) {
      const val = filters.value.toLowerCase().trim();
      result = result.filter(term => {
        const t = term.term.toLowerCase();
        if (filters.type === 'startsWith') return t.startsWith(val);
        if (filters.type === 'contains') return t.includes(val);
        return true;
      });
    }
    if (searchTerm.trim()) {
      const s = searchTerm.toLowerCase().trim();
      result = result.filter(t => t.term.toLowerCase().includes(s) || t.description.toLowerCase().includes(s) || t.domain.toLowerCase().includes(s) || t.procedure.toLowerCase().includes(s));
    }
    return result;
  }, [terms, filters, domainFilter, searchTerm]);

  const paginatedTerms = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTerms.slice(start, start + itemsPerPage);
  }, [filteredTerms, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTerms.length / itemsPerPage);

  const getTypeColor = useCallback((type: TermType): string => {
    const colors = [
      'bg-indigo-100 text-indigo-800', 'bg-pink-100 text-pink-800', 'bg-blue-100 text-blue-800',
      'bg-purple-100 text-purple-800', 'bg-green-100 text-green-800', 'bg-yellow-100 text-yellow-800',
      'bg-red-100 text-red-800', 'bg-teal-100 text-teal-800', 'bg-orange-100 text-orange-800'
    ];
    let hash = 0;
    for (let i = 0; i < type.length; i++) hash = type.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const getTypeLabel = (type: TermType) => type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredTerms.map(t => ({
      Term: t.term, Type: t.type, Description: t.description, Procedure: t.procedure,
      Domain: t.domain, 'File Path': t.filePath, Citation: t.citation
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Business Terms');
    XLSX.writeFile(wb, 'business_terms_export.xlsx');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-orange-500 shadow-lg shadow-orange-200">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Business Terms</h1>
                <p className="text-gray-500 mt-1 font-medium">
                  {data.metadata.total_procedures} procedures analyzed • {terms.length} terms discovered
                </p>
              </div>
            </div>
            <button onClick={exportToExcel} className="flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export Excel
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-8">
            <StatCard label="Total Terms" value={terms.length} color="blue" />
            <StatCard label="Filtered" value={filteredTerms.length} color="purple" />
            {availableTermTypes.slice(0, 3).map(type => (
              <StatCard key={type} label={getTypeLabel(type)} value={terms.filter(t => t.type === type).length} color="indigo" />
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Search</label>
              <div className="relative">
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search terms, definitions, domains..." className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all outline-none" />
                <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Domain Filter</label>
              <select value={domainFilter} onChange={(e) => setDomainFilter(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all">
                <option value="">All Domains</option>
                {availableDomains.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Terms Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-bottom border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Term</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Description</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Context</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedTerms.map((term, i) => (
                  <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-6 py-5 align-top">
                      <div className="font-bold text-gray-900 text-lg mb-2">{term.term}</div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-tighter ${getTypeColor(term.type)}`}>
                        {getTypeLabel(term.type)}
                      </span>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <p className="text-gray-600 leading-relaxed text-sm max-w-2xl">{term.description}</p>
                      <div className="mt-3 flex items-center gap-4 text-xs font-medium text-gray-400">
                        <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1" /></svg>{term.domain}</span>
                        <span className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>{term.procedure}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 align-top">
                      <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-[10px] font-mono text-gray-500 break-all leading-tight max-w-xs">
                        {term.citation}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-500 font-medium">
              Showing <span className="font-bold text-gray-900">{paginatedTerms.length}</span> of <span className="font-bold text-gray-900">{filteredTerms.length}</span> terms
            </p>
            <div className="flex gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm">Previous</button>
              <div className="flex items-center px-4 text-sm font-bold text-gray-900">Page {currentPage} of {totalPages}</div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold disabled:opacity-50 hover:bg-gray-50 transition-all shadow-sm">Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessTermsVisualizer;
