import React from 'react';

const ReportHeader: React.FC<{ title: string }> = ({ title }) => (
  <header>
    <div className="flex items-center gap-3 mb-2">
      <span className="px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold tracking-wide">ARCHITECTURE ANALYSIS</span>
    </div>
    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
  </header>
);

export default ReportHeader;
