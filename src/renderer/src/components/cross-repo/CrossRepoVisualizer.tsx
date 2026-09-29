import React, { useState, useMemo } from 'react';
import { Search, Server, Smartphone, Globe, Activity, ArrowRight, FileText } from 'lucide-react';

interface CrossRepoLink {
  source_node_id: string;
  target_node_id: string;
  consumer_repo_id: string;
  provider_repo_id: string;
  confidence_score: number;
  reason: string;
  matched_signal: string;
  match_tier: string;
  relationship_type: string;
}

interface CrossRepoData {
  database_code_links: any[];
  cross_repo_links: CrossRepoLink[];
}

export default function CrossRepoVisualizer({ data }: { data: CrossRepoData }) {
  const [selectedConsumer, setSelectedConsumer] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const links = data?.cross_repo_links || [];

  const consumers = useMemo(() => {
    const uniqueConsumers = Array.from(new Set(links.map(link => link.consumer_repo_id)));
    return uniqueConsumers.sort();
  }, [links]);

  const providers = useMemo(() => {
    if (!selectedConsumer) return [];
    const relevantLinks = links.filter(link => link.consumer_repo_id === selectedConsumer);
    const uniqueProviders = Array.from(new Set(relevantLinks.map(link => link.provider_repo_id)));
    return uniqueProviders.sort().map(provider => ({
      id: provider,
      count: relevantLinks.filter(l => l.provider_repo_id === provider).length
    }));
  }, [links, selectedConsumer]);

  const filteredLinks = useMemo(() => {
    let result = links;
    if (selectedConsumer) {
      result = result.filter(l => l.consumer_repo_id === selectedConsumer);
    }
    if (selectedProvider) {
      result = result.filter(l => l.provider_repo_id === selectedProvider);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l => 
        l.matched_signal.toLowerCase().includes(q) || 
        l.reason.toLowerCase().includes(q) ||
        l.source_node_id.toLowerCase().includes(q) ||
        l.target_node_id.toLowerCase().includes(q)
      );
    }
    return result;
  }, [links, selectedConsumer, selectedProvider, searchQuery]);

  // Set defaults if null
  React.useEffect(() => {
    if (consumers.length > 0 && !selectedConsumer) {
      setSelectedConsumer(consumers[0]);
    }
  }, [consumers, selectedConsumer]);

  React.useEffect(() => {
    if (providers.length > 0 && selectedConsumer && (!selectedProvider || !providers.find(p => p.id === selectedProvider))) {
      setSelectedProvider(providers[0].id);
    }
  }, [providers, selectedConsumer, selectedProvider]);

  const getRepoIcon = (repoId: string) => {
    const id = repoId.toLowerCase();
    if (id.includes('ios') || id.includes('android') || id.includes('mobile')) return <Smartphone className="w-5 h-5 text-gray-500" />;
    if (id.includes('backend') || id.includes('api')) return <Server className="w-5 h-5 text-blue-500" />;
    return <Globe className="w-5 h-5 text-gray-500" />;
  };

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-700 bg-green-100 border-green-200';
    if (score >= 0.6) return 'text-yellow-700 bg-yellow-100 border-yellow-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  const formatRepoName = (name: string) => {
    return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <div className="flex h-[calc(100vh-73px)] w-full overflow-hidden bg-white text-sm">
      {/* 1. CONSUMER APP */}
      <div className="w-1/4 min-w-[250px] border-r border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-xs mb-1">1. CONSUMER APP</h2>
          <p className="text-gray-400 text-xs">Select the calling application</p>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {consumers.map(consumer => (
            <div 
              key={consumer}
              onClick={() => setSelectedConsumer(consumer)}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                selectedConsumer === consumer 
                  ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm' 
                  : 'border-gray-100 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedConsumer === consumer ? 'bg-blue-100 text-blue-600' : 'bg-gray-100'}`}>
                  {getRepoIcon(consumer)}
                </div>
                <span className="font-medium">{formatRepoName(consumer)}</span>
              </div>
              {selectedConsumer === consumer && <ArrowRight className="w-4 h-4 text-blue-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* 2. PROVIDER SERVICE */}
      <div className="w-1/4 min-w-[250px] border-r border-gray-200 flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-800 text-xs mb-1">2. PROVIDER SERVICE</h2>
          <p className="text-gray-400 text-xs">Select the target service</p>
        </div>
        <div className="overflow-y-auto flex-1 p-3 space-y-2">
          {providers.map(provider => (
            <div 
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${
                selectedProvider === provider.id 
                  ? 'border-green-200 bg-green-50 text-green-800 shadow-sm' 
                  : 'border-gray-100 bg-white hover:border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${selectedProvider === provider.id ? 'bg-green-100 text-green-600' : 'bg-gray-100'}`}>
                  {getRepoIcon(provider.id)}
                </div>
                <div>
                  <div className="font-medium">{formatRepoName(provider.id)}</div>
                  <div className="text-xs opacity-70 mt-0.5">{provider.count} connections</div>
                </div>
              </div>
              {selectedProvider === provider.id && <ArrowRight className="w-4 h-4 text-green-600" />}
            </div>
          ))}
          {providers.length === 0 && (
            <div className="text-center text-gray-400 p-4">No providers found</div>
          )}
        </div>
      </div>

      {/* 3. CONNECTIONS OVERVIEW */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50/30">
        <div className="p-4 border-b border-gray-100 bg-white flex justify-between items-center">
          <div>
            <h2 className="font-bold text-gray-800 text-xs mb-1">3. CONNECTIONS OVERVIEW</h2>
            <div className="text-gray-400 text-xs flex items-center gap-2">
              <span className="text-blue-500">{selectedConsumer ? formatRepoName(selectedConsumer) : '...'}</span> 
              <ArrowRight className="w-3 h-3" />
              <span className="text-green-600">{selectedProvider ? formatRepoName(selectedProvider) : '...'}</span>
            </div>
          </div>
          <div className="relative w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search endpoints..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="overflow-y-auto flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {filteredLinks.map((link, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start gap-4 mb-5">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800 mb-2 truncate" title={link.matched_signal}>
                        {link.matched_signal}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium border border-gray-200 capitalize">
                          {link.relationship_type.replace(/_/g, ' ')}
                        </span>
                        <span className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${getScoreColor(link.confidence_score)}`}>
                          <Activity className="w-3 h-3" />
                          Match: {Math.round(link.confidence_score * 100)}%
                        </span>
                        {link.match_tier && (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-xs font-medium border border-purple-200 capitalize">
                            {link.match_tier.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                      <div className="text-xs font-bold text-blue-800/60 mb-2 tracking-wider">SOURCE (CONSUMER)</div>
                      <div className="text-sm font-mono text-blue-900 break-all bg-white/60 p-2 rounded border border-blue-100 shadow-sm">
                        {link.source_node_id}
                      </div>
                    </div>
                    <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                      <div className="text-xs font-bold text-green-800/60 mb-2 tracking-wider">TARGET (PROVIDER)</div>
                      <div className="text-sm font-mono text-green-900 break-all bg-white/60 p-2 rounded border border-green-100 shadow-sm">
                        {link.target_node_id}
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500 mb-2 tracking-wider">
                      <FileText className="w-3.5 h-3.5" /> REASONING
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {link.reason}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredLinks.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">No connections found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
