import React, { useState, useMemo } from 'react';
import {
  FileCode,
  Copy,
  Check,
  Layers,
  Database,
  FileText,
  Search,
  Code
} from 'lucide-react';
import { Citation } from './type';

export interface StoryCitationsTabProps {
  storyId: string;
  citations?: Citation[];
}

const getLanguageColor = (lang?: string) => {
  const l = (lang || '').toLowerCase();
  switch (l) {
    case 'react':
    case 'jsx':
    case 'tsx':
      return 'bg-cyan-50 text-cyan-700 border-cyan-300';
    case 'javascript':
    case 'js':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'typescript':
    case 'ts':
      return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'java':
      return 'bg-red-50 text-red-700 border-red-300';
    case 'python':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'sql':
      return 'bg-purple-50 text-purple-700 border-purple-300';
    case 'xml':
    case 'html':
      return 'bg-orange-50 text-orange-700 border-orange-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

export const StoryCitationsTab: React.FC<StoryCitationsTabProps> = ({ storyId, citations = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedSourceType, setSelectedSourceType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const languages = useMemo(() => {
    const langs = new Set<string>();
    for (const c of citations) {
      if (c.language) langs.add(c.language);
    }
    return Array.from(langs).sort((a, b) => a.localeCompare(b));
  }, [citations]);

  const sourceTypes = useMemo(() => {
    const types = new Set<string>();
    for (const c of citations) {
      if (c.source_type) types.add(c.source_type);
    }
    return Array.from(types).sort((a, b) => a.localeCompare(b));
  }, [citations]);

  const uniqueFilesCount = useMemo(() => {
    return new Set(citations.map(c => c.file_path).filter(Boolean)).size;
  }, [citations]);

  const filteredCitations = useMemo(() => {
    return citations.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (c.node_name && c.node_name.toLowerCase().includes(term)) ||
        (c.file_path && c.file_path.toLowerCase().includes(term)) ||
        (c.source_name && c.source_name.toLowerCase().includes(term)) ||
        (c.entity_name && c.entity_name.toLowerCase().includes(term));

      const matchLang = selectedLanguage === 'all' || c.language === selectedLanguage;
      const matchSource = selectedSourceType === 'all' || c.source_type === selectedSourceType;

      return matchSearch && matchLang && matchSource;
    });
  }, [citations, searchTerm, selectedLanguage, selectedSourceType]);

  const totalPages = Math.max(1, Math.ceil(filteredCitations.length / pageSize));
  const paginatedCitations = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCitations.slice(start, start + pageSize);
  }, [filteredCitations, currentPage, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedLanguage, selectedSourceType, pageSize]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  if (!citations || citations.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 border border-dashed border-gray-300 rounded-xl">
        <FileCode className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h4 className="text-base font-semibold text-gray-700 mb-1">No Citations Found</h4>
        <p className="text-sm text-gray-500">No source citations are attached to this user story.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header & Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Citations</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{citations.length}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <FileCode className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase tracking-wider">Referenced Files</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{uniqueFilesCount}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Languages</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {languages.map(lang => (
                  <span
                    key={lang}
                    onClick={() => setSelectedLanguage(selectedLanguage === lang ? 'all' : lang)}
                    className={`cursor-pointer px-2 py-0.5 rounded text-xs font-medium border transition-colors ${
                      selectedLanguage === lang
                        ? 'bg-amber-600 text-white border-amber-600'
                        : getLanguageColor(lang)
                    }`}
                    title={`Click to filter by ${lang}`}
                  >
                    {lang} ({citations.filter(c => c.language === lang).length})
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search node, file, source..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {languages.length > 0 && (
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Languages ({citations.length})</option>
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang} ({citations.filter(c => c.language === lang).length})
                </option>
              ))}
            </select>
          )}

          {sourceTypes.length > 0 && (
            <select
              value={selectedSourceType}
              onChange={e => setSelectedSourceType(e.target.value)}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="all">All Sources ({citations.length})</option>
              {sourceTypes.map(st => (
                <option key={st} value={st}>
                  {st} ({citations.filter(c => c.source_type === st).length})
                </option>
              ))}
            </select>
          )}

          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
            <option value={100}>100 / page</option>
          </select>

          {(searchTerm || selectedLanguage !== 'all' || selectedSourceType !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedLanguage('all');
                setSelectedSourceType('all');
              }}
              className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Citations Count Notice */}
      <div className="flex items-center justify-between text-xs text-gray-500 px-1">
        <span>
          Showing {filteredCitations.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
          {Math.min(currentPage * pageSize, filteredCitations.length)} of {filteredCitations.length} citation{filteredCitations.length === 1 ? '' : 's'}
          {filteredCitations.length !== citations.length && ` (filtered from ${citations.length})`}
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Citations List */}
      {paginatedCitations.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">
          No citations matched your search criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedCitations.map((citation, idx) => {
            const citeKey = `${storyId}-cite-${idx}-${citation.node_name}-${citation.line_start}`;
            const isCopied = copiedId === citeKey;

            return (
              <div
                key={citeKey}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
              >
                {/* Top Row: Node Name & Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold font-mono">
                      {(currentPage - 1) * pageSize + idx + 1}
                    </span>
                    <h5 className="text-base font-semibold text-gray-900 font-mono flex items-center gap-1.5">
                      <Code className="w-4 h-4 text-gray-500" />
                      {citation.node_name}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {citation.language && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getLanguageColor(citation.language)}`}>
                        {citation.language.toUpperCase()}
                      </span>
                    )}
                    {citation.source_type && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {citation.source_type}
                      </span>
                    )}
                    {citation.source_name && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        src: {citation.source_name}
                      </span>
                    )}
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Lines {citation.line_start} - {citation.line_end}
                    </span>
                  </div>
                </div>

                {/* File Path Row */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <FileCode className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="font-mono text-gray-700 truncate select-all" title={citation.file_path}>
                      {citation.file_path}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopy(citation.file_path, citeKey)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs bg-white hover:bg-gray-100 text-gray-700 rounded border border-gray-300 transition-colors flex-shrink-0"
                    title="Copy full file path"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-green-600 font-medium">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                        <span>Copy Path</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Extra Metadata (if available) */}
                {(citation.entity_name || citation.database || citation.document_name || citation.schema_name) && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs text-gray-600">
                    {citation.entity_name && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-500">Entity:</span>
                        <span className="font-mono text-gray-800">{citation.entity_name}</span>
                        {citation.entity_type && (
                          <span className="text-gray-400">({citation.entity_type})</span>
                        )}
                      </div>
                    )}
                    {citation.database && (
                      <div className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-500">DB:</span>
                        <span className="font-mono text-gray-800">{citation.database}</span>
                      </div>
                    )}
                    {citation.schema_name && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-gray-500">Schema:</span>
                        <span className="font-mono text-gray-800">{citation.schema_name}</span>
                      </div>
                    )}
                    {citation.document_name && (
                      <div className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium text-gray-500">Doc:</span>
                        <span className="text-gray-800 truncate" title={citation.document_path || citation.document_name}>
                          {citation.document_name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce((acc: (number | string)[], p, idx, arr) => {
                if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                  acc.push('...');
                }
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                typeof item === 'string' ? (
                  <span key={`dots-${idx}`} className="px-2 text-gray-400 text-sm">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => setCurrentPage(item)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === item
                        ? 'bg-blue-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default StoryCitationsTab;
