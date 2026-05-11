import React, { useMemo, useState } from 'react';
import {
  ShieldAlert, ShieldCheck, AlertCircle, AlertTriangle,
  Search, FileCode, ExternalLink, Filter,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Info, Activity, Lock, Eye,
  Clock
} from 'lucide-react';

interface Props {
  data: any;
}

const ITEMS_PER_PAGE = 10;

const SEVERITY_COLORS: Record<string, { bg: string, text: string, icon: any }> = {
  'ERROR': { bg: 'bg-red-500', text: 'text-red-600', icon: ShieldAlert },
  'WARNING': { bg: 'bg-orange-500', text: 'text-orange-600', icon: AlertTriangle },
  'INFO': { bg: 'bg-blue-500', text: 'text-blue-600', icon: Info }
};

export default function SecurityReportViewer({ data }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const findings = useMemo(() => {
    const semgrepResults = data.staticAnalysis?.semgrep?.results?.results || [];
    return semgrepResults.map((res: any) => ({
      id: res.check_id,
      path: res.path,
      line: res.start?.line,
      message: res.extra?.message,
      severity: res.extra?.severity,
      category: res.extra?.metadata?.category || 'General',
      cwe: res.extra?.metadata?.cwe || [],
      owasp: res.extra?.metadata?.owasp || [],
      recommendation: res.extra?.metadata?.recommendation,
      references: res.extra?.metadata?.references || []
    }));
  }, [data]);

  const filteredFindings = useMemo(() => {
    return findings.filter((f: any) => {
      const matchesSearch = f.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.path?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.id?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSeverity = severityFilter === 'ALL' || f.severity === severityFilter;
      return matchesSearch && matchesSeverity;
    });
  }, [findings, searchQuery, severityFilter]);

  const paginatedFindings = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredFindings.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFindings, currentPage]);

  const totalPages = Math.ceil(filteredFindings.length / ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    return {
      total: findings.length,
      errors: findings.filter((f: any) => f.severity === 'ERROR').length,
      warnings: findings.filter((f: any) => f.severity === 'WARNING').length,
      info: findings.filter((f: any) => f.severity === 'INFO').length,
    };
  }, [findings]);

  const MetricCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon size={18} className={color.replace('bg-', 'text-')} />
        </div>
        <h3 className="text-gray-500 text-[10px] font-black uppercase tracking-wider">{title}</h3>
      </div>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50/50">
      {/* Brand Header */}
      <div className="bg-[#FB851E] px-8 pt-10 pb-20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-5 rounded-full -ml-20 -mb-20 blur-2xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 text-white/80 mb-3">
              <Lock size={18} className="text-white" />
              <span className="text-xs font-bold uppercase tracking-widest">Security Audit</span>
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">
              {data.projectName || 'Security Analysis Report'}
            </h1>
            <p className="text-white/80 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Activity size={14} /> Risk: {data.overallRisk}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Clock size={14} /> {new Date(data.scanDate).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
              <span className="text-[10px] text-white/60 font-black uppercase mb-1">Critical Issues</span>
              <span className="text-3xl font-black text-white">
                {data.criticalVulnerabilities || stats.errors}
              </span>
            </div>
            <div className="px-6 py-3 bg-white text-[#FB851E] rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
              <span className="text-[10px] text-[#FB851E]/60 font-black uppercase mb-1">Risk Score</span>
              <span className="text-3xl font-black">
                {(findings.length / 10).toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 -mt-10 relative z-20 pb-10">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard title="Total Findings" value={stats.total} icon={ShieldAlert} color="bg-gray-500" />
          <MetricCard title="Security Errors" value={stats.errors} icon={ShieldAlert} color="bg-red-500" />
          <MetricCard title="Policy Warnings" value={stats.warnings} icon={AlertTriangle} color="bg-[#FB851E]" />
          <MetricCard title="Audit Info" value={stats.info} icon={Info} color="bg-blue-500" />
        </div>

        {/* Findings Section */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[600px]">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Eye size={18} className="text-red-500" />
              Security Vulnerabilities & Findings
            </h3>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
                <Filter size={14} className="text-gray-400" />
                <select
                  className="text-xs font-bold text-gray-600 outline-none"
                  value={severityFilter}
                  onChange={(e) => {
                    setSeverityFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="ALL">All Severities</option>
                  <option value="ERROR">Errors Only</option>
                  <option value="WARNING">Warnings Only</option>
                  <option value="INFO">Info Only</option>
                </select>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search vulnerabilities..."
                  className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-red-500 outline-none w-64"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto max-h-[800px] custom-scrollbar">
            {paginatedFindings.map((finding: any, i: number) => {
              const SeverityIcon = SEVERITY_COLORS[finding.severity]?.icon || Info;
              return (
                <div key={i} className="group p-6 rounded-2xl border border-gray-100 bg-gray-50/30 hover:bg-white hover:border-red-100 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <div className={`mt-1 p-2 rounded-lg ${SEVERITY_COLORS[finding.severity]?.bg || 'bg-gray-500'} text-white shadow-sm`}>
                        <SeverityIcon size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${SEVERITY_COLORS[finding.severity]?.text || 'text-gray-500'}`}>
                            {finding.severity}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] font-bold text-gray-400 font-mono uppercase">{finding.id}</span>
                        </div>
                        <h4 className="text-sm font-bold text-gray-800 leading-relaxed mb-2 group-hover:text-red-600 transition-colors">
                          {finding.message}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 bg-white border border-gray-100 px-2 py-1 rounded-lg w-fit">
                          <FileCode size={12} className="text-gray-400" />
                          <span className="font-semibold text-gray-700">{finding.path.split('/').pop()}</span>
                          <span className="bg-gray-100 px-1 rounded font-mono">L{finding.line}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {finding.owasp.length > 0 && (
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-black border border-red-100">
                          {finding.owasp[0].split(':')[0]}
                        </span>
                      )}
                      {finding.cwe.length > 0 && (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px] font-bold border border-gray-200">
                          {finding.cwe[0].split(':')[0]}
                        </span>
                      )}
                    </div>
                  </div>

                  {finding.recommendation && (
                    <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-100/50">
                      <p className="text-[10px] font-black text-emerald-700 uppercase mb-1 tracking-widest">Recommendation</p>
                      <p className="text-xs text-emerald-800 leading-relaxed font-medium">
                        {finding.recommendation}
                      </p>
                    </div>
                  )}

                  {finding.references?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {finding.references.slice(0, 3).map((ref: string, idx: number) => (
                        <a key={idx} href={ref} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-[9px] text-blue-500 hover:underline">
                          <ExternalLink size={10} /> Reference {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredFindings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-40 text-gray-400">
                <ShieldCheck size={64} className="mb-4 opacity-10" />
                <p className="text-lg font-bold">No security issues found</p>
                <p className="text-sm opacity-60">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-50 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronLeft size={16} />
              </button>
              <div className="px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Ruleset & Scan Metadata */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm md:col-span-2">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <ShieldCheck size={18} className="text-emerald-500" />
              Active Scan Policies
            </h3>
            <div className="flex flex-wrap gap-2">
              {data.staticAnalysis?.semgrep?.ruleset?.map((rule: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-[10px] font-bold border border-gray-100 uppercase tracking-tighter">
                  {rule}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-4">
              <Info size={18} className="text-blue-500" />
              Scanner Metadata
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Semgrep Version</p>
                <p className="text-xs font-bold text-gray-700">{data.staticAnalysis?.semgrep?.results?.version || 'OSS v1.0+'}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Technologies</p>
                <div className="flex flex-wrap gap-1">
                  {data.metadata?.technologies?.map((tech: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{tech}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
