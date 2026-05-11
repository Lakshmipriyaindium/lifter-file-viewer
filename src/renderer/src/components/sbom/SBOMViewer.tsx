import React, { useMemo, useState } from 'react';
import { 
  Package, Server, ShieldCheck, Info, Search, 
  FileCode, Cpu, User, Clock, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, ExternalLink
} from 'lucide-react';

interface Props {
  data: any;
}

const ITEMS_PER_PAGE = 10;

export default function SBOMViewer({ data }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');

  const metadata = data.metadata || {};
  const components = data.components || [];
  const services = data.services || [];
  const annotations = data.annotations || [];

  // Filter components
  const filteredComponents = useMemo(() => {
    return components.filter((comp: any) => 
      comp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.group?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comp.purl?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [components, searchQuery]);

  // Paginate components
  const paginatedComponents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredComponents.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredComponents, currentPage]);

  const totalPages = Math.ceil(filteredComponents.length / ITEMS_PER_PAGE);

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

  const PaginationControls = () => (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button 
        onClick={() => setCurrentPage(1)} 
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronsLeft size={16} />
      </button>
      <button 
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
        disabled={currentPage === 1}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronLeft size={16} />
      </button>
      <div className="px-4 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs font-bold text-gray-600">
        Page {currentPage} of {totalPages || 1}
      </div>
      <button 
        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronRight size={16} />
      </button>
      <button 
        onClick={() => setCurrentPage(totalPages)} 
        disabled={currentPage === totalPages || totalPages === 0}
        className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
      >
        <ChevronsRight size={16} />
      </button>
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
              <ShieldCheck size={18} className="text-white" />
              <span className="text-xs font-bold uppercase tracking-widest">Supply Chain Analysis</span>
            </div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">
              Software Bill of Materials
            </h1>
            <p className="text-white/80 text-sm flex items-center gap-4">
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Info size={14} /> {data.bomFormat} v{data.specVersion}
              </span>
              <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
                <Clock size={14} /> {new Date(metadata.timestamp).toLocaleString()}
              </span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className="px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
              <span className="text-[10px] text-white/60 font-black uppercase mb-1">Format</span>
              <span className="text-3xl font-black text-white">
                {data.bomFormat}
              </span>
            </div>
            <div className="px-6 py-3 bg-white text-[#FB851E] rounded-2xl flex flex-col items-center min-w-[120px] shadow-xl">
              <span className="text-[10px] text-[#FB851E]/60 font-black uppercase mb-1">Spec</span>
              <span className="text-3xl font-black">
                {data.specVersion}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-8 -mt-10 relative z-20 pb-10">
        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Total Components" 
            value={components.length} 
            icon={Package} 
            color="bg-blue-500" 
            subValue="Dependencies"
          />
          <MetricCard 
            title="Total Services" 
            value={services.length} 
            icon={Server} 
            color="bg-purple-500" 
            subValue="External APIs"
          />
          <MetricCard 
            title="Tools Used" 
            value={metadata.tools?.components?.length || 1} 
            icon={Cpu} 
            color="bg-[#FB851E]" 
            subValue="Analyzers"
          />
          <MetricCard 
            title="Lifecycles" 
            value={metadata.lifecycles?.[0]?.phase || 'Build'} 
            icon={Clock} 
            color="bg-emerald-500" 
            subValue="Stage"
          />
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Components Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              <Package size={18} className="text-blue-500" />
              Dependency Components
            </h3>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search components..." 
                className="pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 outline-none w-64"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-6 py-4">Component Name</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Identifier (PURL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedComponents.map((comp: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{comp.name}</span>
                        <span className="text-[10px] text-gray-400">{comp.group || 'Root'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[10px] font-bold border border-blue-100">
                        v{comp.version}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-gray-500 capitalize">{comp.type}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 text-[10px] font-mono text-gray-400">
                        <span className="truncate max-w-[200px]">{comp.purl}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredComponents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <Search size={32} className="mb-2 opacity-20" />
                        <p className="text-sm font-medium">No components found</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && <PaginationControls />}
        </div>

        {/* Sidebar info */}
        <div className="space-y-8">
          {/* External Services */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
              <Server size={18} className="text-purple-500" />
              Detected Services
            </h3>
            <div className="space-y-4">
              {services.map((svc: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-purple-50 border border-purple-100 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-purple-700 truncate max-w-[180px]">{svc.name}</span>
                    <ExternalLink size={12} className="text-purple-400" />
                  </div>
                  <p className="text-[10px] text-purple-600/70 leading-relaxed">
                    {svc.description || 'No description provided.'}
                  </p>
                  {svc.properties?.map((prop: any, idx: number) => (
                    <div key={idx} className="mt-2 flex items-center gap-1.5">
                      <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter">{prop.name}:</span>
                      <span className="text-[10px] font-bold text-purple-600">{prop.value}</span>
                    </div>
                  ))}
                </div>
              ))}
              {services.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-10 italic">No external services detected.</p>
              )}
            </div>
          </div>

          {/* Annotations */}
          {annotations.length > 0 && (
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-6 rounded-2xl shadow-lg text-white">
              <h3 className="font-bold flex items-center gap-2 mb-4">
                <ShieldCheck size={18} className="text-blue-400" />
                Security Insight
              </h3>
              <div className="space-y-4">
                {annotations.map((anno: any, i: number) => (
                  <div key={i}>
                    <p className="text-xs text-gray-300 leading-relaxed italic">
                      "{anno.text}"
                    </p>
                    <div className="mt-4 flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-gray-500" />
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{anno.annotator?.organization?.name || 'Security'}</span>
                      </div>
                      <span className="text-[10px] text-gray-500">{new Date(anno.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Metadata Bottom Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 mb-6">
          <FileCode size={18} className="text-emerald-500" />
          Generation Metadata
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Serial Number</p>
            <p className="text-xs font-mono text-gray-600 bg-gray-50 p-2 rounded-lg break-all">
              {data.serialNumber}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Analysis Tools</p>
            <div className="space-y-2">
              {metadata.tools?.components?.map((tool: any, i: number) => (
                <div key={i} className="flex flex-col bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <span className="text-xs font-bold text-gray-700">{tool.name}</span>
                  <span className="text-[10px] text-gray-400">{tool.publisher} v{tool.version}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Authors & Org</p>
            <div className="flex flex-wrap gap-2">
              {metadata.authors?.map((author: any, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100 shadow-sm flex items-center gap-2">
                  <User size={12} /> {author.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
