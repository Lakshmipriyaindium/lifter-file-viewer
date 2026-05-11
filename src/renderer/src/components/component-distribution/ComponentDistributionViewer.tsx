import React, { useMemo, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import {
  BarChart3, Code2, AlertTriangle, FileCode2, Layers,
  Activity, Gauge, Zap, Copy, Search, ShieldAlert,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  Clock
} from 'lucide-react';

interface Props {
  data: any;
}

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', '#9a3412', '#c2410c', '#ea580c'];
const GRADE_COLORS: Record<string, string> = {
  'A': '#22c55e',
  'B': '#84cc16',
  'C': '#eab308',
  'D': '#f97316',
  'E': '#ef4444',
  'F': '#7f1d1d'
};

const ITEMS_PER_PAGE_REDUNDANCY = 10;
const ITEMS_PER_PAGE_COMPLEXITY = 15;

export default function ComponentDistributionViewer({ data }: Props) {
  const [redundancyPage, setRedundancyPage] = useState(1);
  const [complexityPage, setComplexityPage] = useState(1);

  const metadata = data.metadata || {};
  const tokei = data.tokeiAnalysis || { languages: {} };
  const complexity = data.complexity || {};
  const redundancy = data.redundancyAnalysis || {};
  const duplication = redundancy.grouped_duplicates || {};
  const jscpdTotal = redundancy.metadata?.original_jscpd_stats?.total || {};

  // Language Data
  const languageData = useMemo(() => {
    if (!tokei.languages) return [];
    return Object.entries(tokei.languages).map(([name, stats]: [string, any]) => ({
      name,
      code: stats.code,
      comments: stats.comments,
      blanks: stats.blanks
    })).sort((a, b) => b.code - a.code);
  }, [tokei]);

  // Complexity Distribution
  const complexityDist = useMemo(() => {
    const dist = complexity.cyclomatic?.distribution || {};
    return [
      { name: 'Simple', value: dist.simple || 0, color: '#22c55e' },
      { name: 'Moderate', value: dist.moderate || 0, color: '#eab308' },
      { name: 'Complex', value: dist.complex || 0, color: '#f97316' },
      { name: 'Very Complex', value: dist.veryComplex || 0, color: '#ef4444' }
    ];
  }, [complexity]);

  // Complexity Profile (Labels from files)
  const complexityProfile = useMemo(() => {
    const counts: Record<string, number> = { 'Easy': 0, 'Moderate': 0, 'Hard': 0, 'Very Complex': 0 };
    const files = complexity.cyclomatic?.byFile || [];
    files.forEach((file: any) => {
      const label = file.complexityLabel || 'Easy';
      if (counts[label] !== undefined) counts[label]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complexity]);

  // Cognitive Load Profile
  const cognitiveProfile = useMemo(() => {
    const counts: Record<string, number> = { 'Low': 0, 'Moderate': 0, 'High': 0, 'Very High': 0 };
    const files = complexity.cyclomatic?.byFile || [];
    files.forEach((file: any) => {
      const label = file.cognitiveLabel || 'Low';
      if (counts[label] !== undefined) counts[label]++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [complexity]);

  // Top Complex Files
  const topComplexFiles = useMemo(() => {
    return (complexity.cyclomatic?.byFile || [])
      .sort((a: any, b: any) => b.complexity - a.complexity);
  }, [complexity]);

  // Duplication Stats
  const duplicateFragments = useMemo(() => {
    if (!duplication || typeof duplication !== 'object') return [];
    return Object.entries(duplication)
      .sort((a: any, b: any) => (b[1].occurrence_count || 0) - (a[1].occurrence_count || 0));
  }, [duplication]);

  // Paginated Data
  const paginatedRedundancy = useMemo(() => {
    const start = (redundancyPage - 1) * ITEMS_PER_PAGE_REDUNDANCY;
    return duplicateFragments.slice(start, start + ITEMS_PER_PAGE_REDUNDANCY);
  }, [duplicateFragments, redundancyPage]);

  const totalRedundancyPages = Math.ceil(duplicateFragments.length / ITEMS_PER_PAGE_REDUNDANCY);

  const paginatedComplexity = useMemo(() => {
    const start = (complexityPage - 1) * ITEMS_PER_PAGE_COMPLEXITY;
    return topComplexFiles.slice(start, start + ITEMS_PER_PAGE_COMPLEXITY);
  }, [topComplexFiles, complexityPage]);

  const totalComplexityPages = Math.ceil(topComplexFiles.length / ITEMS_PER_PAGE_COMPLEXITY);

  const PaginationControls = ({ currentPage, totalPages, onPageChange }: any) => (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-600">
        Page {currentPage} of {totalPages}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
      <button
        onClick={() => onPageChange(totalPages)}
        disabled={currentPage === totalPages}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  );

  const MetricCard = ({ title, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10`}>
          <Icon size={20} className={color.replace('bg-', 'text-')} />
        </div>
        {subValue && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
            {subValue}
          </span>
        )}
      </div>
      <h3 className="text-gray-500 text-xs font-medium mb-1 uppercase tracking-wider">{title}</h3>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
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
              <Layers size={18} className="text-white" />
              <span className="text-xs font-bold uppercase tracking-widest">Architectural Distribution</span>
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">
              {metadata.projectRootName || 'Project Distribution'}
            </h1>
            <p className="text-white/80 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Code2 size={14} /> {metadata.framework}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Clock size={14} /> {new Date(metadata.timestamp).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
              <span className="text-[10px] text-white/60 font-black uppercase mb-1">Maintainability</span>
              <span className="text-3xl font-black text-white">
                {metadata.maintainabilityIndex?.toFixed(1)}
              </span>
            </div>
            <div className="px-6 py-3 bg-white text-[#FB851E] rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
              <span className="text-[10px] text-[#FB851E]/60 font-black uppercase mb-1">Complexity</span>
              <span className="text-3xl font-black">
                {metadata.cyclomatic?.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 -mt-10 relative z-20 pb-10">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            title="Total Files"
            value={complexity.cyclomatic?.byFile?.length || 0}
            icon={FileCode2}
            color="bg-blue-500"
            subValue="Project Size"
          />
          <MetricCard
            title="Avg Complexity"
            value={complexity.cyclomatic?.average?.toFixed(2)}
            icon={Gauge}
            color="bg-[#FB851E]"
            subValue="Cyclomatic"
          />
          <MetricCard
            title="Redundancy"
            value={`${jscpdTotal.percentage || 0}%`}
            icon={Copy}
            color="bg-amber-500"
            subValue="Code Clones"
          />
          <MetricCard
            title="Avg Cognitive"
            value={metadata.cognitive?.toFixed(2)}
            icon={Zap}
            color="bg-purple-500"
            subValue="Cognitive"
          />
          <MetricCard
            title="Max Nesting"
            value={Math.max(...(complexity.cyclomatic?.byFile || []).map((f: any) => f.maintainability?.maxNestingDepth || 0))}
            icon={Activity}
            color="bg-rose-500"
            subValue="Nesting Depth"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Language Breakdown */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <BarChart3 size={18} className="text-orange-500" />
                Lines of Code by Language
              </h3>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={languageData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                  <Tooltip
                    cursor={{ fill: '#f9731610' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="code" fill="#f97316" radius={[4, 4, 0, 0]} name="Code" />
                  <Bar dataKey="comments" fill="#fdba74" radius={[4, 4, 0, 0]} name="Comments" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Complexity Distribution Pie */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ShieldAlert size={18} className="text-orange-500" />
                Complexity Tiers
              </h3>
            </div>
            <div className="h-[300px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complexityDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complexityDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-gray-900">{complexityDist.reduce((a, b) => a + b.value, 0)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {complexityDist.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{entry.name}</span>
                    <span className="text-xs font-bold text-gray-700">{entry.value} files</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Complexity Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-orange-500" />
                Complexity Levels
              </h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complexityProfile} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#6b7280' }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {complexityProfile.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Easy' ? '#22c55e' :
                          entry.name === 'Moderate' ? '#eab308' :
                            entry.name === 'Hard' ? '#f97316' : '#ef4444'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cognitive Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Zap size={18} className="text-purple-500" />
                Cognitive Load Profile
              </h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cognitiveProfile} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={false} />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{ fontSize: 11, fontWeight: 'bold', fill: '#6b7280' }} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {cognitiveProfile.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={
                        entry.name === 'Low' ? '#22c55e' :
                          entry.name === 'Moderate' ? '#eab308' :
                            entry.name === 'High' ? '#f97316' : '#ef4444'
                      } />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Duplication Section */}
        <div className="mb-8">
          {/* High Duplication Fragments - Full Width */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Copy size={18} className="text-orange-500" />
                Comprehensive Redundancy Analysis
              </h3>
              {jscpdTotal.clones !== undefined && (
                <div className="flex gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Total Clones</p>
                    <p className="text-sm font-black text-gray-700">{jscpdTotal.clones}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 font-bold uppercase">Dup. Lines</p>
                    <p className="text-sm font-black text-gray-700">{jscpdTotal.duplicatedLines}</p>
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-[400px]">
              {paginatedRedundancy.map(([key, val]: [string, any], i) => (
                <div key={i} className="p-5 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-orange-200 hover:bg-white transition-all shadow-sm flex flex-col h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-orange-500 text-white uppercase shadow-sm">
                        {val.occurrence_count} Instances
                      </span>
                      <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-md border border-orange-100">
                        {val.lines} Lines
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono bg-white px-2 py-1 rounded border border-gray-100 uppercase">{val.format}</span>
                  </div>

                  <div className="mb-4 space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Search size={10} /> Affected Files ({val.occurrences?.length || 0}):
                    </p>
                    <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-2 bg-white rounded-xl border border-gray-100 custom-scrollbar shadow-inner">
                      {(val.occurrences || []).map((occ: any, idx: number) => (
                        <div key={idx} className="group/file relative text-[10px] bg-gray-50 border border-gray-100 px-2 py-1.5 rounded-lg text-gray-600 flex items-center gap-2 hover:bg-white hover:border-orange-200 hover:text-orange-600 transition-all cursor-default" title={occ.file}>
                          <FileCode2 size={12} className="text-gray-400 group-hover/file:text-orange-400" />
                          <span className="font-semibold truncate max-w-[120px]">{occ.file.split('/').pop()}</span>
                          <span className="text-[9px] text-gray-400 bg-gray-100 px-1 rounded font-mono group-hover/file:bg-orange-50 group-hover/file:text-orange-500">L{occ.start_line}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="relative group/code">
                    <pre className="text-[10px] text-gray-300 font-mono bg-gray-900 p-4 rounded-xl border border-gray-800 leading-relaxed overflow-x-auto custom-scrollbar shadow-xl max-h-[200px]">
                      {val.fragment.trim()}
                    </pre>
                  </div>
                </div>
              ))}
              {duplicateFragments.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-200">
                  <Search size={40} className="mb-4 opacity-20" />
                  <p className="text-lg font-bold">No significant duplication found</p>
                  <p className="text-sm opacity-60">Your codebase follows the DRY principle well.</p>
                </div>
              )}
            </div>
            {totalRedundancyPages > 1 && (
              <PaginationControls
                currentPage={redundancyPage}
                totalPages={totalRedundancyPages}
                onPageChange={setRedundancyPage}
              />
            )}
          </div>
        </div>

        {/* Critical Files Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <AlertTriangle size={18} className="text-red-500" />
              Project Complexity Risk Inventory
            </h3>
            <span className="text-xs text-gray-400">Showing all {topComplexFiles.length} files sorted by complexity</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">File Name</th>
                  <th className="px-6 py-4">Grade</th>
                  <th className="px-6 py-4 text-center">Complexity</th>
                  <th className="px-6 py-4 text-center">Cognitive</th>
                  <th className="px-6 py-4 text-center">LOC</th>
                  <th className="px-6 py-4 text-right">Tech Debt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedComplexity.map((file: any, i: any) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800 truncate max-w-xs">{file.file.split('/').pop()}</span>
                        <span className="text-[10px] text-gray-400 truncate max-w-xs">{file.file}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg font-black text-white text-sm" style={{ backgroundColor: GRADE_COLORS[file.maintainability?.grade || 'F'] }}>
                        {file.maintainability?.grade || 'F'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700 text-sm">
                      {file.complexity}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-700 text-sm">
                      {file.cognitive}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500 text-xs">
                      {file.loc}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-red-500">{file.maintainability?.technicalDebtRatio}%</span>
                        <div className="w-16 h-1 bg-gray-100 rounded-full mt-1 overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${file.maintainability?.technicalDebtRatio}%` }}></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalComplexityPages > 1 && (
            <div className="p-4 border-t border-gray-50">
              <PaginationControls
                currentPage={complexityPage}
                totalPages={totalComplexityPages}
                onPageChange={setComplexityPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
